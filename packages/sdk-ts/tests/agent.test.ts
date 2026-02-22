/**
 * Integration tests for TacitAgent.
 */

import { describe, it, expect } from 'vitest';
import { TacitAgent } from '../src/core/agent.js';
import { MemoryBackend } from '../src/storage/store.js';

describe('TacitAgent', () => {
  it('should create an agent with a fresh identity', async () => {
    const agent = await TacitAgent.create({
      domain: 'professional',
      seeking: 'co-founder',
      offering: 'technical leadership',
      storage: new MemoryBackend(),
    });

    expect(agent.did).toMatch(/^did:key:z/);
    expect(agent.card.agent.name).toBe('Tacit Agent');
    expect(agent.card.domains[0].type).toBe('professional');
  });

  it('should compute authenticity vector for new agent', async () => {
    const agent = await TacitAgent.create({ storage: new MemoryBackend() });
    const auth = agent.card.authenticity;

    // New agents start at 'emerging' because consistency signals have default values
    expect(['new', 'emerging']).toContain(auth.level);
    expect(auth.score).toBeGreaterThanOrEqual(0);
    expect(auth.dimensions).toHaveProperty('tenure');
    expect(auth.dimensions).toHaveProperty('consistency');
    expect(auth.dimensions).toHaveProperty('attestations');
    expect(auth.dimensions).toHaveProperty('networkTrust');
  });

  it('should publish and track intents', async () => {
    const agent = await TacitAgent.create({
      domain: 'professional',
      storage: new MemoryBackend(),
    });

    // Need identity first — publishIntent checks for it
    const intent = await agent.publishIntent({
      type: 'introduction',
      domain: 'professional',
      seeking: { role: 'co-founder', skills: ['TypeScript'] },
    });

    expect(intent.id).toBeDefined();
    expect(intent.signature).toBeTruthy(); // Should be signed
    expect(intent.signature.length).toBeGreaterThan(0);

    const active = agent.getActiveIntents();
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(intent.id);
  });

  it('should withdraw intents', async () => {
    const agent = await TacitAgent.create({
      domain: 'professional',
      storage: new MemoryBackend(),
    });

    const intent = await agent.publishIntent({
      type: 'service',
      domain: 'local-services',
      seeking: { service: 'plumbing' },
    });

    await agent.withdrawIntent(intent.id);
    expect(agent.getActiveIntents().length).toBe(0);
  });

  it('should load an agent from storage', async () => {
    const backend = new MemoryBackend();

    const original = await TacitAgent.create({
      domain: 'professional',
      seeking: 'investor',
      storage: backend,
    });

    const originalDid = original.did;

    // Load from the same backend
    const loaded = await TacitAgent.load(backend, {
      profile: {
        name: 'Loaded Agent',
        domain: 'professional',
        seeking: 'investor',
        offering: '',
      },
    });

    expect(loaded).not.toBeNull();
    expect(loaded!.did).toBe(originalDid);
  });

  it('should handle match events', async () => {
    const agent = await TacitAgent.create({
      domain: 'professional',
      storage: new MemoryBackend(),
    });

    const events: string[] = [];
    agent.onAny((event) => {
      events.push(event.type);
    });

    // Simulate a high-score match (should auto-propose)
    await agent.handleMatch({
      matchId: 'match:test:1',
      agents: {
        initiator: agent.did as any,
        responder: 'did:key:zResponder' as any,
      },
      score: {
        overall: 90,
        breakdown: {
          intentAlignment: 0.95,
          domainFit: 0.90,
          authenticityCompatibility: 0.85,
          preferenceMatch: 0.80,
          timingFit: 0.90,
        },
      },
      timestamp: new Date().toISOString(),
    });

    // Should have created a proposal
    expect(agent.getPendingProposals().length).toBe(1);
  });

  it('should shut down cleanly', async () => {
    const agent = await TacitAgent.create({ storage: new MemoryBackend() });
    await agent.shutdown();
    expect(agent.isConnected()).toBe(false);
  });
});
