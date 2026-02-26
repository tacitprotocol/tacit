# TACIT Protocol — Average Joe Onboarding Flow

**Goal:** Make minting a cryptographic digital identity as easy as signing up for Gmail.

---

## The Problem We're Solving For Regular People

People hate:
- Creating and managing passwords (avg person has 100+ accounts)
- Multi-factor authentication (friction for the user, not the attacker)
- Getting breached (data leaked even after doing everything "right")
- Having no control over their identity data

People want:
- Sign in once, trusted everywhere
- No passwords to remember or reset
- Their data NOT stored on someone else's server
- Proof they are who they say they are (anti-catfish, anti-fraud)

---

## Onboarding Flow (5 Steps, Under 3 Minutes)

### Step 1: Download the TACIT App (or visit web app)
- **URL:** app.tacitprotocol.com (PWA — works on any device, no app store)
- **Tagline on landing:** "Your identity, your keys. No passwords. No breaches. Ever."
- **Single CTA:** "Create Your Digital Identity"

### Step 2: Connect Your Existing Accounts (OAuth — 30 seconds)
- "Prove you're real by connecting accounts you already have"
- One-click OAuth connections:
  - **Google** (Gmail, YouTube — proves email ownership + activity history)
  - **LinkedIn** (proves professional identity + employment history)
  - **GitHub** (proves developer identity + contribution history)
  - **X / Twitter** (proves social presence + account age)
  - **Apple ID** (proves device ownership)
- **Minimum:** Connect at least 2 accounts to mint
- **Each connection adds to your Authenticity Score**
- User sees a live "Trust Score" meter filling up as they connect accounts
- NO passwords collected — OAuth tokens only, stored locally on device

### Step 3: Generate Your Key Pair (Automatic — 2 seconds)
- Behind the scenes: Ed25519 key pair generated on-device
- **User sees:** "Your cryptographic identity is being created..."
- **Animation:** A digital fingerprint forming from their connected accounts
- **Private key:** Stored in device secure enclave (iOS Keychain / Android Keystore / WebAuthn)
- **Public key:** Published to the TACIT network
- **W3C DID created:** `did:tacit:abc123...`
- User NEVER sees or manages keys directly — it's abstracted away

### Step 4: Mint Your Identity Token (10 seconds)
- "Your identity is now cryptographically verifiable"
- **Verifiable Credentials minted:**
  - "Account holder since [earliest connected account date]"
  - "Verified across [N] platforms"
  - "Authenticity Score: [X]/100"
