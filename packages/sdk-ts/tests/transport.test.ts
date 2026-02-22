/**
 * Tests for message signing, verification, and intent signing.
 */

import { describe, it, expect } from 'vitest';
import { createIdentity } from '../src/identity/did.js';
import {
  createSignedMessage,
  verifyMessage,
  isMessageExpired,
  signIntent,
  verifyIntent,
  signProposal,
} from '../src/transport/message.js';
import { IntentBuilder } from '../src/discovery/intent.js';

describe('Message Signing', () => {
  it('should create and verify a signed message', async () => {
    const identity = await createIdentity();

    const envelope = await createSignedMessage(
      identity,
      'ping',
      { ts: Date.now() },
    );

    expect(envelope.version).toBe('0.1.0');
    expect(envelope.type).toBe('ping');
    expect(envelope.from).toBe(identity.did);
    expect(envelope.signature).toBeTruthy();
    expect(envelope.signature.length).toBeGreaterThan(0);

    const valid = await verifyMessage(envelope);
    expect(valid).toBe(true);
  });

  it('should reject a tampered message', async () => {
    const identity = await createIdentity();

    const envelope = await createSignedMessage(
      identity,
      'ping',
      { ts: Date.now() },
    );

    // Tamper with the payload
    (envelope.payload as any).ts = 999;

    const valid = await verifyMessage(envelope);
    expect(valid).toBe(false);
  });

  it('should reject a message from a spoofed sender', async () => {
    const alice = await createIdentity();
    const bob = await createIdentity();

    const envelope = await createSignedMessage(
      alice,
      'ping',
      { ts: Date.now() },
    );

    // Spoof the sender
    envelope.from = bob.did;

    const valid = await verifyMessage(envelope);
    expect(valid).toBe(false);
  });

  it('should correctly detect expired messages', async () => {
    const identity = await createIdentity();

    const envelope = await createSignedMessage(
      identity,
      'ping',
      { ts: Date.now() },
    );

    // Fresh message should not be expired
    expect(isMessageExpired(envelope)).toBe(false);

    // Set timestamp to 10 minutes ago
    const old = { ...envelope, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() };
    expect(isMessageExpired(old as any)).toBe(true);
  });
});

describe('Intent Signing', () => {
  it('should sign and verify an intent', async () => {
    const identity = await createIdentity();

    const intent = new IntentBuilder(identity.did)
      .type('introduction')
      .domain('professional')
      .seeking({ role: 'co-founder' })
      .build();

    expect(intent.signature).toBe('');

    const signed = await signIntent(identity, intent);
    expect(signed.signature).toBeTruthy();
    expect(signed.signature.length).toBeGreaterThan(0);

    const valid = await verifyIntent(signed);
    expect(valid).toBe(true);
  });

  it('should reject a tampered intent', async () => {
    const identity = await createIdentity();

    const intent = new IntentBuilder(identity.did)
      .type('introduction')
      .domain('professional')
      .seeking({ role: 'co-founder' })
      .build();

    const signed = await signIntent(identity, intent);

    // Tamper with the intent
    signed.domain = 'dating';

    const valid = await verifyIntent(signed);
    expect(valid).toBe(false);
  });
});
