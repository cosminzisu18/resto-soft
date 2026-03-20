// Types
export interface User {
  id: string;
  name: string;
  role: "waiter" | "admin" | "kitchen";
  pin: string;
  avatar: string;
}

export interface Table {
  id: number;
  number: number;
  seats: number;
  status: "free" | "occupied" | "reserved";
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
  /** Culoare opțională pe hartă (editor) */
  color?: string;
  /** Mock: string; API masă: number (orders.id INT) */
  currentOrderId?: string | number;
  reservationId?: string;
  currentGuests?: number;
  mergedWith?: number[];
  qrCode?: string;
}

// Allergens system
export interface Allergen {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const allergens: Allergen[] = [
  { id: "gluten", name: "Gluten", icon: "🌾", color: "bg-amber-500" },
  { id: "lactose", name: "Lactoză", icon: "🥛", color: "bg-blue-400" },
  { id: "nuts", name: "Nuci", icon: "🥜", color: "bg-amber-700" },
  { id: "eggs", name: "Ouă", icon: "🥚", color: "bg-yellow-400" },
  { id: "fish", name: "Pește", icon: "🐟", color: "bg-cyan-500" },
  { id: "shellfish", name: "Crustacee", icon: "🦐", color: "bg-red-400" },
  { id: "soy", name: "Soia", icon: "🫘", color: "bg-green-600" },
  { id: "celery", name: "Țelină", icon: "🥬", color: "bg-green-500" },
  { id: "mustard", name: "Muștar", icon: "🟡", color: "bg-yellow-500" },
  { id: "sesame", name: "Susan", icon: "⚪", color: "bg-stone-400" },
];

export type UnitType = "buc" | "portie" | "gram";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  kdsStation: string;
  prepTime: number;
  ingredients: string[];
  allergenIds?: string[];
  availableExtras?: string[]; // IDs of extra ingredients available for this item
  image?: string;
  unitType?: UnitType; // 'buc' = per piece (default), 'portie' = per portion, 'gram' = price per 100g
  availability?: {
    restaurant: boolean;
    kiosk: boolean;
    app: boolean;
    delivery: boolean;
  };
  platformPricing?: {
    glovo?: { name: string; price: number; enabled: boolean };
    wolt?: { name: string; price: number; enabled: boolean };
    bolt?: { name: string; price: number; enabled: boolean };
    own?: { name: string; price: number; enabled: boolean };
  };
}

export interface ExtraIngredient {
  id: string;
  name: string;
  price: number;
  category: string;
}

export const extraIngredientCategories = [
  "Brânzeturi",
  "Carne",
  "Legume",
  "Sosuri",
  "Altele",
];

export const kioskSteps = [
  { id: "welcome", name: "Bun venit", enabled: true, order: 1 },
  { id: "categories", name: "Categorii", enabled: true, order: 2 },
  { id: "menu", name: "Meniu", enabled: true, order: 3 },
  { id: "customize", name: "Personalizare", enabled: true, order: 4 },
  { id: "cart", name: "Coș", enabled: true, order: 5 },
  { id: "payment", name: "Plată", enabled: true, order: 6 },
  { id: "confirmation", name: "Confirmare", enabled: true, order: 7 },
];

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  weightGrams?: number; // used when unitType is 'gram'
  modifications: {
    added: string[];
    removed: string[];
    notes: string;
  };
  status: "pending" | "cooking" | "ready" | "served";
  startedAt?: Date;
  readyAt?: Date;
  complimentary?: boolean;
}

export type OrderSource =
  | "restaurant"
  | "glovo"
  | "wolt"
  | "bolt"
  | "own_website"
  | "phone"
  | "kiosk";
export type PaymentMethod = "cash" | "card" | "usage_card";

export interface UsageCard {
  id: string;
  barcode: string;
  customerId: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: CustomerAddress[];
  usageCards: UsageCard[];
  orderHistory: string[]; // Order IDs
  createdAt: Date;
  notes?: string;
}

export interface Order {
  id: string;
  tableId?: number;
  tableNumber?: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  syncTiming: boolean;
  totalAmount: number;
  tip?: number;
  cui?: string;
  paidAt?: Date;
  source: OrderSource;
  deliveryAddress?: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  platformOrderId?: string;
  estimatedDeliveryTime?: Date;
  priority?: number;
  paymentMethod?: PaymentMethod;
  usageCardId?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: Date;
  time: string;
  partySize: number;
  tableIds: number[];
  status: "pending" | "confirmed" | "arrived" | "completed" | "cancelled";
  notes?: string;
  source: "phone" | "online" | "walk-in";
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: "order_ready" | "new_order" | "reservation" | "delivery" | "urgent";
  title: string;
  message: string;
  orderId?: string;
  tableNumber?: number;
  read: boolean;
  createdAt: Date;
  targetRole?: "waiter" | "kitchen" | "admin";
  targetUserId?: string;
}

export interface KDSStation {
  id: string;
  name: string;
  type: "soups" | "pizza" | "grill" | "giros";
  color: string;
  icon: string;
}

