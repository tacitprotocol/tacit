/**
 * Tacit Protocol — Authenticity Vector Engine
 *
 * Computes and manages the multi-dimensional trust score that
 * replaces self-reported profiles with verifiable behavioral signals.
 */

import type {
  AuthenticityVector,
  AuthenticityDimensions,
  TrustLevel,
  VerifiableCredential,
} from '../types/index.js';

// ─── Constants ────────────────────────────────────────────────────

const DIMENSION_WEIGHTS = {
  tenure: 0.20,
  consistency: 0.30,
  attestations: 0.25,
  networkTrust: 0.25,
} as const;

const TRUST_LEVEL_THRESHOLDS: [TrustLevel, number][] = [
  ['exemplary', 90],
  ['trusted', 70],
  ['established', 40],
  ['emerging', 20],
  ['new', 0],
];

const CONSISTENCY_WEIGHTS = {
  intentStability: 0.30,
  profileConsistency: 0.25,
  responseReliability: 0.25,
  interactionQuality: 0.20,
} as const;

const ATTESTATION_WEIGHTS = {
  institutional: 0.40,
  peer: 0.30,
  transaction: 0.30,
} as const;

/** Score decays 0.1% per day after 30 days of inactivity */
const DECAY_RATE_PER_DAY = 0.001;
const DECAY_GRACE_PERIOD_DAYS = 30;

// ─── Core Engine ──────────────────────────────────────────────────

