/**
 * Tacit Protocol — Agent Core
 *
 * The TacitAgent is the primary interface for interacting with the
 * Tacit Protocol. It represents a human's AI agent on the network.
 */

import { v4 as uuidv4 } from 'uuid';
import { createIdentity } from '../identity/did.js';
import { AuthenticityEngine } from '../identity/authenticity.js';
import { RelayClient } from '../transport/relay-client.js';
import { signIntent, signProposal } from '../transport/message.js';
import { AgentStore, MemoryBackend } from '../storage/store.js';
import type {
  AgentIdentity,
  AgentCard,
  TacitConfig,
  Intent,
  IntentType,
  MatchResult,
  IntroProposal,
  TacitEvent,
  DomainType,
  AuthenticityVector,
  PrivacyLevel,
  RelayConfig,
} from '../types/index.js';
import type { StorageBackend } from '../storage/store.js';

// ─── Event Emitter ────────────────────────────────────────────────

type EventHandler = (event: TacitEvent) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private globalHandlers = new Set<EventHandler>();

  on(type: string, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  onAny(handler: EventHandler): void {
    this.globalHandlers.add(handler);
  }

  off(type: string, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  async emit(event: TacitEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? new Set();
    const all = [...handlers, ...this.globalHandlers];

    for (const handler of all) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[Tacit] Event handler error for ${event.type}:`, error);
      }
    }
  }
}

// ─── Agent Class ──────────────────────────────────────────────────

export class TacitAgent {
  private identity: AgentIdentity | null = null;
  private config: TacitConfig;
  private events = new EventBus();
  private authenticityEngine = new AuthenticityEngine();
  private intents = new Map<string, Intent>();
  private proposals = new Map<string, IntroProposal>();
  private connected = false;
  private relay: RelayClient | null = null;
  private store: AgentStore;

  constructor(config: TacitConfig & { storage?: StorageBackend }) {
    this.config = {
      relayUrl: 'wss://relay.tacitprotocol.dev',
      matchThresholds: {
        autoPropose: 80,
        suggest: 60,
      },
      preferences: {
        introductionStyle: 'progressive',
        initialAnonymity: true,
        responseTime: '24h',
        languages: ['en'],
      },
      ...config,
    };

    if (config.identity) {
      this.identity = config.identity;
    }

    this.store = new AgentStore(config.storage ?? new MemoryBackend());
  }

  // ─── Static Factories ──────────────────────────────────────────

  /**
   * Create a new agent identity.
   * Returns an AgentIdentity that can be passed to the constructor.
   */
  static async createIdentity(): Promise<AgentIdentity> {
    return createIdentity();
  }

  /**
   * Convenience factory: creates a new identity and returns a ready-to-use agent.
   */
  static async create(options: {
    domain?: DomainType;
    preferences?: Record<string, any>;
    seeking?: string;
    offering?: string;
    storage?: StorageBackend;
  } = {}): Promise<TacitAgent> {
    const identity = await TacitAgent.createIdentity();
    const agent = new TacitAgent({
      identity,
      profile: {
        name: 'Tacit Agent',
        domain: options.domain || 'professional',
        seeking: options.seeking || '',
        offering: options.offering || '',
      },
      preferences: options.preferences as any,
      storage: options.storage,
    });

    // Persist the identity
    await agent.store.saveIdentity(identity);

    return agent;
  }

  /**
   * Load an existing agent from storage.
   */
  static async load(storage: StorageBackend, config?: Partial<TacitConfig>): Promise<TacitAgent | null> {
    const store = new AgentStore(storage);
    const identity = await store.loadIdentity();
    if (!identity) return null;

    return new TacitAgent({
      ...config,
      identity,
      storage,
    } as TacitConfig & { storage: StorageBackend });
  }

  // ─── Convenience Getters ─────────────────────────────────────

  /** Get the agent's DID (shorthand). */
  get did(): string {
    return this.getDid();
  }

  /** Get the agent's Agent Card (shorthand). */
  get card(): AgentCard {
    return this.getAgentCard();
  }

  // ─── Lifecycle ────────────────────────────────────────────────

  /**
   * Connect the agent to the Tacit network via a relay node.
   * Pass `{ demo: true }` to simulate a match after 3 seconds (no relay needed).
   */
  async connect(options?: { demo?: boolean; relay?: RelayConfig }): Promise<void> {
    if (!this.identity) {
      this.identity = await createIdentity();
      await this.store.saveIdentity(this.identity);
    }

    if (options?.demo) {
      // Demo mode: simulate a match after 3 seconds
      this.connected = true;
      await this.events.emit({
        type: 'connection:established',
        endpoint: 'demo://local',
      });

      setTimeout(async () => {
        const simulatedMatch: MatchResult = {
          matchId: `match:demo:${Date.now()}`,
          agents: {
            initiator: this.identity!.did,
            responder: 'did:key:z6MkdemoAgent00000000000000000000000000000000' as any,
          },
          score: {
            overall: 87,
            breakdown: {
              intentAlignment: 0.92,
              domainFit: 0.88,
              authenticityCompatibility: 0.85,
              preferenceMatch: 0.82,
              timingFit: 0.90,
            },
          },
          timestamp: new Date().toISOString(),
        };
        await this.events.emit({ type: 'match', match: simulatedMatch });
      }, 3000);

      // Keep the process alive
      await new Promise(() => {});
      return;
    }

    // Real connection via relay
    const relayConfig: RelayConfig = options?.relay ?? {
      url: this.config.relayUrl!,
      maxRetries: 5,
      retryDelayMs: 1000,
      heartbeatIntervalMs: 30000,
    };

    this.relay = new RelayClient({
      config: relayConfig,
      identity: this.identity,
      onEvent: async (event) => {
        await this.handleRelayEvent(event);
      },
    });

    await this.relay.connect();
    this.connected = true;

    // Publish our Agent Card to the network
    await this.relay.publishCard(this.getAgentCard());

    // Re-publish active intents
    for (const intent of this.intents.values()) {
      await this.relay.publishIntent(intent);
    }
  }

  /**
   * Disconnect the agent from the network.
   */
  async disconnect(): Promise<void> {
    if (this.relay) {
      await this.relay.disconnect();
      this.relay = null;
    }
    this.connected = false;
  }

  /**
   * Check if the agent is connected to the network.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gracefully shut down — disconnect and close storage.
   */
  async shutdown(): Promise<void> {
    await this.disconnect();
    await this.store.close();
  }

  // ─── Identity ─────────────────────────────────────────────────

  /**
   * Get the agent's DID.
   */
  getDid(): string {
    if (!this.identity) throw new Error('Agent has no identity. Call connect() first.');
    return this.identity.did;
  }

  /**
   * Get the agent's Agent Card.
   */
  getAgentCard(): AgentCard {
    if (!this.identity) throw new Error('Agent has no identity. Call connect() first.');

    return {
      version: '0.1.0',
      agent: {
        did: this.identity.did,
        name: this.config.profile?.name ?? 'Unnamed Tacit',
        description: this.config.profile?.description ?? '',
        created: this.identity.created.toISOString(),
        protocols: ['tacit/discovery/v0.1', 'tacit/intro/v0.1'],
        transport: {
          type: 'didcomm/v2',
          endpoint: this.config.relayUrl!,
        },
      },
      domains: this.config.profile ? [{
        type: this.config.profile.domain,
        seeking: [this.config.profile.seeking],
        offering: [this.config.profile.offering],
        context: {},
      }] : [],
      authenticity: this.getAuthenticity(),
      preferences: {
        introductionStyle: this.config.preferences?.introductionStyle ?? 'progressive',
        initialAnonymity: this.config.preferences?.initialAnonymity ?? true,
        responseTime: this.config.preferences?.responseTime ?? '24h',
        languages: this.config.preferences?.languages ?? ['en'],
      },
    };
  }

  /**
   * Get the agent's current authenticity vector.
   */
  getAuthenticity(): AuthenticityVector {
    if (!this.identity) {
      return {
        level: 'new',
        score: 0,
        dimensions: { tenure: 0, consistency: 0, attestations: 0, networkTrust: 0 },
        verifiableCredentials: [],
      };
    }

    return this.authenticityEngine.computeVector({
      agentCreatedDate: this.identity.created,
      consistencySignals: {
        intentStability: 1.0,
        profileConsistency: 1.0,
        responseReliability: 0.5,
        interactionQuality: 0.5,
      },
      credentials: [],
      networkSignals: {
        totalInteractions: 0,
        positiveInteractions: 0,
        totalIntros: 0,
        successfulIntros: 0,
        bidirectionalTrustEdges: 0,
      },
      lastActiveDate: new Date(),
    });
  }

  /**
   * Recompute authenticity from stored interaction history.
   */
  async recomputeAuthenticity(): Promise<AuthenticityVector> {
    if (!this.identity) throw new Error('Agent has no identity.');

    const [credentials, stats] = await Promise.all([
      this.store.getCredentials(),
      this.store.getInteractionStats(),
    ]);

    const vector = this.authenticityEngine.computeVector({
      agentCreatedDate: this.identity.created,
      consistencySignals: {
        intentStability: 1.0,
        profileConsistency: 1.0,
        responseReliability: stats.totalInteractions > 0 ? 0.8 : 0.5,
        interactionQuality: stats.totalInteractions > 0
          ? stats.positiveInteractions / stats.totalInteractions
          : 0.5,
      },
      credentials,
      networkSignals: stats,
      lastActiveDate: new Date(),
    });

    await this.store.saveTrustSnapshot(vector);
    return vector;
  }

  // ─── Intents ──────────────────────────────────────────────────

  /**
   * Publish an intent to the network.
   */
  async publishIntent(params: {
    type: IntentType;
    domain: DomainType;
    seeking: Record<string, unknown>;
    context?: Record<string, unknown>;
    filters?: {
      minAuthenticityScore?: number;
      requiredCredentials?: string[];
    };
    privacyLevel?: PrivacyLevel;
    ttlSeconds?: number;
  }): Promise<Intent> {
    if (!this.identity) throw new Error('Agent has no identity. Call connect() first.');

    let intent: Intent = {
      id: `intent:${this.identity.did.split(':').pop()}:${Date.now()}`,
      agentDid: this.identity.did,
      type: params.type,
      domain: params.domain,
      intent: {
        seeking: params.seeking,
        context: params.context ?? {},
      },
      filters: {
        minAuthenticityScore: params.filters?.minAuthenticityScore ?? 50,
        requiredCredentials: params.filters?.requiredCredentials ?? [],
        excludedDomains: [],
      },
      privacyLevel: params.privacyLevel ?? 'filtered',
      ttl: params.ttlSeconds ?? 604800,
      created: new Date().toISOString(),
      signature: '',
    };

    // Sign the intent with the agent's private key
    intent = await signIntent(this.identity, intent);

    this.intents.set(intent.id, intent);

    // Broadcast to relay if connected
    if (this.relay?.isConnected) {
      await this.relay.publishIntent(intent);
    }

    await this.events.emit({ type: 'intent:published', intent });

    return intent;
  }

  /**
   * Withdraw an active intent.
   */
  async withdrawIntent(intentId: string): Promise<void> {
    const intent = this.intents.get(intentId);
    if (!intent) throw new Error(`Intent ${intentId} not found`);

    this.intents.delete(intentId);

    if (this.relay?.isConnected) {
      await this.relay.withdrawIntent(intentId);
    }
  }

  /**
   * Get all active intents.
   */
  getActiveIntents(): Intent[] {
    return Array.from(this.intents.values());
  }

  // ─── Proposals ────────────────────────────────────────────────

  /**
   * Handle an incoming match from the network.
   */
  async handleMatch(match: MatchResult): Promise<void> {
    const thresholds = this.config.matchThresholds!;

    if (match.score.overall >= thresholds.autoPropose) {
      await this.proposeIntro(match);
    } else if (match.score.overall >= thresholds.suggest) {
      await this.events.emit({ type: 'intent:matched', match });
    }
  }

  /**
   * Create and send an introduction proposal.
   */
  async proposeIntro(match: MatchResult): Promise<IntroProposal> {
    if (!this.identity) throw new Error('Agent has no identity.');

    let proposal: IntroProposal = {
      id: `proposal:${uuidv4()}`,
      type: 'introduction',
      initiator: {
        agentDid: this.identity.did,
        persona: {
          displayName: this.config.profile?.name ?? 'Anonymous',
          context: this.config.profile?.seeking ?? '',
          anonymityLevel: this.config.preferences?.initialAnonymity ? 'pseudonymous' : 'identified',
          sessionId: uuidv4(),
        },
      },
      responder: {
        agentDid: match.agents.responder,
      },
      match: {
        score: match.score.overall,
        rationale: this.generateRationale(match),
        domain: 'professional',
      },
      terms: {
        initialReveal: 'pseudonymous',
        revealStages: ['domain_context', 'professional_background', 'identity'],
        communicationChannel: 'tacit_direct',
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'pending',
      created: new Date().toISOString(),
      signature: '',
    };

    // Sign the proposal
    proposal = await signProposal(this.identity, proposal);

    this.proposals.set(proposal.id, proposal);
    await this.store.saveProposal(proposal);

    // Send via relay
    if (this.relay?.isConnected) {
      await this.relay.sendProposal(proposal, match.agents.responder);
    }

    return proposal;
  }

  /**
   * Accept an introduction proposal.
   */
  async acceptProposal(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (!this.identity) throw new Error('Agent has no identity.');

    const isInitiator = proposal.initiator.agentDid === this.identity.did;

    if (isInitiator) {
      proposal.status = 'accepted_by_initiator';
    } else {
      proposal.status = 'accepted_by_responder';
    }

    await this.store.saveProposal(proposal);

    // Notify the other party via relay
    if (this.relay?.isConnected) {
      const otherDid = isInitiator ? proposal.responder.agentDid : proposal.initiator.agentDid;
      await this.relay.acceptProposal(proposalId, otherDid);
    }

    await this.events.emit({ type: 'proposal:accepted', proposal });

    // Record positive interaction
    await this.store.recordInteraction({
      withDid: isInitiator ? proposal.responder.agentDid : proposal.initiator.agentDid,
      type: 'introduction',
      outcome: 'positive',
      timestamp: new Date().toISOString(),
      proposalId,
    });
  }

  /**
   * Decline an introduction proposal.
   */
  async declineProposal(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (!this.identity) throw new Error('Agent has no identity.');

    proposal.status = 'declined';
    this.proposals.delete(proposalId);

    // Notify the other party via relay (generic decline — no reason given)
    if (this.relay?.isConnected) {
      const isInitiator = proposal.initiator.agentDid === this.identity.did;
      const otherDid = isInitiator ? proposal.responder.agentDid : proposal.initiator.agentDid;
      await this.relay.declineProposal(proposalId, otherDid);
    }

    await this.events.emit({ type: 'proposal:declined', proposalId });
  }

  /**
   * Get all pending proposals.
   */
  getPendingProposals(): IntroProposal[] {
    return Array.from(this.proposals.values())
      .filter(p => p.status === 'pending');
  }

  // ─── Events ───────────────────────────────────────────────────

  on(type: string, handler: EventHandler): void {
    this.events.on(type, handler);
  }

  onAny(handler: EventHandler): void {
    this.events.onAny(handler);
  }

  off(type: string, handler: EventHandler): void {
    this.events.off(type, handler);
  }

  // ─── Internal ─────────────────────────────────────────────────

  private async handleRelayEvent(event: TacitEvent): Promise<void> {
    switch (event.type) {
      case 'match':
        await this.handleMatch((event as { type: 'match'; match: MatchResult }).match);
        break;

      case 'proposal:received': {
        const proposal = (event as { type: 'proposal:received'; proposal: IntroProposal }).proposal;
        this.proposals.set(proposal.id, proposal);
        await this.store.saveProposal(proposal);
        await this.events.emit(event);
        break;
      }

      case 'proposal:accepted':
      case 'proposal:declined':
        await this.events.emit(event);
        break;

      case 'connection:lost':
        this.connected = false;
        await this.events.emit(event);
        break;

      case 'error':
        await this.events.emit(event);
        break;

      default:
        await this.events.emit(event);
    }
  }

  private generateRationale(match: MatchResult): string {
    const parts: string[] = [];
    const b = match.score.breakdown;

    if (b.intentAlignment > 0.8) parts.push('Strong intent alignment');
    if (b.domainFit > 0.8) parts.push('Excellent domain fit');
    if (b.authenticityCompatibility > 0.7) parts.push('High authenticity compatibility');
    if (b.preferenceMatch > 0.7) parts.push('Good preference match');

    return parts.length > 0
      ? parts.join('. ') + '.'
      : `Match score: ${match.score.overall}/100`;
  }
}