export interface DeliveryPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  apiConnected: boolean;
}

// Mock Users
export const users: User[] = [
  { id: "1", name: "Maria Popescu", role: "waiter", pin: "1234", avatar: "MP" },
  { id: "2", name: "Ion Ionescu", role: "waiter", pin: "5678", avatar: "II" },
  {
    id: "3",
    name: "Elena Vasilescu",
    role: "waiter",
    pin: "9012",
    avatar: "EV",
  },
  { id: "4", name: "Admin", role: "admin", pin: "0000", avatar: "AD" },
  { id: "5", name: "Bucătar Supe", role: "kitchen", pin: "1111", avatar: "BS" },
  {
    id: "6",
    name: "Bucătar Pizza",
    role: "kitchen",
    pin: "2222",
    avatar: "BP",
  },
  {
    id: "7",
    name: "Bucătar Grill",
    role: "kitchen",
    pin: "3333",
    avatar: "BG",
  },
  {
    id: "8",
    name: "Bucătar Giros",
    role: "kitchen",
    pin: "4444",
    avatar: "BK",
  },
];

// KDS Stations
export const kdsStations: KDSStation[] = [
  {
    id: "soups",
    name: "Supe & Ciorbe",
    type: "soups",
    color: "bg-amber-500",
    icon: "🍲",
  },
  {
    id: "pizza",
    name: "Pizza",
    type: "pizza",
    color: "bg-red-500",
    icon: "🍕",
  },
  {
    id: "grill",
    name: "Grill & Mâncare Gătită",
    type: "grill",
    color: "bg-orange-500",
    icon: "🔥",
  },
  {
    id: "giros",
    name: "Giros & Doner",
    type: "giros",
    color: "bg-yellow-500",
    icon: "🥙",
  },
];

// Delivery Platforms
export const deliveryPlatforms: DeliveryPlatform[] = [
  {
    id: "glovo",
    name: "Glovo",
    icon: "🟡",
    color: "bg-yellow-400",
    enabled: true,
    apiConnected: true,
  },
  {
    id: "wolt",
    name: "Wolt",
    icon: "🔵",
    color: "bg-blue-500",
    enabled: true,
    apiConnected: true,
  },
  {
    id: "bolt",
    name: "Bolt Food",
    icon: "🟢",
    color: "bg-green-500",
    enabled: true,
    apiConnected: false,
  },
  {
    id: "own",
    name: "Website propriu",
    icon: "🏠",
    color: "bg-primary",
    enabled: true,
    apiConnected: true,
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: "c1",
    name: "Alexandru Popa",
    phone: "0741234567",
    email: "alex.popa@email.com",
    addresses: [
      {
        id: "a1",
        label: "Acasă",
        street: "Str. Victoriei 123, Ap. 4",
        city: "București",
        isDefault: true,
      },
      {
        id: "a2",
        label: "Birou",
        street: "Bd. Unirii 50, Et. 3",
        city: "București",
        isDefault: false,
      },
    ],
    usageCards: [
      {
        id: "uc1",
        barcode: "1234567890123",
        customerId: "c1",
        balance: 250,
        isActive: true,
        createdAt: new Date("2024-01-15"),
      },
    ],
    orderHistory: ["oh1", "oh2", "oh3"],
    createdAt: new Date("2023-06-15"),
    notes: "Client fidel, preferă livrare seara",
  },
  {
    id: "c2",
    name: "Maria Ionescu",
    phone: "0751234567",
    email: "maria.ionescu@email.com",
    addresses: [
      {
        id: "a3",
        label: "Acasă",
        street: "Bd. Unirii 45, Et. 2",
        city: "București",
        isDefault: true,
      },
    ],
    usageCards: [
      {
        id: "uc2",
        barcode: "9876543210123",
        customerId: "c2",
        balance: 100,
        isActive: true,
        createdAt: new Date("2024-02-20"),
      },
      {
        id: "uc3",
        barcode: "5555666677778",
        customerId: "c2",
        balance: 500,
        isActive: true,
        createdAt: new Date("2024-03-10"),
      },
    ],
    orderHistory: ["oh4", "oh5"],
    createdAt: new Date("2023-09-20"),
  },
  {
    id: "c3",
    name: "Andrei Marinescu",
    phone: "0721234567",
    email: "andrei@email.com",
    addresses: [
      {
        id: "a4",
        label: "Acasă",
        street: "Str. Florilor 78",
        city: "București",
        isDefault: true,
      },
      {
        id: "a5",
        label: "Casă Părinți",
        street: "Str. Libertății 12",
        city: "Ploiești",
        isDefault: false,
      },
    ],
    usageCards: [],
    orderHistory: ["oh6"],
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "c4",
    name: "Elena Dumitrescu",
    phone: "0761234567",
    email: "elena.d@email.com",
    addresses: [
      {
        id: "a6",
        label: "Acasă",
        street: "Calea Dorobanți 100",
        city: "București",
        isDefault: true,
      },
    ],
    usageCards: [
      {
        id: "uc4",
        barcode: "1111222233334",
        customerId: "c4",
        balance: 750,
        isActive: true,
        createdAt: new Date("2024-01-05"),
      },
    ],
    orderHistory: ["oh7", "oh8", "oh9", "oh10"],
    createdAt: new Date("2023-03-15"),
    notes: "Alergică la gluten",
  },
];

