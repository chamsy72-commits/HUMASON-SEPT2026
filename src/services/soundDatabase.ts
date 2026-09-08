import { SoundItem } from '../types';
import { INITIAL_SOUNDS } from '../data/mockData';

const DB_NAME = 'humason_sound_archive_db';
const DB_VERSION = 2;
const SOUNDS_STORE = 'sounds';
const BLOBS_STORE = 'audio_blobs';
const META_STORE = 'metadata';

let dbInstance: IDBDatabase | null = null;

// Track active Object URLs to revoke and prevent memory leaks if replaced
const activeObjectUrls: Map<string, string> = new Map();

/**
 * Open or initialize the IndexedDB instance
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SOUNDS_STORE)) {
        db.createObjectStore(SOUNDS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Helper to compress and optimize uploaded images
 */
export function optimizeImageFile(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const maxDim = Math.max(maxWidth, maxHeight);
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          canvas.toBlob(
            (blob) => {
              resolve({
                dataUrl,
                blob: blob || file
              });
            },
            'image/jpeg',
            0.85
          );
        } else {
          resolve({ dataUrl: e.target?.result as string, blob: file });
        }
      };
      img.onerror = () => {
        resolve({ dataUrl: e.target?.result as string, blob: file });
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({ dataUrl: '', blob: file });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Save audio blob into IndexedDB
 */
export async function saveAudioBlob(soundId: string, blob: Blob): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOBS_STORE, 'readwrite');
      const store = tx.objectStore(BLOBS_STORE);
      store.put(blob, `audio_${soundId}`);

      tx.oncomplete = () => {
        // Create active object URL for immediate playback
        const oldUrl = activeObjectUrls.get(soundId);
        if (oldUrl) URL.revokeObjectURL(oldUrl);

        const newUrl = URL.createObjectURL(blob);
        activeObjectUrls.set(soundId, newUrl);
        resolve(newUrl);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save audio blob to IndexedDB', err);
    return URL.createObjectURL(blob);
  }
}

/**
 * Retrieve audio blob from IndexedDB
 */
export async function getAudioBlob(soundId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(BLOBS_STORE, 'readonly');
      const store = tx.objectStore(BLOBS_STORE);
      const req = store.get(`audio_${soundId}`);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Save sound and optional audio/image blobs into IndexedDB and keep localStorage backup
 */
export async function saveSoundToDatabase(
  sound: SoundItem,
  audioBlob?: Blob,
  imageBlob?: Blob
): Promise<SoundItem> {
  const preparedSound: SoundItem = { ...sound };

  try {
    const db = await openDB();

    // 1. If audio blob provided, save to blobs store and assign fresh Object URL
    if (audioBlob) {
      const audioUrl = await saveAudioBlob(preparedSound.id, audioBlob);
      preparedSound.audioUrl = audioUrl;
    }

    // 2. If image blob provided, save to blobs store
    if (imageBlob) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(BLOBS_STORE, 'readwrite');
        const store = tx.objectStore(BLOBS_STORE);
        store.put(imageBlob, `image_${preparedSound.id}`);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    // 3. Save SoundItem metadata to sounds store
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SOUNDS_STORE, 'readwrite');
      const store = tx.objectStore(SOUNDS_STORE);
      store.put(preparedSound);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // 4. Update sync metadata in localStorage as backup
    syncLocalStorageFallback(preparedSound);
  } catch (err) {
    console.warn('Error saving sound to IndexedDB, fallback to localStorage', err);
    syncLocalStorageFallback(preparedSound);
  }

  return preparedSound;
}

/**
 * Load all sounds from IndexedDB, rehydrating audio object URLs and fallback to mock data
 */
