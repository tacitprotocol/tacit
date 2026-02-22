/**
 * Tacit Protocol — Transport Layer
 *
 * Message signing, verification, and relay communication.
 */

export {
  createSignedMessage,
  verifyMessage,
  isMessageExpired,
  signIntent,
  verifyIntent,
  signProposal,
  type SignedEnvelope,
  type MessageType,
} from './message.js';

export {
  RelayClient,
  type RelayClientOptions,
  type RelayEventHandler,
} from './relay-client.js';
