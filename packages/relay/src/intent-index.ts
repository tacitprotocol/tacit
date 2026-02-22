/**
 * Tacit Protocol — Intent Index
 *
 * Stores and indexes active intents for matching.
 * Handles TTL expiration and withdrawal.
 */

export interface IndexedIntent {
  id: string;
  agentDid: string;
  type: string;
  domain: string;
  intent: unknown;
  filters: unknown;
  ttl: number;
  created: string;
  addedAt: number;
  matched: boolean;
}

export class IntentIndex {
  private intents = new Map<string, IndexedIntent>();

  add(intent: {
    id: string;
    agentDid: string;
    type: string;
    domain: string;
    intent: unknown;
    filters: unknown;
    ttl: number;
    created: string;
  }): void {
    this.intents.set(intent.id, {
      ...intent,
      addedAt: Date.now(),
      matched: false,
    });
  }

  remove(id: string): boolean {
    return this.intents.delete(id);
  }

  get(id: string): IndexedIntent | undefined {
    return this.intents.get(id);
  }

  get size(): number {
    return this.intents.size;
  }

  /**
   * Get all active (non-expired, non-matched) intents.
   */
  getActive(): IndexedIntent[] {
    const now = Date.now();
    const active: IndexedIntent[] = [];

    for (const intent of this.intents.values()) {
      if (intent.matched) continue;

      const expiresAt = new Date(intent.created).getTime() + intent.ttl * 1000;
      if (now > expiresAt) continue;

      active.push(intent);
    }

    return active;
  }

  /**
   * Get active intents by domain.
   */
  getByDomain(domain: string): IndexedIntent[] {
    return this.getActive().filter(i => i.domain === domain);
  }

  /**
   * Get active intents by agent DID.
   */
  getByAgent(agentDid: string): IndexedIntent[] {
    return this.getActive().filter(i => i.agentDid === agentDid);
  }

  /**
   * Mark an intent as matched so it won't be re-matched.
   */
  markMatched(id: string): void {
    const intent = this.intents.get(id);
    if (intent) intent.matched = true;
  }

  /**
   * Remove expired intents.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, intent] of this.intents) {
      const expiresAt = new Date(intent.created).getTime() + intent.ttl * 1000;
      if (now > expiresAt || intent.matched) {
        this.intents.delete(id);
        removed++;
      }
    }

    return removed;
  }
}
