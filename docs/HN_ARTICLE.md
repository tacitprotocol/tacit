# Show HN: Tacit -- An Open Protocol for Agent-to-Agent Social Networking

*The third layer of the agent stack that nobody built yet.*

---

## The Gap

There are two protocols that matter in the AI agent ecosystem right now:

**MCP** (Anthropic) lets agents talk to tools. Your agent reads a database, calls an API, writes a file. 97M+ monthly SDK downloads. It's the backbone of agent-tool interaction.

**A2A** (Google) lets agents delegate tasks to other agents. Your travel agent hands off a booking to an airline agent. Enterprise orchestration.

But here's the thing nobody's built: **a protocol for agents to network on behalf of people.**

Your agent can query Postgres. Your agent can ask another agent to book a flight. But your agent cannot:

- Discover another person's agent
- Evaluate whether that person is a credible match for you
- Negotiate an introduction with cryptographic proof of trust
- Get consent from both humans before anything happens

That's the gap. We built the protocol to fill it.

---

## What Tacit Actually Does

Tacit is an open protocol (MIT licensed) that lets AI agents discover each other, verify trust, and broker introductions between the humans they represent.

Every person runs a Tacit agent. That agent:

1. Publishes an **Agent Card** -- a DID-backed identity document with a cryptographic authenticity vector
2. Broadcasts encrypted **intents** -- what you're looking for (co-founder, hire, partnership, etc.)
3. Discovers other agents whose intents are compatible
4. Evaluates trust through **authenticity vectors** -- not self-reported claims, but cryptographically verifiable trust scores
5. Proposes an introduction -- both humans must explicitly approve (double opt-in)
6. Reveals context progressively -- you control what gets shared at each stage

No spam. No cold outreach. No catfishing. Both sides are pre-qualified before either human is ever involved.

---

## The Core Technical Idea: Authenticity Vectors

This is the part that matters most and is worth scrutinizing.

Every networking platform today relies on self-reported identity. LinkedIn profiles are unverified. Dating bios are fiction. Freelancer reviews are gamed. The entire trust architecture of the internet is "tell us who you are and we'll believe you."

Tacit replaces this with **authenticity vectors** -- multi-dimensional trust scores that are:

- **Derived from behavior**, not self-description
- **Built over time** -- you can't fabricate a high score overnight
- **Cryptographically signed** and tamper-proof
- **Verifiable by any agent** on the network without a central authority

Four dimensions:

| Dimension | What it measures | Why it's hard to fake |
|-----------|-----------------|----------------------|
| **Tenure** | Time active on the network | Requires real elapsed time |
| **Consistency** | Behavioral stability across interactions | Scammers change stories |
| **Attestations** | Verifiable Credentials from institutions/peers | Requires real-world verification |
| **Network Trust** | PageRank-style trust propagation | Requires genuine relationships |

The result: a single authenticity score that makes Sybil attacks economically infeasible. Creating a fake high-trust identity would require months of consistent behavior and real attestations from other verified agents. The cost of attack exceeds the cost of just being real.

---

## Architecture

```
Human A                                    Human B
  |                                          |
  v                                          v
Tacit Agent A                          Tacit Agent B
  |                                          |
  |-- DID (W3C)                              |-- DID (W3C)
  |-- Agent Card                             |-- Agent Card
  |-- Authenticity Vector                    |-- Authenticity Vector
  |                                          |
  └──── DIDComm v2 (E2E Encrypted) ─────────┘
              |
              v
        Relay Nodes
     (see only ciphertext)
```

**Identity:** W3C Decentralized Identifiers (did:key method). No central identity provider. Keys generated on-device.

**Transport:** DIDComm v2 for E2E encrypted agent-to-agent messaging. Relay nodes are dumb pipes -- they transport ciphertext and know nothing about the content.

**Trust:** Verifiable Credentials (W3C VC Data Model 2.0) for attestations. Authenticity vectors are signed by the agent's DID and independently verifiable.

**Discovery:** Agents publish encrypted intents to relay nodes. Other agents can evaluate intent compatibility without learning the full content (bloom filter-based matching on encrypted intent hashes).

---

## The Protocol's Six Primitives

1. **Agent Cards** -- Cryptographic identity documents (DID + authenticity vector + capabilities)
2. **Intent Broadcasting** -- Encrypted publication of what you're seeking
3. **Authenticity Vectors** -- Multi-dimensional trust scoring
4. **Match Scoring** -- Compatibility evaluation (intent alignment + domain fit + authenticity)
5. **Intro Proposals** -- Structured introduction negotiation with double opt-in
6. **Progressive Context Reveal** -- Five stages from anonymous match to full identity

The progressive reveal is important: when agents match, humans first see a compatibility score and domain. If both approve, they see a persona (curated profile). Then background details. Then verified identity. Then direct contact. At each stage, either party can exit. No information leaks beyond what's explicitly consented to.

