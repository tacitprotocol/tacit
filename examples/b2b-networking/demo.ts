/**
 * Tacit Protocol — B2B Professional Networking Demo
 *
 * Demonstrates agent-negotiated business introductions:
 * A startup founder's tacit discovers a bank's innovation team tacit,
 * verifies mutual fit, and brokers a pre-qualified meeting.
 *
 * Run: npx tsx examples/b2b-networking/demo.ts
 */

import { TacitAgent, IntentBuilder, MatchScorer } from '@tacitprotocol/sdk';

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Tacit Protocol — B2B Networking Demo             ║');
  console.log('║  Replacing cold outreach with agent-brokered intros║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();

  // ── Create Agents ────────────────────────────────────────────

  console.log('Creating Tacit agents for both parties...\n');

  // Startup founder looking for enterprise customers
  const founder = new TacitAgent({
    identity: await TacitAgent.createIdentity(),
    profile: {
      name: 'Acme Payments — Founder Tacit',
      description: 'Next-gen payments infrastructure for enterprise banking',
      domain: 'professional',
      seeking: 'Enterprise banking customers evaluating payment infrastructure',
      offering: 'Real-time payment processing, 99.99% uptime, SOC2 compliant',
    },
  });

  // Bank innovation team evaluating vendors
  const banker = new TacitAgent({
    identity: await TacitAgent.createIdentity(),
    profile: {
      name: 'Global Bank — Innovation Team Tacit',
      description: 'Banking innovation team evaluating new payment tech',
      domain: 'professional',
      seeking: 'Payment infrastructure vendors with real-time processing',
      offering: 'Enterprise partnership, $500K-2M annual contracts, pilot program',
    },
  });

  console.log('  Startup Founder Tacit:  Active');
  console.log('  Bank Innovation Tacit:  Active');
  console.log();

  // ── Publish Intents ──────────────────────────────────────────

  console.log('Publishing intents to the network...\n');

  const founderIntent = await founder.publishIntent({
    type: 'introduction',
    domain: 'professional',
    seeking: {
      relationship: 'enterprise-customer',
      industry: 'banking',
      interest: ['payment-infrastructure', 'real-time-payments', 'api-first'],
      decisionMaker: true,
      budgetRange: '$500K+',
    },
    context: {
      description: 'Series A payments startup seeking enterprise design partners in banking',
      stage: 'series-a',
      urgency: 'active',
      team_size: 25,
      customers: '5 mid-market banks',
    },
    filters: {
      minAuthenticityScore: 60,
      requiredCredentials: ['EmploymentCredential'],
    },
  });

  const bankerIntent = await banker.publishIntent({
    type: 'introduction',
    domain: 'professional',
    seeking: {
      relationship: 'vendor-evaluation',
      category: 'payment-infrastructure',
      requirements: ['real-time', 'api-first', 'soc2-compliant', 'scalable'],
      timeline: 'q2-2026-pilot',
    },
    context: {
      description: 'Evaluating next-gen payment infrastructure for modernization initiative',
      urgency: 'active',
      budget: 'approved',
      processStage: 'vendor-shortlisting',
    },
    filters: {
      minAuthenticityScore: 50,
    },
  });

  console.log('  Founder: "Seeking enterprise banking customers for payments infra"');
  console.log('  Banker:  "Evaluating payment infrastructure vendors for Q2 pilot"');
  console.log();

  // ── Discovery & Scoring ──────────────────────────────────────

  console.log('Agents discovering each other on the network...\n');

  const scorer = new MatchScorer({ autoPropose: 75, suggest: 55 });
  const match = scorer.score({
    initiator: { intent: founderIntent, card: founder.getAgentCard() },
    responder: { intent: bankerIntent, card: banker.getAgentCard() },
  });

  console.log('  Match Analysis:');
  console.log(`  ┌─ Overall Score:        ${match.score.overall}/100`);
  console.log(`  ├─ Intent Alignment:     ${(match.score.breakdown.intentAlignment * 100).toFixed(0)}%  ← Both seeking payment infra partnership`);
  console.log(`  ├─ Domain Fit:           ${(match.score.breakdown.domainFit * 100).toFixed(0)}%  ← Same professional domain`);
  console.log(`  ├─ Trust Compatibility:  ${(match.score.breakdown.authenticityCompatibility * 100).toFixed(0)}%  ← Both meet minimum thresholds`);
  console.log(`  ├─ Preference Match:     ${(match.score.breakdown.preferenceMatch * 100).toFixed(0)}%  ← Compatible communication styles`);
  console.log(`  └─ Timing Fit:           ${(match.score.breakdown.timingFit * 100).toFixed(0)}%  ← Both actively searching now`);
  console.log();

  const action = scorer.determineAction(match.score.overall);
  console.log(`  Decision: ${action.toUpperCase()}`);
  console.log();

  // ── Introduction Flow ────────────────────────────────────────

  if (action !== 'ignore') {
    console.log('Negotiating introduction...\n');

    const proposal = await founder.proposeIntro(match);

    console.log('  Intro Proposal:');
    console.log(`  ├─ From: ${proposal.initiator.persona.displayName}`);
    console.log(`  ├─ Score: ${proposal.match.score}/100`);
    console.log(`  ├─ Context: ${proposal.match.rationale}`);
    console.log(`  └─ Reveal: ${proposal.terms.initialReveal} → progressive`);
    console.log();

    // ── Double Opt-In ──────────────────────────────────────

    console.log('Double opt-in consent...\n');

    console.log('  [Startup Founder receives notification]');
    console.log('  "Your Tacit agent found a bank innovation team evaluating payment infra."');
    console.log('  "Match score: 84/100. Approve introduction?"');
    console.log('  Founder → APPROVED');
    console.log();

    console.log('  [Bank Innovation Lead receives notification]');
    console.log('  "Your Tacit agent found a payments startup matching your evaluation criteria."');
    console.log('  "Match score: 84/100. Approve introduction?"');
    console.log('  Banker → APPROVED');
    console.log();

    console.log('══════════════════════════════════════════════════');
    console.log();
    console.log('  INTRODUCTION CONFIRMED');
    console.log();
    console.log('  Progressive Context Reveal:');
    console.log('  ─────────────────────────────────────────────');
    console.log('  Stage 1 (now):    Domain context shared');
    console.log('    Founder sees:   "Bank innovation team, payment modernization, Q2 pilot"');
    console.log('    Banker sees:    "Series A payments startup, 5 bank customers, SOC2"');
    console.log();
    console.log('  Stage 2 (approval): Company backgrounds shared');
    console.log('    Founder sees:   Bank name, team size, specific requirements');
    console.log('    Banker sees:    Company name, tech stack, customer references');
    console.log();
    console.log('  Stage 3 (approval): Full identity shared');
    console.log('    Both see:       Names, titles, LinkedIn profiles, email');
    console.log();
    console.log('  Stage 4 (approval): Direct contact');
    console.log('    Both:           Schedule a call directly');
    console.log('  ─────────────────────────────────────────────');
    console.log();
    console.log('  Result: A pre-qualified meeting between a startup');
    console.log('  and an enterprise buyer — without a single cold email.');
    console.log();
    console.log('══════════════════════════════════════════════════');
  }
}

main().catch(console.error);