// Menu Items with platform pricing, availability, allergens and available extras
export const menuItems: MenuItem[] = [
  // Supe
  {
    id: "m1",
    name: "Ciorbă de burtă",
    description: "Ciorbă tradițională cu smântână și ardei iute",
    price: 22,
    category: "Supe",
    kdsStation: "soups",
    prepTime: 5,
    ingredients: ["Burtă", "Smântână", "Usturoi", "Oțet", "Ardei iute"],
    allergenIds: ["lactose", "celery"],
    availableExtras: ["ei16", "ei18", "ei19"],
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
    platformPricing: {
      glovo: { name: "Ciorbă de Burtă Premium", price: 28, enabled: true },
      wolt: { name: "Ciorbă de Burtă", price: 27, enabled: true },
      bolt: { name: "Ciorbă Burtă", price: 26, enabled: true },
      own: { name: "Ciorbă de burtă", price: 24, enabled: true },
    },
  },
  {
    id: "m2",
    name: "Supă de pui cu tăiței",
    description: "Supă de casă cu legume proaspete",
    price: 18,
    category: "Supe",
    kdsStation: "soups",
    prepTime: 5,
    ingredients: ["Pui", "Tăiței", "Morcov", "Țelină", "Pătrunjel"],
    allergenIds: ["gluten", "eggs", "celery"],
    availableExtras: ["ei16", "ei19"],
    platformPricing: {
      glovo: { name: "Supă Pui cu Tăiței", price: 23, enabled: true },
      wolt: { name: "Supă de Pui", price: 22, enabled: true },
      bolt: { name: "Supă Pui", price: 21, enabled: true },
      own: { name: "Supă de pui cu tăiței", price: 20, enabled: true },
    },
  },
  {
    id: "m3",
    name: "Ciorbă de legume",
    description: "Ciorbă vegetariană de sezon",
    price: 16,
    category: "Supe",
    kdsStation: "soups",
    prepTime: 5,
    ingredients: ["Cartofi", "Morcov", "Fasole verde", "Roșii", "Leuștean"],
    allergenIds: ["celery"],
    availableExtras: ["ei16", "ei19"],
  },

  // Pizza
  {
    id: "m4",
    name: "Pizza Margherita",
    description: "Sos de roșii, mozzarella, busuioc",
    price: 32,
    category: "Pizza",
    kdsStation: "pizza",
    prepTime: 15,
    ingredients: ["Sos roșii", "Mozzarella", "Busuioc", "Ulei de măsline"],
    allergenIds: ["gluten", "lactose"],
    availableExtras: [
      "ei1",
      "ei2",
      "ei3",
      "ei5",
      "ei6",
      "ei10",
      "ei11",
      "ei13",
      "ei14",
      "ei15",
    ],
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
    platformPricing: {
      glovo: { name: "Pizza Margherita Classica", price: 42, enabled: true },
      wolt: { name: "Margherita", price: 40, enabled: true },
      bolt: { name: "Pizza Margherita", price: 39, enabled: true },
      own: { name: "Pizza Margherita", price: 36, enabled: true },
    },
  },
  {
    id: "m5",
    name: "Pizza Quattro Formaggi",
    description: "Patru tipuri de brânză",
    price: 42,
    category: "Pizza",
    kdsStation: "pizza",
    prepTime: 15,
    ingredients: ["Mozzarella", "Gorgonzola", "Parmezan", "Brie"],
    allergenIds: ["gluten", "lactose"],
    availableExtras: ["ei1", "ei2", "ei3", "ei5", "ei10", "ei13"],
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m6",
    name: "Pizza Diavola",
    description: "Salam picant și ardei",
    price: 38,
    category: "Pizza",
    kdsStation: "pizza",
    prepTime: 15,
    ingredients: ["Sos roșii", "Mozzarella", "Salam picant", "Ardei iute"],
    allergenIds: ["gluten", "lactose"],
    availableExtras: ["ei1", "ei2", "ei10", "ei11", "ei15"],
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
    availability: { restaurant: true, kiosk: true, app: false, delivery: true },
  },
  {
    id: "m7",
    name: "Pizza Prosciutto",
    description: "Șuncă de Parma și rucola",
    price: 45,
    category: "Pizza",
    kdsStation: "pizza",
    prepTime: 15,
    ingredients: ["Mozzarella", "Prosciutto", "Rucola", "Parmezan"],
    allergenIds: ["gluten", "lactose"],
    availableExtras: ["ei1", "ei2", "ei3", "ei10", "ei13"],
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    availability: { restaurant: true, kiosk: false, app: true, delivery: true },
  },

  // Grill & Mâncare Gătită
  {
    id: "m8",
    name: "Mici (10 buc)",
    description: "Mititei tradiționali la grătar",
    price: 35,
    category: "Grill",
    kdsStation: "grill",
    prepTime: 12,
    ingredients: ["Carne de vită", "Carne de porc", "Condimente", "Muștar"],
    allergenIds: ["mustard"],
    availableExtras: ["ei16", "ei17", "ei18", "ei22"],
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: false },
  },
  {
    id: "m9",
    name: "Cotlet de porc",
    description: "Cotlet la grătar cu garnitură",
    price: 42,
    category: "Grill",
    kdsStation: "grill",
    prepTime: 18,
    ingredients: ["Cotlet porc", "Rozmarin", "Usturoi", "Cartofi"],
    availableExtras: ["ei16", "ei17", "ei19", "ei22"],
    image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m10",
    name: "Ceafă de porc",
    description: "Ceafă la grătar marinată",
    price: 45,
    category: "Grill",
    kdsStation: "grill",
    prepTime: 20,
    ingredients: ["Ceafă porc", "Condimente", "Ceapă", "Mujdei"],
    availableExtras: ["ei16", "ei17", "ei19", "ei22"],
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m11",
    name: "Sarmale (5 buc)",
    description: "Sarmale în foi de varză cu smântână",
    price: 38,
    category: "Tradițional",
    kdsStation: "grill",
    prepTime: 8,
    ingredients: ["Carne tocată", "Orez", "Varză", "Smântână", "Mămăligă"],
    allergenIds: ["lactose"],
    availableExtras: ["ei16", "ei19"],
    image: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400",
    availability: { restaurant: true, kiosk: false, app: true, delivery: true },
  },
  {
    id: "m12",
    name: "Tocăniță de pui",
    description: "Cu mămăliguță și smântână",
    price: 35,
    category: "Tradițional",
    kdsStation: "grill",
    prepTime: 10,
    ingredients: ["Pui", "Ceapă", "Boia", "Mămăligă", "Smântână"],
    allergenIds: ["lactose"],
    availableExtras: ["ei16", "ei19"],
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },

  // Giros & Doner
  {
    id: "m13",
    name: "Kebab pui",
    description: "Kebab cu carne de pui și salată",
    price: 28,
    category: "Giros",
    kdsStation: "giros",
    prepTime: 8,
    ingredients: ["Pui", "Salată", "Roșii", "Ceapă", "Sos usturoi"],
    allergenIds: ["gluten", "mustard"],
    availableExtras: ["ei8", "ei10", "ei11", "ei15", "ei16", "ei17", "ei18"],
    image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
    platformPricing: {
      glovo: { name: "Kebab de Pui XXL", price: 36, enabled: true },
      wolt: { name: "Kebab Pui", price: 34, enabled: true },
      bolt: { name: "Kebab Pui Mare", price: 33, enabled: true },
      own: { name: "Kebab pui", price: 30, enabled: true },
    },
  },
  {
    id: "m14",
    name: "Kebab vită",
    description: "Kebab cu carne de vită și legume",
    price: 32,
    category: "Giros",
    kdsStation: "giros",
    prepTime: 8,
    ingredients: ["Vită", "Salată", "Roșii", "Castraveți", "Sos"],
    allergenIds: ["gluten", "mustard"],
    availableExtras: ["ei9", "ei10", "ei11", "ei16", "ei17", "ei18"],
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m15",
    name: "Doner la farfurie",
    description: "Doner cu cartofi și salată",
    price: 38,
    category: "Giros",
    kdsStation: "giros",
    prepTime: 10,
    ingredients: ["Carne doner", "Cartofi prăjiți", "Salată", "Sos"],
    allergenIds: ["gluten"],
    availableExtras: ["ei8", "ei9", "ei16", "ei17", "ei22"],
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m16",
    name: "Shaorma mare",
    description: "Shaorma cu de toate",
    price: 30,
    category: "Giros",
    kdsStation: "giros",
    prepTime: 8,
    ingredients: ["Carne pui", "Cartofi", "Varză", "Morcov", "Sos"],
    allergenIds: ["gluten", "mustard"],
    availableExtras: ["ei8", "ei10", "ei11", "ei16", "ei17", "ei18"],
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },

  // Garnituri
  {
    id: "m17",
    name: "Cartofi prăjiți",
    description: "Porție cartofi aurii",
    price: 12,
    category: "Garnituri",
    kdsStation: "grill",
    prepTime: 8,
    ingredients: ["Cartofi", "Sare"],
    availableExtras: ["ei16", "ei17", "ei18"],
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
    unitType: "portie",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m18",
    name: "Salată mixtă",
    description: "Salată de sezon",
    price: 8,
    category: "Garnituri",
    kdsStation: "grill",
    prepTime: 3,
    ingredients: ["Roșii", "Castraveți", "Ceapă", "Măsline"],
    availableExtras: ["ei4", "ei21"],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    unitType: "gram",
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },

  // Băuturi
  {
    id: "m19",
    name: "Cola 330ml",
    description: "",
    price: 8,
    category: "Băuturi",
    kdsStation: "grill",
    prepTime: 0,
    ingredients: [],
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m20",
    name: "Apă plată 500ml",
    description: "",
    price: 6,
    category: "Băuturi",
    kdsStation: "grill",
    prepTime: 0,
    ingredients: [],
    availability: { restaurant: true, kiosk: true, app: true, delivery: true },
  },
  {
    id: "m21",
    name: "Bere Ursus 500ml",
    description: "",
    price: 12,
    category: "Băuturi",
    kdsStation: "grill",
    prepTime: 0,
    ingredients: [],
    availability: {
      restaurant: true,
      kiosk: false,
      app: false,
      delivery: false,
    },
  },
];

