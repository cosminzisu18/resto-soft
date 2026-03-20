export const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Pentru imaginile din API: data URL rămâne neschimbat, /images/... devine URL complet către backend. */
export function imageSrc(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_BASE.replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
  return res.json();
}

export interface IngredientApi {
  id: number;
  name: string;
  defaultUnit?: string | null;
}

/** Un pas din instrucțiunile de preparare: text + timp (minute). */
export interface InstructionStepApi {
  text: string;
  timeMinutes?: number;
}

/** Un rând de ingredient la produsul din meniu (ca la rețetă). */
export interface MenuItemIngredientApi {
  id?: number;
  ingredientId: number;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  lossPercent?: number;
  ingredient?: { id: number; name: string; defaultUnit?: string | null };
}

export interface MenuItemApi {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  kdsStationId: number;
  kdsStation?: { id: number; name: string; type: string };
  prepTime: number;
  portions?: number;
  instructions?: InstructionStepApi[];
  /** Ingrediente cu cantități (ca la rețetă). */
  menuItemIngredients?: MenuItemIngredientApi[];
  /**
   * Răspuns GET (din menu.controller): id, name, defaultUnit – pentru UI rețete.
   * Cantități complete: menuItemIngredients.
   */
  ingredients?: { id: number; name: string; defaultUnit?: string | null }[];
  image?: string;
  gallery?: string[];
  unitType?: 'buc' | 'portie' | 'gram';
  availability?: { restaurant?: boolean; kiosk?: boolean; app?: boolean; delivery?: boolean };
  platformPricing?: Record<string, { name: string; price: number; enabled: boolean }>;
  allergens?: { id: number; name: string }[];
  availableExtras?: { id: number; name: string; price: number; image?: string | null }[];
}

export type KdsStationType = 'soups' | 'pizza' | 'grill' | 'giros';

export interface KdsStationApi {
  id: number;
  name: string;
  type: KdsStationType;
  color?: string;
  icon?: string;
}

export interface CreateKdsStationBody {
  name: string;
  type: KdsStationType;
  color?: string;
  icon?: string;
}

export interface UpdateKdsStationBody {
  name?: string;
  type?: KdsStationType;
  color?: string;
  icon?: string;
}

export interface CreateMenuItemBody {
  name: string;
  description?: string;
  price: number;
  category: string;
  kdsStationId: number;
  prepTime?: number;
  portions?: number;
  instructions?: InstructionStepApi[];
  /** Ingrediente cu cantități (ingredientId, quantity, unit, pricePerUnit, lossPercent). */
  ingredients?: { ingredientId: number; quantity: number; unit: string; pricePerUnit: number; lossPercent?: number }[];
  image?: string;
  gallery?: string[];
  unitType?: 'buc' | 'portie' | 'gram';
  availability?: Record<string, boolean>;
  platformPricing?: Record<string, { name: string; price: number; enabled: boolean }>;
  allergenIds?: number[];
  availableExtrasIds?: number[];
}

export type UpdateMenuItemBody = Partial<CreateMenuItemBody>;

export interface MenuCategoryApi {
  id: number;
  name: string;
  icon?: string | null;
}

// --- Tables (mese RestoSoft – poziții și unire) ---
export interface TableApi {
  id: number;
  number: number;
  seats: number;
  zone?: string | null;
  status: 'free' | 'occupied' | 'reserved';
  position: { x: number; y: number } | null;
  shape: 'round' | 'square' | 'rectangle';
  currentOrderId?: number | null;
  reservationId?: string | null;
  currentGuests: number;
  mergedWith: number[] | null;
  qrCode?: string | null;
  branchId?: string | null;
}

export interface UpdateTableBody {
  position?: { x: number; y: number };
  mergedWith?: number[];
  status?: 'free' | 'occupied' | 'reserved';
  number?: number;
  seats?: number;
  zone?: string;
  shape?: 'round' | 'square' | 'rectangle';
}

export interface CreateTableBody {
  number: number;
  seats: number;
  shape: 'round' | 'square' | 'rectangle';
  zone?: string;
  status?: 'free' | 'occupied' | 'reserved';
  position?: { x: number; y: number };
  branchId?: string;
}

