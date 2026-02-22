/**
 * Tacit Protocol — Relay Node
 *
 * A relay node that enables agent discovery and message routing.
 * The relay NEVER sees plaintext messages — it only routes signed envelopes.
 *
 * Responsibilities:
 * 1. Accept WebSocket connections from agents
 * 2. Index and serve Agent Cards for discovery
 * 3. Store and broadcast intents
 * 4. Run matching engine and notify agents of matches
 * 5. Route proposal messages between agents
 * 6. Enforce rate limits
 */

import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistry } from './registry.js';
import { IntentIndex } from './intent-index.js';
import { MatchEngine } from './match-engine.js';
import { RateLimiter } from './rate-limiter.js';

// ─── Types ───────────────────────────────────────────────────────

interface RelayConfig {
  port: number;
  host?: string;
  maxConnectionsPerIp?: number;
  rateLimitPerMinute?: number;
  matchIntervalMs?: number;
}

interface ConnectedAgent {
  ws: WebSocket;
  did: string | null;
  connectedAt: Date;
  ip: string;
  lastPing: Date;
}

interface Envelope {
  version: string;
  type: string;
  from: string;
  to?: string;
  payload: unknown;
  timestamp: string;
  id: string;
  signature: string;
}

// ─── Relay Server ────────────────────────────────────────────────

export class TacitRelay {
  private wss: WebSocketServer | null = null;
  private agents = new Map<string, ConnectedAgent>();
  private didToConnectionId = new Map<string, string>();
  private registry: AgentRegistry;
  private intentIndex: IntentIndex;
  private matchEngine: MatchEngine;
  private rateLimiter: RateLimiter;
  private matchTimer: ReturnType<typeof setInterval> | null = null;
  private config: Required<RelayConfig>;

