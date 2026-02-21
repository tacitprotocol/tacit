# We Built the Missing Layer of the Agent Stack

*MCP connects agents to tools. A2A connects agents to tasks. Tacit connects agents to people.*

---

There are now three layers to the AI agent stack. You probably know two of them.

**Layer 1: MCP** — Anthropic's Model Context Protocol lets agents talk to tools. Databases, APIs, file systems. It's the backbone of agent-tool interaction. 97 million monthly SDK downloads and counting.

**Layer 2: A2A** — Google's Agent-to-Agent protocol lets agents delegate tasks to each other. Your travel agent talks to a booking agent. Enterprise orchestration at scale.

**Layer 3: ???**

Here's the problem: in a world where billions of AI agents operate on behalf of humans, there is no protocol for the most fundamentally human capability — **connecting people.**

Your agent can query a database (MCP). Your agent can ask another agent to book a flight (A2A). But your agent cannot discover another person's agent, evaluate whether their human is a good match for you, and negotiate an introduction.

That's what we built.

---

## Introducing Tacit

Tacit is the social protocol for the agent era.

Every person gets an AI agent — their **tacit** — that represents them on a decentralized network. Your tacit:

1. **Discovers** other agents whose humans might be the right connection for you
2. **Verifies trust** through a cryptographic authenticity vector that's impossible to fake
3. **Negotiates** an introduction on your behalf — evaluating compatibility before you're ever involved
4. **Gets your consent** — nothing happens without explicit double opt-in from both humans
5. **Reveals context progressively** — you control what information is shared at each stage

No spam. No catfishing. No cold outreach. Just high-signal, verified introductions.

---

## Why Now?

Three things happened that made this possible:

**The infrastructure matured.** W3C Decentralized Identifiers (DIDs) are production-ready. DIDComm v2 provides end-to-end encrypted agent messaging. Verifiable Credentials let institutions attest to facts about people. MCP and A2A provide the lower layers of the stack. The pieces are all here. Nobody assembled them.

**The market exploded.** The agentic AI market is on a $7B-to-$199B trajectory. 78% of Fortune 500 companies will deploy AI agents by end of 2026. Multi-agent system interest surged 1,445% in the past year. Agents are everywhere — but they can't network.

**Trust broke.** LinkedIn is 90% spam. Dating apps are plagued with catfishing. Service marketplace reviews are gamed. Every networking platform relies on self-reported identity that anyone can fake. The architecture is fundamentally broken.

---

## The Core Innovation: Authenticity Vectors

The single most important thing about Tacit is the authenticity vector.

Every other platform asks you to describe yourself. Tacit doesn't. Instead, your Tacit agent builds a trust score from four dimensions:

- **Tenure**: How long have you been active? (You can't spin up a fake identity overnight.)
- **Consistency**: How stable is your behavior? (Scammers constantly change their story.)
- **Attestations**: What can you prove? (Verifiable credentials from employers, institutions, peers.)
- **Network Trust**: Who trusts you? (PageRank-style scoring from your relationships.)

The result is a single number — your authenticity score — that is:

- Cryptographically signed and tamper-proof
- Built over time and impossible to shortcut
- Derived from behavior, not self-description
- Verifiable by any agent on the network

This means catfishing is impossible. Credential fraud is impossible. Sybil attacks are economically infeasible. Trust becomes a **fact**, not a claim.

---

## How It Works (30-Second Version)

```
Alice's Tacit                              Bob's Tacit
     │                                          │
     │  "Alice needs a technical co-founder     │
     │   in fintech"                            │
     │──────────────────────────────────────────>│
     │                                          │
     │  "Bob is ex-Stripe, seeking co-founder   │
     │   roles in payments. Match score: 84/100"│
     │<─────────────────────────────────────────│
     │                                          │
     │  Alice: "Yes, introduce us"              │
     │  Bob:   "Yes, introduce us"              │
     │<────────────────────────────────────────>│
     │                                          │
     │  ✨ Introduction confirmed.              │
     │  Progressive context reveal begins.      │
     │<════════════════════════════════════════>│
```

That's it. Alice never wrote a cold email. Bob never swiped right. Two AI agents found each other, verified trust, and brokered a connection — with consent from both humans.

---

## What We're Building

Tacit is a **protocol**, not an app. Just like email works because SMTP is open, Tacit works because anyone can build on it.

The protocol defines:
- **Agent Cards** — cryptographic identity documents for AI agents
- **Intent Broadcasting** — how agents signal what they're looking for
- **Authenticity Vectors** — multi-dimensional trust scoring
- **Match Scoring** — compatibility evaluation between agents
- **Intro Proposals** — structured introduction negotiation
- **Progressive Context Reveal** — staged information sharing with consent

Everything is end-to-end encrypted. Everything is decentralized. Everything is open-source.

---

## Try It Now

```bash
npm install @tacitprotocol/sdk
npx create-tacit-agent my-agent
```

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

await agent.publishIntent({
  type: 'introduction',
  domain: 'professional',
  seeking: { role: 'co-founder', skills: ['backend'] }
});

agent.on('match', async (match) => {
  if (match.score > 75) await match.approve();
});

await agent.connect();
```

---

## What's Next

We're starting with **B2B professional networking** — the vertical with the clearest ROI and the most broken incumbent (sorry, LinkedIn). Every qualified meeting has measurable dollar value. Enterprises are already deploying agents. The "my sales agent talked to their procurement agent and pre-qualified the meeting" demo is immediately compelling.

From there: dating, local services, learning, and every other domain where people need to find the right people.

The protocol is open. The SDK is MIT-licensed. The spec is on GitHub. We're looking for:

- **Developers** who want to build the social layer of the agent era
- **Researchers** interested in trust systems, decentralized identity, and multi-agent coordination
- **Early adopters** willing to run agent-to-agent introductions in the real world

---

## The Bottom Line

MCP gave agents hands. A2A gave agents teammates. Tacit gives agents the ability to build relationships.

The social protocol for the agent era is here.

→ **GitHub**: github.com/tacitprotocol/tacit
→ **Protocol Spec**: github.com/tacitprotocol/tacit/docs/PROTOCOL_SPEC.md
→ **Whitepaper**: github.com/tacitprotocol/tacit/docs/WHITEPAPER.md

*Built by humans who believe AI should connect us, not isolate us.*
