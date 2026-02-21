# Tacit Protocol — Launch Strategy

**Confidential — Internal Planning Document**
**Date: 2026-02-20**

---

## Goal

Make Tacit the most talked-about open-source protocol launch of Q1-Q2 2026. Target: 5,000+ GitHub stars in the first week, front-page Hacker News, trending on X/Twitter.

---

## Launch Playbook

### Pre-Launch (Week -2 to -1)

**Preparation checklist:**

- [ ] GitHub repo live with polished README, protocol spec, SDK, whitepaper
- [ ] Demo video recorded (30-second agent-to-agent introduction)
- [ ] Blog post finalized
- [ ] Social accounts created:
  - [ ] GitHub org: `tacitprotocol`
  - [ ] X/Twitter: `@tacitprotocol`
  - [ ] Discord server set up
  - [ ] Email: tacitprotocol@proton.me
- [ ] Domain registered (tacitprotocol.dev or similar)
- [ ] 10-15 AI influencers pre-briefed with embargoed access
- [ ] README tested with 3-5 developers for "time to understanding"
- [ ] `npx create-tacit-agent` works end-to-end

**Pre-briefing targets:**

| Person/Account | Platform | Why | Approach |
|---|---|---|---|
| @swyx (Shawn Wang) | X/Twitter | AI developer influencer, community builder | DM with demo video |
| @simonw (Simon Willison) | X/Blog | AI + open-source, huge HN following | Email with blog post draft |
| @alexalbert__ | X | Anthropic community, MCP ecosystem | DM positioning as MCP companion |
| @labordepierre | X | A2A ecosystem, Google DevRel | DM positioning as A2A companion |
| @levelsio | X | Indie maker influencer, 1M+ followers | DM with "built this in 4 weeks" angle |
| The Neuron newsletter | Email | AI newsletter, 250K+ subscribers | Press pitch |
| Ben's Bites newsletter | Email | AI newsletter, major reach | Press pitch |
| ThursdAI podcast | Podcast | Weekly AI show, HN-adjacent audience | Pitch for episode |
| AI Explained (YouTube) | YouTube | Large AI tech channel | DM with demo video |

### Launch Day (D-Day)

**Timing:** Tuesday or Wednesday, 8:00-9:00 AM EST

This timing is optimal because:
- HN front page traffic peaks Tuesday-Thursday
- US East Coast morning catches both US and European working hours
- Avoid Monday (backlog), Friday (checkout), weekends (lower traffic)

**Sequence (all within 60 minutes):**

1. **08:00 EST** — GitHub repo goes public
2. **08:05 EST** — Blog post published
3. **08:10 EST** — "Show HN" post on Hacker News
   - Title: `Show HN: Tacit – The social protocol for AI agents (open source)`
   - Text: Short, factual, no hype. What it does, why, link to repo.
4. **08:15 EST** — X/Twitter thread posted (NO external links in thread)
5. **08:20 EST** — Reddit posts:
   - r/MachineLearning (Discussion flair)
   - r/artificial
   - r/programming
   - r/opensource
6. **08:30 EST** — Embargoes lift — pre-briefed influencers can post
7. **08:30 EST** — Discord server opens

---

## Content Pieces

### Hacker News Post

**Title:** `Show HN: Tacit – The social protocol for AI agents (open source)`

**Text:**
```
Hi HN,

We built Tacit — an open protocol where AI agents discover, trust, and
introduce the humans they represent.

MCP connects agents to tools. A2A connects agents to tasks. But no protocol
exists for agents to network on behalf of people. That's the gap Tacit fills.

Core ideas:
- Every person has an AI agent (their "tacit") that represents them
- Agents build trust through "authenticity vectors" — cryptographic trust
  scores derived from behavior and attestations, not self-reported claims
- Introductions require double opt-in from both humans
- E2E encrypted, decentralized, built on W3C DIDs + DIDComm v2

We're starting with B2B professional networking — replacing cold outreach
with agent-negotiated, pre-qualified introductions.

Stack: TypeScript SDK, DIDComm v2 transport, W3C DIDs for identity.
Protocol spec, whitepaper, and working demo in the repo.

MIT licensed. Would love feedback on the protocol design.

https://github.com/tacitprotocol/tacit
```

### X/Twitter Thread (No Links)

**Thread structure (8-10 tweets):**

Tweet 1 (Hook):
```
There are 3 layers to the AI agent stack.

You probably know 2 of them.

The third one doesn't exist yet.

Until today.
```

