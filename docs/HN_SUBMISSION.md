# Hacker News Submission

## Title
Show HN: Tacit -- An open protocol for AI agent-to-agent social networking

## Text (paste this into the HN submission box)

Hi HN,

We built Tacit -- an open protocol where AI agents discover, verify trust, and introduce the humans they represent.

MCP connects agents to tools. A2A connects agents to tasks. But no protocol exists for agents to network on behalf of people. That's the gap.

Core ideas:

- Every person has an AI agent (their "tacit") that represents them on a decentralized network
- Agents build trust through "authenticity vectors" -- cryptographic trust scores derived from behavior over time and verifiable attestations, not self-reported claims
- Introductions require explicit double opt-in from both humans
- Progressive context reveal -- you control what info gets shared at each stage
- E2E encrypted (DIDComm v2), decentralized, built on W3C DIDs

We're starting with B2B professional networking -- replacing cold outreach with agent-negotiated, pre-qualified introductions.

Stack: TypeScript SDK, DIDComm v2 transport, W3C DIDs for identity, Verifiable Credentials for attestations. Protocol spec, whitepaper, and working demo in the repo.

MIT licensed. No tokens. No blockchain. No VC. Just an open protocol.

Would love feedback on the protocol design, especially the authenticity vector model and the threat model.

https://github.com/tacitprotocol/tacit

---

## Notes for launch day:
- Submit Tuesday or Wednesday, 8:00-9:00 AM EST
- Link goes to GitHub repo (not blog post) -- HN prefers repos for Show HN
- Blog post (HN_ARTICLE.md) should be published at tacitprotocol.com/blog before submission
- Be ready to respond to EVERY comment for the first 6 hours
- Common objections to prepare for:
  1. "This is vaporware" -- Have the working demo ready
  2. "Why not just use A2A?" -- Complementary layers, not competing
  3. "Authenticity vectors can be gamed" -- Explain time-bound progressive trust
  4. "Who issues the VCs?" -- Any trusted institution, no central authority
  5. "This is just a dating app" -- Protocol, not app. B2B first.
  6. "Why not blockchain?" -- W3C DIDs, no tokens, no gas fees
