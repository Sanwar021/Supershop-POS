import Dexie, { Table } from 'dexie';
import { Category, MenuItem, Table as RestaurantTable, PaymentMethod } from '../types';

export interface OutboxItem {
  id: string;
  type: string; // 'create_order' | 'pay_order' | 'send_kot'
  payload: any;
  idempotency_key: string;
  created_at: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
}

export class RestoFlowDB extends Dexie {
  categories!: Table<Category, string>;
  items!: Table<MenuItem, string>;
  restaurantTables!: Table<RestaurantTable, string>;
  paymentMethods!: Table<PaymentMethod, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('RestoFlowOfflineDB');
    this.version(1).stores({
      categories: 'id, sort',
      items: 'id, category_id, is_available',
      restaurantTables: 'id, branch_id, status',
      paymentMethods: 'id, code',
      outbox: 'id, type, status, created_at',
    });
  }
}

export const db = new RestoFlowDB();
