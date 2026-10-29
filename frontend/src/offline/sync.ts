import { db, OutboxItem } from './db';
import { api } from '../lib/api';

export async function cacheBootstrapData(branchId?: string) {
  try {
    const data = await api.get(`/pos/bootstrap?branch_id=${branchId || ''}`);
    if (data) {
      if (data.categories?.length) {
        await db.categories.clear();
        await db.categories.bulkPut(data.categories);
      }
      if (data.items?.length) {
        await db.items.clear();
        await db.items.bulkPut(data.items);
      }
      if (data.tables?.length) {
        await db.restaurantTables.clear();
        await db.restaurantTables.bulkPut(data.tables);
      }
      if (data.payment_methods?.length) {
        await db.paymentMethods.clear();
        await db.paymentMethods.bulkPut(data.payment_methods);
      }
      console.log('[Offline] POS Bootstrap cached in IndexedDB successfully');
    }
  } catch (err) {
    console.warn('[Offline] Could not cache bootstrap data, using local fallback:', err);
  }
}

export async function queueOutboxOperation(type: string, payload: any): Promise<string> {
  const id = crypto.randomUUID();
  const item: OutboxItem = {
    id,
    type,
    payload,
    idempotency_key: id,
    created_at: new Date().toISOString(),
    status: 'pending',
  };

  await db.outbox.add(item);

  // If online, trigger sync immediately
  if (navigator.onLine) {
    syncOutbox();
  }

  return id;
}

export async function syncOutbox(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const pendingItems = await db.outbox
    .where('status')
    .equals('pending')
    .sortBy('created_at');

  if (pendingItems.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Replaying ${pendingItems.length} outbox operations...`);
  window.dispatchEvent(new CustomEvent('sync_status', { detail: 'syncing' }));

  try {
    const batch = pendingItems.map((item) => ({
      id: item.id,
      type: item.type,
      payload: item.payload,
      idempotency_key: item.idempotency_key,
    }));

    const results = await api.post('/sync/batch', batch);

    let syncedCount = 0;
    let failedCount = 0;

    for (const res of results) {
      if (res.status === 'success' || res.status === 'cached') {
        await db.outbox.update(res.operation_id, { status: 'synced' });
        syncedCount++;
      } else {
        await db.outbox.update(res.operation_id, { status: 'failed', error: res.error });
        failedCount++;
      }
    }

    // Clean up synced items older than 1 hour
    await db.outbox.where('status').equals('synced').delete();

    window.dispatchEvent(new CustomEvent('sync_status', { detail: 'online' }));
    return { synced: syncedCount, failed: failedCount };
  } catch (e) {
    console.error('[Sync] Batch sync failed:', e);
    window.dispatchEvent(new CustomEvent('sync_status', { detail: 'offline' }));
    return { synced: 0, failed: pendingItems.length };
  }
}

// Auto-sync listener on window reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOutbox();
  });
}
