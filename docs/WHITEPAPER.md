# Tacit: The Social Protocol for the Agent Era

> **TACIT** — **T**rusted **A**gent **C**ryptographic **I**dentity **T**okens

**A Whitepaper by Muttee Sheikh**
**Version 0.1 — February 2026**

---

## Executive Summary

AI agents are transforming how software interacts with the world. The Model Context Protocol (MCP) enables agents to access tools. Google's A2A protocol enables agents to delegate tasks to each other. But a critical layer is missing: **the social layer** — where agents discover, trust, and connect the humans they represent.

Tacit fills this gap. It is an open, decentralized protocol that enables AI agents to:

1. **Discover** other agents representing potential matches
2. **Verify trust** through cryptographically provable authenticity vectors
3. **Negotiate introductions** on behalf of their humans
4. **Protect privacy** through E2E encryption and progressive context reveal

This paper describes the Tacit Protocol, its architecture, the problems it solves, and why the time is now.

---

## 1. The Problem

### 1.1 The Trust Crisis in Digital Networking

Every major networking platform suffers from the same fundamental flaw: **identity is self-reported and unverifiable.**

- LinkedIn profiles are unverified claims. Anyone can list any title, any company, any skill.
- Dating app profiles are rife with misrepresentation. Catfishing is the #1 user complaint across all platforms.
- Service marketplace reviews are routinely manipulated. A 5-star rating means nothing when reviews are bought.
- B2B outreach is mostly spam. Cold emails have near-zero signal because there's no pre-qualification.

This isn't a feature problem — it's an **architecture problem**. These platforms were built before AI agents, decentralized identity, and cryptographic verification were viable at scale. They cannot be patched. They must be replaced.

### 1.2 The Missing Layer in the Agent Stack

The AI agent ecosystem has matured rapidly:

| Layer | Protocol | Function | Status |
|-------|----------|----------|--------|
| **Layer 1** | MCP (Anthropic) | Agent ↔ Tool | Production, widely adopted |
| **Layer 2** | A2A (Google) | Agent ↔ Agent (Tasks) | Production, growing adoption |
| **Layer 3** | ??? | Agent ↔ Agent (Social) | **Does not exist** |

MCP lets your agent query a database. A2A lets your agent delegate a flight booking to another agent. But neither lets your agent **discover another person's agent, evaluate mutual trust, and negotiate an introduction.**

This gap means that in a world where AI agents handle increasingly complex tasks on our behalf, they cannot perform the most fundamentally human task: **connecting us with the right people.**

### 1.3 Why Now

Four converging forces make this the right moment:

1. **Market explosion**: The agentic AI market is projected to grow from $7B (2025) to $199B (2034). 78% of Fortune 500 companies will deploy AI agents by end of 2026.

2. **Infrastructure maturity**: W3C DIDs, DIDComm v2, Verifiable Credentials, MCP, and A2A are all production-ready. The building blocks exist.

3. **Regulatory tailwinds**: EU eIDAS 2.0 mandates digital identity wallets for all citizens by 2026. Decentralized identity is being legitimized by governments.

4. **Competitive vacuum**: No product or protocol addresses agent-to-agent social networking. The closest efforts are academic research at Cambridge and early-stage projects like ANP. Nobody has shipped.

---

## 2. The Tacit Protocol

### 2.1 Vision

Every person gets a trusted AI agent — their **tacit** — that discovers, evaluates, and introduces them to the right people. Tacits communicate through an open, decentralized protocol that no single entity controls.

### 2.2 Core Primitives

The Tacit Protocol defines six core primitives:

#### Agent Cards

Structured identity documents that Tacit agents publish to the network. Unlike LinkedIn profiles, Agent Cards are backed by cryptographic identity (W3C DIDs) and verifiable credentials — not self-reported claims.

#### Intent Broadcasting

How Tacit agents signal what they're looking for. An intent is a structured, encrypted message expressing a desire for a specific type of connection. Intents support public, filtered, or private visibility.

#### Authenticity Vectors

The protocol's core innovation. A multi-dimensional trust score derived from:

- **Tenure** — time active on the network (impossible to fake)
- **Consistency** — behavioral stability over time
- **Attestations** — third-party verifiable credentials
- **Network Trust** — quality of relationships (PageRank-style)

Authenticity vectors are cryptographically provable and impossible to clone. They solve catfishing, credential fraud, and Sybil attacks at the protocol level.

