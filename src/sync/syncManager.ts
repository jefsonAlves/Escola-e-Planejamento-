import { db, SyncQueueItem } from '../db/database';
import { db as firestore } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Multi-tab safe processing lock
let isProcessingQueue = false;

/**
 * Custom prioritization algorithm to ensure critical data consistency.
 * 
 * Priority Levels:
 * 1 (Highest) - Critical events: Occurrences/occurrences (ocorrencias) and Attendance (frequencias).
 * 2 (High)    - Structuring nodes: Classes, Students, Schools, and Linkage requests.
 * 3 (Medium)  - User / profile updates: User records, general configs, etc.
 * 4 (Normal)  - Any other fallback/default items.
 */
export const getSyncPriority = (item: SyncQueueItem): number => {
  const col = (item.collection || '').toLowerCase();
  
  // Level 1: Occurrences / Attendance
  if (
    col.includes('occurren') || 
    col.includes('ocorren') || 
    col.includes('ocorrên') || 
    col.includes('attendance') ||
    col.includes('frequenc') ||
    col.includes('presenc')
  ) {
    return 1;
  }

  // Level 2: Structural entities (Classes, Students, Schools, Links)
  if (
    col.includes('class') || 
    col.includes('student') || 
    col.includes('school') || 
    col.includes('link')
  ) {
    return 2;
  }

  // Level 3: Users/Profile modifications
  if (col.includes('user') || col.includes('profile')) {
    return 3;
  }

  // Level 4: fallback items
  return 4;
};

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
  // Only process online and avoid overlapping execution
  if (!navigator.onLine || isProcessingQueue) return;
  
  isProcessingQueue = true;
  
  try {
    const queue = await db.syncQueue.toArray();
    
    if (queue.length === 0) return;

    // Prioritize operations to improve consistency for offline environments
    queue.sort((a, b) => {
      const priorityA = getSyncPriority(a);
      const priorityB = getSyncPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower priority number is executed first (ascending)
      }
      
      // Preserve chronological sequence inside same priority classification
      return a.createdAt - b.createdAt;
    });

    for (const item of queue) {
      try {
        const docRef = doc(firestore, item.collection, item.localId);
        
        if (item.operation === 'DELETE') {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, item.payload, { merge: true });
        }

        // Mark local record as synced if it exists in local table
        if (item.operation !== 'DELETE') {
          const table = (db as any)[item.collection];
          if (table) {
            await table.update(item.localId, { 
              isSynced: true, 
              syncStatus: 'synced', 
              lastSyncAt: Date.now() 
            });
          }
        }

        // Successfully synchronized, remove from queue
        await db.syncQueue.delete(item.id);

      } catch (e: any) {
        const errMessage = e?.message || '';
        const isPermissionDenied = errMessage.includes('Missing or insufficient permissions') || e?.code === 'permission-denied';

        // Discard if permission-denied or standard non-blocking collection failure to prevent queue blockage
        if (isPermissionDenied || item.collection === 'users') {
          await db.syncQueue.delete(item.id);
          continue;
        }
        
        console.error(`Sync error on item ${item.id}:`, e);
        
        // Update retry count and preserve last error description
        await db.syncQueue.update(item.id, { 
          retryCount: item.retryCount + 1,
          lastError: e.message || 'Unknown network error'
        });
        
        // Update local state to error
        if (item.operation !== 'DELETE') {
          const table = (db as any)[item.collection];
          if (table) {
            await table.update(item.localId, { syncStatus: 'error' });
          }
        }
      }
    }
  } catch (queueErr) {
    console.error('Critical failure processing sync queue:', queueErr);
  } finally {
    isProcessingQueue = false;
  }
};

// Listen for online events to trigger prioritized sync
window.addEventListener('online', () => {
  processSyncQueue();
});

