/**
 * Tacit Protocol — Core Type Definitions
 * Version: 0.1.0
 */

// ─── Identity Types ───────────────────────────────────────────────

export type DID = `did:${string}:${string}`;

export interface AgentIdentity {
  did: DID;
  publicKey: Uint8Array;
  privateKey?: Uint8Array;
  created: Date;
}

export type AnonymityLevel = 'anonymous' | 'pseudonymous' | 'semi-identified' | 'identified';

export interface SessionPersona {
  displayName: string;
  context: string;
  anonymityLevel: AnonymityLevel;
  sessionId: string;
}

// ─── Agent Card Types ─────────────────────────────────────────────

export interface AgentCard {
  version: string;
  agent: {
    did: DID;
    name: string;
    description: string;
    created: string;
    protocols: string[];
    transport: TransportConfig;
  };
  domains: Domain[];
  authenticity: AuthenticityVector;
  preferences: AgentPreferences;
}

export interface TransportConfig {
  type: 'didcomm/v2';
  endpoint: string;
}

export interface Domain {
  type: DomainType;
  seeking: string[];
  offering: string[];
  context: Record<string, string | string[] | number>;
}

export type DomainType =
  | 'professional'
  | 'dating'
  | 'local-services'
  | 'learning'
  | 'commerce'
  | 'custom';

export interface AgentPreferences {
  introductionStyle: 'progressive' | 'direct';
  initialAnonymity: boolean;
  responseTime: string;
  languages: string[];
}

// ─── Authenticity Vector Types ────────────────────────────────────

export interface AuthenticityVector {
  level: TrustLevel;
  score: number;
  dimensions: AuthenticityDimensions;
  verifiableCredentials: VerifiableCredential[];
}

export interface AuthenticityDimensions {
  tenure: number;
  consistency: number;
  attestations: number;
  networkTrust: number;
}

export type TrustLevel = 'new' | 'emerging' | 'established' | 'trusted' | 'exemplary';

export interface VerifiableCredential {
  type: string;
  issuer: DID;
  claim: string;
  issued: string;
  signature?: string;
}

// ─── Intent Types ─────────────────────────────────────────────────

export interface Intent {
  id: string;
  agentDid: DID;
  type: IntentType;
  domain: DomainType;
  intent: {
    seeking: Record<string, unknown>;
    context: Record<string, unknown>;
  };
  filters: IntentFilters;
  privacyLevel: PrivacyLevel;
  ttl: number;
  created: string;
  signature: string;
}

export type IntentType =
  | 'introduction'
  | 'service'
  | 'collaboration'
  | 'mentorship'
  | 'commerce';

export type PrivacyLevel = 'public' | 'filtered' | 'private';

export interface IntentFilters {
  minAuthenticityScore: number;
  requiredCredentials: string[];
  excludedDomains: string[];
}

export type IntentStatus =
  | 'created'
  | 'published'
  | 'active'
  | 'matched'
  | 'fulfilled'
  | 'expired'
  | 'withdrawn';

// ─── Match Types ──────────────────────────────────────────────────

export interface MatchResult {
  matchId: string;
  agents: {
    initiator: DID;
    responder: DID;
  };
  score: MatchScore;
  timestamp: string;
}

export interface MatchScore {
  overall: number;
  breakdown: {
    intentAlignment: number;
    domainFit: number;
    authenticityCompatibility: number;
    preferenceMatch: number;
    timingFit: number;
  };
}

export type MatchAction = 'auto-propose' | 'suggest' | 'ignore';

// ─── Intro Proposal Types ─────────────────────────────────────────

export interface IntroProposal {
  id: string;
  type: IntentType;
  initiator: {
    agentDid: DID;
    persona: SessionPersona;
  };
  responder: {
    agentDid: DID;
    persona?: SessionPersona;
  };
  match: {
    score: number;
    rationale: string;
    domain: DomainType;
  };
  terms: IntroTerms;
  status: ProposalStatus;
  created: string;
  signature: string;
}

export interface IntroTerms {
  initialReveal: AnonymityLevel;
  revealStages: RevealStage[];
  communicationChannel: string;
  expiry: string;
}

export type RevealStage =
  | 'domain_context'
  | 'professional_background'
  | 'personal_background'
  | 'identity'
  | 'direct_contact';

export type ProposalStatus =
  | 'pending'
  | 'accepted_by_initiator'
  | 'accepted_by_responder'
  | 'active'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'withdrawn';

// ─── Service / Commerce Types ─────────────────────────────────────

export interface ServiceIntent {
  serviceType: string;
  description: string;
  location?: {
    city: string;
    radiusKm: number;
  };
  budget?: {
    currency: string;
    max: number;
  };
  urgency: string;
  requirements: {
    minAuthenticity: number;
    requiredCredentials: string[];
  };
}

export interface ServiceAttestation {
  type: 'ServiceAttestation';
  issuer: DID;
  subject: DID;
  claims: {
    serviceType: string;
    completed: boolean;
    qualityRating: number;
    onTime: boolean;
    wouldRecommend: boolean;
  };
  issued: string;
  signature: string;
}

// ─── Event Types ──────────────────────────────────────────────────

export type TacitEvent =
  | { type: 'intent:published'; intent: Intent }
  | { type: 'intent:matched'; match: MatchResult }
  | { type: 'intent:expired'; intentId: string }
  | { type: 'proposal:received'; proposal: IntroProposal }
  | { type: 'proposal:accepted'; proposal: IntroProposal }
  | { type: 'proposal:declined'; proposalId: string }
  | { type: 'intro:started'; proposal: IntroProposal }
  | { type: 'intro:context-revealed'; stage: RevealStage; data: Record<string, unknown> }
  | { type: 'intro:completed'; proposalId: string }
  | { type: 'connection:established'; endpoint: string }
  | { type: 'connection:lost'; reason: string }
  | { type: 'error'; error: Error };

// ─── Configuration Types ──────────────────────────────────────────

export interface TacitConfig {
  identity?: AgentIdentity;
  relayUrl?: string;
  profile?: {
    name: string;
    description?: string;
    domain: DomainType;
    seeking: string;
    offering: string;
  };
  matchThresholds?: {
    autoPropose: number;
    suggest: number;
  };
  preferences?: Partial<AgentPreferences>;
}

export interface RelayConfig {
  url: string;
  maxRetries: number;
  retryDelayMs: number;
  heartbeatIntervalMs: number;
}
