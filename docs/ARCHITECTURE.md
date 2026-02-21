# Tacit Protocol — Architecture Guide

## Overview

This document describes the technical architecture of the Tacit Protocol and the reference implementation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HUMAN INTERFACE                            │
│  CLI  |  Web Dashboard  |  Mobile App  |  Chat Integration   │
├─────────────────────────────────────────────────────────────┤
│                    TACIT AGENT                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agent Core                                          │   │
│  │  ├─ Identity Manager (DID, keys, personas)           │   │
│  │  ├─ Intent Manager (publish, withdraw, track)        │   │
│  │  ├─ Match Engine (score, threshold, decide)          │   │
│  │  ├─ Proposal Handler (create, respond, negotiate)    │   │
│  │  ├─ Authenticity Engine (compute, update, verify)    │   │
│  │  └─ Event Bus (internal pub/sub)                     │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    TRANSPORT                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  DIDComm v2 Client                                   │   │
│  │  ├─ Message Encryption (XChaCha20-Poly1305)          │   │
│  │  ├─ Message Signing (Ed25519)                        │   │
│  │  ├─ Relay Connection (WebSocket)                     │   │
│  │  └─ Offline Queue (message persistence)              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    STORAGE (Local)                            │
│  Identity keys | Agent Card | Intents | Proposals | Creds   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Publishing an Intent

```
Human                Agent Core              Transport            Relay Node
  │                      │                      │                     │
  │  "Find me a          │                      │                     │
  │   co-founder"        │                      │                     │
  │─────────────────────>│                      │                     │
  │                      │                      │                     │
  │                      │  Create Intent        │                     │
  │                      │  Sign with DID key    │                     │
  │                      │                      │                     │
  │                      │  Encrypt (DIDComm)    │                     │
  │                      │─────────────────────>│                     │
  │                      │                      │                     │
  │                      │                      │  Forward to relay    │
  │                      │                      │────────────────────>│
  │                      │                      │                     │
  │                      │                      │  Index for discovery │
  │                      │                      │  (encrypted metadata)│
  │                      │                      │                     │
  │  "Intent published"  │                      │                     │
  │<─────────────────────│                      │                     │
```

### Receiving a Match

```
Relay Node           Transport              Agent Core              Human
  │                      │                      │                     │
  │  Match notification  │                      │                     │
  │─────────────────────>│                      │                     │
  │                      │                      │                     │
  │                      │  Decrypt (DIDComm)   │                     │
  │                      │─────────────────────>│                     │
  │                      │                      │                     │
  │                      │                      │  Evaluate match      │
  │                      │                      │  Check authenticity  │
  │                      │                      │  Score compatibility │
  │                      │                      │                     │
  │                      │                      │  Score >= 80?        │
  │                      │                      │  → Auto-propose      │
  │                      │                      │                     │
  │                      │                      │  Score 60-79?        │
  │                      │                      │  → Notify human      │
  │                      │                      │─────────────────────>│
  │                      │                      │                     │
  │                      │                      │                     │  "Approve"
  │                      │                      │<────────────────────│
```

## Package Structure

```
@tacitprotocol/sdk                    # Main SDK package
├── core/agent.ts             # TacitAgent class — primary API
├── types/index.ts            # All TypeScript type definitions
├── identity/
│   ├── did.ts                # DID creation, resolution, signing
│   └── authenticity.ts       # Authenticity vector computation
├── discovery/
│   └── intent.ts             # Intent creation, storage, querying
├── matching/
│   └── scorer.ts             # Match scoring engine
├── transport/                # (Coming: DIDComm v2 transport)
│   ├── didcomm.ts            # DIDComm message formatting
│   ├── relay.ts              # Relay node WebSocket client
│   └── encryption.ts         # E2E encryption utilities
└── utils/                    # Shared utilities
```

## Key Design Decisions

### Why DIDComm v2 (not HTTP/REST)?

- E2E encryption is built into the protocol, not bolted on
- Transport-agnostic (works over WebSocket, HTTP, Bluetooth)
- DID-native authentication — no separate auth layer needed
- Supports offline delivery via relay nodes

### Why W3C DIDs (not OAuth/JWT)?

- Self-sovereign: the agent controls its own identity
- Portable: identity works across any relay or application
- Verifiable: public keys are embedded in the DID
- No central authority needed to issue or revoke identity

### Why Local-First Storage?

- Core human identity never leaves the device
- Agent keys stored locally (ideally in secure enclave)
- No central database to breach
- Selective disclosure: share only what you choose

### Why Event-Driven Architecture?

- Agents operate asynchronously — matches arrive at unpredictable times
- Events allow human-in-the-loop at critical decision points
- Extensible: new event types can be added without changing core
- Natural fit for real-time agent communication

## Security Architecture

### Encryption Layers

```
Layer 1: Transport encryption (TLS for WebSocket)
Layer 2: DIDComm v2 message encryption (XChaCha20-Poly1305)
Layer 3: Intent-level encryption (filtered/private intents)
```

Relay nodes only see Layer 1 + encrypted Layer 2 blobs. They cannot read message contents or metadata beyond what's needed for routing.

### Key Hierarchy

```
Agent Master Key (Ed25519)
├── DID Key (identity + signing)
├── Encryption Key (DIDComm message encryption)
├── Session Keys (per-introduction ephemeral keys)
└── Recovery Key (pre-registered for key rotation)
```

### Rate Limiting Model

Rate limits are enforced at the relay level, not the agent level. This means:

- Agents cannot bypass rate limits by connecting to a different relay
- Relays share rate limit state (or agents' authenticity level is verifiable)
- New agents (low authenticity) have strict limits
- Established agents earn higher limits through demonstrated behavior
