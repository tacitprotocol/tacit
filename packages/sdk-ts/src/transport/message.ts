/**
 * Tacit Protocol — Message Signing & Verification
 *
 * Signs and verifies protocol messages using the agent's DID keypair.
 * All messages on the network are signed to prevent impersonation.
 */

import { sign, verify, resolveDid } from '../identity/did.js';
import type { DID, AgentIdentity, Intent, IntroProposal } from '../types/index.js';

// ─── Message Envelope ────────────────────────────────────────────

export interface SignedEnvelope<T = unknown> {
  /** Protocol version */
  version: '0.1.0';
  /** Message type identifier */
  type: MessageType;
  /** Sender's DID */
  from: DID;
  /** Recipient's DID (optional — broadcasts have no recipient) */
  to?: DID;
  /** The payload */
  payload: T;
  /** ISO timestamp */
  timestamp: string;
  /** Unique message ID */
  id: string;
  /** Ed25519 signature over the canonical payload */
  signature: string;
}

export type MessageType =
  | 'agent-card:publish'
  | 'agent-card:query'
  | 'intent:publish'
  | 'intent:withdraw'
  | 'intent:query'
  | 'match:notify'
  | 'proposal:send'
  | 'proposal:accept'
  | 'proposal:decline'
  | 'ping'
  | 'pong';

// ─── Message Builder ─────────────────────────────────────────────

let messageCounter = 0;

function generateMessageId(did: DID): string {
  const short = did.split(':').pop()?.slice(0, 8) ?? 'unknown';
  return `msg:${short}:${Date.now()}:${++messageCounter}`;
}

/**
 * Canonical serialization of a message payload for signing.
 * Deterministic JSON — sorted keys, no whitespace.
 */
function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k])).join(',') + '}';
  }
  return String(obj);
}

// ─── Sign & Verify ───────────────────────────────────────────────

/**
 * Create and sign a message envelope.
 */
export async function createSignedMessage<T>(
  identity: AgentIdentity,
  type: MessageType,
  payload: T,
  to?: DID,
): Promise<SignedEnvelope<T>> {
  const envelope: Omit<SignedEnvelope<T>, 'signature'> = {
    version: '0.1.0',
    type,
    from: identity.did,
    to,
    payload,
    timestamp: new Date().toISOString(),
    id: generateMessageId(identity.did),
  };

  // Sign the canonical representation
  const canonical = canonicalize({
    version: envelope.version,
    type: envelope.type,
    from: envelope.from,
    to: envelope.to,
    payload: envelope.payload,
    timestamp: envelope.timestamp,
    id: envelope.id,
  });

  const data = new TextEncoder().encode(canonical);

  if (!identity.privateKey) {
    throw new Error('Cannot sign message: agent has no private key');
  }

  const sig = await sign(data, identity.privateKey);
  const signature = uint8ArrayToHex(sig);

  return { ...envelope, signature };
}

/**
 * Verify a signed message envelope.
 * Returns true if the signature is valid for the claimed sender DID.
 */
export async function verifyMessage<T>(envelope: SignedEnvelope<T>): Promise<boolean> {
  // Resolve the sender's public key from their DID
  const resolved = resolveDid(envelope.from);
  if (!resolved) return false;

  // Reconstruct the canonical data that was signed
  const canonical = canonicalize({
    version: envelope.version,
    type: envelope.type,
    from: envelope.from,
    to: envelope.to,
    payload: envelope.payload,
    timestamp: envelope.timestamp,
    id: envelope.id,
  });

  const data = new TextEncoder().encode(canonical);
  const sig = hexToUint8Array(envelope.signature);

  return verify(data, sig, resolved.publicKey);
}

/**
 * Check if a message is expired (older than maxAgeMs).
 * Default: 5 minutes.
 */
export function isMessageExpired(envelope: SignedEnvelope, maxAgeMs = 5 * 60 * 1000): boolean {
  const sent = new Date(envelope.timestamp).getTime();
  return Date.now() - sent > maxAgeMs;
}

// ─── Convenience Signers ─────────────────────────────────────────

/**
 * Sign an intent before publishing.
 */
export async function signIntent(identity: AgentIdentity, intent: Intent): Promise<Intent> {
  const canonical = canonicalize({
    id: intent.id,
    agentDid: intent.agentDid,
    type: intent.type,
    domain: intent.domain,
    intent: intent.intent,
    filters: intent.filters,
    privacyLevel: intent.privacyLevel,
    ttl: intent.ttl,
    created: intent.created,
  });

  const data = new TextEncoder().encode(canonical);

  if (!identity.privateKey) {
    throw new Error('Cannot sign intent: agent has no private key');
  }

  const sig = await sign(data, identity.privateKey);
  return { ...intent, signature: uint8ArrayToHex(sig) };
}

/**
 * Verify an intent's signature.
 */
export async function verifyIntent(intent: Intent): Promise<boolean> {
  if (!intent.signature) return false;

  const resolved = resolveDid(intent.agentDid);
  if (!resolved) return false;

  const canonical = canonicalize({
    id: intent.id,
    agentDid: intent.agentDid,
    type: intent.type,
    domain: intent.domain,
    intent: intent.intent,
    filters: intent.filters,
    privacyLevel: intent.privacyLevel,
    ttl: intent.ttl,
    created: intent.created,
  });

  const data = new TextEncoder().encode(canonical);
  const sig = hexToUint8Array(intent.signature);

  return verify(data, sig, resolved.publicKey);
}

/**
 * Sign a proposal before sending.
 */
export async function signProposal(identity: AgentIdentity, proposal: IntroProposal): Promise<IntroProposal> {
  const canonical = canonicalize({
    id: proposal.id,
    type: proposal.type,
    initiator: proposal.initiator,
    responder: proposal.responder,
    match: proposal.match,
    terms: proposal.terms,
    status: proposal.status,
    created: proposal.created,
  });

  const data = new TextEncoder().encode(canonical);

  if (!identity.privateKey) {
    throw new Error('Cannot sign proposal: agent has no private key');
  }

  const sig = await sign(data, identity.privateKey);
  return { ...proposal, signature: uint8ArrayToHex(sig) };
}

// ─── Hex Encoding ────────────────────────────────────────────────

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
