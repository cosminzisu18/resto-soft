const DEFAULT_API_BASE = 'http://localhost:3001';

function resolveRuntimeApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE;

  // Android emulator: aplicația rulează din 10.0.2.2 și backend-ul local este expus tot prin 10.0.2.2.
  if (window.location.hostname === '10.0.2.2') {
    return 'http://10.0.2.2:3001';
  }

  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE;
}

export const API_BASE = resolveRuntimeApiBase();

/** Pentru imaginile din API: data URL rămâne neschimbat, /images/... devine URL complet către backend. */
export function imageSrc(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_BASE.replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

/** Header opțional când backend-ul are `BILLING_API_KEY` (vezi docs). */
function billingAuthHeaders(): HeadersInit | undefined {
  const k =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BILLING_API_KEY?.trim() : undefined;
  return k ? { 'X-Billing-Key': k } : undefined;
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
  platformPrices?: Array<{
    platformId: number;
    displayName?: string | null;
    price: number;
    platform?: SalesPlatformApi;
  }>;
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
  platformPrices?: Array<{
    platformId: number;
    displayName?: string;
    price: number;
  }>;
  allergenIds?: number[];
  availableExtrasIds?: number[];
}

export type UpdateMenuItemBody = Partial<CreateMenuItemBody>;

export interface MenuCategoryApi {
  id: number;
  name: string;
  icon?: string | null;
}

export interface SalesPlatformApi {
  id: number;
  code: string;
  name: string;
  icon?: string | null;
  active: boolean;
  sortOrder: number;
}

export interface CreateSalesPlatformBody {
  code: string;
  name: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}

export type UpdateSalesPlatformBody = Partial<CreateSalesPlatformBody>;

// --- Utilizatori (conturi PIN: admin, ospătar, bucătărie) ---
export type UserRoleApi = 'waiter' | 'admin' | 'kitchen';

export interface UserApi {
  id: string;
  name: string;
  role: UserRoleApi;
  pin: string;
  avatar: string | null;
  branchId?: string | null;
  branch?: { id: string; name?: string } | null;
}

export interface CreateUserBody {
  name: string;
  role: UserRoleApi;
  pin: string;
  avatar?: string;
  branchId?: string | null;
}

export type UpdateUserBody = Partial<CreateUserBody>;

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

/** Mapare răspuns API → model UI (avatar = inițiale dacă lipsește). */
export function userApiToUser(api: UserApi): {
  id: string;
  name: string;
  role: UserRoleApi;
  pin: string;
  avatar: string;
} {
  return {
    id: api.id,
    name: api.name,
    role: api.role,
    pin: api.pin,
    avatar: (api.avatar && api.avatar.trim()) || initialsFromName(api.name),
  };
}

export const usersApi = {
  list: () => request<UserApi[]>('/users'),
  get: (id: string) => request<UserApi | null>(`/users/${encodeURIComponent(id)}`),
  create: (body: CreateUserBody) =>
    request<UserApi>('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: UpdateUserBody) =>
    request<UserApi>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

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

export function normalizeTablePosition(
  raw: unknown,
): { x: number; y: number } | null {
  // Nu folosi `!raw`: obiectul { x: 0, y: 0 } este poziție validă (colț).
  if (raw === null || raw === undefined || raw === '') return null;

  let parsed: unknown = raw;
  for (let i = 0; i < 3 && typeof parsed === 'string'; i += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const maybe = parsed as { x?: unknown; y?: unknown };
  const x = typeof maybe.x === 'number' ? maybe.x : Number(maybe.x);
  const y = typeof maybe.y === 'number' ? maybe.y : Number(maybe.y);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;

  return { x, y };
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
  unitPrice: number;
  lineTotal: number;
  weightGrams?: number | null;
  modifications: { added?: string[]; removed?: string[]; notes?: string } | null;
  status: OrderItemStatusApi;
  startedAt?: string | null;
  readyAt?: string | null;
  complimentary?: boolean;
}

export interface OrderDeliveryAddressApi {
  id: number;
  orderId: number;
  addressLine: string;
  city?: string | null;
  postalCode?: string | null;
  notes?: string | null;
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
  orderType?:
    | 'restaurant'
    | 'takeaway'
    | 'phone'
    | 'glovo'
    | 'wolt'
    | 'bolt'
    | 'own_website'
    | 'kiosk';
  fulfillmentType?: 'dine_in' | 'takeaway' | null;
  items: OrderItemApi[];
  syncTiming?: boolean;
  paymentMethod?: 'cash' | 'card' | 'usage_card' | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  cui?: string | null;
  kioskId?: number | null;
  deliveryAddressDetail?: OrderDeliveryAddressApi | null;
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
  orderType?: 'restaurant' | 'takeaway' | 'phone' | 'glovo' | 'wolt' | 'bolt' | 'own_website' | 'kiosk';
  fulfillmentType?: 'dine_in' | 'takeaway';
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string | null;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  deliveryNotes?: string;
  kioskId?: number;
  paymentMethod?: 'cash' | 'card' | 'usage_card';
  items: CreateOrderItemBody[];
}

export interface KioskApi {
  id: number;
  number: number;
  name?: string | null;
  active: boolean;
}

export interface UpdateOrderBody {
  status?: OrderStatusApi;
  paymentMethod?: 'cash' | 'card' | 'usage_card';
  tip?: number;
  cui?: string;
  paidAt?: string;
}

export interface CustomerApi {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  orderHistory?: string[] | null;
  createdAt: string;
  notes?: string | null;
}

export interface CreateCustomerBody {
  name: string;
  phone?: string;
  email?: string;
  orderHistory?: string[];
  notes?: string;
}

export type UpdateCustomerBody = Partial<CreateCustomerBody>;

export type ReservationStatusApi = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled';
export type ReservationSourceApi = 'phone' | 'online' | 'walk-in';

export interface ReservationApi {
  id: number;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatusApi;
  notes?: string | null;
  source: ReservationSourceApi;
  createdAt: string;
  reservationTables?: { tableId: number }[];
}

export interface CreateReservationBody {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  time: string;
  partySize: number;
  status?: ReservationStatusApi;
  notes?: string;
  source: ReservationSourceApi;
  tableIds: number[];
}

export type UpdateReservationBody = Partial<CreateReservationBody>;

export const ordersApi = {
  getByTableId: (tableId: number, date?: string) => {
    const params = new URLSearchParams({ tableId: String(tableId) });
    if (date) params.set('date', date);
    return request<OrderApi[]>(`/orders?${params.toString()}`);
  },
  getAll: () => request<OrderApi[]>('/orders'),
  getOne: (id: number) => request<OrderApi | null>(`/orders/${id}`),
  create: (body: CreateOrderBody) =>
    request<OrderApi>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateOrderBody) =>
    request<OrderApi | null>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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

export const customersApi = {
  getAll: () => request<CustomerApi[]>('/customers'),
  getOne: (id: number) => request<CustomerApi | null>(`/customers/${id}`),
  create: (body: CreateCustomerBody) =>
    request<CustomerApi>('/customers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateCustomerBody) =>
    request<CustomerApi | null>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (id: number) => request<void>(`/customers/${id}`, { method: 'DELETE' }),
};

export const reservationsApi = {
  getAll: (date?: string) =>
    request<ReservationApi[]>(
      date ? `/reservations?date=${encodeURIComponent(date)}` : '/reservations',
    ),
  getOne: (id: number) => request<ReservationApi | null>(`/reservations/${id}`),
  create: (body: CreateReservationBody) =>
    request<ReservationApi>('/reservations', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateReservationBody) =>
    request<ReservationApi | null>(`/reservations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (id: number) => request<void>(`/reservations/${id}`, { method: 'DELETE' }),
};

export const kiosksApi = {
  getAll: () => request<KioskApi[]>('/kiosks'),
  getByNumber: (number: number) => request<KioskApi | null>(`/kiosks?number=${number}`),
  getOne: (id: number) => request<KioskApi | null>(`/kiosks/${id}`),
  create: (body: { number: number; name?: string; active?: boolean }) =>
    request<KioskApi>('/kiosks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { number?: number; name?: string; active?: boolean }) =>
    request<KioskApi | null>(`/kiosks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: number) => request<void>(`/kiosks/${id}`, { method: 'DELETE' }),
};

export const platformsApi = {
  getAll: (active?: boolean) =>
    request<SalesPlatformApi[]>(active === undefined ? '/platforms' : `/platforms?active=${active ? 'true' : 'false'}`),
  getOne: (id: number) => request<SalesPlatformApi | null>(`/platforms/${id}`),
  create: (body: CreateSalesPlatformBody) =>
    request<SalesPlatformApi>('/platforms', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: UpdateSalesPlatformBody) =>
    request<SalesPlatformApi | null>(`/platforms/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: number) => request<void>(`/platforms/${id}`, { method: 'DELETE' }),
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

export interface InventoryCountApi {
  id: number;
  inventoryId: number;
  scripticQuantity: number;
  countedQuantity: number;
  differenceQuantity: number;
  notes?: string | null;
  countedBy?: string | null;
  countedAt: string;
  inventory?: {
    id: number;
    menuItemId: number;
    zoneId: number;
    quantity: number;
    unit: string;
    menuItem?: { id: number; name: string; category: string; price?: number };
    zone?: { id: number; name: string };
  };
}

export const storageApi = {
  getZones: () => request<StorageZoneApi[]>('/storage/zones'),
  getZone: (id: number) => request<StorageZoneApi | null>(`/storage/zones/${id}`),
  createZone: (body: { name: string; code?: string }) => request<StorageZoneApi>('/storage/zones', { method: 'POST', body: JSON.stringify(body) }),
  updateZone: (id: number, body: { name?: string; code?: string }) => request<StorageZoneApi>(`/storage/zones/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteZone: (id: number) => request<void>(`/storage/zones/${id}`, { method: 'DELETE' }),
  getInventory: (zoneId?: number) => request<InventoryApi[]>(zoneId != null ? `/storage/inventory?zoneId=${zoneId}` : '/storage/inventory'),
  upsertInventory: (body: { menuItemId: number; zoneId: number; quantity: number; unit?: string }) => request<InventoryApi>('/storage/inventory', { method: 'POST', body: JSON.stringify(body) }),
  getInventoryCounts: (zoneId?: number) => request<InventoryCountApi[]>(zoneId != null ? `/storage/inventory-counts?zoneId=${zoneId}` : '/storage/inventory-counts'),
  recordInventoryCount: (body: { inventoryId: number; countedQuantity: number; notes?: string; countedBy?: string }) =>
    request<InventoryCountApi>('/storage/inventory-counts', { method: 'POST', body: JSON.stringify(body) }),
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

// --- Billing / multi-tenant (abonamente, facturi) ---
export interface SubscriptionPlanApi {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthRon: string;
  maxLocations: number | null;
  maxUsers: number | null;
  features: string[];
  modulesEnabled: string[];
  supportLevel: string | null;
  badge: string | null;
  sortOrder: number;
  marketingActiveClients: number;
  isActive: boolean;
}

export interface TenantApi {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSubscriptionApi {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface TenantWithSubscriptionRowApi {
  tenant: TenantApi;
  subscription: TenantSubscriptionApi | null;
  plan: SubscriptionPlanApi | null;
}

export interface InvoiceApi {
  id: string;
  tenantId: string;
  tenantSubscriptionId: string | null;
  invoiceNumber: string | null;
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

const billingReq = <T>(path: string, init?: RequestInit) =>
  request<T>(path, { ...init, headers: { ...billingAuthHeaders(), ...init?.headers } });

export const billingApi = {
  getPlans: () => billingReq<SubscriptionPlanApi[]>('/billing/plans'),
  getTenants: () => billingReq<TenantWithSubscriptionRowApi[]>('/billing/tenants'),
  getInvoices: (tenantId: string) =>
    billingReq<InvoiceApi[]>(`/billing/tenants/${encodeURIComponent(tenantId)}/invoices`),
  createInvoice: (body: {
    tenantId: string;
    tenantSubscriptionId?: string;
    invoiceNumber?: string;
    amount: number;
    currency?: string;
    status?: string;
    description?: string;
    issuedAt?: string;
    dueAt?: string;
  }) =>
    billingReq<InvoiceApi>('/billing/invoices', { method: 'POST', body: JSON.stringify(body) }),
};
