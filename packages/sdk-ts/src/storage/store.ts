/**
 * Tacit Protocol — Persistence Layer
 *
 * Stores agent identity, credentials, interaction history, and trust data.
 * Uses a pluggable backend — ships with in-memory and JSON file adapters.
 * SQLite adapter available as optional dependency.
 */

import type {
  AgentIdentity,
  DID,
  VerifiableCredential,
  Intent,
  IntroProposal,
  AuthenticityVector,
} from '../types/index.js';

// ─── Storage Backend Interface ───────────────────────────────────

export interface StorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
  close(): Promise<void>;
}

// ─── In-Memory Backend ───────────────────────────────────────────

export class MemoryBackend implements StorageBackend {
  private data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.data.keys()).filter(k => k.startsWith(prefix));
  }

  async close(): Promise<void> {
    this.data.clear();
  }
}

// ─── JSON File Backend ───────────────────────────────────────────

export class FileBackend implements StorageBackend {
  private data: Record<string, string> = {};
  private filePath: string;
  private dirty = false;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Load data from disk. Call this before using the backend.
   */
  async load(): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      const raw = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      // File doesn't exist yet — start empty
      this.data = {};
    }

    // Auto-flush every 5 seconds if dirty
    this.flushTimer = setInterval(() => {
      if (this.dirty) this.flush();
    }, 5000);
  }

  async get(key: string): Promise<string | null> {
    return this.data[key] ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data[key] = value;
    this.dirty = true;
  }

  async delete(key: string): Promise<boolean> {
    if (key in this.data) {
      delete this.data[key];
      this.dirty = true;
      return true;
    }
    return false;
  }

  async list(prefix: string): Promise<string[]> {
    return Object.keys(this.data).filter(k => k.startsWith(prefix));
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (!this.dirty) return;
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
    this.dirty = false;
  }
}

// ─── Agent Store ─────────────────────────────────────────────────

/**
 * High-level storage for agent data.
 * Wraps a StorageBackend with typed accessors for identity,
 * credentials, intents, proposals, and interaction history.
 */
export class AgentStore {
  private backend: StorageBackend;

  constructor(backend: StorageBackend) {
    this.backend = backend;
  }

  // ─── Identity ──────────────────────────────────────────────

  async saveIdentity(identity: AgentIdentity): Promise<void> {
    const serialized = {
      did: identity.did,
      publicKey: Array.from(identity.publicKey),
      privateKey: identity.privateKey ? Array.from(identity.privateKey) : undefined,
      created: identity.created.toISOString(),
    };
    await this.backend.set('identity', JSON.stringify(serialized));
  }

  async loadIdentity(): Promise<AgentIdentity | null> {
    const raw = await this.backend.get('identity');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      did: parsed.did,
      publicKey: new Uint8Array(parsed.publicKey),
      privateKey: parsed.privateKey ? new Uint8Array(parsed.privateKey) : undefined,
      created: new Date(parsed.created),
    };
  }

  // ─── Credentials ───────────────────────────────────────────

  async addCredential(credential: VerifiableCredential): Promise<void> {
    const key = `credential:${credential.type}:${credential.issuer}:${credential.issued}`;
    await this.backend.set(key, JSON.stringify(credential));
  }

  async getCredentials(): Promise<VerifiableCredential[]> {
    const keys = await this.backend.list('credential:');
    const results: VerifiableCredential[] = [];
    for (const key of keys) {
      const raw = await this.backend.get(key);
      if (raw) results.push(JSON.parse(raw));
    }
    return results;
  }

  async removeCredential(type: string, issuer: DID): Promise<boolean> {
    const keys = await this.backend.list(`credential:${type}:${issuer}`);
    let removed = false;
    for (const key of keys) {
      if (await this.backend.delete(key)) removed = true;
    }
    return removed;
  }

  // ─── Interaction History ───────────────────────────────────

  private interactionCounter = 0;

  async recordInteraction(interaction: InteractionRecord): Promise<void> {
    const key = `interaction:${interaction.timestamp}:${interaction.withDid}:${++this.interactionCounter}`;
    await this.backend.set(key, JSON.stringify(interaction));
  }

  async getInteractions(opts?: {
    withDid?: DID;
    since?: Date;
    limit?: number;
  }): Promise<InteractionRecord[]> {
    const keys = await this.backend.list('interaction:');
    const results: InteractionRecord[] = [];

    for (const key of keys) {
      const raw = await this.backend.get(key);
      if (!raw) continue;
      const record: InteractionRecord = JSON.parse(raw);

      if (opts?.withDid && record.withDid !== opts.withDid) continue;
      if (opts?.since && new Date(record.timestamp) < opts.since) continue;

      results.push(record);
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return opts?.limit ? results.slice(0, opts.limit) : results;
  }

  async getInteractionStats(): Promise<{
    totalInteractions: number;
    positiveInteractions: number;
    totalIntros: number;
    successfulIntros: number;
    bidirectionalTrustEdges: number;
  }> {
    const interactions = await this.getInteractions();

    const uniquePartners = new Set<string>();
    const positivePartners = new Set<string>();
    let totalIntros = 0;
    let successfulIntros = 0;

    for (const i of interactions) {
      uniquePartners.add(i.withDid);
      if (i.outcome === 'positive') positivePartners.add(i.withDid);
      if (i.type === 'introduction') {
        totalIntros++;
        if (i.outcome === 'positive') successfulIntros++;
      }
    }

    // Bidirectional = partners who we rated positive AND who rated us positive
    // (Simplified — in production this would involve network queries)
    const bidirectionalTrustEdges = positivePartners.size;

    return {
      totalInteractions: interactions.length,
      positiveInteractions: interactions.filter(i => i.outcome === 'positive').length,
      totalIntros,
      successfulIntros,
      bidirectionalTrustEdges,
    };
  }

  // ─── Proposals ─────────────────────────────────────────────

  async saveProposal(proposal: IntroProposal): Promise<void> {
    await this.backend.set(`proposal:${proposal.id}`, JSON.stringify(proposal));
  }

  async getProposal(id: string): Promise<IntroProposal | null> {
    const raw = await this.backend.get(`proposal:${id}`);
    return raw ? JSON.parse(raw) : null;
  }

  async getPendingProposals(): Promise<IntroProposal[]> {
    const keys = await this.backend.list('proposal:');
    const proposals: IntroProposal[] = [];
    for (const key of keys) {
      const raw = await this.backend.get(key);
      if (!raw) continue;
      const proposal: IntroProposal = JSON.parse(raw);
      if (proposal.status === 'pending') proposals.push(proposal);
    }
    return proposals;
  }

  // ─── Trust Snapshot ────────────────────────────────────────

  async saveTrustSnapshot(vector: AuthenticityVector): Promise<void> {
    const key = `trust:${new Date().toISOString()}`;
    await this.backend.set(key, JSON.stringify(vector));
    await this.backend.set('trust:latest', JSON.stringify(vector));
  }

  async getLatestTrust(): Promise<AuthenticityVector | null> {
    const raw = await this.backend.get('trust:latest');
    return raw ? JSON.parse(raw) : null;
  }

  // ─── Lifecycle ─────────────────────────────────────────────

  async close(): Promise<void> {
    await this.backend.close();
  }
}

// ─── Types ───────────────────────────────────────────────────────

export interface InteractionRecord {
  withDid: DID;
  type: 'introduction' | 'service' | 'collaboration' | 'commerce';
  outcome: 'positive' | 'neutral' | 'negative';
  timestamp: string;
  proposalId?: string;
  notes?: string;
}
