/**
 * Tacit Protocol — Match Scoring Engine
 *
 * Computes compatibility scores between two agents based on their
 * intents, domains, authenticity, and preferences.
 */

import type {
  Intent,
  AgentCard,
  MatchResult,
  MatchScore,
  MatchAction,
  AuthenticityVector,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

// ─── Scoring Weights ──────────────────────────────────────────────

const SCORE_WEIGHTS = {
  intentAlignment: 0.30,
  domainFit: 0.25,
  authenticityCompatibility: 0.20,
  preferenceMatch: 0.15,
  timingFit: 0.10,
} as const;

// ─── Default Thresholds ───────────────────────────────────────────

const DEFAULT_THRESHOLDS = {
  autoPropose: 80,
  suggest: 60,
};

// ─── Match Scorer ─────────────────────────────────────────────────

export class MatchScorer {
  private thresholds: { autoPropose: number; suggest: number };

  constructor(thresholds?: { autoPropose?: number; suggest?: number }) {
    this.thresholds = {
      autoPropose: thresholds?.autoPropose ?? DEFAULT_THRESHOLDS.autoPropose,
      suggest: thresholds?.suggest ?? DEFAULT_THRESHOLDS.suggest,
    };
  }

  /**
   * Score the compatibility between two agents based on their intents and cards.
   */
  score(params: {
    initiator: { intent: Intent; card: AgentCard };
    responder: { intent: Intent; card: AgentCard };
  }): MatchResult {
    const { initiator, responder } = params;

    const breakdown = {
      intentAlignment: this.scoreIntentAlignment(initiator.intent, responder.intent),
      domainFit: this.scoreDomainFit(initiator.intent, responder.intent),
      authenticityCompatibility: this.scoreAuthenticityCompatibility(
        initiator.card.authenticity,
        responder.card.authenticity,
        initiator.intent,
        responder.intent
      ),
      preferenceMatch: this.scorePreferenceMatch(initiator.card, responder.card),
      timingFit: this.scoreTimingFit(initiator.intent, responder.intent),
    };

    const overall = Math.round(
      breakdown.intentAlignment * SCORE_WEIGHTS.intentAlignment +
      breakdown.domainFit * SCORE_WEIGHTS.domainFit +
      breakdown.authenticityCompatibility * SCORE_WEIGHTS.authenticityCompatibility +
      breakdown.preferenceMatch * SCORE_WEIGHTS.preferenceMatch +
      breakdown.timingFit * SCORE_WEIGHTS.timingFit
    ) * 100;

    return {
      matchId: `match:${uuidv4()}`,
      agents: {
        initiator: initiator.card.agent.did,
        responder: responder.card.agent.did,
      },
      score: {
        overall: Math.min(100, Math.max(0, overall)),
        breakdown,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Determine what action to take based on a match score.
   */
  determineAction(score: number): MatchAction {
    if (score >= this.thresholds.autoPropose) return 'auto-propose';
    if (score >= this.thresholds.suggest) return 'suggest';
    return 'ignore';
  }

  // ─── Dimension Scorers ──────────────────────────────────────────

  /**
   * Score how well the two intents complement each other.
   * A seeking-offering match scores highest.
   */
  private scoreIntentAlignment(a: Intent, b: Intent): number {
    // Check for seeking-offering complementarity
    const aSeeking = flattenValues(a.intent.seeking);
    const bSeeking = flattenValues(b.intent.seeking);
    const aContext = flattenValues(a.intent.context);
    const bContext = flattenValues(b.intent.context);

    // How well does A's seeking match B's context/offering?
    const aToB = computeOverlap(aSeeking, [...bSeeking, ...bContext]);
    // How well does B's seeking match A's context/offering?
    const bToA = computeOverlap(bSeeking, [...aSeeking, ...aContext]);

    // Bidirectional alignment is better
    return (aToB + bToA) / 2;
  }

  /**
   * Score the domain overlap between two intents.
   */
  private scoreDomainFit(a: Intent, b: Intent): number {
    // Same domain is a strong signal
    if (a.domain === b.domain) return 0.9;

    // Related domains get partial credit
    const related = RELATED_DOMAINS.get(a.domain);
    if (related?.includes(b.domain)) return 0.5;

    return 0.1;
  }

  /**
   * Score whether both agents meet each other's authenticity requirements.
   */
  private scoreAuthenticityCompatibility(
    aAuth: AuthenticityVector,
    bAuth: AuthenticityVector,
    aIntent: Intent,
    bIntent: Intent
  ): number {
    const aMinScore = aIntent.filters.minAuthenticityScore;
    const bMinScore = bIntent.filters.minAuthenticityScore;

    // Both meet each other's minimums
    const aMeetsBMin = bAuth.score >= aMinScore;
    const bMeetsAMin = aAuth.score >= bMinScore;

    if (aMeetsBMin && bMeetsAMin) {
      // Both meet minimums — score based on how far above the minimum
      const aExcess = (bAuth.score - aMinScore) / (100 - aMinScore);
      const bExcess = (aAuth.score - bMinScore) / (100 - bMinScore);
      return 0.6 + ((aExcess + bExcess) / 2) * 0.4;
    }

    if (aMeetsBMin || bMeetsAMin) {
      // Only one meets the other's minimum
      return 0.3;
    }

    // Neither meets the other's minimum
    return 0;
  }

  /**
   * Score preference compatibility (communication style, timing, language).
   */
  private scorePreferenceMatch(a: AgentCard, b: AgentCard): number {
    let score = 0;
    let factors = 0;

    // Language overlap
    const langOverlap = a.preferences.languages.filter(
      l => b.preferences.languages.includes(l)
    );
    if (langOverlap.length > 0) {
      score += 1.0;
    }
    factors++;

    // Introduction style compatibility
    if (a.preferences.introductionStyle === b.preferences.introductionStyle) {
      score += 1.0;
    } else {
      score += 0.5; // Different styles still work
    }
    factors++;

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Score timing compatibility — are both intents active and aligned in urgency?
   */
  private scoreTimingFit(a: Intent, b: Intent): number {
    const now = Date.now();

    // Check both intents are still within TTL
    const aExpiry = new Date(a.created).getTime() + a.ttl * 1000;
    const bExpiry = new Date(b.created).getTime() + b.ttl * 1000;

    if (now > aExpiry || now > bExpiry) return 0;

    // Check urgency alignment from context
    const aUrgency = extractUrgency(a.intent.context);
    const bUrgency = extractUrgency(b.intent.context);

    if (aUrgency === bUrgency) return 1.0;
    if (Math.abs(aUrgency - bUrgency) <= 1) return 0.7;
    return 0.3;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Flatten an object's values into a string array for comparison.
 */
function flattenValues(obj: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      values.push(value.toLowerCase());
    } else if (Array.isArray(value)) {
      values.push(...value.filter(v => typeof v === 'string').map(v => (v as string).toLowerCase()));
    }
  }
  return values;
}

/**
 * Compute the overlap between two string arrays using Jaccard-like similarity.
 */
function computeOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  let matches = 0;
  for (const term of a) {
    for (const bTerm of b) {
      if (term === bTerm || bTerm.includes(term) || term.includes(bTerm)) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(a.length, 1);
}

/**
 * Extract urgency level from context (0 = passive, 3 = immediate).
 */
function extractUrgency(context: Record<string, unknown>): number {
  const urgency = context['urgency'];
  if (typeof urgency !== 'string') return 1; // default: moderate

  switch (urgency.toLowerCase()) {
    case 'immediate':
    case 'asap':
      return 3;
    case 'active':
    case 'urgent':
      return 2;
    case 'moderate':
    case 'normal':
      return 1;
    case 'passive':
    case 'low':
    case 'whenever':
      return 0;
    default:
      return 1;
  }
}

/**
 * Related domain mapping for cross-domain matching.
 */
const RELATED_DOMAINS = new Map<string, string[]>([
  ['professional', ['commerce', 'learning']],
  ['dating', []],
  ['local-services', ['commerce']],
  ['learning', ['professional']],
  ['commerce', ['professional', 'local-services']],
]);
