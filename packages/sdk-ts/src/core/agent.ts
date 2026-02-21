/**
 * Tacit Protocol — Agent Core
 *
 * The TacitAgent is the primary interface for interacting with the
 * Tacit Protocol. It represents a human's AI agent on the network.
 */

import { v4 as uuidv4 } from 'uuid';
import { createIdentity } from '../identity/did.js';
import { AuthenticityEngine } from '../identity/authenticity.js';
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
} from '../types/index.js';

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

  constructor(config: TacitConfig) {
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
  } = {}): Promise<TacitAgent> {
    const identity = await TacitAgent.createIdentity();
    return new TacitAgent({
      identity,
      profile: {
        name: 'Tacit Agent',
        domain: options.domain || 'professional',
        seeking: options.seeking || '',
        offering: options.offering || '',
      },
      preferences: options.preferences as any,
    });
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
  async connect(options?: { demo?: boolean }): Promise<void> {
    if (!this.identity) {
      this.identity = await createIdentity();
    }

    // TODO: Establish WebSocket connection to relay node
    // TODO: Publish Agent Card to the network
    // TODO: Subscribe to intent matches

    this.connected = true;

    await this.events.emit({
      type: 'connection:established',
      endpoint: this.config.relayUrl!,
    });

    // Demo mode: simulate a match after 3 seconds
    if (options?.demo) {
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
    }
  }

  /**
   * Disconnect the agent from the network.
   * Active intents remain on the network until their TTL expires.
   */
  async disconnect(): Promise<void> {
    // TODO: Close WebSocket connection
    // TODO: Optionally withdraw all active intents

    this.connected = false;
  }

  /**
   * Check if the agent is connected to the network.
   */
  isConnected(): boolean {
    return this.connected;
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
        intentStability: 1.0, // New agent, no changes yet
        profileConsistency: 1.0,
        responseReliability: 0.5, // No track record
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

    const intent: Intent = {
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
      ttl: params.ttlSeconds ?? 604800, // 7 days default
      created: new Date().toISOString(),
      signature: '', // TODO: Sign with agent's private key
    };

    this.intents.set(intent.id, intent);

    // TODO: Broadcast to relay node

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

    // TODO: Notify relay node of withdrawal
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
   * Called when another agent's intent is compatible with ours.
   */
  async handleMatch(match: MatchResult): Promise<void> {
    const thresholds = this.config.matchThresholds!;

    if (match.score.overall >= thresholds.autoPropose) {
      // Auto-propose introduction
      await this.proposeIntro(match);
    } else if (match.score.overall >= thresholds.suggest) {
      // Suggest to human for review
      await this.events.emit({ type: 'intent:matched', match });
    }
    // Below suggest threshold: ignore
  }

  /**
   * Create and send an introduction proposal.
   */
  async proposeIntro(match: MatchResult): Promise<IntroProposal> {
    if (!this.identity) throw new Error('Agent has no identity.');

    const proposal: IntroProposal = {
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
        domain: 'professional', // TODO: derive from intent
      },
      terms: {
        initialReveal: 'pseudonymous',
        revealStages: ['domain_context', 'professional_background', 'identity'],
        communicationChannel: 'tacit_direct',
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'pending',
      created: new Date().toISOString(),
      signature: '', // TODO: Sign
    };

    this.proposals.set(proposal.id, proposal);

    // TODO: Send proposal to responder via relay

    return proposal;
  }

  /**
   * Accept an introduction proposal.
   * This is the human's explicit consent (one half of double opt-in).
   */
  async acceptProposal(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

    if (!this.identity) throw new Error('Agent has no identity.');

    // Determine which side we are
    const isInitiator = proposal.initiator.agentDid === this.identity.did;

    if (isInitiator) {
      proposal.status = 'accepted_by_initiator';
    } else {
      proposal.status = 'accepted_by_responder';
    }

    // TODO: Send acceptance to the other party via relay
    await this.events.emit({ type: 'proposal:accepted', proposal });
  }

  /**
   * Decline an introduction proposal.
   * The other party receives a generic "not a match" response.
   */
  async declineProposal(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

    proposal.status = 'declined';
    this.proposals.delete(proposalId);

    // TODO: Send generic decline to the other party via relay
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

  /**
   * Subscribe to specific event types.
   */
  on(type: string, handler: EventHandler): void {
    this.events.on(type, handler);
  }

  /**
   * Subscribe to all events.
   */
  onAny(handler: EventHandler): void {
    this.events.onAny(handler);
  }

  /**
   * Unsubscribe from an event type.
   */
  off(type: string, handler: EventHandler): void {
    this.events.off(type, handler);
  }

  // ─── Helpers ──────────────────────────────────────────────────

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
