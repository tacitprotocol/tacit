/**
 * Tacit Protocol SDK
 *
 * The social layer for the agent era.
 * Enables AI agents to discover, trust, and introduce the humans they represent.
 *
 * @packageDocumentation
 */

// Core
export { TacitAgent } from './core/agent.js';

// Identity
export { createIdentity, publicKeyToDid, resolveDid, sign, verify } from './identity/did.js';
export { AuthenticityEngine } from './identity/authenticity.js';
export type { ConsistencySignals, NetworkTrustSignals } from './identity/authenticity.js';

// Discovery
export { IntentBuilder, IntentStore } from './discovery/intent.js';

// Matching
export { MatchScorer } from './matching/scorer.js';

// Types
export type {
  // Identity
  DID,
  AgentIdentity,
  AnonymityLevel,
  SessionPersona,

  // Agent Card
  AgentCard,
  TransportConfig,
  Domain,
  DomainType,
  AgentPreferences,

  // Authenticity
  AuthenticityVector,
  AuthenticityDimensions,
  TrustLevel,
  VerifiableCredential,

  // Intents
  Intent,
  IntentType,
  IntentStatus,
  IntentFilters,
  PrivacyLevel,

  // Matching
  MatchResult,
  MatchScore,
  MatchAction,

  // Introductions
  IntroProposal,
  IntroTerms,
  RevealStage,
  ProposalStatus,

  // Commerce
  ServiceIntent,
  ServiceAttestation,

  // Events
  TacitEvent,

  // Config
  TacitConfig,
  RelayConfig,
} from './types/index.js';
