/**
 * Tacit Protocol — Intent Broadcasting & Discovery
 *
 * Handles the creation, publication, and discovery of intents
 * on the Tacit network.
 */

import type {
  Intent,
  IntentType,
  IntentStatus,
  DomainType,
  PrivacyLevel,
  DID,
} from '../types/index.js';

// ─── Intent Builder ───────────────────────────────────────────────

export class IntentBuilder {
  private partial: Partial<Intent> = {};

  constructor(agentDid: DID) {
    this.partial.agentDid = agentDid;
    this.partial.id = `intent:${agentDid.split(':').pop()}:${Date.now()}`;
    this.partial.created = new Date().toISOString();
    this.partial.privacyLevel = 'filtered';
    this.partial.ttl = 604800; // 7 days
    this.partial.filters = {
      minAuthenticityScore: 50,
      requiredCredentials: [],
      excludedDomains: [],
    };
  }

  type(type: IntentType): this {
    this.partial.type = type;
    return this;
  }

  domain(domain: DomainType): this {
    this.partial.domain = domain;
    return this;
  }

  seeking(seeking: Record<string, unknown>): this {
    if (!this.partial.intent) {
      this.partial.intent = { seeking: {}, context: {} };
    }
    this.partial.intent.seeking = seeking;
    return this;
  }

  context(context: Record<string, unknown>): this {
    if (!this.partial.intent) {
      this.partial.intent = { seeking: {}, context: {} };
    }
    this.partial.intent.context = context;
    return this;
  }

  privacy(level: PrivacyLevel): this {
    this.partial.privacyLevel = level;
    return this;
  }

  ttl(seconds: number): this {
    this.partial.ttl = seconds;
    return this;
  }

  minAuthenticity(score: number): this {
    this.partial.filters!.minAuthenticityScore = score;
    return this;
  }

  requireCredentials(...types: string[]): this {
    this.partial.filters!.requiredCredentials = types;
    return this;
  }

  build(): Intent {
    if (!this.partial.type) throw new Error('Intent type is required');
    if (!this.partial.domain) throw new Error('Intent domain is required');
    if (!this.partial.intent?.seeking) throw new Error('Intent seeking is required');

    return {
      id: this.partial.id!,
      agentDid: this.partial.agentDid!,
      type: this.partial.type,
      domain: this.partial.domain,
      intent: this.partial.intent!,
      filters: this.partial.filters!,
      privacyLevel: this.partial.privacyLevel!,
      ttl: this.partial.ttl!,
      created: this.partial.created!,
      signature: '', // Signed by agent before publishing
    };
  }
}

// ─── Intent Store ─────────────────────────────────────────────────

/**
 * Local intent storage with lifecycle management.
 * In production, this connects to the relay network.
 */
export class IntentStore {
  private intents = new Map<string, { intent: Intent; status: IntentStatus }>();

  add(intent: Intent): void {
    this.intents.set(intent.id, { intent, status: 'active' });
  }

  get(id: string): Intent | undefined {
    return this.intents.get(id)?.intent;
  }

  getStatus(id: string): IntentStatus | undefined {
    return this.intents.get(id)?.status;
  }

  setStatus(id: string, status: IntentStatus): void {
    const entry = this.intents.get(id);
    if (entry) entry.status = status;
  }

  withdraw(id: string): boolean {
    const entry = this.intents.get(id);
    if (!entry) return false;
    entry.status = 'withdrawn';
    return true;
  }

  /**
   * Get all active intents (not expired, not withdrawn, not fulfilled).
   */
  getActive(): Intent[] {
    const now = Date.now();
    const active: Intent[] = [];

    for (const [, entry] of this.intents) {
      if (entry.status !== 'active') continue;

      // Check TTL
      const created = new Date(entry.intent.created).getTime();
      if (now - created > entry.intent.ttl * 1000) {
        entry.status = 'expired';
        continue;
      }

      active.push(entry.intent);
    }

    return active;
  }

  /**
   * Find intents that match a given query.
   * This is the local equivalent of a relay query.
   */
  query(params: {
    type?: IntentType;
    domain?: DomainType;
    minAuthenticity?: number;
    keywords?: string[];
  }): Intent[] {
    return this.getActive().filter(intent => {
      if (params.type && intent.type !== params.type) return false;
      if (params.domain && intent.domain !== params.domain) return false;

      if (params.keywords && params.keywords.length > 0) {
        const intentText = JSON.stringify(intent.intent).toLowerCase();
        const hasKeyword = params.keywords.some(kw =>
          intentText.includes(kw.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      return true;
    });
  }

  /**
   * Remove expired intents from the store.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, entry] of this.intents) {
      if (entry.status === 'expired' || entry.status === 'withdrawn' || entry.status === 'fulfilled') {
        this.intents.delete(id);
        removed++;
      }

      // Check TTL for active intents
      if (entry.status === 'active') {
        const created = new Date(entry.intent.created).getTime();
        if (now - created > entry.intent.ttl * 1000) {
          entry.status = 'expired';
          this.intents.delete(id);
          removed++;
        }
      }
    }

    return removed;
  }
}
