/**
 * Tacit Protocol — DID Identity Management
 *
 * Handles creation, resolution, and management of W3C Decentralized Identifiers
 * for Tacit agents. Uses did:key method for simplicity in v0.1.
 */

import type { AgentIdentity, DID } from '../types/index.js';

/**
 * Generate a new Ed25519 keypair for agent identity.
 * In production, this should use a secure random number generator
 * and keys should be stored in a secure enclave.
 */
export async function generateKeypair(): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  // Use Web Crypto API for key generation
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  const pair = keyPair as { publicKey: CryptoKey; privateKey: CryptoKey };
  const publicKeyBuffer = await crypto.subtle.exportKey('raw', pair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', pair.privateKey);

  return {
    publicKey: new Uint8Array(publicKeyBuffer),
    privateKey: new Uint8Array(privateKeyBuffer),
  };
}

/**
 * Create a did:key identifier from a public key.
 * did:key encodes the public key directly in the DID string.
 *
 * Format: did:key:z{multibase-encoded-multicodec-public-key}
 * For Ed25519: multicodec prefix is 0xed01
 */
export function publicKeyToDid(publicKey: Uint8Array): DID {
  // Multicodec prefix for Ed25519 public key
  const ED25519_MULTICODEC = new Uint8Array([0xed, 0x01]);
  const prefixed = new Uint8Array(ED25519_MULTICODEC.length + publicKey.length);
  prefixed.set(ED25519_MULTICODEC);
  prefixed.set(publicKey, ED25519_MULTICODEC.length);

  // Base58btc encode with 'z' prefix (multibase)
  const encoded = base58btcEncode(prefixed);
  return `did:key:z${encoded}` as DID;
}

/**
 * Create a new agent identity with a fresh keypair and DID.
 */
export async function createIdentity(): Promise<AgentIdentity> {
  const { publicKey, privateKey } = await generateKeypair();
  const did = publicKeyToDid(publicKey);

  return {
    did,
    publicKey,
    privateKey,
    created: new Date(),
  };
}

/**
 * Resolve a DID to its public key.
 * For did:key, the public key is embedded in the DID itself.
 */
export function resolveDid(did: DID): { publicKey: Uint8Array } | null {
  if (!did.startsWith('did:key:z')) {
    // Only did:key supported in v0.1
    return null;
  }

  const encoded = did.slice('did:key:z'.length);
  const decoded = base58btcDecode(encoded);

  // Strip multicodec prefix (2 bytes for Ed25519)
  const publicKey = decoded.slice(2);

  return { publicKey };
}

/**
 * Sign arbitrary data with the agent's private key.
 */
export async function sign(data: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKey.buffer as ArrayBuffer,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('Ed25519', key, data.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * Verify a signature against a public key.
 */
export async function verify(
  data: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    publicKey.buffer as ArrayBuffer,
    { name: 'Ed25519' },
    false,
    ['verify']
  );

  return crypto.subtle.verify('Ed25519', key, signature.buffer as ArrayBuffer, data.buffer as ArrayBuffer);
}

// ─── Base58btc Encoding (simplified) ──────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58btcEncode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';

  // Count leading zeros
  let zeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) break;
    zeros++;
  }

  // Convert to base58
  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < zeros; i++) result += '1';
  for (let i = digits.length - 1; i >= 0; i--) result += BASE58_ALPHABET[digits[i]];

  return result;
}

function base58btcDecode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);

  const bytes: number[] = [0];
  for (const char of str) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) throw new Error(`Invalid base58 character: ${char}`);

    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Count leading '1's (zeros in base58)
  let zeros = 0;
  for (const char of str) {
    if (char !== '1') break;
    zeros++;
  }

  const result = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < zeros; i++) result[i] = 0;
  for (let i = 0; i < bytes.length; i++) result[zeros + i] = bytes[bytes.length - 1 - i];

  return result;
}
