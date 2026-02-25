/**
 * IndexedDB Storage Backend for TACIT Protocol SDK
 *
 * Implements the StorageBackend interface so TacitAgent can persist
 * identity, credentials, and interaction history in the browser.
 * Private keys never leave IndexedDB — they stay on the user's device.
 */

import { openDB, type IDBPDatabase } from 'idb';

interface StorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
  close(): Promise<void>;
}

const DB_VERSION = 1;
const STORE_NAME = 'tacit-data';

export class IndexedDBBackend implements StorageBackend {
  private dbName: string;
  private db: IDBPDatabase | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  private async getDb(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });

    return this.db;
  }

  async get(key: string): Promise<string | null> {
    const db = await this.getDb();
    const value = await db.get(STORE_NAME, key);
    return value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.put(STORE_NAME, value, key);
  }

  async delete(key: string): Promise<boolean> {
    const db = await this.getDb();
    const existing = await db.get(STORE_NAME, key);
    if (existing === undefined) return false;
    await db.delete(STORE_NAME, key);
    return true;
  }

  async list(prefix: string): Promise<string[]> {
    const db = await this.getDb();
    const allKeys = await db.getAllKeys(STORE_NAME);
    return (allKeys as string[]).filter((k) => k.startsWith(prefix));
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
