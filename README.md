<div align="center">

# Tacit Protocol

### The Trust Layer for the Internet

**Every identity on the internet is self-reported. Tacit is an open protocol where AI agents verify identity, prevent fraud, and broker trusted introductions — with cryptographic proof.**

MCP connects agents to tools. A2A connects agents to tasks.
**Tacit verifies the humans behind them.**

[![npm](https://img.shields.io/npm/v/@tacitprotocol/sdk?color=blue)](https://www.npmjs.com/package/@tacitprotocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Protocol Version](https://img.shields.io/badge/Protocol-v0.1--draft-blue.svg)](docs/PROTOCOL_SPEC.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Protocol Spec](docs/PROTOCOL_SPEC.md) | [Quick Start](#quick-start) | [Whitepaper](docs/WHITEPAPER.md) | [Examples](examples/) | [Contributing](CONTRIBUTING.md)

</div>

---

## The Problem

Every networking platform is broken in the same way:

- **LinkedIn** lets anyone claim anything. No verification. Your inbox is 90% spam.
- **Dating apps** are plagued with catfishing. The #1 user complaint across all platforms.
- **Local services** have review fraud. You can't trust a 5-star rating.
- **B2B sales** means cold outreach to people who don't want to hear from you.

The root cause: **there is no trust layer between people on the internet.**

Meanwhile, AI agents are everywhere — but they can only talk to tools (MCP) or delegate tasks to each other (A2A). They can't discover other people's agents, verify who they represent, or negotiate introductions.

**Tacit is the missing third layer of the agent protocol stack.**

```
┌─────────────────────────────────────────────────────┐
│  YOUR APP (Dating / B2B / Local Services / Any)     │
├─────────────────────────────────────────────────────┤
│  TACIT PROTOCOL          ← You are here             │
│  Discovery + Trust + Matching + Introductions        │
├─────────────────────────────────────────────────────┤
│  Layer 2: A2A            Agent ↔ Agent Tasks         │
├─────────────────────────────────────────────────────┤
│  Layer 1: MCP            Agent ↔ Tools               │
└─────────────────────────────────────────────────────┘
```

## How It Works

Every person gets an AI agent that understands them tacitly — without being told. Your **Tacit agent** represents you on the network.

```
Alice's Tacit                              Bob's Tacit
     │                                          │
     │  1. Publishes encrypted intent           │
     │  "Alice is looking for a co-founder      │
     │   with backend experience in fintech"    │
     │──────────────────────────────────────────>│
     │                                          │
     │  2. Bob's agent evaluates the match             │
     │     Checks authenticity vectors          │
     │     Scores compatibility                 │
     │<─────────────────────────────────────────│
     │                                          │
     │  3. Mutual interest confirmed            │
     │     Double opt-in from both humans       │
     │<────────────────────────────────────────>│
     │                                          │
     │  4. Introduction happens                 │
     │     Context shared progressively         │
     │     Both sides verified                  │
     │<════════════════════════════════════════>│
```

**No spam. No catfishing. No cold outreach. Just high-signal, verified introductions.**

## Key Concepts

### Authenticity Vectors

Unlike LinkedIn profiles or dating bios, your Tacit agent doesn't rely on self-reported claims. Instead, it builds a multi-dimensional trust score from:

- **Long-running behavioral signals** — patterns that take months to build, impossible to fake overnight
- **Third-party attestations** — verifiable credentials from institutions, employers, peers
- **Progressive trust tiers** — new agents start with limited reach; trust is earned, not claimed

A Tacit agent's authenticity is cryptographically provable and impossible to clone. This solves catfishing, credential fraud, and Sybil attacks at the protocol level.

### Double Opt-In Introductions

Both sides must agree before any revealing information is shared. Your Tacit agent negotiates on your behalf — evaluating compatibility, verifying trust, proposing intros — so you only see high-quality matches that both parties have already pre-approved.

### Separation of Identities

Every person has three distinct identity layers:

| Layer | Purpose | Visibility |
|-------|---------|------------|
| **Core Identity** | Your real identity | Private to your Tacit agent only |
| **Agent Identity** | Your tacit's cryptographic ID + authenticity vector | Visible to the network |
| **Session Persona** | Context-specific persona per introduction | Shared only with matched parties |

You can be pseudonymous on a dating network and fully identified on a B2B network — same tacit, different personas, same trust score.

## Quick Start

```bash
# Install the Tacit SDK
npm install @tacitprotocol/sdk

# Create your first tacit agent
npx create-tacit-agent my-agent
```

```typescript
import { TacitAgent, Intent } from '@tacitprotocol/sdk';

// Initialize your Tacit agent
const agent = new TacitAgent({
  identity: await TacitAgent.createIdentity(),
  profile: {
    domain: 'professional',
    seeking: 'co-founder with backend experience in fintech',
    offering: 'product leadership, 10 years in payments'
  }
});

// Publish an intent to the network
await agent.publishIntent(new Intent({
  type: 'introduction',
  context: 'co-founder-search',
  preferences: {
    domain: 'fintech',
    skills: ['backend', 'systems-architecture'],
    stage: 'pre-seed'
  }
}));

// Listen for matches
agent.on('match', async (match) => {
  console.log(`Match found: ${match.score}/100 compatibility`);
  console.log(`Authenticity: ${match.authenticity.level}`);

  // Approve or decline the introduction
  if (match.score > 75) {
    await match.approve();
    // Introduction happens — context shared progressively
  }
});

// Start the agent
await agent.connect();
```

**Time to first introduction: under 5 minutes.**

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                            │
│         Dating  |  B2B Networking  |  Local Services  |  Custom   │
├──────────────────────────────────────────────────────────────────┤
│                      TACIT PROTOCOL                               │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────┐ │
│  │  Discovery   │ │  Matching   │ │    Intro     │ │ Commerce  │ │
│  │  & Intent    │ │  & Scoring  │ │  Negotiation │ │ & Service │ │
│  └─────────────┘ └─────────────┘ └──────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────────┐   │
│  │ Authenticity │ │ Progressive │ │   Context-Specific       │   │
│  │   Vector     │ │   Unlock    │ │   Personas               │   │
│  └─────────────┘ └─────────────┘ └──────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                   TRANSPORT / MESSAGING                           │
│           DIDComm v2  |  E2E Encryption  |  Relay Nodes          │
├──────────────────────────────────────────────────────────────────┤
│                   IDENTITY LAYER                                  │
│        W3C DIDs  |  Verifiable Credentials  |  Local Key Mgmt    │
├──────────────────────────────────────────────────────────────────┤
│                   INTEGRATION LAYER                               │
│           MCP (tool access)  |  A2A (task delegation)            │
└──────────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | What It Means |
|-----------|---------------|
| **Protocol-first** | Open standard, not a walled garden. Anyone can build on Tacit. |
| **Decentralized** | No single entity controls the network. Your identity is portable. |
| **E2E encrypted** | Relay nodes see only ciphertext. Your data stays yours. |
| **Identity separation** | Your real identity, agent identity, and session personas are distinct. |
| **Progressive trust** | Trust is earned over time, not self-declared. |
| **Double opt-in** | Both parties must consent before any introduction happens. |

## Use Cases

### B2B Professional Networking
Your sales Tacit agent finds qualified prospects. Their procurement Tacit agent evaluates your offering. If there's a fit, both humans get a pre-qualified, context-rich introduction. No more cold emails.

### Dating & Matchmaking
Your Tacit agent carries a cryptographically verified authenticity vector — not a self-written bio. Matches are based on behavioral signals and mutual compatibility, not profile photos. No catfishing possible.

### Local Services
Need a plumber? Your Tacit agent broadcasts the intent. Verified service providers' Tacit agents respond with availability, pricing, and trust scores built from real transaction history. No fake reviews.

### Learning & Mentorship
Looking for a mentor in machine learning? Your Tacit agent discovers experienced practitioners whose Tacit agents indicate willingness to mentor. Mutual fit is verified before either party invests time.

## Protocol Specification

The full protocol spec is available at [docs/PROTOCOL_SPEC.md](docs/PROTOCOL_SPEC.md).

Key protocol components:
- **Agent Cards** — structured identity documents for Tacit agents
- **Intent Broadcasting** — encrypted intent publication and discovery
- **Authenticity Vectors** — multi-dimensional trust scoring
- **Match Scoring** — compatibility evaluation between tacits
- **Intro Proposals** — structured introduction negotiation
- **Progressive Context Reveal** — staged information sharing

## Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| **v0.1 — The Demo** | Q1 2026 | Reference SDK, basic discovery, first agent-to-agent intro |
| **v0.2 — The Vertical** | Q2 2026 | B2B professional networking vertical, beta users |
| **v0.3 — The Network** | Q3-Q4 2026 | Multi-vertical support, developer ecosystem, service negotiation |
| **v1.0 — The Standard** | 2027 | Protocol standardization, multiple implementations, hosted infrastructure |

## Project Structure

```
tacit-protocol/
├── docs/                    # Protocol specification & whitepaper
│   ├── PROTOCOL_SPEC.md     # Full protocol v0.1 specification
│   ├── WHITEPAPER.md        # Tacit whitepaper
│   └── ARCHITECTURE.md      # Detailed architecture docs
├── packages/
│   ├── sdk-ts/              # TypeScript SDK (reference implementation)
│   │   ├── src/
│   │   │   ├── core/        # Core protocol implementation
│   │   │   ├── types/       # TypeScript type definitions
│   │   │   ├── transport/   # DIDComm v2 transport layer
│   │   │   ├── discovery/   # Agent discovery & intent broadcasting
│   │   │   ├── matching/    # Match scoring engine
│   │   │   ├── identity/    # DID management & authenticity vectors
│   │   │   └── utils/       # Shared utilities
│   │   ├── tests/           # Test suite
│   │   └── examples/        # SDK usage examples
│   └── sdk-python/          # Python SDK (coming soon)
├── examples/
│   ├── basic-intro/         # Minimal two-agent introduction
│   └── b2b-networking/      # B2B professional networking demo
├── assets/                  # Diagrams, logos, media
└── .github/                 # CI/CD, issue templates, PR templates
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

The Tacit Protocol is at an early stage. The highest-impact contributions right now:

- **Protocol feedback** — Review the [spec](docs/PROTOCOL_SPEC.md) and open issues
- **SDK development** — Help build the reference TypeScript SDK
- **Use case proposals** — Describe a vertical where Tacit would create value
- **Transport layer** — Help integrate DIDComm v2 or alternative transport
- **Identity integration** — W3C DID method implementations

## FAQ

**How is this different from A2A?**
A2A (Google) handles agent-to-agent *task delegation* — think "my agent asks your agent to book a flight." Tacit handles agent-to-agent *social networking* — think "my agent discovers your agent and brokers an introduction between us." They're complementary layers.

**How is this different from MCP?**
MCP (Anthropic) connects agents to *tools* — databases, APIs, file systems. Tacit connects agents to *other people's agents*. MCP is Layer 1, Tacit is Layer 3.

**Why not just build an app?**
Apps create walled gardens. Protocols create ecosystems. Email won because SMTP was open. The web won because HTTP was open. Tacit is the open protocol that any app can build on.

**How do you prevent spam/abuse?**
The authenticity vector system ensures that trust is earned over time through verifiable behavior, not self-declared. New agents start with limited reach (progressive unlock). Sybil attacks are economically infeasible because trust scores take months to build.

**What about privacy?**
E2E encryption by default. Your core identity is known only to your Tacit agent. Relay nodes see only ciphertext. You can be pseudonymous or identified depending on context. The protocol is privacy-by-architecture, not privacy-by-policy.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Tacit Protocol** — The trust infrastructure the internet was built without.

[GitHub](https://github.com/tacitprotocol) | [Docs](docs/) | [Discord](#) | [Twitter](https://x.com/tacitprotocol)

*Built by humans who believe AI should connect us, not isolate us.*

</div>
