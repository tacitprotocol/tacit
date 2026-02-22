/**
 * Tacit Protocol — Agent Card Registry
 *
 * In-memory index of registered Agent Cards.
 * Supports lookup by DID and query by domain/capability.
 */

export class AgentRegistry {
  private cards = new Map<string, AgentCardEntry>();

  register(did: string, card: unknown): void {
    this.cards.set(did, {
      did,
      card,
      registeredAt: new Date(),
      lastSeen: new Date(),
    });
  }

  unregister(did: string): boolean {
    return this.cards.delete(did);
  }

  get(did: string): unknown | undefined {
    const entry = this.cards.get(did);
    if (entry) entry.lastSeen = new Date();
    return entry?.card;
  }

  has(did: string): boolean {
    return this.cards.has(did);
  }

  get size(): number {
    return this.cards.size;
  }

  /**
   * Find agents by domain.
   */
  findByDomain(domain: string): string[] {
    const results: string[] = [];
    for (const [did, entry] of this.cards) {
      const card = entry.card as { domains?: Array<{ type: string }> };
      if (card.domains?.some(d => d.type === domain)) {
        results.push(did);
      }
    }
    return results;
  }

  /**
   * Get all registered DIDs.
   */
  getAllDids(): string[] {
    return Array.from(this.cards.keys());
  }

  /**
   * Remove agents not seen in the last `maxAgeMs` milliseconds.
   */
  pruneStale(maxAgeMs = 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAgeMs);
    let pruned = 0;
    for (const [did, entry] of this.cards) {
      if (entry.lastSeen < cutoff) {
        this.cards.delete(did);
        pruned++;
      }
    }
    return pruned;
  }
}

interface AgentCardEntry {
  did: string;
  card: unknown;
  registeredAt: Date;
  lastSeen: Date;
}