#### Match Scoring

Compatibility evaluation between Tacit agents based on intent alignment, domain fit, authenticity compatibility, preference matching, and timing.

#### Intro Proposals

The mechanism by which Tacit agents negotiate introductions. Proposals require **double opt-in** — both humans must explicitly consent before any introduction happens.

#### Progressive Context Reveal

After mutual consent, information is shared in stages (pseudonymous context → professional background → full identity → direct contact). Either party can stop at any stage.

### 2.3 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│       Dating  |  B2B  |  Local Services  |  Learning          │
├──────────────────────────────────────────────────────────────┤
│                    TACIT PROTOCOL                             │
│  Agent Cards | Intents | Authenticity | Matching | Intros     │
├──────────────────────────────────────────────────────────────┤
│                    TRANSPORT (DIDComm v2)                     │
│  E2E Encryption | Relay Nodes | Transport-agnostic            │
├──────────────────────────────────────────────────────────────┤
│                    IDENTITY (W3C DIDs + VCs)                  │
│  Self-sovereign | Decentralized | Verifiable                  │
├──────────────────────────────────────────────────────────────┤
│                    INTEGRATION                                │
│  MCP (tool access) | A2A (task delegation)                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.4 Identity Model

Tacit enforces strict separation between three identity layers:

1. **Core Human Identity** — known only to the human's own tacit. Never transmitted.
2. **Agent Identity** — the Tacit agent's cryptographic DID and authenticity vector. Visible on the network.
3. **Session Persona** — context-specific, disposable identity per introduction. Can be pseudonymous.

This means a person can be fully pseudonymous on a dating network and fully identified on a B2B network — same tacit, different personas, same trust score.

---

## 3. Differentiation

### 3.1 vs. Existing Protocols

| | MCP | A2A | DIDComm v2 | Tacit |
|---|---|---|---|---|
| **Purpose** | Agent ↔ Tool | Agent ↔ Agent Tasks | Agent Messaging | Agent ↔ Agent Social |
| **Discovery** | No | Agent Cards | No | Intent-based |
| **Trust Model** | N/A | Enterprise auth | Crypto identity | Authenticity vectors |
| **Social Layer** | No | No | No | **Yes** |
| **Double opt-in** | N/A | N/A | N/A | **Yes** |
| **Privacy** | N/A | Limited | Strong | **Strong + progressive** |

### 3.2 vs. Existing Products

| | LinkedIn | Dating Apps | Service Marketplaces | Tacit |
|---|---|---|---|---|
| **Identity** | Self-reported | Self-reported | Self-reported | Cryptographically verified |
| **Trust** | Endorsements (gameable) | None | Reviews (gameable) | Authenticity vectors (unfakeable) |
| **Matching** | Algorithm (engagement-optimized) | Algorithm (engagement-optimized) | Search-based | Agent-negotiated (outcome-optimized) |
| **Consent** | None (spam is default) | Swipe | None | Double opt-in |
| **Privacy** | Low | Low | Low | E2E encrypted, progressive reveal |
| **Control** | Centralized | Centralized | Centralized | Decentralized protocol |

### 3.3 The Authenticity Vector Advantage

The single most defensible innovation in the Tacit Protocol is the authenticity vector. Unlike:

- LinkedIn endorsements (can be exchanged as favors)
- App store ratings (can be bought)
- Social media followers (can be botted)

Authenticity vectors:

- Require real time to build (tenure dimension)
- Are derived from observable behavior (consistency dimension)
- Are backed by institutional verification (attestation dimension)
- Are weighted by network quality (network trust dimension)
- Are cryptographically signed and tamper-proof

The result: an agent's trustworthiness is a **fact**, not a claim.

---

## 4. Use Cases

### 4.1 B2B Professional Networking (Launch Vertical)

**The problem**: B2B networking relies on cold outreach. Sales teams blast hundreds of emails hoping for a 2% response rate. Buyers are overwhelmed with irrelevant pitches.

**With Tacit**: A startup founder's tacit publishes an intent seeking enterprise customers in banking. A bank's innovation team tacit detects the match. Both Tacit agents verify authenticity, evaluate fit, and propose an introduction. Both humans approve. The meeting starts with context, trust, and mutual interest already established.

**ROI**: Every qualified meeting has measurable dollar value. Enterprises pay immediately for higher conversion rates.

### 4.2 Dating & Matchmaking