// Tables
export const initialTables: Table[] = [
  {
    id: 1,
    number: 1,
    seats: 2,
    status: "free",
    position: { x: 10, y: 15 },
    shape: "round",
    currentGuests: 0,
  },
  {
    id: 2,
    number: 2,
    seats: 2,
    status: "free",
    position: { x: 30, y: 15 },
    shape: "round",
    currentGuests: 0,
  },
  {
    id: 3,
    number: 3,
    seats: 4,
    status: "occupied",
    position: { x: 50, y: 15 },
    shape: "square",
    currentGuests: 3,
  },
  {
    id: 4,
    number: 4,
    seats: 4,
    status: "free",
    position: { x: 70, y: 15 },
    shape: "square",
    currentGuests: 0,
  },
  {
    id: 5,
    number: 5,
    seats: 6,
    status: "reserved",
    position: { x: 10, y: 45 },
    shape: "rectangle",
    currentGuests: 0,
  },
  {
    id: 6,
    number: 6,
    seats: 6,
    status: "free",
    position: { x: 40, y: 45 },
    shape: "rectangle",
    currentGuests: 0,
  },
  {
    id: 7,
    number: 7,
    seats: 4,
    status: "occupied",
    position: { x: 70, y: 45 },
    shape: "square",
    currentGuests: 4,
  },
  {
    id: 8,
    number: 8,
    seats: 8,
    status: "free",
    position: { x: 25, y: 75 },
    shape: "rectangle",
    currentGuests: 0,
  },
  {
    id: 9,
    number: 9,
    seats: 4,
    status: "free",
    position: { x: 60, y: 75 },
    shape: "square",
    currentGuests: 0,
  },
];

