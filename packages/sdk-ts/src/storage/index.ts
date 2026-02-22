/**
 * Tacit Protocol — Storage Layer
 *
 * Persistence for agent identity, credentials, and interaction history.
 */

export {
  AgentStore,
  MemoryBackend,
  FileBackend,
  type StorageBackend,
  type InteractionRecord,
} from './store.js';