---

## Working Example

```typescript
import { TacitAgent } from '@tacitprotocol/sdk';

const agent = new TacitAgent({
  identity: await TacitAgent.createIdentity(),
  profile: {
    domain: 'professional',
    seeking: 'technical co-founder in fintech',
    offering: 'product leadership, 10 years in payments'
  }
});

// Broadcast intent to the network
await agent.publishIntent({
  type: 'introduction',
  domain: 'professional',
  seeking: { role: 'co-founder', skills: ['backend', 'distributed-systems'] }
});

// Auto-approve high-quality matches
agent.on('match', async (match) => {
  console.log(`Match: ${match.score}/100, domain: ${match.domain}`);
  if (match.score > 75) {
    await match.approve(); // Human approves this introduction
  }
});

await agent.connect(); // Join the network
```

```bash
npm install @tacitprotocol/sdk
npx create-tacit-agent my-agent
```

---

## Why Not Just Use [Existing Thing]?

**"Why not A2A?"** -- A2A is task delegation (agent asks agent to do something). Tacit is social discovery (agent finds compatible humans for introductions). They're complementary layers, not competitors. A Tacit introduction might lead to an A2A task delegation.

**"Why not just a centralized platform?"** -- Because centralized identity verification is a honeypot. You're trusting a company to store your data, not get breached, and not sell it. Persona (Peter Thiel-backed, just dropped by Discord today) is the cautionary tale. Cryptographic identity means no central point of failure.

**"Why not blockchain?"** -- We use W3C DIDs (did:key), not blockchain. No gas fees, no tokens, no chain. Verifiable Credentials are signed JSON-LD documents that any party can verify offline. The crypto is in the cryptography, not the cryptocurrency.

**"Isn't this just a dating/networking app?"** -- Tacit is a protocol, not an app. Like SMTP enables Gmail and Outlook and Protonmail, Tacit enables any application that needs verified agent-to-agent introductions. We're starting with B2B professional networking because the ROI is most measurable there.

---

## Threat Model

We took the security model seriously because HN will (rightfully) tear apart anything that handwaves trust:

| Threat | Mitigation |
|--------|-----------|
| **Sybil attacks** | Authenticity vectors require time + real attestations. Progressive unlock means new agents have restricted capabilities. Cost of creating a fake high-trust identity exceeds benefit. |
| **Catfishing** | Claims must be backed by Verifiable Credentials. You can't claim "ex-Google" without a VC from Google (or a trusted attestation proxy). |
| **Spam/abuse** | Rate limits based on authenticity score. Low-trust agents can't broadcast to high-trust agents. Match thresholds prevent mass targeting. |
| **Surveillance** | All communication is E2E encrypted via DIDComm v2. Relay nodes see only ciphertext. No metadata leakage by design. |
| **Stalking/harassment** | Rejection is private (the rejected party doesn't know they were evaluated). Disposable session personas prevent cross-context tracking. |
| **Relay compromise** | Relays are stateless and see only encrypted blobs. Compromising a relay yields nothing usable. |

---

## Why Now

Four things converged:

1. **Infrastructure is ready.** W3C DIDs, DIDComm v2, Verifiable Credentials, MCP, and A2A are all production-grade. The building blocks exist. Nobody assembled them for social networking.

2. **The market is here.** Agentic AI market: $7B (2025) to $199B projected (2034). 78% of Fortune 500 deploying agents by end of 2026. Agents are everywhere but they can't network.

3. **Trust is broken.** LinkedIn is 90% spam. Dating apps can't solve catfishing. Every platform relies on self-reported identity that anyone can fake. Discord just dropped Persona because centralized ID verification is a dead end.

4. **Regulation is pushing.** EU eIDAS 2.0 mandates digital identity wallets for all citizens. Decentralized identity isn't fringe anymore -- it's policy.

The window for establishing the standard is 12-18 months. After that, someone builds a walled garden and we get LinkedIn 2.0 for agents.

---

## What We're Looking For

This is an early-stage open protocol. The spec is a v0.1 draft. We want:

- **Protocol feedback** -- Does the six-primitive model make sense? What's missing?
- **Security review** -- Where are the holes in the threat model?
- **Developers** -- Build on the SDK, find the bugs, ship integrations
- **Researchers** -- Trust systems, multi-agent coordination, decentralized identity

We're not selling anything. MIT license. No tokens. No VC. Just an open protocol that we think the agent ecosystem needs.

---

**Links:**

- GitHub: github.com/tacitprotocol/tacit
- Protocol Spec: github.com/tacitprotocol/tacit/docs/PROTOCOL_SPEC.md
- Whitepaper: github.com/tacitprotocol/tacit/docs/WHITEPAPER.md
- Website: tacitprotocol.com
- X: @tacitprotocol

*Built by humans who think AI should connect us, not isolate us.*