export async function loadAllSoundsFromDatabase(): Promise<SoundItem[]> {
  try {
    const db = await openDB();

    // 1. Get deleted sound IDs
    const deletedIds = getDeletedSoundIds();

    // 2. Read custom and modified sounds from IndexedDB
    const storedSounds: SoundItem[] = await new Promise((resolve) => {
      const tx = db.transaction(SOUNDS_STORE, 'readonly');
      const store = tx.objectStore(SOUNDS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    // 3. For each stored sound, check if an audio blob exists and rehydrate audioUrl
    for (const sound of storedSounds) {
      const blob = await getAudioBlob(sound.id);
      if (blob) {
        const existingUrl = activeObjectUrls.get(sound.id);
        if (existingUrl) URL.revokeObjectURL(existingUrl);
        const newUrl = URL.createObjectURL(blob);
        activeObjectUrls.set(sound.id, newUrl);
        sound.audioUrl = newUrl;
      }
    }

    // 4. If IndexedDB had no records yet, migrate from localStorage
    if (storedSounds.length === 0) {
      const localDeposited = localStorage.getItem('humason_deposited_sounds');
      const localModified = localStorage.getItem('humason_modified_sounds');

      if (localDeposited || localModified) {
        const toMigrate: SoundItem[] = JSON.parse(localDeposited || localModified || '[]');
        if (Array.isArray(toMigrate) && toMigrate.length > 0) {
          for (const s of toMigrate) {
            await saveSoundToDatabase(s);
          }
          return loadAllSoundsFromDatabase();
        }
      }
    }

    // 5. Merge with INITIAL_SOUNDS
    const storedMap = new Map<string, SoundItem>(storedSounds.map((s) => [s.id, s]));
    const result: SoundItem[] = [];

    // Add stored custom/modified sounds
    for (const s of storedSounds) {
      if (!deletedIds.has(s.id)) {
        result.push(s);
      }
    }

    // Add initial sounds if not already overridden or deleted
    for (const initSound of INITIAL_SOUNDS) {
      if (!storedMap.has(initSound.id) && !deletedIds.has(initSound.id)) {
        result.push(initSound);
      }
    }

    return result;
  } catch (err) {
    console.warn('Error reading from IndexedDB, using localStorage / mock data', err);
    return getLocalStorageFallback();
  }
}

/**
 * Delete sound from IndexedDB and mark as deleted
 */
export async function deleteSoundFromDatabase(soundId: string): Promise<void> {
  try {
    const db = await openDB();

    // 1. Delete from sounds store
    await new Promise<void>((resolve) => {
      const tx = db.transaction([SOUNDS_STORE, BLOBS_STORE], 'readwrite');
      tx.objectStore(SOUNDS_STORE).delete(soundId);
      tx.objectStore(BLOBS_STORE).delete(`audio_${soundId}`);
      tx.objectStore(BLOBS_STORE).delete(`image_${soundId}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    // Revoke blob URL
    const url = activeObjectUrls.get(soundId);
    if (url) {
      URL.revokeObjectURL(url);
      activeObjectUrls.delete(soundId);
    }
  } catch (e) {
    console.warn('IndexedDB delete error', e);
  }

  // Record in deleted set
  addDeletedSoundId(soundId);
}

// ----------------- Fallback and sync helpers -----------------

function getDeletedSoundIds(): Set<string> {
  try {
    const raw = localStorage.getItem('humason_deleted_sound_ids');
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function addDeletedSoundId(id: string): void {
  try {
    const set = getDeletedSoundIds();
    set.add(id);
    localStorage.setItem('humason_deleted_sound_ids', JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function syncLocalStorageFallback(sound: SoundItem) {
  try {
    // Store a safe, lightweight copy in localStorage (without massive base64)
    const raw = localStorage.getItem('humason_deposited_sounds');
    const list: SoundItem[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((s) => s.id !== sound.id);

    const safeSound: SoundItem = {
      ...sound,
      // If image is a huge data URL, keep only if small or use placeholder
      image: sound.image && sound.image.length > 50000 ? sound.image.slice(0, 100) : sound.image
    };

    filtered.unshift(safeSound);
    localStorage.setItem('humason_deposited_sounds', JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore quota error
  }
}

function getLocalStorageFallback(): SoundItem[] {
  try {
    const deletedIds = getDeletedSoundIds();
    const raw = localStorage.getItem('humason_deposited_sounds');
    let custom: SoundItem[] = [];
    if (raw) {
      custom = JSON.parse(raw);
    }
    const initIds = new Set(INITIAL_SOUNDS.map((s) => s.id));
    const combined = [...custom.filter((s) => !initIds.has(s.id)), ...INITIAL_SOUNDS];
    return combined.filter((s) => !deletedIds.has(s.id));
  } catch {
    return INITIAL_SOUNDS;
  }
}
