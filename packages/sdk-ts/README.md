# @tacitprotocol/sdk

The TypeScript SDK for the **Tacit Protocol** — verify identity, prevent fraud, and broker trusted introductions with cryptographic proof.

[![npm](https://img.shields.io/npm/v/@tacitprotocol/sdk?color=blue)](https://www.npmjs.com/package/@tacitprotocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/tacitprotocol/tacit/blob/main/LICENSE)

## Install

```bash
npm install @tacitprotocol/sdk
```

## Quick Start

```typescript
import { TacitAgent } from '@tacitprotocol/sdk';

// Create an agent with a fresh DID identity
const agent = await TacitAgent.create({
  domain: 'professional',
  preferences: {
    languages: ['en'],
    introductionStyle: 'professional',
  },
});

// Publish an intent to the network
await agent.publishIntent({
  type: 'introduction',
  domain: 'professional',
  seeking: {
    role: 'co-founder',
    skills: ['backend', 'systems-architecture'],
    industry: 'fintech',
  },
  context: {
    offering: 'product leadership, 10 years in payments',
    stage: 'pre-seed',
  },
});

// Listen for verified matches
agent.on('match', async (event) => {
  const { match } = event;
  console.log(`Match: ${match.score.overall}/100`);
  console.log(`Authenticity: ${match.score.breakdown.authenticityCompatibility}`);
});

// Connect to the relay network
await agent.connect();
```

## Core Modules

### Identity (`createIdentity`, `sign`, `verify`)

W3C DID-based identity using Ed25519 keypairs. Every agent gets a `did:key` identifier that is cryptographically verifiable.

```typescript
import { createIdentity, sign, verify } from '@tacitprotocol/sdk';

const identity = await createIdentity();
console.log(identity.did); // did:key:z6Mk...

const data = new TextEncoder().encode('hello');
const signature = await sign(data, identity.privateKey);
const valid = await verify(data, signature, identity.publicKey);
```

### Authenticity (`AuthenticityEngine`)

Multi-dimensional trust scores that are earned over time — impossible to fake overnight. Dimensions: tenure, consistency, attestations, network trust.

```typescript
import { AuthenticityEngine } from '@tacitprotocol/sdk';

const engine = new AuthenticityEngine();
const vector = engine.computeVector({
  created: agent.card.agent.created,
  consistencySignals: { intentFulfillmentRate: 0.9, responseRate: 0.85 },
  credentials: agent.card.credentials,
  networkTrust: { endorsements: 12, uniqueEndorsers: 8, mutualConnections: 3 },
});
console.log(vector.score); // 0-100
```

### Discovery (`IntentBuilder`, `IntentStore`)

Publish and discover encrypted intents on the network. The `IntentBuilder` provides a fluent API for constructing intents.

```typescript
import { IntentBuilder, IntentStore } from '@tacitprotocol/sdk';

const intent = new IntentBuilder(agent.did)
  .type('introduction')
  .domain('professional')
  .seeking({ role: 'backend-engineer', skills: ['rust', 'distributed-systems'] })
  .context({ offering: 'equity + salary', stage: 'seed' })
  .minAuthenticity(70)
  .ttl(86400) // 24 hours
  .build();

const store = new IntentStore();
store.add(intent);
const matches = store.query({ domain: 'professional', keywords: ['rust'] });
```

### Matching (`MatchScorer`)

Score compatibility between two agents across five dimensions: intent alignment, domain fit, authenticity compatibility, preference match, and timing fit.

```typescript
import { MatchScorer } from '@tacitprotocol/sdk';

const scorer = new MatchScorer({ autoPropose: 80, suggest: 60 });
const result = scorer.score({
  initiator: { intent: aliceIntent, card: aliceCard },
  responder: { intent: bobIntent, card: bobCard },
});

console.log(result.score.overall);           // 0-100
console.log(scorer.determineAction(result.score.overall)); // 'auto-propose' | 'suggest' | 'ignore'
```

## API Reference

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `TacitAgent` | Class | Main agent interface — identity, intents, matching, events |
| `createIdentity` | Function | Generate a new Ed25519 DID identity |
| `publicKeyToDid` | Function | Convert a public key to a `did:key` DID |
| `resolveDid` | Function | Resolve a DID to its public key |
| `sign` / `verify` | Functions | Ed25519 signing and verification |
| `AuthenticityEngine` | Class | Compute multi-dimensional trust scores |
| `IntentBuilder` | Class | Fluent builder for constructing intents |
| `IntentStore` | Class | Local intent storage with lifecycle management |
| `MatchScorer` | Class | Score compatibility between two agents |

All types are fully exported — see the [type definitions](https://github.com/tacitprotocol/tacit/blob/main/packages/sdk-ts/src/types/index.ts) for the complete schema.

## Requirements

- Node.js >= 18.0.0 (Web Crypto API required)
- TypeScript >= 5.0 (recommended)

## Links

- [Protocol Spec](https://github.com/tacitprotocol/tacit/blob/main/docs/PROTOCOL_SPEC.md)
- [Whitepaper](https://github.com/tacitprotocol/tacit/blob/main/docs/WHITEPAPER.md)
- [GitHub](https://github.com/tacitprotocol/tacit)
- [Website](https://tacitprotocol.com)

## License

MIT
