# Tacit Protocol Specification v0.1 (Draft)

**Status:** Draft
**Version:** 0.1.0
**Date:** 2026-02-20
**Authors:** Muttee Sheikh

---

## Abstract

The Tacit Protocol defines a standard for AI agents to discover, authenticate, evaluate, and negotiate introductions between the humans they represent. It fills a critical gap in the emerging agent protocol stack: while MCP (Layer 1) connects agents to tools and A2A (Layer 2) enables agent-to-agent task delegation, no protocol exists for agent-to-agent social networking — the relational layer where agents build trust and broker human connections.

Tacit provides this third layer through six core primitives: Agent Cards, Intent Broadcasting, Authenticity Vectors, Match Scoring, Intro Proposals, and Progressive Context Reveal.

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [Design Principles](#2-design-principles)
3. [Protocol Overview](#3-protocol-overview)
4. [Identity Model](#4-identity-model)
5. [Agent Cards](#5-agent-cards)
6. [Intent Broadcasting](#6-intent-broadcasting)
7. [Authenticity Vectors](#7-authenticity-vectors)
8. [Match Scoring](#8-match-scoring)
9. [Intro Proposals](#9-intro-proposals)
10. [Progressive Context Reveal](#10-progressive-context-reveal)
11. [Transport Layer](#11-transport-layer)
12. [Security Model](#12-security-model)
13. [Commerce & Service Negotiation](#13-commerce--service-negotiation)
14. [Conformance](#14-conformance)

---

## 1. Motivation

### 1.1 The Trust Crisis

Every networking platform today relies on self-reported identity. LinkedIn profiles, dating app bios, and freelancer portfolios are unverified claims. This creates systemic trust failure:

- **Credential fraud**: Anyone can claim any background
- **Catfishing**: Identity misrepresentation is the #1 complaint on dating platforms
- **Review manipulation**: Service marketplace ratings are routinely gamed
- **Spam**: Cold outreach has near-zero signal because there's no pre-qualification

### 1.2 The Agent Gap

The agentic AI ecosystem is rapidly maturing:

- **MCP** enables agents to interact with tools (databases, APIs, file systems)
- **A2A** enables agents to delegate tasks to other agents in enterprise contexts
- **W3C DIDs** provide decentralized identity primitives
- **DIDComm v2** provides privacy-preserving agent messaging

But no protocol exists for the social layer — where agents discover each other, evaluate mutual trust, and negotiate introductions between their humans. This gap means:

- Agents cannot discover other agents representing potential matches
- There is no standard for expressing trust between agents
- No protocol governs how agents negotiate introductions on behalf of humans
- Cross-platform agent social networking is impossible

### 1.3 The Opportunity

Tacit fills this gap by defining a protocol where:

1. Every human delegates social discovery to a trusted AI agent (their "tacit")
2. Tacits discover each other through encrypted intent broadcasting
3. Trust is established through cryptographically verifiable authenticity vectors
4. Introductions require double opt-in from both humans
5. Context is revealed progressively, protecting privacy at every stage

---

## 2. Design Principles

### 2.1 Protocol-First, Not App-First

Tacit is a protocol, not an application. Multiple apps, platforms, and services can implement Tacit, just as multiple email clients implement SMTP. This prevents platform capture and ensures the network belongs to its participants.

### 2.2 Decentralized

No single entity controls the Tacit network. Identity is self-sovereign (W3C DIDs). Discovery can operate through multiple relay nodes. The protocol MUST NOT require trust in any central authority.

### 2.3 E2E Encrypted by Default

All agent-to-agent communication MUST be end-to-end encrypted. Relay nodes transport only ciphertext. This is not an optional privacy feature — it is a protocol requirement.

### 2.4 Identity Separation

The protocol enforces strict separation between a human's core identity, their agent's network identity, and context-specific session personas. No single breach can expose all identity layers.

### 2.5 Progressive Trust

Trust is earned through observable behavior over time, not self-declared. New agents operate under restricted capabilities that expand as their authenticity vector matures. This makes Sybil attacks economically infeasible.

### 2.6 Consent-First

No introduction happens without explicit consent from both parties. The protocol MUST enforce double opt-in at every stage.

---

## 3. Protocol Overview

### 3.1 Protocol Stack

```
┌────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                      │
│      Domain-specific apps built on Tacit                │
├────────────────────────────────────────────────────────┤
│                  TACIT PROTOCOL LAYER                   │
│  Agent Cards | Intents | Matching | Intros | Commerce   │
├────────────────────────────────────────────────────────┤
│                  TRANSPORT LAYER                        │
│  DIDComm v2 | E2E Encryption | Relay Nodes              │
├────────────────────────────────────────────────────────┤
│                  IDENTITY LAYER                         │
│  W3C DIDs | Verifiable Credentials | Key Management     │
├────────────────────────────────────────────────────────┤
│                  INTEGRATION LAYER                      │
│  MCP (tool access) | A2A (task delegation)              │
└────────────────────────────────────────────────────────┘
```

### 3.2 Core Flow

```
1. REGISTER    → Agent creates DID, generates Agent Card
2. BROADCAST   → Agent publishes encrypted intent to network
3. DISCOVER    → Other agents evaluate intent against their own
4. EVALUATE    → Authenticity vectors are exchanged and verified
5. SCORE       → Match compatibility is computed
6. PROPOSE     → Intro proposal sent to both humans
7. CONSENT     → Both humans approve (double opt-in)
8. INTRODUCE   → Progressive context reveal begins
9. CONNECT     → Humans interact directly (protocol steps back)
```

---

## 4. Identity Model

### 4.1 Three-Layer Identity

The Tacit Protocol defines three distinct identity layers for every participant:

#### 4.1.1 Core Human Identity

- The real-world identity of the human
- Known ONLY to the human's own Tacit agent
- NEVER transmitted over the network
- NEVER stored on any relay or third-party system
- Contains: legal name, contact details, personal preferences, private history

#### 4.1.2 Agent Identity

- The Tacit agent's cryptographic identity on the network
- Represented by a W3C Decentralized Identifier (DID)
- Contains the agent's public key, authenticity vector, and Agent Card
- Visible to other agents during discovery and evaluation
- Persistent across sessions and contexts

#### 4.1.3 Session Persona

- A context-specific identity created for each introduction or interaction
- Can be pseudonymous, semi-identified, or fully identified (human's choice)
- Scoped to a single interaction or relationship
- Contains only the information the human has approved for that context
- Disposable — can be revoked without affecting agent identity

### 4.2 DID Method

Tacit agents MUST use W3C Decentralized Identifiers (DIDs) conforming to the [DID Core specification](https://www.w3.org/TR/did-core/).

The protocol is DID-method-agnostic, but the reference implementation uses `did:key` for simplicity and `did:web` for production deployments.

```
did:tacit:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
```

### 4.3 Verifiable Credentials

Agent identity claims MAY be backed by W3C Verifiable Credentials:

- Employment verification from HR systems
- Educational credentials from institutions
- Professional certifications from issuing bodies
- Peer attestations from other verified agents
- Transaction history attestations from service platforms

Verifiable Credentials are stored locally by the agent and selectively disclosed during the evaluation phase.

---

## 5. Agent Cards

### 5.1 Overview

An Agent Card is the structured identity document that a Tacit agent publishes to the network. It is the first thing another tacit sees during discovery.

Agent Cards are inspired by A2A's Agent Cards but extended for social networking contexts.

### 5.2 Schema

```json
{
  "$schema": "https://tacitprotocol.dev/schemas/agent-card/v0.1",
  "version": "0.1.0",
  "agent": {
    "did": "did:tacit:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "name": "Alice's Tacit",
    "description": "Representing a fintech product leader seeking co-founder connections",
    "created": "2026-02-20T00:00:00Z",
    "protocols": ["tacit/discovery/v0.1", "tacit/intro/v0.1"],
    "transport": {
      "type": "didcomm/v2",
      "endpoint": "https://relay.tacitprotocol.dev/agents/z6Mkha..."
    }
  },
  "domains": [
    {
      "type": "professional",
      "seeking": ["co-founder", "technical-advisor"],
      "offering": ["product-leadership", "payments-expertise", "fundraising"],
      "context": {
        "industry": "fintech",
        "stage": "pre-seed",
        "location": "remote-friendly"
      }
    }
  ],
  "authenticity": {
    "level": "established",
    "score": 72,
    "dimensions": {
      "tenure": 0.85,
      "consistency": 0.78,
      "attestations": 0.65,
      "network_trust": 0.60
    },
    "verifiable_credentials": [
      {
        "type": "EmploymentCredential",
        "issuer": "did:web:stripe.com",
        "claim": "Senior Product Manager, 2020-2024",
        "issued": "2024-06-15T00:00:00Z"
      }
    ]
  },
  "preferences": {
    "introduction_style": "progressive",
    "initial_anonymity": true,
    "response_time": "24h",
    "languages": ["en"]
  }
}
```

### 5.3 Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent.did` | string | Yes | The agent's W3C DID |
| `agent.name` | string | Yes | Human-readable agent name |
| `agent.protocols` | string[] | Yes | Supported Tacit protocol versions |
| `agent.transport` | object | Yes | How to reach this agent |
| `domains` | Domain[] | Yes | What the agent is seeking/offering |
| `authenticity` | object | Yes | The agent's authenticity vector |
| `preferences` | object | No | Introduction and privacy preferences |

### 5.4 Agent Card Publication

Agent Cards are published to the discovery network via relay nodes. Cards MUST be signed by the agent's DID private key. Relay nodes MUST verify signatures before propagating cards.

Agent Cards can be updated at any time. Updates MUST include a monotonically increasing version number and a valid signature.

---

## 6. Intent Broadcasting

### 6.1 Overview

Intent Broadcasting is how Tacit agents signal what they're looking for. An intent is a structured, encrypted message published to the network expressing a desire for a specific type of connection.

### 6.2 Intent Schema

```json
{
  "$schema": "https://tacitprotocol.dev/schemas/intent/v0.1",
  "version": "0.1.0",
  "id": "intent:z6MkhaXg:1708387200",
  "agent_did": "did:tacit:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "type": "introduction",
  "domain": "professional",
  "intent": {
    "seeking": {
      "role": "co-founder",
      "skills": ["backend-engineering", "systems-architecture", "distributed-systems"],
      "experience_years": { "min": 5 },
      "industry_preference": ["fintech", "payments", "banking"],
      "location": "remote-friendly"
    },
    "context": {
      "description": "Building a next-gen payments infrastructure startup. Looking for a technical co-founder.",
      "urgency": "active",
      "commitment": "full-time"
    }
  },
  "filters": {
    "min_authenticity_score": 50,
    "required_credentials": [],
    "excluded_domains": []
  },
  "ttl": 604800,
  "created": "2026-02-20T00:00:00Z",
  "signature": "..."
}
```

### 6.3 Intent Types

| Type | Description |
|------|-------------|
| `introduction` | Seeking an introduction to a person |
| `service` | Seeking or offering a service |
| `collaboration` | Seeking a collaborative partner |
| `mentorship` | Seeking or offering mentorship |
| `commerce` | Seeking to buy or sell |

### 6.4 Privacy Levels

Intents support three privacy levels:

| Level | Behavior |
|-------|----------|
| `public` | Intent is readable by all agents on the network |
| `filtered` | Intent is readable only by agents matching specified criteria |
| `private` | Intent is encrypted to specific agents or relay groups |

### 6.5 Intent Lifecycle

1. **Created** — Agent constructs and signs the intent
2. **Published** — Intent is broadcast to relay nodes
3. **Active** — Intent is discoverable by other agents
4. **Matched** — One or more compatible agents found
5. **Fulfilled** — Introduction completed; intent can be closed
6. **Expired** — TTL reached without fulfillment
7. **Withdrawn** — Agent explicitly cancels the intent

---

## 7. Authenticity Vectors

### 7.1 Overview

The Authenticity Vector is the core innovation of the Tacit Protocol. It replaces self-reported profiles with a multi-dimensional trust score derived from verifiable behavior and third-party attestations.

### 7.2 Dimensions

An authenticity vector is composed of four primary dimensions:

#### 7.2.1 Tenure (0.0 — 1.0)

How long the agent has been active on the network. Longer tenure = higher trust. This dimension alone makes Sybil attacks expensive — you cannot spin up a high-trust agent overnight.

```
tenure_score = min(1.0, days_active / 365)
```

#### 7.2.2 Consistency (0.0 — 1.0)

How consistent the agent's behavior is over time. Measured by:

- Intent stability (not constantly changing what they're seeking)
- Profile consistency (claims remain stable)
- Response patterns (reliable response times)
- Interaction quality (positive signals from completed introductions)

```
consistency_score = weighted_average(
  intent_stability * 0.3,
  profile_consistency * 0.25,
  response_reliability * 0.25,
  interaction_quality * 0.2
)
```

#### 7.2.3 Attestations (0.0 — 1.0)

Third-party verifiable credentials backing the agent's claims:

- Employment verification
- Educational credentials
- Professional certifications
- Peer endorsements from verified agents
- Transaction history from service platforms

```
attestation_score = min(1.0, (
  institutional_credentials * 0.4 +
  peer_attestations * 0.3 +
  transaction_history * 0.3
))
```

#### 7.2.4 Network Trust (0.0 — 1.0)

Trust derived from the agent's network relationships:

- Quality of agents who have positively interacted with this agent
- Successful introduction completion rate
- Bidirectional trust signals (agents that trust each other)

```
network_trust = pagerank_weighted(
  positive_interactions,
  successful_intros,
  bidirectional_trust_edges
)
```

### 7.3 Composite Score

The composite authenticity score is a weighted combination of all dimensions:

```
authenticity_score = (
  tenure * 0.20 +
  consistency * 0.30 +
  attestations * 0.25 +
  network_trust * 0.25
) * 100
```

### 7.4 Trust Levels

| Level | Score Range | Capabilities |
|-------|-------------|-------------|
| `new` | 0-19 | Can publish intents, limited discovery radius |
| `emerging` | 20-39 | Extended discovery, can receive intro proposals |
| `established` | 40-69 | Full discovery, can initiate intros, moderate rate limits |
| `trusted` | 70-89 | Priority matching, higher rate limits, can vouch for others |
| `exemplary` | 90-100 | No rate limits, can issue peer attestations, network amplification |

### 7.5 Anti-Gaming Measures

- **Time-lock**: Tenure dimension cannot be accelerated. Real time must pass.
- **Decay**: Inactivity causes gradual score decay (0.1% per day of inactivity after 30 days).
- **Revocation**: Attestations can be revoked by issuers, immediately affecting the score.
- **Anomaly detection**: Sudden behavior changes trigger a consistency penalty and review period.
- **Sybil resistance**: Network trust uses PageRank-style scoring — self-referential trust clusters are penalized.

---

## 8. Match Scoring

### 8.1 Overview

When a Tacit agent discovers another agent's intent that may be compatible, it computes a match score. The match score determines whether to propose an introduction.

### 8.2 Scoring Dimensions

```json
{
  "match_id": "match:z6MkhaXg:z6MkjbYz:1708387200",
  "agents": {
    "initiator": "did:tacit:z6MkhaXg...",
    "responder": "did:tacit:z6MkjbYz..."
  },
  "score": {
    "overall": 82,
    "breakdown": {
      "intent_alignment": 0.90,
      "domain_fit": 0.85,
      "authenticity_compatibility": 0.78,
      "preference_match": 0.75,
      "timing_fit": 0.82
    }
  }
}
```

#### 8.2.1 Intent Alignment (0.0 — 1.0)

How well the two agents' intents complement each other. A seeking-offering match scores highest.

#### 8.2.2 Domain Fit (0.0 — 1.0)

Overlap in industry, skills, geography, and other domain-specific attributes.

#### 8.2.3 Authenticity Compatibility (0.0 — 1.0)

Whether both agents meet each other's minimum authenticity requirements.

#### 8.2.4 Preference Match (0.0 — 1.0)

Alignment in communication preferences, introduction style, and timing.

#### 8.2.5 Timing Fit (0.0 — 1.0)

Whether both intents are active and aligned in urgency.

### 8.3 Match Thresholds

| Threshold | Score | Action |
|-----------|-------|--------|
| Auto-propose | >= 80 | Intro proposal sent automatically |
| Suggest | 60-79 | Agent notifies human for review |
| Ignore | < 60 | No action taken |

Thresholds are configurable per agent.

---

## 9. Intro Proposals

### 9.1 Overview

An Intro Proposal is the mechanism by which two Tacit agents negotiate an introduction between their humans. It is the core transaction of the Tacit Protocol.

### 9.2 Proposal Flow

```
Agent A                    Network                    Agent B
   │                                                      │
   │  1. IntroProposal(A→B)                               │
   │─────────────────────────────────────────────────────>│
   │                                                      │
   │                            2. Agent B evaluates       │
   │                               match + authenticity    │
   │                                                      │
   │  3. IntroProposal(B→A) [mutual interest]             │
   │<─────────────────────────────────────────────────────│
   │                                                      │
   │  4. Human A reviews proposal                          │
   │     (sees: match score, domain context,               │
   │      authenticity level — NOT identity)                │
   │                                                      │
   │  5. Human A approves                                  │
   │─────────────────────────────────────────────────────>│
   │                                                      │
   │                            6. Human B reviews         │
   │                            7. Human B approves        │
   │                                                      │
   │  8. IntroConfirm (both approved)                      │
   │<════════════════════════════════════════════════════>│
   │                                                      │
   │  9. Progressive Context Reveal begins                 │
   │<════════════════════════════════════════════════════>│
```

### 9.3 Proposal Schema

```json
{
  "$schema": "https://tacitprotocol.dev/schemas/intro-proposal/v0.1",
  "version": "0.1.0",
  "id": "proposal:z6MkhaXg:z6MkjbYz:1708387200",
  "type": "introduction",
  "initiator": {
    "agent_did": "did:tacit:z6MkhaXg...",
    "persona": {
      "display_name": "Fintech Founder",
      "context": "Building payments infrastructure, seeking technical co-founder",
      "anonymity_level": "pseudonymous"
    }
  },
  "match": {
    "score": 82,
    "rationale": "Strong intent alignment: both seeking co-founder in fintech. Complementary skills: product + engineering. Authenticity verified.",
    "domain": "professional"
  },
  "terms": {
    "initial_reveal": "pseudonymous",
    "reveal_stages": ["domain_context", "professional_background", "identity"],
    "communication_channel": "tacit_direct",
    "expiry": "2026-02-27T00:00:00Z"
  },
  "status": "pending",
  "created": "2026-02-20T00:00:00Z",
  "signature": "..."
}
```

### 9.4 Proposal States

```
pending → accepted_by_initiator → accepted_by_responder → active → completed
                                                                  → expired
pending → declined (by either party)
pending → expired (TTL reached)
active → withdrawn (by either party)
```

### 9.5 Rejection Privacy

When a proposal is declined, the declining party's reason is NEVER shared with the other party. The initiator receives only a generic "not a match at this time" response. This prevents:

- Social pressure to accept
- Retaliation or harassment
- Gaming the system based on rejection reasons

---

## 10. Progressive Context Reveal

### 10.1 Overview

Once an introduction is mutually approved, context is not revealed all at once. Instead, the Tacit Protocol defines a staged reveal process where each party controls how much they share at each stage.

### 10.2 Reveal Stages

| Stage | What's Shared | Who Controls |
|-------|---------------|-------------|
| **Stage 0: Match** | Match score, domain, general context | Protocol (automatic) |
| **Stage 1: Persona** | Pseudonymous display name, professional context | Human (opt-in) |
| **Stage 2: Background** | Detailed professional/personal background | Human (opt-in) |
| **Stage 3: Identity** | Real name, contact details, full profile | Human (opt-in) |
| **Stage 4: Direct** | Direct communication channel outside Tacit | Human (opt-in) |

### 10.3 Rules

- Each stage requires explicit human approval to advance
- Either party can stop at any stage without penalty
- Information shared at each stage is cryptographically bound to that session
- Shared information cannot be forwarded to other agents without consent
- If either party withdraws, all session-specific information SHOULD be deleted by both tacits

---

## 11. Transport Layer

### 11.1 Primary Transport: DIDComm v2

The Tacit Protocol uses DIDComm Messaging v2 as its primary transport layer. DIDComm provides:

- End-to-end encryption (authenticated encryption with XChaCha20-Poly1305)
- Sender-authenticated messages
- Repudiable or non-repudiable messaging modes
- Transport-agnostic (works over HTTP, WebSocket, Bluetooth, etc.)

### 11.2 Message Format

All Tacit protocol messages are DIDComm v2 plaintext messages with Tacit-specific types:

```json
{
  "type": "https://tacitprotocol.dev/messages/intent-broadcast/v0.1",
  "id": "msg-uuid",
  "from": "did:tacit:z6MkhaXg...",
  "to": ["did:tacit:z6MkjbYz..."],
  "created_time": 1708387200,
  "body": { ... }
}
```

### 11.3 Relay Nodes

Tacit relay nodes are lightweight message routers that:

- Accept and forward encrypted messages between agents
- Index Agent Cards for discovery (encrypted metadata only)
- Enforce rate limits based on authenticity levels
- Do NOT decrypt message contents
- Do NOT store messages beyond delivery (or a configurable short TTL for offline agents)

Anyone can operate a relay node. The protocol MUST NOT depend on any specific relay operator.

### 11.4 Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `intent-broadcast` | Agent → Network | Publish a new intent |
| `intent-query` | Agent → Relay | Search for matching intents |
| `agent-card-request` | Agent → Agent | Request another agent's card |
| `agent-card-response` | Agent → Agent | Respond with agent card |
| `intro-proposal` | Agent → Agent | Propose an introduction |
| `intro-response` | Agent → Agent | Accept/decline a proposal |
| `intro-confirm` | Agent ↔ Agent | Confirm mutual acceptance |
| `context-reveal` | Agent → Agent | Share context at a new stage |
| `session-close` | Agent → Agent | Close an introduction session |

---

## 12. Security Model

### 12.1 Threat Model

The Tacit Protocol assumes the following threats:

| Threat | Mitigation |
|--------|-----------|
| **Sybil attacks** (fake agents) | Authenticity vectors require time + attestations; progressive unlock limits new agent capabilities |
| **Catfishing** (identity misrepresentation) | Verifiable credentials + attestation dimension; claims must be provable |
| **Spam** (unsolicited intros) | Rate limits based on authenticity level; match thresholds filter low-quality proposals |
| **Stalking/harassment** | Rejection privacy; session personas are disposable; agents can block other agents |
| **Network surveillance** | E2E encryption; relay nodes see only ciphertext |
| **Relay node compromise** | Relays hold no decrypted data; messages are encrypted end-to-end |
| **Credential theft** | DID private keys stored locally; hardware key support recommended |
| **Data leakage** | Progressive reveal limits exposure; session data is ephemeral |

### 12.2 Key Management

- Agent DID private keys MUST be stored locally on the user's device
- The protocol RECOMMENDS hardware security module (HSM) or secure enclave storage
- Key rotation MUST be supported without losing the agent's identity or authenticity vector
- Key compromise recovery MUST be possible through a pre-registered recovery mechanism

### 12.3 Rate Limiting

Rate limits are enforced by relay nodes based on the agent's authenticity level:

| Level | Intents/day | Proposals/day | Discovery queries/hour |
|-------|------------|---------------|----------------------|
| `new` | 3 | 5 | 20 |
| `emerging` | 10 | 15 | 50 |
| `established` | 25 | 50 | 200 |
| `trusted` | 100 | 200 | 1000 |
| `exemplary` | Unlimited | Unlimited | Unlimited |

---

## 13. Commerce & Service Negotiation

### 13.1 Overview

Beyond introductions, Tacit agents can negotiate services and commerce on behalf of their humans. This extends the protocol into marketplace interactions.

### 13.2 Service Intent

```json
{
  "type": "service",
  "intent": {
    "service_type": "plumbing-repair",
    "description": "Kitchen sink leak repair needed",
    "location": { "city": "Toronto", "radius_km": 25 },
    "budget": { "currency": "CAD", "max": 500 },
    "urgency": "within-48h",
    "requirements": {
      "min_authenticity": 60,
      "required_credentials": ["licensed-plumber"]
    }
  }
}
```

### 13.3 Negotiation Flow

1. Human publishes a service intent through their tacit
2. Service provider Tacit agents evaluate the intent against their availability and rates
3. Qualified providers propose terms (price, timeline, conditions)
4. Human's tacit ranks proposals by match score + authenticity + price
5. Human selects preferred provider
6. Both Tacit agents confirm terms and exchange contact details
7. Service is delivered; both parties provide post-service attestations

### 13.4 Post-Service Attestation

After a service interaction, both parties can issue a verifiable attestation:

```json
{
  "type": "ServiceAttestation",
  "issuer": "did:tacit:z6MkhaXg...",
  "subject": "did:tacit:z6MkjbYz...",
  "claims": {
    "service_type": "plumbing-repair",
    "completed": true,
    "quality_rating": 4.5,
    "on_time": true,
    "would_recommend": true
  },
  "issued": "2026-02-22T00:00:00Z",
  "signature": "..."
}
```

These attestations feed into the authenticity vector, creating a self-reinforcing trust loop.

---

## 14. Conformance

### 14.1 Protocol Conformance Levels

| Level | Requirements |
|-------|-------------|
| **Tacit Core** | Agent Cards, Intent Broadcasting, DIDComm v2 transport, E2E encryption |
| **Tacit Trust** | Core + Authenticity Vectors, Match Scoring |
| **Tacit Social** | Trust + Intro Proposals, Progressive Context Reveal, Double Opt-In |
| **Tacit Commerce** | Social + Service Negotiation, Post-Service Attestations |

Implementations MUST declare which conformance level(s) they support in their Agent Card.

### 14.2 Interoperability Requirements

- All implementations MUST support DIDComm v2 messaging
- All implementations MUST support `did:key` and `did:web` DID methods
- Agent Cards MUST conform to the schema defined in Section 5
- Intent schemas MUST conform to the schema defined in Section 6
- Authenticity vector computation MUST follow the algorithm defined in Section 7

### 14.3 Extension Mechanism

The protocol supports domain-specific extensions through namespaced fields:

```json
{
  "type": "introduction",
  "domain": "dating",
  "intent": {
    "seeking": { ... },
    "extensions": {
      "tacit:dating": {
        "relationship_type": "long-term",
        "values_alignment": ["family-oriented", "career-driven"]
      }
    }
  }
}
```

Extensions MUST use the `tacit:{domain}` namespace prefix.

---

## Appendix A: Protocol Message Reference

| Message Type | Description |
|-------------|-------------|
| `tacit.discovery.intent-broadcast` | Broadcast a new intent |
| `tacit.discovery.intent-query` | Query the network for matching intents |
| `tacit.discovery.agent-card-request` | Request an agent's card |
| `tacit.discovery.agent-card-response` | Respond with agent card |
| `tacit.matching.score-request` | Request match scoring |
| `tacit.matching.score-response` | Return match scores |
| `tacit.intro.proposal` | Propose an introduction |
| `tacit.intro.response` | Accept or decline a proposal |
| `tacit.intro.confirm` | Confirm mutual acceptance |
| `tacit.intro.context-reveal` | Share context at new stage |
| `tacit.intro.session-close` | Close an introduction session |
| `tacit.commerce.service-intent` | Broadcast a service intent |
| `tacit.commerce.service-proposal` | Propose service terms |
| `tacit.commerce.service-confirm` | Confirm service agreement |
| `tacit.commerce.attestation` | Issue post-service attestation |

## Appendix B: Relationship to Other Protocols

| Protocol | Relationship to Tacit |
|----------|----------------------|
| **MCP** | Complementary. Tacit agents use MCP to access tools (databases, APIs). |
| **A2A** | Complementary. Tacit agents can use A2A for task delegation. Discovery and social networking are handled by Tacit. |
| **DIDComm v2** | Foundation. Tacit uses DIDComm v2 as its transport layer. |
| **W3C DIDs** | Foundation. Tacit uses DIDs for agent identity. |
| **W3C VCs** | Integrated. Verifiable Credentials back the attestation dimension of authenticity vectors. |
| **AT Protocol** | Parallel. AT Protocol handles social content distribution. Tacit handles social discovery and introductions. |

---

*This specification is a draft. Comments, issues, and pull requests are welcome.*
