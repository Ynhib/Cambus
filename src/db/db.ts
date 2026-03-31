import Dexie, { type EntityTable } from 'dexie';

export type EventSource = 'MANUAL' | 'ORDER' | 'EXTERNAL';
export type EventImpact = 'LOW' | 'MEDIUM' | 'HIGH';
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type EventType = 'ORDER' | 'LOCAL_EVENT' | 'WORK';

export interface StreetEvent {
  id?: number;
  title: string;
  date: string;       // ISO date for querying (YYYY-MM-DD)
  endDate?: string;   // For items spanning days
  type: EventType;
  impact: EventImpact;
  description?: string;
  isCompleted: boolean;
  source: EventSource;
  externalId?: string; // For syncing (e.g., iCal UID)
}

export interface CustomerOrder {
  id?: number;
  customerName: string;
  dueDate: string;    // ISO date
  productType: string;
  quantity: number;
  status: OrderStatus;
}

const db = new Dexie('CambuseDB') as Dexie & {
  events: EntityTable<StreetEvent, 'id'>;
  orders: EntityTable<CustomerOrder, 'id'>;
};

db.version(1).stores({
  events: '++id, title, date, endDate, type, impact, isCompleted, source, externalId',
  orders: '++id, customerName, dueDate, productType, status'
});

export { db };
