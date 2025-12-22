// Types
export interface User {
  id: string;
  name: string;
  role: 'waiter' | 'admin' | 'kitchen';
  pin: string;
  avatar: string;
}

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'free' | 'occupied' | 'reserved';
  position: { x: number; y: number };
  shape: 'round' | 'square' | 'rectangle';
  currentOrderId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  kdsStation: string;
  prepTime: number; // in minutes
  ingredients: string[];
  image?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
    notes: string;
  };
  status: 'pending' | 'cooking' | 'ready' | 'served';
  startedAt?: Date;
  readyAt?: Date;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  syncTiming: boolean;
  totalAmount: number;
  tip?: number;
  cui?: string;
  paidAt?: Date;
}

export interface KDSStation {
  id: string;
  name: string;
  type: 'soups' | 'pizza' | 'grill' | 'giros';
  color: string;
  icon: string;
}

// Mock Users
export const users: User[] = [
  { id: '1', name: 'Maria Popescu', role: 'waiter', pin: '1234', avatar: 'MP' },
  { id: '2', name: 'Ion Ionescu', role: 'waiter', pin: '5678', avatar: 'II' },
  { id: '3', name: 'Elena Vasilescu', role: 'waiter', pin: '9012', avatar: 'EV' },
  { id: '4', name: 'Admin', role: 'admin', pin: '0000', avatar: 'AD' },
  { id: '5', name: 'Bucătar Supe', role: 'kitchen', pin: '1111', avatar: 'BS' },
  { id: '6', name: 'Bucătar Pizza', role: 'kitchen', pin: '2222', avatar: 'BP' },
  { id: '7', name: 'Bucătar Grill', role: 'kitchen', pin: '3333', avatar: 'BG' },
];

// KDS Stations
export const kdsStations: KDSStation[] = [
  { id: 'soups', name: 'Supe & Ciorbe', type: 'soups', color: 'bg-amber-500', icon: '🍲' },
  { id: 'pizza', name: 'Pizza', type: 'pizza', color: 'bg-red-500', icon: '🍕' },
  { id: 'grill', name: 'Grill & Mâncare Gătită', type: 'grill', color: 'bg-orange-500', icon: '🔥' },
  { id: 'giros', name: 'Giros & Doner', type: 'giros', color: 'bg-yellow-500', icon: '🥙' },
];

// Menu Items
export const menuItems: MenuItem[] = [
  // Supe
  { id: 'm1', name: 'Ciorbă de burtă', description: 'Ciorbă tradițională cu smântână și ardei iute', price: 22, category: 'Supe', kdsStation: 'soups', prepTime: 5, ingredients: ['Burtă', 'Smântână', 'Usturoi', 'Oțet', 'Ardei iute'] },
  { id: 'm2', name: 'Supă de pui cu tăiței', description: 'Supă de casă cu legume proaspete', price: 18, category: 'Supe', kdsStation: 'soups', prepTime: 5, ingredients: ['Pui', 'Tăiței', 'Morcov', 'Țelină', 'Pătrunjel'] },
  { id: 'm3', name: 'Ciorbă de legume', description: 'Ciorbă vegetariană de sezon', price: 16, category: 'Supe', kdsStation: 'soups', prepTime: 5, ingredients: ['Cartofi', 'Morcov', 'Fasole verde', 'Roșii', 'Leuștean'] },

  // Pizza
  { id: 'm4', name: 'Pizza Margherita', description: 'Sos de roșii, mozzarella, busuioc', price: 32, category: 'Pizza', kdsStation: 'pizza', prepTime: 15, ingredients: ['Sos roșii', 'Mozzarella', 'Busuioc', 'Ulei de măsline'] },
  { id: 'm5', name: 'Pizza Quattro Formaggi', description: 'Patru tipuri de brânză', price: 42, category: 'Pizza', kdsStation: 'pizza', prepTime: 15, ingredients: ['Mozzarella', 'Gorgonzola', 'Parmezan', 'Brie'] },
  { id: 'm6', name: 'Pizza Diavola', description: 'Salam picant și ardei', price: 38, category: 'Pizza', kdsStation: 'pizza', prepTime: 15, ingredients: ['Sos roșii', 'Mozzarella', 'Salam picant', 'Ardei iute'] },
  { id: 'm7', name: 'Pizza Prosciutto', description: 'Șuncă de Parma și rucola', price: 45, category: 'Pizza', kdsStation: 'pizza', prepTime: 15, ingredients: ['Mozzarella', 'Prosciutto', 'Rucola', 'Parmezan'] },

  // Grill & Mâncare Gătită
  { id: 'm8', name: 'Mici (10 buc)', description: 'Mititei tradiționali la grătar', price: 35, category: 'Grill', kdsStation: 'grill', prepTime: 12, ingredients: ['Carne de vită', 'Carne de porc', 'Condimente', 'Muștar'] },
  { id: 'm9', name: 'Cotlet de porc', description: 'Cotlet la grătar cu garnitură', price: 42, category: 'Grill', kdsStation: 'grill', prepTime: 18, ingredients: ['Cotlet porc', 'Rozmarin', 'Usturoi', 'Cartofi'] },
  { id: 'm10', name: 'Ceafă de porc', description: 'Ceafă la grătar marinată', price: 45, category: 'Grill', kdsStation: 'grill', prepTime: 20, ingredients: ['Ceafă porc', 'Condimente', 'Ceapă', 'Mujdei'] },
  { id: 'm11', name: 'Sarmale (5 buc)', description: 'Sarmale în foi de varză cu smântână', price: 38, category: 'Tradițional', kdsStation: 'grill', prepTime: 8, ingredients: ['Carne tocată', 'Orez', 'Varză', 'Smântână', 'Mămăligă'] },
  { id: 'm12', name: 'Tocăniță de pui', description: 'Cu mămăliguță și smântână', price: 35, category: 'Tradițional', kdsStation: 'grill', prepTime: 10, ingredients: ['Pui', 'Ceapă', 'Boia', 'Mămăligă', 'Smântână'] },

  // Giros & Doner
  { id: 'm13', name: 'Kebab pui', description: 'Kebab cu carne de pui și salată', price: 28, category: 'Giros', kdsStation: 'giros', prepTime: 8, ingredients: ['Pui', 'Salată', 'Roșii', 'Ceapă', 'Sos usturoi'] },
  { id: 'm14', name: 'Kebab vită', description: 'Kebab cu carne de vită și legume', price: 32, category: 'Giros', kdsStation: 'giros', prepTime: 8, ingredients: ['Vită', 'Salată', 'Roșii', 'Castraveți', 'Sos'] },
  { id: 'm15', name: 'Doner la farfurie', description: 'Doner cu cartofi și salată', price: 38, category: 'Giros', kdsStation: 'giros', prepTime: 10, ingredients: ['Carne doner', 'Cartofi prăjiți', 'Salată', 'Sos'] },
  { id: 'm16', name: 'Shaorma mare', description: 'Shaorma cu de toate', price: 30, category: 'Giros', kdsStation: 'giros', prepTime: 8, ingredients: ['Carne pui', 'Cartofi', 'Varză', 'Morcov', 'Sos'] },

  // Garnituri
  { id: 'm17', name: 'Cartofi prăjiți', description: 'Porție cartofi aurii', price: 12, category: 'Garnituri', kdsStation: 'grill', prepTime: 8, ingredients: ['Cartofi', 'Sare'] },
  { id: 'm18', name: 'Salată mixtă', description: 'Salată de sezon', price: 14, category: 'Garnituri', kdsStation: 'grill', prepTime: 3, ingredients: ['Roșii', 'Castraveți', 'Ceapă', 'Măsline'] },

  // Băuturi
  { id: 'm19', name: 'Cola 330ml', description: '', price: 8, category: 'Băuturi', kdsStation: 'grill', prepTime: 0, ingredients: [] },
  { id: 'm20', name: 'Apă plată 500ml', description: '', price: 6, category: 'Băuturi', kdsStation: 'grill', prepTime: 0, ingredients: [] },
  { id: 'm21', name: 'Bere Ursus 500ml', description: '', price: 12, category: 'Băuturi', kdsStation: 'grill', prepTime: 0, ingredients: [] },
];

