/**
 * Tacit Protocol — Relay Match Engine
 *
 * Server-side matching engine that runs periodically to find
 * compatible intent pairs and notify both agents.
 *
 * This is a simplified version of the SDK's MatchScorer,
 * optimized for server-side batch processing.
 */

import { v4 as uuidv4 } from 'uuid';
import type { AgentRegistry } from './registry.js';
import type { IntentIndex, IndexedIntent } from './intent-index.js';

export interface RelayMatch {
  matchId: string;
  agents: {
    initiator: string;
    responder: string;
  };
  score: {
    overall: number;
    breakdown: {
      intentAlignment: number;
      domainFit: number;
      authenticityCompatibility: number;
      preferenceMatch: number;
      timingFit: number;
    };
  };
  timestamp: string;
}

// Track which pairs we've already matched to avoid duplicates, with timestamps for TTL cleanup
const matchedPairs = new Map<string, number>();

const MATCHED_PAIR_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanupExpiredPairs(): void {
  const now = Date.now();
  for (const [key, timestamp] of matchedPairs) {
    if (now - timestamp > MATCHED_PAIR_TTL_MS) {
      matchedPairs.delete(key);
    }
  }
}

export class MatchEngine {
  private registry: AgentRegistry;
  private intentIndex: IntentIndex;

  constructor(registry: AgentRegistry, intentIndex: IntentIndex) {
    this.registry = registry;
    this.intentIndex = intentIndex;
  }

  /**
   * Find all compatible intent pairs among active intents.
   * Returns new matches only (previously matched pairs are skipped).
   */
  findMatches(): RelayMatch[] {
    // Clean up expired matched pairs before scanning
    cleanupExpiredPairs();

    const active = this.intentIndex.getActive();
    if (active.length < 2) return [];

    const matches: RelayMatch[] = [];

    // Compare all pairs
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];

        // Skip same-agent intents
        if (a.agentDid === b.agentDid) continue;

        // Skip already-matched pairs
        const pairKey = [a.id, b.id].sort().join(':');
        if (matchedPairs.has(pairKey)) continue;


        const score = this.scoreMatch(a, b);

        // Minimum threshold: 60
        if (score.overall >= 60) {
          matchedPairs.set(pairKey, Date.now());

          matches.push({
            matchId: `match:${uuidv4()}`,
            agents: {
              initiator: a.agentDid,
              responder: b.agentDid,
            },
            score,
            timestamp: new Date().toISOString(),
          });

          // Mark intents as matched
          this.intentIndex.markMatched(a.id);
          this.intentIndex.markMatched(b.id);
        }
      }
    }

    if (matches.length > 0) {
      console.log(`[Tacit Relay] Found ${matches.length} new match(es)`);
    }

    return matches;
  }

  private scoreMatch(a: IndexedIntent, b: IndexedIntent): RelayMatch['score'] {
    const intentAlignment = this.scoreIntentAlignment(a, b);
    const domainFit = this.scoreDomainFit(a, b);
    const timingFit = this.scoreTimingFit(a, b);

    // Server-side can't fully compute authenticity or preferences
    // without the full Agent Cards, so we use defaults
    const authenticityCompatibility = 0.7;
    const preferenceMatch = 0.7;

    const overall = Math.round(
      (intentAlignment * 0.30 +
       domainFit * 0.25 +
       authenticityCompatibility * 0.20 +
       preferenceMatch * 0.15 +
       timingFit * 0.10) * 100
    );

    return {
      overall: Math.min(100, Math.max(0, overall)),
      breakdown: {
        intentAlignment,
        domainFit,
        authenticityCompatibility,
        preferenceMatch,
        timingFit,
      },
    };
  }

  private scoreIntentAlignment(a: IndexedIntent, b: IndexedIntent): number {
    // Simple keyword overlap between seeking fields
    const aText = JSON.stringify(a.intent).toLowerCase();
    const bText = JSON.stringify(b.intent).toLowerCase();

    // Extract words
    const aWords = new Set(aText.match(/\b[a-z]{3,}\b/g) ?? []);
    const bWords = new Set(bText.match(/\b[a-z]{3,}\b/g) ?? []);

    let overlap = 0;
    for (const word of aWords) {
      if (bWords.has(word)) overlap++;
    }

    const total = Math.max(aWords.size, bWords.size, 1);
    return Math.min(1.0, overlap / total * 3); // Boost factor for sparse data
  }

  private scoreDomainFit(a: IndexedIntent, b: IndexedIntent): number {
    if (a.domain === b.domain) return 0.9;

    const related: Record<string, string[]> = {
      professional: ['commerce', 'learning'],
      'local-services': ['commerce'],
      learning: ['professional'],
      commerce: ['professional', 'local-services'],
    };

    if (related[a.domain]?.includes(b.domain)) return 0.5;
    return 0.1;
  }

  private scoreTimingFit(a: IndexedIntent, b: IndexedIntent): number {
    const now = Date.now();
    const aExpiry = new Date(a.created).getTime() + a.ttl * 1000;
    const bExpiry = new Date(b.created).getTime() + b.ttl * 1000;

    if (now > aExpiry || now > bExpiry) return 0;

    // Both still fresh
    const aRemaining = (aExpiry - now) / (a.ttl * 1000);
    const bRemaining = (bExpiry - now) / (b.ttl * 1000);

    return (aRemaining + bRemaining) / 2;
  }
}
