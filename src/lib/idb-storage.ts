'use client';

/**
 * IndexedDB-backed storage adapter for Zustand persist middleware.
 * Handles large datasets (10MB+) that exceed localStorage limits.
 */

const DB_NAME = 'vesdi-dashboard';
const STORE_NAME = 'state';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Browsers cap the size of a single IndexedDB value (Chrome: ~133 MB serialized,
 * and strings serialize as UTF-16, i.e. 2 bytes/char). A full multi-year dataset
 * such as Utrecht serializes to >100M chars, so large values are split into
 * chunks stored under separate keys. The main key then holds a small marker.
 */
const CHUNK_CHARS = 16 * 1024 * 1024; // 16M chars ≈ 32 MB serialized per chunk
const CHUNK_MARKER = '__vesdi_chunked__:';
const chunkKey = (key: string, i: number) => `${key}::chunk::${i}`;

function chunkCount(marker: unknown): number {
  return typeof marker === 'string' && marker.startsWith(CHUNK_MARKER)
    ? Number(marker.slice(CHUNK_MARKER.length)) || 0
    : 0;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idbStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const db = await openDB();
      const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
      const value = await request(store.get(key));
      const n = chunkCount(value);
      if (n === 0) return (value as string | undefined) ?? null;
      const parts = await Promise.all(
        Array.from({ length: n }, (_, i) => request(store.get(chunkKey(key, i))))
      );
      if (parts.some((p) => typeof p !== 'string')) return null;
      return parts.join('');
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        // Read the previous chunk count so stale chunks can be removed
        const prev = store.get(key);
        prev.onsuccess = () => {
          const oldChunks = chunkCount(prev.result);
          const newChunks = value.length > CHUNK_CHARS ? Math.ceil(value.length / CHUNK_CHARS) : 0;
          for (let i = 0; i < newChunks; i++) {
            store.put(value.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS), chunkKey(key, i));
          }
          for (let i = newChunks; i < oldChunks; i++) store.delete(chunkKey(key, i));
          store.put(newChunks > 0 ? `${CHUNK_MARKER}${newChunks}` : value, key);
        };
        // All writes share one transaction: either everything lands or nothing does
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          console.warn('[vesdi] Opslaan in IndexedDB mislukt:', tx.error);
          resolve();
        };
        tx.onabort = () => {
          console.warn('[vesdi] Opslaan in IndexedDB afgebroken:', tx.error);
          resolve();
        };
      });
    } catch {
      // Silently fail - data just won't persist
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const prev = store.get(key);
        prev.onsuccess = () => {
          const n = chunkCount(prev.result);
          for (let i = 0; i < n; i++) store.delete(chunkKey(key, i));
          store.delete(key);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      });
    } catch {
      // Silently fail
    }
  },
};