- **User sees:** A clean identity card with:
  - Their chosen display name
  - Authenticity score (like a credit score for identity)
  - Number of verified platforms
  - Account tenure (how long they've been online)
  - A QR code for sharing their verified identity
- **No blockchain required** — credentials are signed with their key pair and verifiable by anyone

### Step 5: Share Your Verified Identity (Ongoing)
- "Use your TACIT identity anywhere"
- **Share options:**
  - QR code (in-person verification)
  - Link (tacit.id/yourname)
  - Browser extension (auto-fill verified identity on supported sites)
  - API (for apps that integrate TACIT)
- **Use cases shown:**
  - "Prove you're real on dating apps"
  - "Skip KYC with verified identity"
  - "Show employers your verified background"
  - "Prove your age without showing your ID"
  - "Verify your identity to AI agents"

---

## Trust Score Breakdown (What Users See)

```
┌─────────────────────────────────────────┐
│         YOUR TACIT IDENTITY             │
│                                         │
│   Display Name: John D.                │
│   Authenticity Score: 78/100            │
│                                         │
│   ✓ Google    — verified (8 years)      │
│   ✓ LinkedIn  — verified (5 years)      │
│   ✓ GitHub    — verified (3 years)      │
│   ✓ X/Twitter — verified (6 years)      │
│                                         │
│   Tenure: 8 years online                │
│   Platforms: 4 verified                 │
│   Consistency: High                     │
│   Network Trust: 3 attestations         │
│                                         │
│   [Share Identity]  [View Credentials]  │
│                                         │
│   🔏 Cryptographically verified         │
│   Keys stored on YOUR device only       │
└─────────────────────────────────────────┘
```

---

## Authenticity Score Components

| Vector | Weight | How It's Calculated |
|--------|--------|-------------------|
| **Tenure** | 30% | Age of oldest connected account. 10+ years = max score |
| **Consistency** | 25% | Same name/info across platforms. Contradictions lower score |
| **Platform Count** | 20% | More independently verified platforms = higher trust |
| **Network Trust** | 15% | Attestations from other verified TACIT users |
| **Activity** | 10% | Active accounts (not dormant/abandoned) score higher |

---

## Key UX Principles

1. **Zero crypto knowledge required** — No wallets, no seed phrases, no gas fees
2. **No passwords ever** — Passkey/biometric login only (Face ID, fingerprint, WebAuthn)
3. **Progressive disclosure** — Show simple score first, technical details on demand
4. **Privacy by default** — Share only what you choose, when you choose
5. **Works without blockchain** — Verifiable Credentials are portable, signed JSON-LD
6. **Mobile-first** — PWA that works on any phone, no app store gatekeeping

---

## The "Exclusive Network" Concept

Once users have minted their TACIT identity, they can join the **TACIT Network** — an exclusive social layer where:

### Entry Requirement
- Must have a verified TACIT identity with score >= 50
- This automatically filters out bots, fake accounts, and low-effort impersonators

### What Makes It Exclusive
- **Every person is verified** — no catfishing, no fake profiles, no scammers
- **Trust scores are visible** — you can see how trustworthy someone is before engaging
- **Introductions are earned** — your agent finds compatible connections based on shared intent
- **Progressive reveal** — you control what information is shared and when
- **Double opt-in** — both parties must agree before any introduction happens

### Features
1. **Verified Networking** — LinkedIn but everyone is actually verified
2. **Trust-Based Dating** — Meet real people with real verified backgrounds
3. **Secure Commerce** — Buy/sell with verified counterparties
4. **Agent-Brokered Intros** — Your AI agent finds and negotiates connections for you
5. **Reputation Portability** — Take your trust score anywhere on the internet

### Growth Mechanics
- **Invite-only initially** — Early adopters get TACIT Pioneer status
- **Attestation incentives** — Verify other users, grow the trust network
- **Score compounds** — The longer you're on the network, the more valuable your identity becomes
- **Cross-platform badges** — Show your TACIT verification on other platforms

---

## Technical Architecture (Simplified)

```
User's Device (keys never leave)
    │
    ├── TACIT App (PWA)
    │   ├── Key generation (Ed25519)
    │   ├── OAuth connectors
    │   ├── Credential management
    │   └── Agent interface
    │
    ├── Secure Storage
    │   ├── Private key (device enclave)
    │   ├── Verifiable Credentials (local)
    │   └── Agent Card (local + published)
    │
    └── TACIT Network (relay)
        ├── Public agent cards
        ├── Encrypted intent broadcasts
        ├── Match proposals
        └── Intro negotiations
```

---

## MVP Scope (What to Build First)

### Phase 1: Identity Minting (Week 1-2)
- [ ] Web app at app.tacitprotocol.com
- [ ] Google OAuth + LinkedIn OAuth integration
- [ ] Ed25519 key pair generation (in-browser)
- [ ] W3C DID creation (did:key method)
- [ ] Basic Verifiable Credential minting
- [ ] Authenticity score calculation (tenure + platform count)
- [ ] Identity card display with QR code
- [ ] Shareable profile page (tacit.id/username)

### Phase 2: Verification + Sharing (Week 3-4)
- [ ] Additional OAuth providers (GitHub, X, Apple)
- [ ] Consistency checking across platforms
- [ ] Browser extension for identity sharing
- [ ] Passkey/WebAuthn login (no passwords)
- [ ] Mobile-optimized PWA
- [ ] QR code verification flow

### Phase 3: Social Network (Week 5-8)
- [ ] TACIT Network feed (verified users only)
- [ ] Intent broadcasting (what are you looking for?)
- [ ] Agent-based matching
- [ ] Intro proposals with double opt-in
- [ ] Progressive context reveal
- [ ] Attestation system (verify other users)

---

## Messaging for Launch

**Hero:** "Verify once. Trusted everywhere. No passwords. No breaches. Just a key pair that proves you are you."

**For regular people:** "Stop creating passwords. Stop getting breached. Your identity should be yours — cryptographic, portable, and unforgeable."

**For developers:** "npm install @tacitprotocol/sdk — Add verified identity to your app in 10 lines of code."

**For enterprises:** "Eliminate credential fraud. Reduce KYC costs. Ship trust infrastructure that compounds over time."
