import { db, SyncQueueItem } from '../db/database';
import { getFirestore, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const addToSyncQueue = async (operation: 'CREATE' | 'UPDATE' | 'DELETE', tableName: string, localId: string, payload: any) => {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    operation,
    collection: tableName,
    localId,
    payload,
    createdAt: Date.now(),
    retryCount: 0
  });

  // Try to sync immediately if online
  if (navigator.onLine) {
    processSyncQueue();
  }
};

export const processSyncQueue = async () => {
  if (!navigator.onLine) return; // Only process when online
  
  const firestore = getFirestore();
  const queue = await db.syncQueue.orderBy('createdAt').toArray();

  for (const item of queue) {
    try {
      const docRef = doc(firestore, item.collection, item.localId);
      
      if (item.operation === 'DELETE') {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, item.payload, { merge: true });
      }

      // Mark local as synced
      if (item.operation !== 'DELETE') {
        const table = (db as any)[item.collection];
        if (table) {
           await table.update(item.localId, { isSynced: true, syncStatus: 'synced', lastSyncAt: Date.now() });
        }
      }

      // Remove from queue
      await db.syncQueue.delete(item.id);

    } catch (e: any) {
      console.error(`Sync error on item ${item.id}:`, e);
      // Update retry count and error
      await db.syncQueue.update(item.id, { 
        retryCount: item.retryCount + 1,
        lastError: e.message 
      });
      // Update local record to error
      if (item.operation !== 'DELETE') {
        const table = (db as any)[item.collection];
        if (table) {
           await table.update(item.localId, { syncStatus: 'error' });
        }
      }
    }
  }
};

// Listen for online events to trigger sync
window.addEventListener('online', () => {
  processSyncQueue();
});
