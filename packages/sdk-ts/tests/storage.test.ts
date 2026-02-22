/**
 * Tests for the persistence layer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentStore, MemoryBackend } from '../src/storage/store.js';
import { createIdentity } from '../src/identity/did.js';
import type { DID } from '../src/types/index.js';

describe('AgentStore', () => {
  let store: AgentStore;

  beforeEach(() => {
    store = new AgentStore(new MemoryBackend());
  });

  describe('Identity', () => {
    it('should save and load an identity', async () => {
      const identity = await createIdentity();

      await store.saveIdentity(identity);
      const loaded = await store.loadIdentity();

      expect(loaded).not.toBeNull();
      expect(loaded!.did).toBe(identity.did);
      expect(loaded!.publicKey).toEqual(identity.publicKey);
      expect(loaded!.privateKey).toEqual(identity.privateKey);
      expect(loaded!.created.getTime()).toBe(identity.created.getTime());
    });

    it('should return null when no identity is stored', async () => {
      const loaded = await store.loadIdentity();
      expect(loaded).toBeNull();
    });
  });

  describe('Credentials', () => {
    it('should add and retrieve credentials', async () => {
      await store.addCredential({
        type: 'EmploymentCredential',
        issuer: 'did:key:zIssuer' as DID,
        claim: 'Senior Engineer at Acme Corp',
        issued: '2025-01-15T00:00:00Z',
      });

      await store.addCredential({
        type: 'PeerEndorsement',
        issuer: 'did:key:zPeer' as DID,
        claim: 'Great collaborator',
        issued: '2025-06-01T00:00:00Z',
      });

      const creds = await store.getCredentials();
      expect(creds.length).toBe(2);
    });
  });

  describe('Interaction History', () => {
    it('should record and query interactions', async () => {
      const otherDid = 'did:key:zOther' as DID;

      await store.recordInteraction({
        withDid: otherDid,
        type: 'introduction',
        outcome: 'positive',
        timestamp: new Date().toISOString(),
      });

      await store.recordInteraction({
        withDid: otherDid,
        type: 'introduction',
        outcome: 'neutral',
        timestamp: new Date().toISOString(),
      });

      const all = await store.getInteractions();
      expect(all.length).toBe(2);

      const withOther = await store.getInteractions({ withDid: otherDid });
      expect(withOther.length).toBe(2);
    });

    it('should compute interaction stats', async () => {
      const did1 = 'did:key:z1' as DID;
      const did2 = 'did:key:z2' as DID;

      await store.recordInteraction({
        withDid: did1, type: 'introduction', outcome: 'positive',
        timestamp: new Date().toISOString(),
      });
      await store.recordInteraction({
        withDid: did2, type: 'introduction', outcome: 'positive',
        timestamp: new Date().toISOString(),
      });
      await store.recordInteraction({
        withDid: did1, type: 'collaboration', outcome: 'negative',
        timestamp: new Date().toISOString(),
      });

      const stats = await store.getInteractionStats();
      expect(stats.totalInteractions).toBe(3);
      expect(stats.positiveInteractions).toBe(2);
      expect(stats.totalIntros).toBe(2);
      expect(stats.successfulIntros).toBe(2);
    });
  });

  describe('Trust Snapshots', () => {
    it('should save and load trust snapshots', async () => {
      const vector = {
        level: 'established' as const,
        score: 55,
        dimensions: { tenure: 0.3, consistency: 0.8, attestations: 0, networkTrust: 0.5 },
        verifiableCredentials: [],
      };

      await store.saveTrustSnapshot(vector);
      const latest = await store.getLatestTrust();

      expect(latest).not.toBeNull();
      expect(latest!.score).toBe(55);
      expect(latest!.level).toBe('established');
    });
  });
});
