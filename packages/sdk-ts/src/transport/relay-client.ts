/**
 * Tacit Protocol — Relay Client
 *
 * WebSocket client for connecting agents to the Tacit relay network.
 * Handles connection lifecycle, message routing, and reconnection.
 */

import type {
  AgentIdentity,
  AgentCard,
  Intent,
  MatchResult,
  IntroProposal,
  RelayConfig,
  TacitEvent,
  DID,
} from '../types/index.js';
import {
  createSignedMessage,
  verifyMessage,
  type SignedEnvelope,
  type MessageType,
} from './message.js';

// ─── Relay Client ────────────────────────────────────────────────

export type RelayEventHandler = (event: TacitEvent) => void | Promise<void>;

export interface RelayClientOptions {
  config: RelayConfig;
  identity: AgentIdentity;
  onEvent: RelayEventHandler;
}

export class RelayClient {
  private ws: WebSocket | null = null;
  private identity: AgentIdentity;
  private config: RelayConfig;
  private onEvent: RelayEventHandler;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();

  constructor(options: RelayClientOptions) {
    this.identity = options.identity;
    this.config = options.config;
    this.onEvent = options.onEvent;
  }

  // ─── Connection Lifecycle ────────────────────────────────────

  /**
   * Connect to the relay node via WebSocket.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onEvent({ type: 'connection:established', endpoint: this.config.url });
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string);
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          this.onEvent({ type: 'connection:lost', reason: 'WebSocket closed' });
          this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
          if (this.reconnectAttempts === 0) {
            reject(new Error(`Failed to connect to relay: ${this.config.url}`));
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect from the relay node.
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client disconnecting'));
    }
    this.pendingRequests.clear();

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ─── Agent Operations ────────────────────────────────────────

  /**
   * Publish the agent's card to the relay for discovery.
   */
  async publishCard(card: AgentCard): Promise<void> {
    await this.send('agent-card:publish', card);
  }

  /**
   * Publish an intent to the relay network.
   */
  async publishIntent(intent: Intent): Promise<void> {
    await this.send('intent:publish', intent);
  }

  /**
   * Withdraw an intent from the relay network.
   */
  async withdrawIntent(intentId: string): Promise<void> {
    await this.send('intent:withdraw', { intentId });
  }

  /**
   * Send an introduction proposal to another agent.
   */
  async sendProposal(proposal: IntroProposal, to: DID): Promise<void> {
    await this.send('proposal:send', proposal, to);
  }

  /**
   * Accept an introduction proposal.
   */
  async acceptProposal(proposalId: string, to: DID): Promise<void> {
    await this.send('proposal:accept', { proposalId }, to);
  }

  /**
   * Decline an introduction proposal.
   */
  async declineProposal(proposalId: string, to: DID): Promise<void> {
    await this.send('proposal:decline', { proposalId }, to);
  }

  // ─── Internal ────────────────────────────────────────────────

  private async send<T>(type: MessageType, payload: T, to?: DID): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to relay');
    }

    const envelope = await createSignedMessage(this.identity, type, payload, to);
    this.ws.send(JSON.stringify(envelope));
  }

  private async handleMessage(raw: string): Promise<void> {
    let envelope: SignedEnvelope;
    try {
      envelope = JSON.parse(raw);
    } catch {
      console.error('[Tacit Relay] Failed to parse message:', raw.slice(0, 100));
      return;
    }

    // Verify signature
    const valid = await verifyMessage(envelope);
    if (!valid) {
      console.warn('[Tacit Relay] Invalid signature on message:', envelope.id);
      return;
    }

    // Handle pending request responses
    if (this.pendingRequests.has(envelope.id)) {
      const pending = this.pendingRequests.get(envelope.id)!;
      clearTimeout(pending.timeout);
      pending.resolve(envelope.payload);
      this.pendingRequests.delete(envelope.id);
      return;
    }

    // Route by message type
    switch (envelope.type) {
      case 'match:notify':
        await this.onEvent({
          type: 'match',
          match: envelope.payload as MatchResult,
        });
        break;

      case 'proposal:send':
        await this.onEvent({
          type: 'proposal:received',
          proposal: envelope.payload as IntroProposal,
        });
        break;

      case 'proposal:accept':
        // Look up the proposal
        await this.onEvent({
          type: 'proposal:accepted',
          proposal: envelope.payload as IntroProposal,
        });
        break;

      case 'proposal:decline':
        await this.onEvent({
          type: 'proposal:declined',
          proposalId: (envelope.payload as { proposalId: string }).proposalId,
        });
        break;

      case 'pong':
        // Heartbeat response — no-op
        break;

      default:
        console.debug('[Tacit Relay] Unhandled message type:', envelope.type);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (this.isConnected) {
        try {
          await this.send('ping', { ts: Date.now() });
        } catch {
          // Will trigger reconnect via onclose
        }
      }
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxRetries) {
      this.onEvent({
        type: 'error',
        error: new Error(`Failed to reconnect after ${this.config.maxRetries} attempts`),
      });
      return;
    }

    const delay = this.config.retryDelayMs * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        // Will schedule another reconnect via onclose
      }
    }, delay);
  }
}
