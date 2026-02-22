/**
 * Tests for intent discovery and match scoring.
 */

import { describe, it, expect } from 'vitest';
import { IntentBuilder, IntentStore } from '../src/discovery/intent.js';
import { MatchScorer } from '../src/matching/scorer.js';
import { createIdentity } from '../src/identity/did.js';
import { AuthenticityEngine } from '../src/identity/authenticity.js';
import type { AgentCard, Intent, DID } from '../src/types/index.js';

function makeCard(did: DID, domain = 'professional'): AgentCard {
  return {
    version: '0.1.0',
    agent: {
      did,
      name: 'Test Agent',
      description: '',
      created: new Date().toISOString(),
      protocols: ['tacit/discovery/v0.1'],
      transport: { type: 'didcomm/v2', endpoint: 'wss://relay.test' },
    },
    domains: [{ type: domain, seeking: [], offering: [], context: {} }],
    authenticity: {
      level: 'established',
      score: 60,
      dimensions: { tenure: 0.5, consistency: 0.8, attestations: 0, networkTrust: 0.5 },
      verifiableCredentials: [],
    },
    preferences: {
      introductionStyle: 'progressive',
      initialAnonymity: true,
      responseTime: '24h',
      languages: ['en'],
    },
  };
}

describe('IntentBuilder', () => {
  it('should build a valid intent', async () => {
    const identity = await createIdentity();
    const intent = new IntentBuilder(identity.did)
      .type('introduction')
      .domain('professional')
      .seeking({ role: 'co-founder', skills: ['TypeScript', 'Rust'] })
      .context({ urgency: 'active' })
      .minAuthenticity(60)
      .ttl(86400)
      .build();

    expect(intent.agentDid).toBe(identity.did);
    expect(intent.type).toBe('introduction');
    expect(intent.domain).toBe('professional');
    expect(intent.intent.seeking).toEqual({ role: 'co-founder', skills: ['TypeScript', 'Rust'] });
    expect(intent.ttl).toBe(86400);
    expect(intent.filters.minAuthenticityScore).toBe(60);
  });

  it('should throw on missing required fields', async () => {
    const identity = await createIdentity();
    expect(() => new IntentBuilder(identity.did).build()).toThrow();
  });
});

describe('IntentStore', () => {
  it('should add and retrieve intents', async () => {
    const store = new IntentStore();
    const identity = await createIdentity();

    const intent = new IntentBuilder(identity.did)
      .type('introduction')
      .domain('professional')
      .seeking({ role: 'mentor' })
      .build();

    store.add(intent);
    expect(store.get(intent.id)).toEqual(intent);
    expect(store.getActive().length).toBe(1);
  });

  it('should query by domain', async () => {
    const store = new IntentStore();
    const identity = await createIdentity();

    const profIntent = new IntentBuilder(identity.did)
      .type('introduction').domain('professional').seeking({ role: 'a' }).build();

    // Small delay to avoid ID collision (same-millisecond timestamps)
    await new Promise(r => setTimeout(r, 2));

    const datingIntent = new IntentBuilder(identity.did)
      .type('introduction').domain('dating').seeking({ role: 'b' }).build();

    store.add(profIntent);
    store.add(datingIntent);

    expect(store.getActive().length).toBe(2);

    const results = store.query({ domain: 'professional' });
    expect(results.length).toBe(1);
    expect(results[0].domain).toBe('professional');
  });

  it('should withdraw intents', async () => {
    const store = new IntentStore();
    const identity = await createIdentity();

    const intent = new IntentBuilder(identity.did)
      .type('service').domain('commerce').seeking({ item: 'design' }).build();

    store.add(intent);
    expect(store.withdraw(intent.id)).toBe(true);
    expect(store.getActive().length).toBe(0);
  });
});

describe('MatchScorer', () => {
  it('should score same-domain same-seeking intents highly', async () => {
    const alice = await createIdentity();
    const bob = await createIdentity();
    const scorer = new MatchScorer();

    const aliceIntent = new IntentBuilder(alice.did)
      .type('introduction')
      .domain('professional')
      .seeking({ role: 'co-founder', skills: ['TypeScript'] })
      .context({ offering: 'co-founder', skills: ['TypeScript'] })
      .build();

    const bobIntent = new IntentBuilder(bob.did)
      .type('introduction')
      .domain('professional')
      .seeking({ role: 'co-founder', skills: ['TypeScript'] })
      .context({ offering: 'co-founder', skills: ['TypeScript'] })
      .build();

    const result = scorer.score({
      initiator: { intent: aliceIntent, card: makeCard(alice.did) },
      responder: { intent: bobIntent, card: makeCard(bob.did) },
    });

    expect(result.score.overall).toBeGreaterThanOrEqual(60);
    expect(result.matchId).toBeDefined();
    expect(result.agents.initiator).toBe(alice.did);
  });

  it('should score different-domain intents lower', async () => {
    const alice = await createIdentity();
    const bob = await createIdentity();
    const scorer = new MatchScorer();

    const aliceIntent = new IntentBuilder(alice.did)
      .type('introduction').domain('professional')
      .seeking({ role: 'co-founder' }).build();

    const bobIntent = new IntentBuilder(bob.did)
      .type('introduction').domain('dating')
      .seeking({ role: 'partner' }).build();

    const result = scorer.score({
      initiator: { intent: aliceIntent, card: makeCard(alice.did, 'professional') },
      responder: { intent: bobIntent, card: makeCard(bob.did, 'dating') },
    });

    expect(result.score.breakdown.domainFit).toBeLessThan(0.5);
  });

  it('should determine correct match actions', () => {
    const scorer = new MatchScorer();
    expect(scorer.determineAction(85)).toBe('auto-propose');
    expect(scorer.determineAction(70)).toBe('suggest');
    expect(scorer.determineAction(40)).toBe('ignore');
  });
});