// Categories for menu
export const menuCategories = [
  "Supe",
  "Pizza",
  "Grill",
  "Tradițional",
  "Giros",
  "Garnituri",
  "Băuturi",
];

// Extra ingredients that can be added (defined by admin)
export const extraIngredients: ExtraIngredient[] = [
  { id: "ei1", name: "Mozzarella extra", price: 5, category: "Brânzeturi" },
  { id: "ei2", name: "Parmezan", price: 4, category: "Brânzeturi" },
  { id: "ei3", name: "Gorgonzola", price: 6, category: "Brânzeturi" },
  { id: "ei4", name: "Feta", price: 5, category: "Brânzeturi" },
  { id: "ei5", name: "Bacon", price: 6, category: "Carne" },
  { id: "ei6", name: "Șuncă", price: 5, category: "Carne" },
  { id: "ei7", name: "Salam", price: 4, category: "Carne" },
  { id: "ei8", name: "Pui extra", price: 8, category: "Carne" },
  { id: "ei9", name: "Vită extra", price: 10, category: "Carne" },
  { id: "ei10", name: "Ciuperci", price: 4, category: "Legume" },
  { id: "ei11", name: "Ardei gras", price: 3, category: "Legume" },
  { id: "ei12", name: "Ceapă caramelizată", price: 4, category: "Legume" },
  { id: "ei13", name: "Măsline", price: 3, category: "Legume" },
  { id: "ei14", name: "Roșii uscate", price: 5, category: "Legume" },
  { id: "ei15", name: "Jalapeño", price: 3, category: "Legume" },
  { id: "ei16", name: "Sos usturoi", price: 3, category: "Sosuri" },
  { id: "ei17", name: "Sos BBQ", price: 3, category: "Sosuri" },
  { id: "ei18", name: "Sos iute", price: 2, category: "Sosuri" },
  { id: "ei19", name: "Smântână", price: 3, category: "Sosuri" },
  { id: "ei20", name: "Ou prăjit", price: 4, category: "Altele" },
  { id: "ei21", name: "Avocado", price: 8, category: "Altele" },
  { id: "ei22", name: "Cartofi extra", price: 5, category: "Altele" },
];