export const tablesApi = {
  getTables: (branchId?: string) =>
    request<TableApi[]>(branchId ? `/tables?branchId=${encodeURIComponent(branchId)}` : '/tables'),
  getTable: (id: number) => request<TableApi | null>(`/tables/${id}`),
  createTable: (body: CreateTableBody) =>
    request<TableApi>('/tables', { method: 'POST', body: JSON.stringify(body) }),
  updateTable: (id: number, body: UpdateTableBody) =>
    request<TableApi>(`/tables/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTable: (id: number) => request<void>(`/tables/${id}`, { method: 'DELETE' }),
};

// --- Orders (comenzi ospătar / POS) ---
export type OrderStatusApi = 'active' | 'completed' | 'cancelled';
export type OrderItemStatusApi = 'pending' | 'cooking' | 'ready' | 'served';

export interface OrderItemApi {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItem: Record<string, unknown> | null;
  quantity: number;
  weightGrams?: number | null;
  modifications: { added?: string[]; removed?: string[]; notes?: string } | null;
  status: OrderItemStatusApi;
  startedAt?: string | null;
  readyAt?: string | null;
  complimentary?: boolean;
}

export interface OrderApi {
  id: number;
  tableId: number | null;
  tableNumber: number | null;
  waiterId: string | null;
  waiterName: string | null;
  status: OrderStatusApi;
  createdAt: string;
  totalAmount: number;
  tip: number;
  source: string;
  fulfillmentType?: 'dine_in' | 'takeaway' | null;
  items: OrderItemApi[];
  syncTiming?: boolean;
  paymentMethod?: 'cash' | 'card' | 'usage_card' | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  cui?: string | null;
}

export interface CreateOrderItemBody {
  menuItemId: number;
  quantity?: number;
  weightGrams?: number;
  menuItem?: Record<string, unknown>;
  modifications?: { added?: string[]; removed?: string[]; notes?: string };
  complimentary?: boolean;
}

export interface CreateOrderBody {
  tableId?: number;
  tableNumber?: number;
  waiterId?: string;
  waiterName?: string;
  status?: OrderStatusApi;
  source?: string;
  fulfillmentType?: 'dine_in' | 'takeaway';
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string | null;
  paymentMethod?: 'cash' | 'card' | 'usage_card';
  items: CreateOrderItemBody[];
}

export const ordersApi = {
  getByTableId: (tableId: number) =>
    request<OrderApi[]>(`/orders?tableId=${encodeURIComponent(String(tableId))}`),
  getAll: () => request<OrderApi[]>('/orders'),
  getOne: (id: number) => request<OrderApi | null>(`/orders/${id}`),
  create: (body: CreateOrderBody) =>
    request<OrderApi>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  addItems: (orderId: number, items: CreateOrderItemBody[]) =>
    request<OrderApi>(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ items }) }),
  updateItemStatus: (
    orderId: number,
    itemId: number,
    status: OrderItemStatusApi,
    actor?: { employeeId?: string; employeeName?: string },
  ) =>
    request<OrderApi>(`/orders/${orderId}/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...actor }),
    }),
};

