/**
 * Tacit Protocol — Basic Introduction Demo
 *
 * This example demonstrates the core magic of Tacit:
 * Two AI agents discover each other and negotiate an introduction
 * between the humans they represent.
 *
 * Run: npx tsx examples/basic-intro/demo.ts
 */

import { TacitAgent, IntentBuilder, MatchScorer } from '@tacitprotocol/sdk';

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     Tacit Protocol — Introduction Demo       ║');
  console.log('║     The Social Layer for the Agent Era        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  // ── Step 1: Create two agents ────────────────────────────────

  console.log('🔑 Creating agent identities...\n');

  const alice = new TacitAgent({
    identity: await TacitAgent.createIdentity(),
    profile: {
      name: "Alice's Tacit",
      description: 'Fintech founder seeking technical co-founder',
      domain: 'professional',
      seeking: 'CTO / technical co-founder with backend expertise in payments',
      offering: 'Product leadership, 10 years in fintech, $500K pre-seed secured',
    },
  });

  const bob = new TacitAgent({
    identity: await TacitAgent.createIdentity(),
    profile: {
      name: "Bob's Tacit",
      description: 'Senior engineer exploring co-founder opportunities',
      domain: 'professional',
      seeking: 'Co-founder role at early-stage fintech startup',
      offering: 'Staff engineer, 8 years distributed systems, ex-Stripe',
    },
  });

  console.log(`  Alice's Agent: ${alice.getDid().slice(0, 30)}...`);
  console.log(`  Bob's Agent:   ${bob.getDid().slice(0, 30)}...`);
  console.log();

  // ── Step 2: Publish intents ──────────────────────────────────

  console.log('📡 Publishing intents to the network...\n');

  const aliceIntent = await alice.publishIntent({
    type: 'introduction',
    domain: 'professional',
    seeking: {
      role: 'co-founder',
      skills: ['backend', 'distributed-systems', 'payments'],
      experienceYears: 5,
      industry: 'fintech',
    },
    context: {
      description: 'Building next-gen payments infrastructure',
      stage: 'pre-seed',
      urgency: 'active',
      commitment: 'full-time',
    },
    filters: { minAuthenticityScore: 40 },
  });

  const bobIntent = await bob.publishIntent({
    type: 'introduction',
    domain: 'professional',
    seeking: {
      role: 'co-founder',
      type: 'product-leader',
      industry: ['fintech', 'payments', 'banking'],
      stage: ['pre-seed', 'seed'],
    },
    context: {
      description: 'Looking to join an early-stage fintech as technical co-founder',
      urgency: 'active',
      commitment: 'full-time',
    },
    filters: { minAuthenticityScore: 40 },
  });

  console.log(`  Alice's Intent: "${aliceIntent.intent.context.description}"`);
  console.log(`  Bob's Intent:   "${bobIntent.intent.context.description}"`);
  console.log();

  // ── Step 3: Discovery & Scoring ──────────────────────────────

  console.log('🔍 Agents discovering each other...\n');

  const scorer = new MatchScorer();
  const match = scorer.score({
    initiator: { intent: aliceIntent, card: alice.getAgentCard() },
    responder: { intent: bobIntent, card: bob.getAgentCard() },
  });

  console.log(`  Match Score: ${match.score.overall}/100`);
  console.log(`  ├─ Intent Alignment:    ${(match.score.breakdown.intentAlignment * 100).toFixed(0)}%`);
  console.log(`  ├─ Domain Fit:          ${(match.score.breakdown.domainFit * 100).toFixed(0)}%`);
  console.log(`  ├─ Trust Compatibility: ${(match.score.breakdown.authenticityCompatibility * 100).toFixed(0)}%`);
  console.log(`  ├─ Preference Match:    ${(match.score.breakdown.preferenceMatch * 100).toFixed(0)}%`);
  console.log(`  └─ Timing Fit:          ${(match.score.breakdown.timingFit * 100).toFixed(0)}%`);
  console.log();

  const action = scorer.determineAction(match.score.overall);
  console.log(`  Action: ${action.toUpperCase()}`);
  console.log();

  // ── Step 4: Introduction Proposal ────────────────────────────

  if (action === 'auto-propose' || action === 'suggest') {
    console.log('🤝 Agents negotiating introduction...\n');

    const proposal = await alice.proposeIntro(match);

    console.log(`  Proposal ID: ${proposal.id.slice(0, 30)}...`);
    console.log(`  From: ${proposal.initiator.persona.displayName}`);
    console.log(`  Match Score: ${proposal.match.score}/100`);
    console.log(`  Rationale: ${proposal.match.rationale}`);
    console.log(`  Initial Reveal: ${proposal.terms.initialReveal}`);
    console.log(`  Status: ${proposal.status}`);
    console.log();

    // ── Step 5: Double Opt-In ────────────────────────────────

    console.log('✅ Simulating double opt-in...\n');

    // Alice approves (her agent auto-approved based on match score)
    console.log('  Alice → "Yes, I want to meet this person"');
    await alice.acceptProposal(proposal.id);

    // Bob reviews and approves
    console.log('  Bob   → "Yes, I want to meet this person"');
    // In production, Bob's agent would receive this proposal via the relay
    // and present it to Bob for approval

    console.log();
    console.log('═══════════════════════════════════════════════');
    console.log();
    console.log('  ✨ INTRODUCTION CONFIRMED');
    console.log();
    console.log('  Both parties have opted in.');
    console.log('  Progressive context reveal begins:');
    console.log('    Stage 1: Domain context (fintech, co-founder search)');
    console.log('    Stage 2: Professional background (on approval)');
    console.log('    Stage 3: Identity reveal (on approval)');
    console.log('    Stage 4: Direct contact (on approval)');
    console.log();
    console.log('  No spam. No catfishing. No cold outreach.');
    console.log('  Just a high-signal, verified introduction.');
    console.log();
    console.log('═══════════════════════════════════════════════');
  }

  console.log();
  console.log('Learn more: https://github.com/tacitprotocol/tacit');
}

main().catch(console.error);