// Sample order history items (for customer history)
export const orderHistoryItems: {
  orderId: string;
  customerId: string;
  items: { menuItemId: string; quantity: number }[];
  date: Date;
  total: number;
}[] = [
  {
    orderId: "oh1",
    customerId: "c1",
    items: [
      { menuItemId: "m4", quantity: 2 },
      { menuItemId: "m13", quantity: 1 },
    ],
    date: new Date("2024-03-10"),
    total: 92,
  },
  {
    orderId: "oh2",
    customerId: "c1",
    items: [
      { menuItemId: "m1", quantity: 1 },
      { menuItemId: "m8", quantity: 1 },
    ],
    date: new Date("2024-03-05"),
    total: 57,
  },
  {
    orderId: "oh3",
    customerId: "c1",
    items: [
      { menuItemId: "m16", quantity: 2 },
      { menuItemId: "m17", quantity: 1 },
    ],
    date: new Date("2024-02-28"),
    total: 72,
  },
  {
    orderId: "oh4",
    customerId: "c2",
    items: [
      { menuItemId: "m5", quantity: 1 },
      { menuItemId: "m19", quantity: 2 },
    ],
    date: new Date("2024-03-12"),
    total: 58,
  },
  {
    orderId: "oh5",
    customerId: "c2",
    items: [{ menuItemId: "m11", quantity: 2 }],
    date: new Date("2024-03-01"),
    total: 76,
  },
  {
    orderId: "oh6",
    customerId: "c3",
    items: [
      { menuItemId: "m9", quantity: 1 },
      { menuItemId: "m18", quantity: 1 },
    ],
    date: new Date("2024-03-08"),
    total: 56,
  },
  {
    orderId: "oh7",
    customerId: "c4",
    items: [
      { menuItemId: "m2", quantity: 2 },
      { menuItemId: "m12", quantity: 1 },
    ],
    date: new Date("2024-03-11"),
    total: 71,
  },
  {
    orderId: "oh8",
    customerId: "c4",
    items: [
      { menuItemId: "m14", quantity: 1 },
      { menuItemId: "m15", quantity: 1 },
    ],
    date: new Date("2024-03-09"),
    total: 70,
  },
  {
    orderId: "oh9",
    customerId: "c4",
    items: [{ menuItemId: "m7", quantity: 1 }],
    date: new Date("2024-03-03"),
    total: 45,
  },
  {
    orderId: "oh10",
    customerId: "c4",
    items: [
      { menuItemId: "m10", quantity: 1 },
      { menuItemId: "m17", quantity: 2 },
    ],
    date: new Date("2024-02-25"),
    total: 69,
  },
];

// Sample reservations
export const sampleReservations: Reservation[] = [
  {
    id: "r1",
    customerName: "Andrei Marinescu",
    customerPhone: "0721234567",
    customerEmail: "andrei@email.com",
    date: new Date(),
    time: "19:00",
    partySize: 4,
    tableIds: [4],
    status: "confirmed",
    notes: "Aniversare",
    source: "online",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000),
  },
  {
    id: "r2",
    customerName: "Familia Popescu",
    customerPhone: "0731234567",
    date: new Date(),
    time: "20:30",
    partySize: 6,
    tableIds: [5],
    status: "pending",
    source: "phone",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000),
  },
];

// Sample notifications
export const sampleNotifications: Notification[] = [
  {
    id: "n1",
    type: "order_ready",
    title: "Comandă gata",
    message: "Pizza Margherita pentru Masa 3 este gata",
    orderId: "o1",
    tableNumber: 3,
    read: false,
    createdAt: new Date(),
    targetRole: "waiter",
  },
  {
    id: "n2",
    type: "new_order",
    title: "Comandă nouă Glovo",
    message: "Comandă nouă primită de la Glovo - #GLV12345",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60000),
    targetRole: "admin",
  },
  {
    id: "n3",
    type: "reservation",
    title: "Rezervare nouă",
    message: "Rezervare pentru 4 persoane la 19:00",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000),
    targetRole: "admin",
  },
];