export class AuthenticityEngine {
  /**
   * Compute the tenure dimension score.
   * Linear growth over 365 days, capped at 1.0.
   */
  computeTenure(agentCreatedDate: Date, now: Date = new Date()): number {
    const daysActive = (now.getTime() - agentCreatedDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(1.0, Math.max(0, daysActive / 365));
  }

  /**
   * Compute the consistency dimension score.
   * Based on behavioral stability signals over time.
   */
  computeConsistency(signals: ConsistencySignals): number {
    return clamp(
      signals.intentStability * CONSISTENCY_WEIGHTS.intentStability +
      signals.profileConsistency * CONSISTENCY_WEIGHTS.profileConsistency +
      signals.responseReliability * CONSISTENCY_WEIGHTS.responseReliability +
      signals.interactionQuality * CONSISTENCY_WEIGHTS.interactionQuality
    );
  }

  /**
   * Compute the attestation dimension score.
   * Based on third-party verifiable credentials.
   */
  computeAttestations(credentials: VerifiableCredential[]): number {
    if (credentials.length === 0) return 0;

    let institutional = 0;
    let peer = 0;
    let transaction = 0;

    for (const cred of credentials) {
      // Categorize credentials
      if (isInstitutionalCredential(cred)) {
        institutional += credentialWeight(cred);
      } else if (isPeerAttestation(cred)) {
        peer += credentialWeight(cred);
      } else {
        transaction += credentialWeight(cred);
      }
    }

    // Normalize each category to 0-1
    institutional = Math.min(1.0, institutional);
    peer = Math.min(1.0, peer);
    transaction = Math.min(1.0, transaction);

    return clamp(
      institutional * ATTESTATION_WEIGHTS.institutional +
      peer * ATTESTATION_WEIGHTS.peer +
      transaction * ATTESTATION_WEIGHTS.transaction
    );
  }

  /**
   * Compute the network trust dimension score.
   * Based on the quality of the agent's network relationships.
   *
   * This is a simplified version — production implementations
   * should use a full PageRank-style algorithm.
   */
  computeNetworkTrust(signals: NetworkTrustSignals): number {
    if (signals.totalInteractions === 0) return 0;

    const successRate = signals.successfulIntros / Math.max(1, signals.totalIntros);
    const positiveRate = signals.positiveInteractions / signals.totalInteractions;
    const bidirectionalBonus = Math.min(1.0, signals.bidirectionalTrustEdges * 0.1);

    return clamp(
      successRate * 0.35 +
      positiveRate * 0.35 +
      bidirectionalBonus * 0.30
    );
  }

  /**
   * Compute the full authenticity vector from all dimensions.
   */
  computeVector(params: {
    agentCreatedDate: Date;
    consistencySignals: ConsistencySignals;
    credentials: VerifiableCredential[];
    networkSignals: NetworkTrustSignals;
    lastActiveDate?: Date;
  }): AuthenticityVector {
    const now = new Date();

    const dimensions: AuthenticityDimensions = {
      tenure: this.computeTenure(params.agentCreatedDate, now),
      consistency: this.computeConsistency(params.consistencySignals),
      attestations: this.computeAttestations(params.credentials),
      networkTrust: this.computeNetworkTrust(params.networkSignals),
    };

    // Compute raw score
    let score =
      dimensions.tenure * DIMENSION_WEIGHTS.tenure +
      dimensions.consistency * DIMENSION_WEIGHTS.consistency +
      dimensions.attestations * DIMENSION_WEIGHTS.attestations +
      dimensions.networkTrust * DIMENSION_WEIGHTS.networkTrust;

    // Apply inactivity decay
    if (params.lastActiveDate) {
      const inactiveDays = (now.getTime() - params.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
      if (inactiveDays > DECAY_GRACE_PERIOD_DAYS) {
        const decayDays = inactiveDays - DECAY_GRACE_PERIOD_DAYS;
        const decayFactor = Math.max(0, 1 - decayDays * DECAY_RATE_PER_DAY);
        score *= decayFactor;
      }
    }

    // Scale to 0-100
    score = Math.round(score * 100);

    return {
      level: this.scoreToLevel(score),
      score,
      dimensions,
      verifiableCredentials: params.credentials,
    };
  }

  /**
   * Convert a numeric score to a trust level.
   */
  scoreToLevel(score: number): TrustLevel {
    for (const [level, threshold] of TRUST_LEVEL_THRESHOLDS) {
      if (score >= threshold) return level;
    }
    return 'new';
  }

  /**
   * Check if an agent meets minimum authenticity requirements.
   */
  meetsMinimum(vector: AuthenticityVector, minScore: number): boolean {
    return vector.score >= minScore;
  }
}

// ─── Signal Types ─────────────────────────────────────────────────

export interface ConsistencySignals {
  /** 0-1: How stable the agent's intents have been over time */
  intentStability: number;
  /** 0-1: How consistent the profile claims have been */
  profileConsistency: number;
  /** 0-1: How reliably the agent responds to proposals */
  responseReliability: number;
  /** 0-1: Quality ratings from completed interactions */
  interactionQuality: number;
}

export interface NetworkTrustSignals {
  /** Total number of interactions this agent has had */
  totalInteractions: number;
  /** Number of interactions rated positively by the other party */
  positiveInteractions: number;
  /** Total introduction proposals that reached completion */
  totalIntros: number;
  /** Intros that both parties rated as successful */
  successfulIntros: number;
  /** Number of agents that mutually trust this agent */
  bidirectionalTrustEdges: number;
}

// ─── Helpers ──────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

const INSTITUTIONAL_TYPES = new Set([
  'EmploymentCredential',
  'EducationCredential',
  'ProfessionalCertification',
  'GovernmentId',
  'LicenseCredential',
]);

function isInstitutionalCredential(cred: VerifiableCredential): boolean {
  return INSTITUTIONAL_TYPES.has(cred.type);
}

const PEER_TYPES = new Set([
  'PeerEndorsement',
  'PeerAttestation',
  'RecommendationCredential',
]);

function isPeerAttestation(cred: VerifiableCredential): boolean {
  return PEER_TYPES.has(cred.type);
}

function credentialWeight(cred: VerifiableCredential): number {
  // Newer credentials are worth more
  const issued = new Date(cred.issued);
  const ageYears = (Date.now() - issued.getTime()) / (1000 * 60 * 60 * 24 * 365);

  // Decay: full weight for first year, then 10% per year
  const ageFactor = Math.max(0.1, 1 - (ageYears - 1) * 0.1);

  // Base weight by type
  const baseWeight = INSTITUTIONAL_TYPES.has(cred.type) ? 0.5 : 0.3;

  return baseWeight * ageFactor;
}