Tweet 2:
```
Layer 1: MCP (Anthropic)
→ How agents talk to tools

Layer 2: A2A (Google)
→ How agents delegate tasks

Layer 3: ???
→ How agents connect PEOPLE

That's the gap. No protocol exists for AI agents to discover other
people's agents, verify trust, and broker introductions.
```

Tweet 3:
```
We built it. It's called Tacit.

Your AI agent — your Tacit agent — represents you on a decentralized network.

It discovers other agents, evaluates compatibility, verifies trust
through cryptographic proof, and negotiates introductions.

Both humans must approve. Double opt-in.
```

Tweet 4:
```
The key innovation: Authenticity Vectors.

Your Tacit agent doesn't ask you to describe yourself.
Instead, it builds a trust score from:

• Time on network (can't fake overnight)
• Behavioral consistency (scammers change stories)
• Verified credentials (prove it, don't claim it)
• Network quality (who trusts you matters)

Catfishing? Impossible.
```

Tweet 5:
```
How it actually works:

Alice's tacit: "She needs a co-founder in fintech"
Bob's Tacit agent: "He's ex-Stripe, seeking co-founder roles"

Agents match. Score: 84/100.

Alice: "Yes, introduce us"
Bob: "Yes, introduce us"

Done. No cold email. No swipe. No spam.
```

Tweet 6:
```
Why now:

• $7B → $199B agentic AI market
• MCP, A2A, DIDs all production-ready
• EU mandating digital identity wallets
• LinkedIn is 90% spam
• Dating apps can't solve catfishing
• The window is 12-18 months

Nobody has built this. The field is wide open.
```

Tweet 7:
```
Tacit is a PROTOCOL, not an app.

Open-source. MIT licensed. Decentralized.

Like email works because SMTP is open,
Tacit works because anyone can build on it.

TypeScript SDK, protocol spec, whitepaper,
and working demo — all in the repo.
```

Tweet 8 (CTA):
```
We're starting with B2B professional networking
and expanding to dating, local services, and more.

Looking for:
• Developers to build on the protocol
• Researchers in trust systems + multi-agent systems
• Early adopters to run real introductions

Link in bio. Let's build the social layer of the agent era.
```

### Reddit Post (r/MachineLearning)

**Title:** `[P] Tacit: An open protocol for AI agent-to-agent social networking — the missing Layer 3 of the agent stack`

**Body:** Condensed version of the blog post, focusing on the technical architecture and authenticity vector innovation. Include link to repo and protocol spec.

---

## Post-Launch (Week 1-4)

### Week 1: Ride the Wave

- Respond to EVERY GitHub issue and Hacker News comment
- Ship 2-3 quick fixes/improvements based on community feedback
- Write a follow-up blog post addressing common questions
- Track metrics: GitHub stars, forks, npm downloads, Discord members

### Week 2: Developer Content

- Publish tutorial: "Build your first Tacit agent in 5 minutes"
- Publish deep dive: "How authenticity vectors prevent catfishing"
- Start weekly "Tacit Build Log" updates on X

### Week 3-4: Community Building

- Host first community call (Discord/YouTube live)
- Announce first hackathon ($5K-10K in prizes)
- Publish "Tacit Enhancement Proposals" (EEPs) process
- Start conversations with AAIF about standardization path

---

## Metrics to Track

| Metric | Week 1 Target | Month 1 Target |
|--------|--------------|----------------|
| GitHub Stars | 5,000 | 15,000 |
| npm downloads | 500 | 2,000 |
| Discord members | 200 | 1,000 |
| Contributors | 10 | 50 |
| Blog post views | 50,000 | 200,000 |
| HN front page | Yes | — |
| Press mentions | 3 | 10 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| HN doesn't pick it up | Pre-seed with 3-5 upvotes from real accounts (friends/advisors). Have Reddit as backup. |
| "Vaporware" criticism | Ship working demo. The demo IS the counter-argument. |
| "This is just a dating app" pushback | Lead with B2B professional networking. Dating is a later vertical. |
| "Why not just use A2A?" questions | Prepare clear differentiation: A2A = task delegation, Tacit = social discovery. Complementary, not competing. |
| Big Tech announces something similar | First-mover advantage. Open protocol is hard to "embrace and extend." Position as the standard. |
| Security concerns | Publish threat model openly. Invite security audits. Transparency is the defense. |

---

## Budget Estimate

| Item | Cost |
|------|------|
| Domain (tacitprotocol.dev) | $12/year |
| Discord server (Nitro boost) | Free to start |
| Email (Proton Mail) | Free |
| Demo video production | $0 (screen recording) |
| Hackathon prizes | $5,000-10,000 |
| Total launch cost | < $100 (excluding hackathon) |

This is a zero-budget launch. The product is the marketing.