// Sample orders for demo - expanded with more items and sync examples
export const sampleOrders: Order[] = [
  // Order 1: Multiple pizzas - SYNC enabled (all items should be ready together)
  {
    id: "o1",
    tableId: 3,
    tableNumber: 3,
    waiterId: "1",
    waiterName: "Maria Popescu",
    items: [
      {
        id: "oi1",
        menuItemId: "m4",
        menuItem: menuItems.find((m) => m.id === "m4")!,
        quantity: 2,
        modifications: { added: ["Extra mozzarella"], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 8 * 60000),
      },
      {
        id: "oi1b",
        menuItemId: "m5",
        menuItem: menuItems.find((m) => m.id === "m5")!,
        quantity: 1,
        modifications: {
          added: [],
          removed: ["Gorgonzola"],
          notes: "Alergie lactoza",
        },
        status: "cooking",
        startedAt: new Date(Date.now() - 8 * 60000),
      },
      {
        id: "oi1c",
        menuItemId: "m6",
        menuItem: menuItems.find((m) => m.id === "m6")!,
        quantity: 1,
        modifications: { added: ["Extra ardei iute"], removed: [], notes: "" },
        status: "pending",
      },
      {
        id: "oi2",
        menuItemId: "m1",
        menuItem: menuItems.find((m) => m.id === "m1")!,
        quantity: 2,
        modifications: {
          added: [],
          removed: ["Ardei iute"],
          notes: "Fara ardei",
        },
        status: "pending",
      },
      {
        id: "oi2b",
        menuItemId: "m19",
        menuItem: menuItems.find((m) => m.id === "m19")!,
        quantity: 4,
        modifications: { added: [], removed: [], notes: "" },
        status: "ready",
        startedAt: new Date(Date.now() - 1 * 60000),
        readyAt: new Date(),
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 10 * 60000),
    syncTiming: true,
    totalAmount: 188,
    source: "restaurant",
  },
  // Order 2: Mixed items - Grill + Giros - SYNC enabled
  {
    id: "o2",
    tableId: 7,
    tableNumber: 7,
    waiterId: "2",
    waiterName: "Ion Ionescu",
    items: [
      {
        id: "oi3",
        menuItemId: "m13",
        menuItem: menuItems.find((m) => m.id === "m13")!,
        quantity: 2,
        modifications: { added: ["Extra sos usturoi"], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 3 * 60000),
      },
      {
        id: "oi3b",
        menuItemId: "m14",
        menuItem: menuItems.find((m) => m.id === "m14")!,
        quantity: 1,
        modifications: { added: [], removed: ["Ceapa"], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 3 * 60000),
      },
      {
        id: "oi4",
        menuItemId: "m8",
        menuItem: menuItems.find((m) => m.id === "m8")!,
        quantity: 2,
        modifications: { added: [], removed: [], notes: "" },
        status: "ready",
        startedAt: new Date(Date.now() - 12 * 60000),
        readyAt: new Date(),
      },
      {
        id: "oi4b",
        menuItemId: "m9",
        menuItem: menuItems.find((m) => m.id === "m9")!,
        quantity: 1,
        modifications: {
          added: ["Extra usturoi"],
          removed: [],
          notes: "Bine facut",
        },
        status: "cooking",
        startedAt: new Date(Date.now() - 15 * 60000),
      },
      {
        id: "oi4c",
        menuItemId: "m17",
        menuItem: menuItems.find((m) => m.id === "m17")!,
        quantity: 3,
        modifications: { added: [], removed: [], notes: "" },
        status: "pending",
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 15 * 60000),
    syncTiming: true,
    totalAmount: 203,
    source: "restaurant",
  },
  // Order 3: Delivery Glovo - Multiple pizzas
  {
    id: "o3",
    waiterId: "1",
    waiterName: "Sistem",
    items: [
      {
        id: "oi5",
        menuItemId: "m4",
        menuItem: menuItems.find((m) => m.id === "m4")!,
        quantity: 2,
        modifications: { added: [], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 5 * 60000),
      },
      {
        id: "oi5b",
        menuItemId: "m7",
        menuItem: menuItems.find((m) => m.id === "m7")!,
        quantity: 1,
        modifications: { added: ["Extra prosciutto"], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 5 * 60000),
      },
      {
        id: "oi6",
        menuItemId: "m13",
        menuItem: menuItems.find((m) => m.id === "m13")!,
        quantity: 2,
        modifications: { added: ["Extra sos"], removed: [], notes: "" },
        status: "pending",
      },
      {
        id: "oi6b",
        menuItemId: "m19",
        menuItem: menuItems.find((m) => m.id === "m19")!,
        quantity: 3,
        modifications: { added: [], removed: [], notes: "" },
        status: "ready",
        startedAt: new Date(Date.now() - 1 * 60000),
        readyAt: new Date(),
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 6 * 60000),
    syncTiming: true,
    totalAmount: 189,
    source: "glovo",
    platformOrderId: "GLV-12345",
    customerName: "Alexandru Popa",
    customerPhone: "0741234567",
    customerId: "c1",
    deliveryAddress: "Str. Victoriei 123, Ap. 4, Bucuresti",
    priority: 1,
  },
  // Order 4: Delivery Wolt - Giros focus
  {
    id: "o4",
    waiterId: "1",
    waiterName: "Sistem",
    items: [
      {
        id: "oi7",
        menuItemId: "m16",
        menuItem: menuItems.find((m) => m.id === "m16")!,
        quantity: 2,
        modifications: { added: [], removed: ["Varza"], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 4 * 60000),
      },
      {
        id: "oi7b",
        menuItemId: "m15",
        menuItem: menuItems.find((m) => m.id === "m15")!,
        quantity: 1,
        modifications: { added: ["Extra carne"], removed: [], notes: "" },
        status: "pending",
      },
      {
        id: "oi7c",
        menuItemId: "m20",
        menuItem: menuItems.find((m) => m.id === "m20")!,
        quantity: 2,
        modifications: { added: [], removed: [], notes: "" },
        status: "ready",
        startedAt: new Date(Date.now() - 1 * 60000),
        readyAt: new Date(),
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 5 * 60000),
    syncTiming: true,
    totalAmount: 110,
    source: "wolt",
    platformOrderId: "WLT-67890",
    customerName: "Maria Ionescu",
    customerPhone: "0751234567",
    customerId: "c2",
    deliveryAddress: "Bd. Unirii 45, Et. 2, Bucuresti",
    priority: 2,
  },
  // Order 5: Table 4 - Supe + Traditional - SYNC (different prep times)
  {
    id: "o5",
    tableId: 4,
    tableNumber: 4,
    waiterId: "3",
    waiterName: "Elena Vasilescu",
    items: [
      {
        id: "oi8",
        menuItemId: "m2",
        menuItem: menuItems.find((m) => m.id === "m2")!,
        quantity: 2,
        modifications: { added: [], removed: [], notes: "" },
        status: "pending",
      },
      {
        id: "oi8b",
        menuItemId: "m3",
        menuItem: menuItems.find((m) => m.id === "m3")!,
        quantity: 1,
        modifications: { added: ["Extra legume"], removed: [], notes: "" },
        status: "pending",
      },
      {
        id: "oi9",
        menuItemId: "m11",
        menuItem: menuItems.find((m) => m.id === "m11")!,
        quantity: 2,
        modifications: { added: [], removed: [], notes: "" },
        status: "pending",
      },
      {
        id: "oi9b",
        menuItemId: "m12",
        menuItem: menuItems.find((m) => m.id === "m12")!,
        quantity: 1,
        modifications: {
          added: ["Extra smantana"],
          removed: [],
          notes: "Picant",
        },
        status: "pending",
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 2 * 60000),
    syncTiming: true,
    totalAmount: 145,
    source: "restaurant",
  },
  // Order 6: Phone order - Mixed
  {
    id: "o6",
    waiterId: "1",
    waiterName: "Sistem",
    items: [
      {
        id: "oi10",
        menuItemId: "m5",
        menuItem: menuItems.find((m) => m.id === "m5")!,
        quantity: 1,
        modifications: { added: [], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 10 * 60000),
      },
      {
        id: "oi10b",
        menuItemId: "m6",
        menuItem: menuItems.find((m) => m.id === "m6")!,
        quantity: 2,
        modifications: { added: ["Extra salam"], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 10 * 60000),
      },
      {
        id: "oi11",
        menuItemId: "m10",
        menuItem: menuItems.find((m) => m.id === "m10")!,
        quantity: 1,
        modifications: { added: [], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 18 * 60000),
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 20 * 60000),
    syncTiming: true,
    totalAmount: 163,
    source: "phone",
    customerName: "Andrei Marinescu",
    customerPhone: "0721234567",
    customerId: "c3",
    deliveryAddress: "Str. Florilor 78, Bucuresti",
  },
  // Order 7: URGENT - Bolt delivery overdue
  {
    id: "o7",
    waiterId: "1",
    waiterName: "Sistem",
    items: [
      {
        id: "oi12",
        menuItemId: "m4",
        menuItem: menuItems.find((m) => m.id === "m4")!,
        quantity: 3,
        modifications: { added: [], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 25 * 60000),
      },
      {
        id: "oi12b",
        menuItemId: "m7",
        menuItem: menuItems.find((m) => m.id === "m7")!,
        quantity: 2,
        modifications: { added: [], removed: [], notes: "" },
        status: "cooking",
        startedAt: new Date(Date.now() - 25 * 60000),
      },
    ],
    status: "active",
    createdAt: new Date(Date.now() - 30 * 60000),
    syncTiming: false,
    totalAmount: 186,
    source: "bolt",
    platformOrderId: "BLT-11111",
    customerName: "Elena Dumitrescu",
    customerPhone: "0761234567",
    customerId: "c4",
    deliveryAddress: "Calea Dorobanti 100, Bucuresti",
    priority: 1,
  },
];

// Restaurant info for receipts
export const restaurantInfo = {
  name: "Restaurant La Mama",
  address: "Strada Florilor 123, București",
  phone: "021-123-4567",
  cui: "RO12345678",
  regCom: "J40/1234/2020",
};

// Upsell Questions for waiters
export interface UpsellQuestion {
  id: string;
  question: string;
  type: "simple" | "products";
  enabled: boolean;
  order: number;
  suggestedProducts?: string[]; // Product IDs to suggest
  category?: string; // Category filter for products
}

export interface ExpiringProduct {
  productId: string;
  productName: string;
  expiresAt: Date;
  quantity: number;
}

export const upsellQuestions: UpsellQuestion[] = [
  {
    id: "uq1",
    question: "Doriți un desert?",
    type: "simple",
    enabled: true,
    order: 1,
    category: "Deserturi",
  },
  {
    id: "uq2",
    question: "Doriți ceva de băut?",
    type: "simple",
    enabled: true,
    order: 2,
    category: "Băuturi",
  },
  {
    id: "uq3",
    question: "Avem o ofertă specială pentru produsele aproape de expirare:",
    type: "products",
    enabled: true,
    order: 3,
  },
];

export const expiringProducts: ExpiringProduct[] = [
  {
    productId: "m4",
    productName: "Pizza Margherita",
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    quantity: 3,
  },
  {
    productId: "m11",
    productName: "Sarmale (5 buc)",
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    quantity: 5,
  },
  {
    productId: "m2",
    productName: "Supă de pui cu tăiței",
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
    quantity: 2,
  },
];