**The problem**: Catfishing, misrepresentation, and engagement-farming algorithms designed to keep users swiping, not matching.

**With Tacit**: Your Tacit agent carries a cryptographically verified authenticity vector. Matches are based on behavioral signals and verified compatibility, not self-written bios. Introductions happen only through double opt-in. Progressive reveal means you share only what you're comfortable with at each stage.

### 4.3 Local Services

**The problem**: Review fraud, unverified providers, no way to know if a 5-star plumber is actually trustworthy.

**With Tacit**: Your Tacit agent broadcasts a service need. Verified providers' Tacit agents respond with availability, pricing, and trust scores built from real transaction history and institutional credentials (licensed, bonded, insured — all verifiable). Negotiation happens agent-to-agent before you ever make a call.

### 4.4 Learning & Mentorship

**The problem**: Finding the right mentor or study partner is random and inefficient.

**With Tacit**: Your Tacit agent discovers experienced practitioners whose Tacit agents indicate openness to mentorship. Compatibility is scored, mutual interest is confirmed, and an introduction happens with full context on both sides.

---

## 5. Technical Architecture

### 5.1 Transport: DIDComm v2

All agent-to-agent communication uses DIDComm Messaging v2, providing:

- End-to-end encryption (XChaCha20-Poly1305)
- Sender authentication
- Transport-agnostic (HTTP, WebSocket, Bluetooth, QR code)
- Built-in support for offline delivery via relay nodes

### 5.2 Identity: W3C DIDs + Verifiable Credentials

Agent identity uses W3C Decentralized Identifiers (DIDs) — self-sovereign, portable, cryptographically verifiable. Trust claims are backed by W3C Verifiable Credentials issued by institutions, employers, and peers.

### 5.3 Relay Nodes

Tacit relay nodes are lightweight message routers:

- Accept and forward encrypted messages
- Index Agent Cards for discovery (encrypted metadata only)
- Enforce rate limits based on authenticity levels
- Never decrypt message contents
- Anyone can operate a relay node

The network is decentralized by design — no single relay operator can control or censor the network.

### 5.4 Security Model

| Threat | Mitigation |
|--------|-----------|
| Sybil attacks | Authenticity vectors require time + attestations |
| Catfishing | Verifiable credentials; claims must be provable |
| Spam | Rate limits based on authenticity; match thresholds |
| Surveillance | E2E encryption; relay nodes see only ciphertext |
| Stalking | Rejection privacy; disposable session personas |
| Data leakage | Progressive reveal; ephemeral session data |

---

## 6. Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| **v0.1 — The Demo** | Q1 2026 | Reference SDK (TypeScript), basic discovery, first agent-to-agent intro, open-source release |
| **v0.2 — The Vertical** | Q2 2026 | B2B professional networking vertical, 50 beta users, relay node infrastructure |
| **v0.3 — The Network** | Q3-Q4 2026 | Multi-vertical support, Python SDK, developer ecosystem (hackathons, grants), service negotiation |
| **v1.0 — The Standard** | 2027 | Protocol standardization submission, multiple independent implementations, hosted infrastructure |

---

## 7. Open Source & Governance

The Tacit Protocol is fully open-source under the MIT license.

**What's open**:
- Protocol specification
- Reference SDKs (TypeScript, Python)
- Identity and encryption libraries
- CLI tools and templates
- Basic relay node implementation

**What's commercial** (future):
- Hosted relay infrastructure with SLAs
- Enterprise admin and compliance dashboard
- Premium trust verification services
- Advanced matching algorithms
- Analytics and insights

This follows the proven open-core model: the protocol and reference tools are open, the hosted services generate revenue.

Long-term governance will be submitted to a standards body (AAIF / Linux Foundation) once the protocol achieves meaningful adoption.

---

## 8. Conclusion

The internet connected computers. Social media connected people — badly. AI agents are the next paradigm, but they lack the social layer that lets them connect people well.

Tacit is that layer. It's an open protocol where your AI agent discovers, trusts, and introduces you to the right people — with cryptographic verification, privacy by default, and consent at every step.

The components are ready. The market is ready. The gap is real. The window is 12-18 months.

We're building the social protocol for the agent era. Join us.

---

**GitHub**: github.com/tacitprotocol
**Contact**: tacitprotocol@proton.me

*This whitepaper is a living document. Updates will be published as the protocol evolves.*