  constructor(config: RelayConfig) {
    this.config = {
      host: '0.0.0.0',
      maxConnectionsPerIp: 10,
      rateLimitPerMinute: 60,
      matchIntervalMs: 5000,
      ...config,
    };

    this.registry = new AgentRegistry();
    this.intentIndex = new IntentIndex();
    this.matchEngine = new MatchEngine(this.registry, this.intentIndex);
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute);
  }

  // ─── Lifecycle ─────────────────────────────────────────────

  start(): void {
    this.wss = new WebSocketServer({
      port: this.config.port,
      host: this.config.host,
    });

    console.log(`[Tacit Relay] Listening on ws://${this.config.host}:${this.config.port}`);

    this.wss.on('connection', (ws, req) => {
      const ip = req.socket.remoteAddress ?? 'unknown';
      const connectionId = uuidv4();

      // Check connection limit per IP
      const ipConnections = Array.from(this.agents.values()).filter(a => a.ip === ip).length;
      if (ipConnections >= this.config.maxConnectionsPerIp) {
        ws.close(4001, 'Too many connections from this IP');
        return;
      }

      const agent: ConnectedAgent = {
        ws,
        did: null,
        connectedAt: new Date(),
        ip,
        lastPing: new Date(),
      };

      this.agents.set(connectionId, agent);
      console.log(`[Tacit Relay] Agent connected: ${connectionId} from ${ip} (${this.agents.size} total)`);

      ws.on('message', (data) => {
        this.handleMessage(connectionId, agent, data.toString());
      });

      ws.on('close', () => {
        this.handleDisconnect(connectionId, agent);
      });

      ws.on('error', (err) => {
        console.error(`[Tacit Relay] WebSocket error for ${connectionId}:`, err.message);
      });
    });

    // Start periodic matching
    this.matchTimer = setInterval(() => {
      this.runMatchCycle();
    }, this.config.matchIntervalMs);

    // Cleanup expired intents every minute
    setInterval(() => {
      this.intentIndex.cleanup();
    }, 60000);
  }

  stop(): void {
    if (this.matchTimer) {
      clearInterval(this.matchTimer);
      this.matchTimer = null;
    }

    for (const [, agent] of this.agents) {
      agent.ws.close(1001, 'Server shutting down');
    }
    this.agents.clear();
    this.didToConnectionId.clear();

    this.wss?.close();
    this.wss = null;
    console.log('[Tacit Relay] Stopped');
  }

  get stats() {
    return {
      connections: this.agents.size,
      registeredAgents: this.registry.size,
      activeIntents: this.intentIndex.size,
    };
  }

  // ─── Message Handling ──────────────────────────────────────

  private handleMessage(connectionId: string, agent: ConnectedAgent, raw: string): void {
    let envelope: Envelope;
    try {
      envelope = JSON.parse(raw);
    } catch {
      this.sendError(agent.ws, 'Invalid JSON');
      return;
    }

    // Rate limit check
    const rateLimitKey = agent.did ?? connectionId;
    if (!this.rateLimiter.allow(rateLimitKey)) {
      this.sendError(agent.ws, 'Rate limit exceeded');
      return;
    }

    // NOTE: In production, verify the envelope signature here
    // using the sender's public key from their DID.
    // For v0.1, we trust the relay transport.

    switch (envelope.type) {
      case 'agent-card:publish':
        this.handleCardPublish(connectionId, agent, envelope);
        break;

      case 'intent:publish':
        this.handleIntentPublish(connectionId, agent, envelope);
        break;

      case 'intent:withdraw':
        this.handleIntentWithdraw(agent, envelope);
        break;

      case 'proposal:send':
      case 'proposal:accept':
      case 'proposal:decline':
        this.routeToAgent(envelope);
        break;

      case 'ping':
        agent.lastPing = new Date();
        this.sendTo(agent.ws, {
          version: '0.1.0',
          type: 'pong',
          from: 'relay',
          payload: { ts: Date.now() },
          timestamp: new Date().toISOString(),
          id: `pong:${Date.now()}`,
          signature: '',
        });
        break;

      default:
        this.sendError(agent.ws, `Unknown message type: ${envelope.type}`);
    }
  }

  private handleCardPublish(connectionId: string, agent: ConnectedAgent, envelope: Envelope): void {
    const card = envelope.payload as { agent: { did: string } };
    const did = card.agent?.did;

    if (!did) {
      this.sendError(agent.ws, 'Agent Card must include agent.did');
      return;
    }

    agent.did = did;
    this.didToConnectionId.set(did, connectionId);
    this.registry.register(did, card);

    console.log(`[Tacit Relay] Agent Card registered: ${did.slice(0, 24)}...`);
  }

  private handleIntentPublish(connectionId: string, agent: ConnectedAgent, envelope: Envelope): void {
    if (!agent.did) {
      this.sendError(agent.ws, 'Must publish Agent Card before publishing intents');
      return;
    }

    const intent = envelope.payload as {
      id: string;
      agentDid: string;
      type: string;
      domain: string;
      intent: unknown;
      filters: unknown;
      ttl: number;
      created: string;
    };

    this.intentIndex.add(intent);
    console.log(`[Tacit Relay] Intent published: ${intent.id} (${intent.type}/${intent.domain})`);
  }

  private handleIntentWithdraw(agent: ConnectedAgent, envelope: Envelope): void {
    const { intentId } = envelope.payload as { intentId: string };
    this.intentIndex.remove(intentId);
  }

  private routeToAgent(envelope: Envelope): void {
    if (!envelope.to) {
      console.warn('[Tacit Relay] Cannot route message without recipient DID');
      return;
    }

    const connectionId = this.didToConnectionId.get(envelope.to);
    if (!connectionId) {
      // Agent offline — in production, queue the message
      console.debug(`[Tacit Relay] Recipient offline: ${envelope.to.slice(0, 24)}...`);
      return;
    }

    const agent = this.agents.get(connectionId);
    if (!agent || agent.ws.readyState !== WebSocket.OPEN) return;

    this.sendTo(agent.ws, envelope);
  }

  private handleDisconnect(connectionId: string, agent: ConnectedAgent): void {
    if (agent.did) {
      this.didToConnectionId.delete(agent.did);
    }
    this.agents.delete(connectionId);
    console.log(`[Tacit Relay] Agent disconnected: ${connectionId} (${this.agents.size} remaining)`);
  }

  // ─── Matching ──────────────────────────────────────────────

  private runMatchCycle(): void {
    const matches = this.matchEngine.findMatches();

    for (const match of matches) {
      // Notify initiator
      this.notifyAgent(match.agents.initiator, {
        version: '0.1.0',
        type: 'match:notify',
        from: 'relay',
        to: match.agents.initiator,
        payload: match,
        timestamp: new Date().toISOString(),
        id: `match:${match.matchId}:init`,
        signature: '',
      });

      // Notify responder
      this.notifyAgent(match.agents.responder, {
        version: '0.1.0',
        type: 'match:notify',
        from: 'relay',
        to: match.agents.responder,
        payload: match,
        timestamp: new Date().toISOString(),
        id: `match:${match.matchId}:resp`,
        signature: '',
      });
    }
  }

  private notifyAgent(did: string, envelope: Envelope): void {
    const connectionId = this.didToConnectionId.get(did);
    if (!connectionId) return;

    const agent = this.agents.get(connectionId);
    if (!agent || agent.ws.readyState !== WebSocket.OPEN) return;

    this.sendTo(agent.ws, envelope);
  }

  // ─── Helpers ───────────────────────────────────────────────

  private sendTo(ws: WebSocket, envelope: Envelope): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(envelope));
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    this.sendTo(ws, {
      version: '0.1.0',
      type: 'error',
      from: 'relay',
      payload: { error: message },
      timestamp: new Date().toISOString(),
      id: `error:${Date.now()}`,
      signature: '',
    });
  }
}

// ─── CLI Entry Point ─────────────────────────────────────────────

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const port = parseInt(process.env['TACIT_RELAY_PORT'] ?? '8787');
  const relay = new TacitRelay({ port });
  relay.start();

  process.on('SIGINT', () => {
    relay.stop();
    process.exit(0);
  });
}
