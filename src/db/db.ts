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

export type OrderingMethod = 'EMAIL' | 'CASH_AND_CARRY';

export interface Supplier {
  id?: number;
  name: string;
  email: string;
  contactName?: string;
  method: OrderingMethod;
}

export interface CatalogItem {
  id?: number;
  name: string;
  category: string;
  unit: string;
  minStockAlert: number;
  defaultSupplierId?: number; // Pre-selected for procurement
  allergens?: string[]; // ["Gluten", "Lactose", etc.]
  fatPer100?: number;   // Grammes de gras pour 100g ou 100ml
  isRepurposable?: boolean; // ex: croissants -> amandes
  isFreezable?: boolean;    // ex: pâte crue
}

export type TransformationAction = 'FREEZE' | 'REPURPOSE' | 'WASTE';

export interface Transformation {
  id?: number;
  date: number; // timestamp
  sourceProductId: number;
  targetProductId?: number; // Optional if WAISTED
  quantity: number;
  actionType: TransformationAction;
  notes?: string;
}

export interface Batch {
  id?: number;
  productId: number; // Foreign key to CatalogItem.id
  supplierId?: number; // Foreign key to Supplier.id
  lotNumber: string;
  purchaseDate: number; // timestamp
  expirationDate: number; // timestamp
  initialQuantity: number;
  currentQuantity: number;
  totalPriceHT: number;
  unitPriceHT: number; // calculated at entry
}

export interface ProductionHistory {
  id?: number;
  recipeId: number;
  recipeName: string;
  date: number; // timestamp
  quantityProduced: number;
  totalCostHT: number;
  unitCostHT: number;
  details: { ingredientName: string, quantityUsed: number, cost: number }[];
}

export interface LaborRole {
  id?: number;
  name: string;
  hourlyCost: number; // Chargé
}

export interface Equipment {
  id?: number;
  name: string;
  hourlyCost: number; // Amortissement + Énergie
}

export interface RecipeIngredient {
  ingredientId: number;
  requiredQuantity: number;
}

export interface RecipeLabor {
  roleId: number;
  minutesSpent: number;
}

export interface RecipeEquipment {
  equipmentId: number;
  minutesUsed: number;
}

export interface RecipeStep {
  label: string;
  minutes: number;
  type: 'PREP' | 'REST' | 'KNEAD' | 'BAKING';
}

export interface Recipe {
  id?: number;
  name: string;
  category: string;
  yield: number;
  vatRate: number; // ex: 5.5
  ingredients: RecipeIngredient[];
  labor: RecipeLabor[];
  equipmentUsed: RecipeEquipment[];
  instructions?: string[];
  prepSteps?: RecipeStep[];
  utensils?: string[];
  bakingTemp?: number;
  bakingTime?: number; // en minutes
  shelfLife?: number;  // Durée de vie en heures
}

const db = new Dexie('CambuseDB') as Dexie & {
  events: EntityTable<StreetEvent, 'id'>;
  orders: EntityTable<CustomerOrder, 'id'>;
  catalog: EntityTable<CatalogItem, 'id'>;
  batches: EntityTable<Batch, 'id'>;
  recipes: EntityTable<Recipe, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  productionHistory: EntityTable<ProductionHistory, 'id'>;
  laborRoles: EntityTable<LaborRole, 'id'>;
  equipment: EntityTable<Equipment, 'id'>;
  transformations: EntityTable<Transformation, 'id'>;
};

// Version 11 : HACCP End-of-Day Transformations & Waste Tracking
db.version(11).stores({
  events: '++id, title, date, endDate, type, impact, isCompleted, source, externalId',
  orders: '++id, customerName, dueDate, productType, status',
  catalog: '++id, name, category, defaultSupplierId',
  batches: '++id, productId, lotNumber, expirationDate, purchaseDate, supplierId',
  recipes: '++id, name, category',
  suppliers: '++id, name, method',
  productionHistory: '++id, recipeId, date',
  laborRoles: '++id, name',
  equipment: '++id, name',
  transformations: '++id, date, actionType, sourceProductId'
});

export { db };