export const menuApi = {
  getItems: () => request<MenuItemApi[]>('/menu/items'),
  getItem: (id: string) => request<MenuItemApi | null>(`/menu/items/${id}`),
  createItem: (body: CreateMenuItemBody) => request<MenuItemApi>('/menu/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id: number, body: UpdateMenuItemBody) => request<MenuItemApi>(`/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getCategories: () => request<MenuCategoryApi[]>('/menu/categories'),
  createCategory: (body: { name: string; icon?: string }) => request<MenuCategoryApi>('/menu/categories', { method: 'POST', body: JSON.stringify(body) }),
  deleteCategory: (id: number) => request<void>(`/menu/categories/${id}`, { method: 'DELETE' }),
  getKdsStations: () => request<KdsStationApi[]>('/menu/kds-stations'),
  getKdsStation: (id: number) => request<KdsStationApi | null>(`/menu/kds-stations/${id}`),
  createKdsStation: (body: CreateKdsStationBody) => request<KdsStationApi>('/menu/kds-stations', { method: 'POST', body: JSON.stringify(body) }),
  updateKdsStation: (id: number, body: UpdateKdsStationBody) => request<KdsStationApi>(`/menu/kds-stations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteKdsStation: (id: number) => request<void>(`/menu/kds-stations/${id}`, { method: 'DELETE' }),
  getAllergens: () => request<{ id: number; name: string; icon?: string; color?: string }[]>('/menu/allergens'),
  getExtraIngredients: () => request<{ id: number; name: string; price: number; category?: string; image?: string | null }[]>('/menu/extra-ingredients'),
  createExtraIngredient: (body: { name: string; price: number; category?: string; image?: string }) =>
    request<{ id: number; name: string; price: number; category?: string; image?: string | null }>('/menu/extra-ingredients', { method: 'POST', body: JSON.stringify(body) }),
  updateExtraIngredient: (id: number, body: { name?: string; price?: number; category?: string; image?: string }) =>
    request<{ id: number; name: string; price: number; category?: string; image?: string | null }>(`/menu/extra-ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteExtraIngredient: (id: number) => request<void>(`/menu/extra-ingredients/${id}`, { method: 'DELETE' }),
  getIngredients: () => request<IngredientApi[]>('/menu/ingredients'),
  createIngredient: (body: { name: string; defaultUnit?: string }) => request<IngredientApi>('/menu/ingredients', { method: 'POST', body: JSON.stringify(body) }),
  updateIngredient: (id: number, body: { name?: string; defaultUnit?: string }) => request<IngredientApi>(`/menu/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteIngredient: (id: number) => request<void>(`/menu/ingredients/${id}`, { method: 'DELETE' }),
  seedBaseData: () => request<{ kds: number; allergens: number; extras: number }>('/menu/seed', { method: 'POST' }),
};

// --- Storage (zone depozit, inventar, transferuri) ---
export interface StorageZoneApi {
  id: number;
  name: string;
  code?: string | null;
}

export interface InventoryApi {
  id: number;
  menuItemId: number;
  zoneId: number;
  quantity: number;
  unit: string;
  menuItem?: { id: number; name: string; category: string; price?: number };
  zone?: { id: number; name: string };
}

export interface TransferRequestApi {
  id: number;
  fromZoneId: number;
  toZoneId: number;
  menuItemId: number;
  quantity: number;
  unit: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  fromZone?: { id: number; name: string };
  toZone?: { id: number; name: string };
  menuItem?: { id: number; name: string };
}

export const storageApi = {
  getZones: () => request<StorageZoneApi[]>('/storage/zones'),
  getZone: (id: number) => request<StorageZoneApi | null>(`/storage/zones/${id}`),
  createZone: (body: { name: string; code?: string }) => request<StorageZoneApi>('/storage/zones', { method: 'POST', body: JSON.stringify(body) }),
  updateZone: (id: number, body: { name?: string; code?: string }) => request<StorageZoneApi>(`/storage/zones/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteZone: (id: number) => request<void>(`/storage/zones/${id}`, { method: 'DELETE' }),
  getInventory: (zoneId?: number) => request<InventoryApi[]>(zoneId != null ? `/storage/inventory?zoneId=${zoneId}` : '/storage/inventory'),
  upsertInventory: (body: { menuItemId: number; zoneId: number; quantity: number; unit?: string }) => request<InventoryApi>('/storage/inventory', { method: 'POST', body: JSON.stringify(body) }),
  getTransfers: (status?: 'pending' | 'approved' | 'rejected') => request<TransferRequestApi[]>(status != null ? `/storage/transfers?status=${status}` : '/storage/transfers'),
  createTransfer: (body: { fromZoneId: number; toZoneId: number; menuItemId: number; quantity: number; unit?: string }) => request<TransferRequestApi>('/storage/transfers', { method: 'POST', body: JSON.stringify(body) }),
  approveTransfer: (id: number, approvedBy?: string) => request<TransferRequestApi>(`/storage/transfers/${id}/approve`, { method: 'PATCH', body: JSON.stringify(approvedBy != null ? { approvedBy } : {}) }),
  rejectTransfer: (id: number) => request<TransferRequestApi>(`/storage/transfers/${id}/reject`, { method: 'PATCH' }),
};

// --- Recipes (rețete legate de produse din meniu) ---
export interface RecipeIngredientApi {
  id?: number;
  ingredientId: number;
  ingredient?: { id: number; name: string; defaultUnit?: string | null };
  quantity: number;
  unit: string;
  pricePerUnit: number;
  /** Procent pierdere 0–100; folosit la cost per porție */
  lossPercent?: number;
}

export interface RecipeApi {
  id: number;
  menuItemId: number | null;
  name: string;
  category: string;
  prepTimeMinutes: number;
  portions: number;
  instructions: InstructionStepApi[];
  allergenIds: number[];
  image: string | null;
  gallery: string[];
  ingredients: RecipeIngredientApi[];
  menuItem?: { id: number; name: string; category: string; prepTime: number; ingredients?: string[]; allergens?: { id: number; name: string }[] } | null;
}

export interface CreateRecipeBody {
  menuItemId?: number | null;
  name: string;
  category: string;
  prepTimeMinutes?: number;
  portions?: number;
  instructions?: InstructionStepApi[];
  allergenIds?: number[];
  image?: string | null;
  gallery?: string[];
  ingredients?: { ingredientId: number; quantity: number; unit: string; pricePerUnit: number; lossPercent?: number }[];
}

export type UpdateRecipeBody = Partial<CreateRecipeBody>;

export const recipesApi = {
  getAll: () => request<RecipeApi[]>('/recipes'),
  getOne: (id: number) => request<RecipeApi | null>(`/recipes/${id}`),
  create: (body: CreateRecipeBody) => request<RecipeApi>('/recipes', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateRecipeBody) => request<RecipeApi>(`/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: number) => request<void>(`/recipes/${id}`, { method: 'DELETE' }),
  syncFromMenuItem: (menuItemId: number, body: { name?: string; category?: string; prepTimeMinutes?: number; allergenIds?: number[]; image?: string | null }) =>
    request<number>(`/recipes/sync-from-menu-item/${menuItemId}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
