/**
 * Client-side identity management for the TACIT app.
 *
 * Generates Ed25519 key pairs in the browser using Web Crypto API.
 * Keys never leave the client. The public key and DID are sent to
 * Supabase for the user profile.
 */

// Base58btc alphabet
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  let zeros = 0;
  for (const b of bytes) {
    if (b !== 0) break;
    zeros++;
  }
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
  for (let i = digits.length - 1; i >= 0; i--) result += BASE58[digits[i]];
  return result;
}

export function uint8ToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToUint8(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export interface TacitIdentity {
  did: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicKeyHex: string;
  created: Date;
}

/**
 * Generate a new TACIT identity with Ed25519 key pair and W3C DID.
 */
export async function createTacitIdentity(): Promise<TacitIdentity> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  const pair = keyPair as { publicKey: CryptoKey; privateKey: CryptoKey };
  const publicKeyBuffer = await crypto.subtle.exportKey('raw', pair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', pair.privateKey);

  const publicKey = new Uint8Array(publicKeyBuffer);
  const privateKey = new Uint8Array(privateKeyBuffer);

  // Create did:key from public key
  const ED25519_MULTICODEC = new Uint8Array([0xed, 0x01]);
  const prefixed = new Uint8Array(ED25519_MULTICODEC.length + publicKey.length);
  prefixed.set(ED25519_MULTICODEC);
  prefixed.set(publicKey, ED25519_MULTICODEC.length);
  const did = `did:key:z${base58Encode(prefixed)}`;

  return {
    did,
    publicKey,
    privateKey,
    publicKeyHex: uint8ToHex(publicKey),
    created: new Date(),
  };
}

/**
 * Sign data with the identity's private key.
 */
export async function signData(
  data: string,
  privateKey: Uint8Array
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKey.buffer as ArrayBuffer,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const encoded = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign('Ed25519', key, encoded);
  return uint8ToHex(new Uint8Array(signature));
}

/**
 * Serialize identity for IndexedDB storage (converts Uint8Arrays to hex).
 */
export function serializeIdentity(identity: TacitIdentity): string {
  return JSON.stringify({
    did: identity.did,
    publicKey: uint8ToHex(identity.publicKey),
    privateKey: uint8ToHex(identity.privateKey),
    publicKeyHex: identity.publicKeyHex,
    created: identity.created.toISOString(),
  });
}

/**
 * Deserialize identity from IndexedDB storage.
 */
export function deserializeIdentity(raw: string): TacitIdentity {
  const parsed = JSON.parse(raw);
  return {
    did: parsed.did,
    publicKey: hexToUint8(parsed.publicKey),
    privateKey: hexToUint8(parsed.privateKey),
    publicKeyHex: parsed.publicKeyHex,
    created: new Date(parsed.created),
  };
}