// Tables
export const initialTables: Table[] = [
  { id: 't1', number: 1, seats: 2, status: 'free', position: { x: 10, y: 15 }, shape: 'round' },
  { id: 't2', number: 2, seats: 2, status: 'free', position: { x: 30, y: 15 }, shape: 'round' },
  { id: 't3', number: 3, seats: 4, status: 'occupied', position: { x: 50, y: 15 }, shape: 'square' },
  { id: 't4', number: 4, seats: 4, status: 'free', position: { x: 70, y: 15 }, shape: 'square' },
  { id: 't5', number: 5, seats: 6, status: 'reserved', position: { x: 10, y: 45 }, shape: 'rectangle' },
  { id: 't6', number: 6, seats: 6, status: 'free', position: { x: 40, y: 45 }, shape: 'rectangle' },
  { id: 't7', number: 7, seats: 4, status: 'occupied', position: { x: 70, y: 45 }, shape: 'square' },
  { id: 't8', number: 8, seats: 8, status: 'free', position: { x: 25, y: 75 }, shape: 'rectangle' },
  { id: 't9', number: 9, seats: 4, status: 'free', position: { x: 60, y: 75 }, shape: 'square' },
];

// Categories for menu
export const menuCategories = ['Supe', 'Pizza', 'Grill', 'Tradițional', 'Giros', 'Garnituri', 'Băuturi'];

// Sample orders for demo
export const sampleOrders: Order[] = [
  {
    id: 'o1',
    tableId: 't3',
    tableNumber: 3,
    waiterId: '1',
    waiterName: 'Maria Popescu',
    items: [
      {
        id: 'oi1',
        menuItemId: 'm4',
        menuItem: menuItems.find(m => m.id === 'm4')!,
        quantity: 1,
        modifications: { added: ['Extra mozzarella'], removed: [], notes: '' },
        status: 'cooking',
        startedAt: new Date(Date.now() - 5 * 60000),
      },
      {
        id: 'oi2',
        menuItemId: 'm1',
        menuItem: menuItems.find(m => m.id === 'm1')!,
        quantity: 2,
        modifications: { added: [], removed: ['Ardei iute'], notes: 'Fără ardei' },
        status: 'pending',
      },
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 60000),
    syncTiming: true,
    totalAmount: 76,
  },
  {
    id: 'o2',
    tableId: 't7',
    tableNumber: 7,
    waiterId: '2',
    waiterName: 'Ion Ionescu',
    items: [
      {
        id: 'oi3',
        menuItemId: 'm13',
        menuItem: menuItems.find(m => m.id === 'm13')!,
        quantity: 2,
        modifications: { added: ['Extra sos'], removed: [], notes: '' },
        status: 'cooking',
        startedAt: new Date(Date.now() - 3 * 60000),
      },
      {
        id: 'oi4',
        menuItemId: 'm8',
        menuItem: menuItems.find(m => m.id === 'm8')!,
        quantity: 1,
        modifications: { added: [], removed: [], notes: '' },
        status: 'ready',
        startedAt: new Date(Date.now() - 12 * 60000),
        readyAt: new Date(),
      },
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 60000),
    syncTiming: true,
    totalAmount: 91,
  },
];
