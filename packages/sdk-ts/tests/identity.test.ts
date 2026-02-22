/**
 * Tests for DID identity management and authenticity engine.
 */

import { describe, it, expect } from 'vitest';
import {
  createIdentity,
  publicKeyToDid,
  resolveDid,
  sign,
  verify,
} from '../src/identity/did.js';
import { AuthenticityEngine } from '../src/identity/authenticity.js';

describe('DID Identity', () => {
  it('should generate a valid identity', async () => {
    const identity = await createIdentity();

    expect(identity.did).toMatch(/^did:key:z/);
    expect(identity.publicKey).toBeInstanceOf(Uint8Array);
    expect(identity.publicKey.length).toBe(32);
    expect(identity.privateKey).toBeInstanceOf(Uint8Array);
    expect(identity.created).toBeInstanceOf(Date);
  });

  it('should generate unique DIDs', async () => {
    const a = await createIdentity();
    const b = await createIdentity();
    expect(a.did).not.toBe(b.did);
  });

  it('should resolve a DID back to a public key', async () => {
    const identity = await createIdentity();
    const resolved = resolveDid(identity.did);

    expect(resolved).not.toBeNull();
    expect(resolved!.publicKey).toEqual(identity.publicKey);
  });

  it('should return null for unsupported DID methods', () => {
    const resolved = resolveDid('did:web:example.com' as any);
    expect(resolved).toBeNull();
  });
});

describe('Ed25519 Signing', () => {
  it('should sign and verify data', async () => {
    const identity = await createIdentity();
    const data = new TextEncoder().encode('hello tacit');

    const signature = await sign(data, identity.privateKey!);
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);

    const valid = await verify(data, signature, identity.publicKey);
    expect(valid).toBe(true);
  });

  it('should reject invalid signatures', async () => {
    const identity = await createIdentity();
    const data = new TextEncoder().encode('hello tacit');
    const signature = await sign(data, identity.privateKey!);

    // Tamper with the signature
    const tampered = new Uint8Array(signature);
    tampered[0] ^= 0xff;

    const valid = await verify(data, tampered, identity.publicKey);
    expect(valid).toBe(false);
  });

  it('should reject data signed by a different key', async () => {
    const alice = await createIdentity();
    const bob = await createIdentity();
    const data = new TextEncoder().encode('hello tacit');

    const signature = await sign(data, alice.privateKey!);

    const valid = await verify(data, signature, bob.publicKey);
    expect(valid).toBe(false);
  });
});

describe('Authenticity Engine', () => {
  const engine = new AuthenticityEngine();

  it('should compute tenure score linearly over 365 days', () => {
    const now = new Date();

    // Brand new agent
    expect(engine.computeTenure(now, now)).toBe(0);

    // 6 months
    const sixMonths = new Date(now.getTime() - 182.5 * 24 * 60 * 60 * 1000);
    expect(engine.computeTenure(sixMonths, now)).toBeCloseTo(0.5, 1);

    // 1 year+
    const oneYear = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);
    expect(engine.computeTenure(oneYear, now)).toBe(1.0);
  });

  it('should compute consistency score from signals', () => {
    const score = engine.computeConsistency({
      intentStability: 0.9,
      profileConsistency: 0.8,
      responseReliability: 0.7,
      interactionQuality: 0.6,
    });

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should compute zero attestation score with no credentials', () => {
    expect(engine.computeAttestations([])).toBe(0);
  });

  it('should compute network trust from interaction signals', () => {
    const score = engine.computeNetworkTrust({
      totalInteractions: 20,
      positiveInteractions: 18,
      totalIntros: 10,
      successfulIntros: 8,
      bidirectionalTrustEdges: 5,
    });

    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should assign correct trust levels', () => {
    expect(engine.scoreToLevel(95)).toBe('exemplary');
    expect(engine.scoreToLevel(75)).toBe('trusted');
    expect(engine.scoreToLevel(50)).toBe('established');
    expect(engine.scoreToLevel(25)).toBe('emerging');
    expect(engine.scoreToLevel(5)).toBe('new');
  });

  it('should compute full authenticity vector', () => {
    const vector = engine.computeVector({
      agentCreatedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      consistencySignals: {
        intentStability: 0.9,
        profileConsistency: 0.8,
        responseReliability: 0.7,
        interactionQuality: 0.6,
      },
      credentials: [],
      networkSignals: {
        totalInteractions: 10,
        positiveInteractions: 8,
        totalIntros: 5,
        successfulIntros: 4,
        bidirectionalTrustEdges: 3,
      },
    });

    expect(vector.score).toBeGreaterThan(0);
    expect(vector.score).toBeLessThanOrEqual(100);
    expect(vector.level).toBeDefined();
    expect(vector.dimensions.tenure).toBeGreaterThan(0);
    expect(vector.dimensions.consistency).toBeGreaterThan(0);
    expect(vector.dimensions.networkTrust).toBeGreaterThan(0);
  });

  it('should apply inactivity decay', () => {
    const created = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const lastActive = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

    const withDecay = engine.computeVector({
      agentCreatedDate: created,
      consistencySignals: {
        intentStability: 1, profileConsistency: 1,
        responseReliability: 1, interactionQuality: 1,
      },
      credentials: [],
      networkSignals: {
        totalInteractions: 10, positiveInteractions: 10,
        totalIntros: 5, successfulIntros: 5,
        bidirectionalTrustEdges: 5,
      },
      lastActiveDate: lastActive,
    });

    const withoutDecay = engine.computeVector({
      agentCreatedDate: created,
      consistencySignals: {
        intentStability: 1, profileConsistency: 1,
        responseReliability: 1, interactionQuality: 1,
      },
      credentials: [],
      networkSignals: {
        totalInteractions: 10, positiveInteractions: 10,
        totalIntros: 5, successfulIntros: 5,
        bidirectionalTrustEdges: 5,
      },
      lastActiveDate: new Date(),
    });

    expect(withDecay.score).toBeLessThan(withoutDecay.score);
  });
});
