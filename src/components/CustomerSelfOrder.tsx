import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { menuCategories, MenuItem, type Table, extraIngredients as extraIngredientsData } from '@/data/mockData';
import { imageSrc, menuApi, ordersApi, tablesApi, type MenuItemApi, type TableApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  Check, X, CreditCard, Loader2, CheckCircle, Clock, Sparkles,
  Volume2, VolumeX, ChevronRight, Banknote, QrCode, Truck, 
  UtensilsCrossed, MapPin, Phone, User, History, Users, Scan,
  Camera, Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AllergenBadges from '@/components/AllergenBadges';

/**
 * Cod masă = numele mesei: litera M + număr (ex. m2, M9000).
 * Nu acceptă doar cifre (ex. „2”) — trebuie prefix M.
 */
function parseSelfOrderTableCode(
  raw: string,
): { ok: true; number: number } | { ok: false; reason: 'empty' | 'format' } {
  const compact = raw.trim().replace(/\s+/g, '');
  if (!compact) return { ok: false, reason: 'empty' };
  const m = /^m(\d+)$/i.exec(compact);
  if (!m) return { ok: false, reason: 'format' };
  return { ok: true, number: parseInt(m[1], 10) };
}

/** Mapare meniu API → model UI (același catalog ca POS / kiosk). */
function menuItemApiToMenuItem(item: MenuItemApi): MenuItem {
  const ingredients =
    item.menuItemIngredients?.map((r) => r.ingredient?.name ?? `Ingredient #${r.ingredientId}`) ??
    item.ingredients?.map((i) => i.name) ??
    [];
  const av = item.availability;
  return {
    id: String(item.id),
    name: item.name,
    description: item.description ?? '',
    price: Number(item.price ?? 0),
    category: item.category,
    kdsStation: item.kdsStation?.type ?? 'pizza',
    prepTime: Number(item.prepTime ?? 0),
    ingredients,
    allergenIds: item.allergens?.map((a) => String(a.id)),
    availableExtras: item.availableExtras?.map((e) => String(e.id)) ?? [],
    image: item.image,
    unitType: item.unitType,
    availability: av
      ? {
          restaurant: av.restaurant !== false,
          kiosk: av.kiosk !== false,
          app: av.app !== false,
          delivery: av.delivery !== false,
        }
      : undefined,
  };
}

type SelfOrderStep = 'idle' | 'mode' | 'scan' | 'scanning' | 'delivery-form' | 'menu' | 'cart' | 'customize' | 'upsell' | 'payment' | 'processing' | 'confirm';
type OrderMode = 'dine-in' | 'delivery';
type PaymentMethod = 'cash' | 'card' | 'online';
type CashPaymentType = 'exact' | 'need-change';

const DELIVERY_FEE_UNDER_50 = 10;

function deliveryFinalTotal(productsTotal: number, orderMode: OrderMode): number {
  if (orderMode !== 'delivery') return productsTotal;
  if (productsTotal > 0 && productsTotal < 50) return productsTotal + DELIVERY_FEE_UNDER_50;
  return productsTotal;
}

/** Note curier + detalii plată cash (vizibile în POS / pe comandă). */
function buildDeliveryNotesForApi(
  userNotes: string,
  paymentMethod: PaymentMethod,
  cashPaymentType: CashPaymentType,
  customerCashAmount: string,
  finalTotal: number,
): string {
  const blocks: string[] = [];
  const u = userNotes.trim();
  if (u) blocks.push(u);
  if (paymentMethod === 'cash') {
    const cash = parseFloat(String(customerCashAmount).replace(',', '.')) || 0;
    if (cashPaymentType === 'exact') {
      blocks.push(`[Plată livrare] Cash – sumă exactă: ${finalTotal.toFixed(2)} RON`);
    } else if (cash >= finalTotal) {
      blocks.push(
        `[Plată livrare] Cash – plătește cu ${cash.toFixed(2)} RON, rest de dată: ${(cash - finalTotal).toFixed(2)} RON`,
      );
    }
  } else {
    blocks.push('[Plată livrare] Card / online');
  }
  return blocks.join('\n\n');
}

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
  };
  extras: { name: string; quantity: number; price: number }[];
  addedBy?: string;
  timestamp?: number;
}

interface TableOrder {
  tableId: number;
  tableNumber: number;
  items: CartItem[];
  history: CartItem[];
  devices: string[];
}

// Comprehensive ingredient images mapping
const ingredientImages: Record<string, string> = {
  'Mozzarella': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=150',
  'Gorgonzola': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=150',
  'Parmezan': 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=150',
  'Brânză': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=150',
  'Carne': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=150',
  'Carne de vită': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=150',
  'Vită': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=150',
  'Bacon': 'https://images.unsplash.com/photo-1606851094291-6efae152bb87?w=150',
  'Pui': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=150',
  'Prosciutto': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=150',
  'Ceapă': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=150',
  'Roșii': 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=150',
  'Salată': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=150',
  'Ciuperci': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150',
  'Măsline': 'https://images.unsplash.com/photo-1563288204-f0e9c6d2e6b0?w=150',
  'Usturoi': 'https://images.unsplash.com/photo-1501420193726-1a34f3a80713?w=150',
  'Cartofi': 'https://images.unsplash.com/photo-1518977676601-b53f82bece48?w=150',
  'Sos roșii': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=150',
  'Smântână': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150',
  'Maioneză': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=150',
  'Busuioc': 'https://images.unsplash.com/photo-1600692851888-3f6a8f3f8c82?w=150',
};

const getIngredientImage = (name: string): string => {
  if (ingredientImages[name]) return ingredientImages[name];
  for (const [key, url] of Object.entries(ingredientImages)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return url;
    }
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150';
};

// Category icons
const categoryIcons: Record<string, string> = {
  'Supe': '🍲',
  'Pizza': '🍕',
  'Grill': '🔥',
  'Giros': '🥙',
  'Paste': '🍝',
  'Salate': '🥗',
  'Garnituri': '🍟',
  'Deserturi': '🍰',
  'Băuturi': '🥤',
};

// Idle screen promotions
const promotions = [
  { id: 1, title: 'Pizza Margherita', subtitle: 'Clasică și delicioasă', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200', color: 'from-red-500/80' },
  { id: 2, title: 'Livrare Rapidă', subtitle: 'În 30 de minute!', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200', color: 'from-green-500/80' },
  { id: 3, title: 'Comandă de la masă', subtitle: 'Scanează QR-ul', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200', color: 'from-orange-500/80' },
];

// Languages
const languages = [
  { code: 'ro', flag: '🇷🇴', name: 'Română' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
];

interface CustomerSelfOrderProps {
  initialTableId?: string;
}

const CustomerSelfOrder: React.FC<CustomerSelfOrderProps> = ({ initialTableId }) => {
  const { tables, menu, createDeliveryOrder, addItemToOrder, createOrder } = useRestaurant();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  
  // Generate unique device ID
  const [deviceId] = useState(() => `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const [step, setStep] = useState<SelfOrderStep>('mode');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  // Cash payment options
  const [cashPaymentType, setCashPaymentType] = useState<CashPaymentType>('exact');
  const [customerCashAmount, setCustomerCashAmount] = useState<string>('');
  
  // Table ordering
  const [scannedTableId, setScannedTableId] = useState<number | null>(() => {
    if (!initialTableId) return null;
    const n = parseInt(initialTableId, 10);
    return Number.isNaN(n) ? null : n;
  });
  const [qrInput, setQrInput] = useState('');
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Scanning animation
  const [scanningProgress, setScanningProgress] = useState(0);
  
  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const [apiTables, setApiTables] = useState<TableApi[]>([]);
  const [apiMenuItems, setApiMenuItems] = useState<MenuItemApi[]>([]);
  const [apiCategoryNames, setApiCategoryNames] = useState<string[]>([]);
  /** Masă rezolvată din API (validare M1 / GET /tables) — trimisă la POST /orders pentru dine-in. */
  const [apiTable, setApiTable] = useState<TableApi | null>(null);
  const [tableValidationError, setTableValidationError] = useState<string | null>(null);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<number | null>(null);
  
  // Customization
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizeStep, setCustomizeStep] = useState<'extras' | 'remove'>('extras');
  const [tempExtras, setTempExtras] = useState<{ name: string; quantity: number; price: number }[]>([]);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);

  const scannedTable: Table | null = useMemo(() => {
    if (orderMode === 'dine-in' && apiTable) {
      return {
        id: apiTable.id,
        number: apiTable.number,
        seats: apiTable.seats,
        status: apiTable.status,
        position: apiTable.position ?? { x: 50, y: 50 },
        shape: apiTable.shape,
        currentOrderId: apiTable.currentOrderId ?? undefined,
        reservationId: apiTable.reservationId ?? undefined,
        currentGuests: undefined,
        mergedWith: apiTable.mergedWith ?? undefined,
        qrCode: apiTable.qrCode ?? undefined,
      };
    }
    if (scannedTableId != null) {
      return tables.find((t) => t.id === scannedTableId) ?? null;
    }
    return null;
  }, [orderMode, apiTable, scannedTableId, tables]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [cats, tbls, items] = await Promise.all([
          menuApi.getCategories(),
          tablesApi.getTables(),
          menuApi.getItems(),
        ]);
        if (!cancelled) {
          setApiCategoryNames(cats.map((c) => c.name));
          setApiTables(tbls);
          setApiMenuItems(items);
        }
      } catch {
        if (!cancelled) {
          setApiCategoryNames([]);
          setApiTables([]);
          setApiMenuItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-rotate promotions
  useEffect(() => {
    if (step === 'idle') {
      const interval = setInterval(() => {
        setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Simulate real-time sync for table orders (in production, this would use Supabase realtime)
  useEffect(() => {
    if (scannedTableId && orderMode === 'dine-in') {
      // Initialize table order if not exists
      if (!tableOrder) {
        setTableOrder({
          tableId: scannedTableId,
          tableNumber: scannedTable?.number || 0,
          items: [],
          history: [],
          devices: [deviceId]
        });
      }
      
      // In production: Subscribe to realtime updates
      // const channel = supabase.channel(`table-${scannedTableId}`)
      //   .on('broadcast', { event: 'cart_update' }, ({ payload }) => {
      //     setTableOrder(payload);
      //   })
      //   .subscribe();
      
      // return () => supabase.removeChannel(channel);
    }
  }, [scannedTableId, orderMode, deviceId]);

  // Sync cart with table order for dine-in
  useEffect(() => {
    if (tableOrder && orderMode === 'dine-in') {
      // Broadcast cart changes to other devices (simulated)
      // In production: supabase.channel(`table-${scannedTableId}`).send({ type: 'broadcast', event: 'cart_update', payload: tableOrder });
    }
  }, [cart, tableOrder]);

  /** Meniu din API: la masă (cu masă validată) sau livrare — aceleași produse ca în restul aplicației. */
  const selfOrderUsesApiMenu =
    apiMenuItems.length > 0 &&
    ((orderMode === 'dine-in' && apiTable != null) || orderMode === 'delivery');

  const menuForOrder = useMemo((): MenuItem[] => {
    if (selfOrderUsesApiMenu) {
      return apiMenuItems.map(menuItemApiToMenuItem);
    }
    return menu;
  }, [selfOrderUsesApiMenu, apiMenuItems, menu]);

  const categoryList = useMemo(() => {
    if (selfOrderUsesApiMenu && apiCategoryNames.length > 0) {
      return apiCategoryNames;
    }
    return menuCategories;
  }, [selfOrderUsesApiMenu, apiCategoryNames]);

  useEffect(() => {
    if (categoryList.length > 0 && !categoryList.includes(activeCategory)) {
      setActiveCategory(categoryList[0]);
    }
  }, [categoryList, activeCategory]);

  const filteredMenu = useMemo(() => {
    return menuForOrder.filter((m) => {
      if (m.category !== activeCategory) return false;
      if (!selfOrderUsesApiMenu) {
        return m.availability?.app !== false;
      }
      if (orderMode === 'delivery') {
        return m.availability == null || m.availability.delivery !== false;
      }
      return m.availability == null || m.availability.restaurant !== false;
    });
  }, [menuForOrder, activeCategory, selfOrderUsesApiMenu, orderMode]);

  // Upsell suggestions
  const upsellSuggestions = useMemo(() => {
    if (cart.length === 0) return [];
    const cartCategories = new Set(cart.map((c) => c.menuItem.category));
    const suggestions: MenuItem[] = [];

    if (!cartCategories.has('Băuturi')) {
      suggestions.push(...menuForOrder.filter((m) => m.category === 'Băuturi').slice(0, 2));
    }
    if (cartCategories.has('Grill') || cartCategories.has('Pizza') || cartCategories.has('Giros')) {
      if (!cartCategories.has('Garnituri')) {
        suggestions.push(...menuForOrder.filter((m) => m.category === 'Garnituri').slice(0, 2));
      }
    }
    return suggestions.slice(0, 4);
  }, [cart, menuForOrder]);

  const handleScanQR = () => {
    const q = qrInput.trim();
    setTableValidationError(null);

    const parsed = parseSelfOrderTableCode(q);
    if (parsed.ok) {
      const found = apiTables.find((t) => t.number === parsed.number);
      if (found) {
        setApiTable(found);
        setScannedTableId(found.id);
        setOrderMode('dine-in');
        setStep('menu');
        setQrInput('');
        toast({ title: `Masa M${found.number} selectată` });
        return;
      }
      setTableValidationError('Masa nu există.');
      toast({ title: 'Masa nu există.', variant: 'destructive' });
      return;
    }

    /** Doar cod QR din bancă (altfel decât M+n); nu acceptăm „2” sau id intern — doar nume tip M2. */
    const table = tables.find((t) => t.qrCode != null && t.qrCode !== '' && t.qrCode === q);
    if (table) {
      const match = apiTables.find((t) => t.number === table.number) ?? null;
      setApiTable(match);
      setScannedTableId(table.id);
      setOrderMode('dine-in');
      setStep('menu');
      setQrInput('');
      toast({ title: `Masa ${table.number} detectată!` });
      return;
    }

    if (parsed.ok === false) {
      const { reason } = parsed;
      if (reason === 'empty') {
        setTableValidationError('Introdu codul mesei.');
        toast({ title: 'Introdu codul mesei', variant: 'destructive' });
        return;
      }
      setTableValidationError('Scrie numele mesei cu M în față (ex. m2), nu doar cifre. Sau codul QR de pe masă.');
      toast({
        title: 'Cod invalid',
        description: 'Folosește m2 / M2, nu „2” singur.',
        variant: 'destructive',
      });
    }
  };

  const openCustomization = (item: MenuItem) => {
    setCustomizingItem(item);
    setTempExtras([]);
    setTempRemovals([]);
    setCustomizeStep('extras');
    setStep('customize');
  };

  const addToCart = (item: MenuItem) => {
    if (item.ingredients && item.ingredients.length > 0) {
      openCustomization(item);
    } else {
      const newItem: CartItem = {
        id: `order-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        modifications: { added: [], removed: [] },
        extras: [],
        addedBy: deviceId,
        timestamp: Date.now()
      };
      setCart([...cart, newItem]);
      
      // Update table order if dine-in
      if (tableOrder) {
        setTableOrder({
          ...tableOrder,
          items: [...tableOrder.items, newItem]
        });
      }
    }
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    const newItem: CartItem = {
      id: `order-${Date.now()}`,
      menuItem: customizingItem,
      quantity: 1,
      modifications: { 
        added: tempExtras.map(e => e.name), 
        removed: tempRemovals 
      },
      extras: tempExtras,
      addedBy: deviceId,
      timestamp: Date.now()
    };
    setCart([...cart, newItem]);
    
    if (tableOrder) {
      setTableOrder({
        ...tableOrder,
        items: [...tableOrder.items, newItem]
      });
    }
    
    setCustomizingItem(null);
    setStep('menu');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const resetOrder = () => {
    setStep('idle');
    setOrderMode(null);
    setCart([]);
    setActiveCategory(menuCategories[0]);
    setScannedTableId(null);
    setQrInput('');
    setApiTable(null);
    setTableValidationError(null);
    setLastPlacedOrderId(null);
    setDeliveryForm({ name: '', phone: '', address: '', city: '', postalCode: '', notes: '' });
    setTableOrder(null);
    setPaymentMethod('card');
    setCashPaymentType('exact');
    setCustomerCashAmount('');
  };

  const calculateItemTotal = (item: CartItem) => {
    const extrasTotal = item.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
    return (item.menuItem.price + extrasTotal) * item.quantity;
  };

  const totalAmount = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotalWithDelivery = deliveryFinalTotal(
    totalAmount,
    orderMode === 'delivery' ? 'delivery' : 'dine-in',
  );

  const handleExtraQuantity = (ingredientName: string, delta: number, price: number) => {
    setTempExtras(prev => {
      const existing = prev.find(e => e.name === ingredientName);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(e => e.name !== ingredientName);
        }
        return prev.map(e => e.name === ingredientName ? { ...e, quantity: newQty } : e);
      } else if (delta > 0) {
        return [...prev, { name: ingredientName, quantity: 1, price }];
      }
      return prev;
    });
  };

  const handleConfirmOrder = async () => {
    if (orderMode === 'dine-in' && scannedTable && apiTable) {
      try {
        const itemsPayload = [];
        for (const line of cart) {
          const idFromCart = Number(line.menuItem.id);
          const apiMi = Number.isInteger(idFromCart)
            ? apiMenuItems.find((mi) => mi.id === idFromCart)
            : apiMenuItems.find(
                (mi) => mi.name === line.menuItem.name && mi.category === line.menuItem.category,
              );
          if (!apiMi) {
            toast({
              title: 'Produs indisponibil',
              description: `„${line.menuItem.name}” nu există în meniul din baza de date.`,
              variant: 'destructive',
            });
            setStep('cart');
            return;
          }
          const notesExtra =
            line.extras.length > 0 ? line.extras.map((e) => `${e.name} x${e.quantity}`).join(', ') : '';
          itemsPayload.push({
            menuItemId: apiMi.id,
            quantity: line.quantity,
            menuItem: {
              id: apiMi.id,
              name: line.menuItem.name,
              category: line.menuItem.category,
              kdsStationId: apiMi.kdsStationId,
              kdsStationType: apiMi.kdsStation?.type,
              prepTime: apiMi.prepTime,
              image: line.menuItem.image ?? null,
            },
            modifications: {
              added: line.modifications.added,
              removed: line.modifications.removed,
              ...(notesExtra ? { notes: notesExtra } : {}),
            },
          });
        }
        const created = await ordersApi.create({
          tableId: apiTable.id,
          tableNumber: apiTable.number,
          source: 'restaurant',
          orderType: 'restaurant',
          fulfillmentType: 'dine_in',
          customerName: `Self-order · M${apiTable.number}`,
          items: itemsPayload,
        });
        setLastPlacedOrderId(created.id);
        if (tableOrder) {
          setTableOrder({
            ...tableOrder,
            items: [],
            history: [...tableOrder.history, ...cart],
          });
        }
      } catch {
        toast({
          title: 'Eroare',
          description: 'Nu s-a putut trimite comanda. Încearcă din nou.',
          variant: 'destructive',
        });
        setStep('payment');
        return;
      }
    } else if (orderMode === 'dine-in' && scannedTable) {
      const order = await createOrder(scannedTable.id, 'restaurant');
      for (const item of cart) {
        await addItemToOrder(order.id, item.menuItem, item.quantity);
      }
      setLastPlacedOrderId(null);
      if (tableOrder) {
        setTableOrder({
          ...tableOrder,
          items: [],
          history: [...tableOrder.history, ...cart],
        });
      }
    } else if (orderMode === 'delivery' && selfOrderUsesApiMenu) {
      try {
        const itemsPayload = [];
        for (const line of cart) {
          const idFromCart = Number(line.menuItem.id);
          const apiMi = Number.isInteger(idFromCart)
            ? apiMenuItems.find((mi) => mi.id === idFromCart)
            : apiMenuItems.find(
                (mi) => mi.name === line.menuItem.name && mi.category === line.menuItem.category,
              );
          if (!apiMi) {
            toast({
              title: 'Produs indisponibil',
              description: `„${line.menuItem.name}” nu există în meniul din baza de date.`,
              variant: 'destructive',
            });
            setStep('cart');
            return;
          }
          const notesExtra =
            line.extras.length > 0 ? line.extras.map((e) => `${e.name} x${e.quantity}`).join(', ') : '';
          itemsPayload.push({
            menuItemId: apiMi.id,
            quantity: line.quantity,
            menuItem: {
              id: apiMi.id,
              name: line.menuItem.name,
              category: line.menuItem.category,
              kdsStationId: apiMi.kdsStationId,
              kdsStationType: apiMi.kdsStation?.type,
              prepTime: apiMi.prepTime,
              image: line.menuItem.image ?? null,
            },
            modifications: {
              added: line.modifications.added,
              removed: line.modifications.removed,
              ...(notesExtra ? { notes: notesExtra } : {}),
            },
          });
        }
        const deliveryFinal = deliveryFinalTotal(totalAmount, 'delivery');
        const created = await ordersApi.create({
          source: 'own_website',
          orderType: 'own_website',
          fulfillmentType: 'takeaway',
          customerName: deliveryForm.name.trim(),
          customerPhone: deliveryForm.phone.trim(),
          deliveryAddress: deliveryForm.address.trim(),
          deliveryCity: deliveryForm.city.trim() || undefined,
          deliveryPostalCode: deliveryForm.postalCode.trim() || undefined,
          deliveryNotes: buildDeliveryNotesForApi(
            deliveryForm.notes,
            paymentMethod,
            cashPaymentType,
            customerCashAmount,
            deliveryFinal,
          ),
          paymentMethod: paymentMethod === 'card' ? 'card' : 'cash',
          items: itemsPayload,
        });
        setLastPlacedOrderId(created.id);
      } catch {
        toast({
          title: 'Eroare',
          description: 'Nu s-a putut trimite comanda. Încearcă din nou.',
          variant: 'destructive',
        });
        setStep('payment');
        return;
      }
    } else if (orderMode === 'delivery') {
      const order = await createDeliveryOrder('own_website', {
        name: deliveryForm.name,
        phone: deliveryForm.phone,
        address: deliveryForm.address,
      });
      for (const item of cart) {
        await addItemToOrder(order.id, item.menuItem, item.quantity);
      }
      setLastPlacedOrderId(null);
    }

    toast({ title: 'Comandă plasată cu succes!' });
    setStep('confirm');
  };

  // ============ IDLE SCREEN ============
  if (step === 'idle') {
    const promo = promotions[currentPromoIndex];
    return (
      <div 
        className="min-h-screen flex flex-col cursor-pointer overflow-hidden relative bg-slate-900"
        onClick={() => setStep('mode')}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
          <div className={cn("absolute inset-0 bg-gradient-to-t to-transparent", promo.color)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={(e) => { e.stopPropagation(); setLanguage(lang.code as 'ro' | 'en' | 'de' | 'hu'); }}
              className={cn(
                "w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all",
                language === lang.code ? "bg-white shadow-lg scale-110" : "bg-white/30 hover:bg-white/50"
              )}
            >
              {lang.flag}
            </button>
          ))}
        </div>

        {/* Sound Toggle */}
        <button 
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/30 text-white"
          onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-center">Bine ai venit!</h1>
          <p className="text-lg sm:text-xl text-white/80 mb-8 text-center">Apasă pentru a comanda</p>

          {/* Order Type Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-sm px-4">
            <button
              onClick={(e) => { e.stopPropagation(); setStep('scan'); }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-lg font-bold block">Scanează masa</span>
                <span className="text-sm text-white/70">Comandă direct la masa ta</span>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setOrderMode('delivery'); setStep('delivery-form'); }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-lg font-bold block">Livrare la domiciliu</span>
                <span className="text-sm text-white/70">Comandă acasă sau la birou</span>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50" />
            </button>
          </div>
        </div>

        {/* Promo indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {promotions.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentPromoIndex ? "bg-white w-6" : "bg-white/50"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // ============ MODE SELECTION ============
  if (step === 'mode') {
    const promo = promotions[0];
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as 'ro' | 'en' | 'de' | 'hu')}
              className={cn(
                "w-8 h-8 rounded-full text-lg flex items-center justify-center transition-all border-2",
                language === lang.code ? "bg-white border-primary shadow-lg" : "bg-white/80 border-transparent hover:bg-white"
              )}
            >
              {lang.flag}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="mb-6">
            <img 
              src={promo.image} 
              alt="Product"
              className="w-48 h-36 object-cover rounded-2xl shadow-xl"
            />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-slate-800">Cum dorești să comanzi?</h1>
          <p className="text-slate-500 mb-6">Alege tipul comenzii</p>

          <div className="flex flex-col gap-4 w-full max-w-sm px-4">
            <button
              onClick={() => setStep('scan')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-7 h-7 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-lg font-bold text-slate-800 block">Scanează masa</span>
                <span className="text-sm text-slate-500">Comandă la restaurant</span>
              </div>
            </button>

            <button
              onClick={() => { setOrderMode('delivery'); setStep('delivery-form'); }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-lg font-bold text-slate-800 block">Livrare la domiciliu</span>
                <span className="text-sm text-slate-500">Livrăm în 30-45 min</span>
              </div>
            </button>
          </div>

          <button 
            className="mt-6 text-slate-500 text-sm underline"
            onClick={() => setStep('idle')}
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  // Start scanning animation
  const startScanning = () => {
    setStep('scanning');
    setScanningProgress(0);
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanningProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const fromApi = apiTables.find((t) => t.status === 'free' || t.status === 'occupied');
          const fromMock = fromApi
            ? null
            : tables.find((t) => t.status === 'free' || t.status === 'occupied');
          const freeTable = fromApi ?? fromMock;
          if (freeTable) {
            setTimeout(() => {
              if (fromApi) {
                setApiTable(fromApi);
                setScannedTableId(fromApi.id);
              } else if (fromMock) {
                setApiTable(apiTables.find((t) => t.number === fromMock.number) ?? null);
                setScannedTableId(fromMock.id);
              }
              setOrderMode('dine-in');
              setStep('menu');
              toast({ title: `Masa ${freeTable.number} detectată!` });
            }, 500);
          }
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  // ============ QR SCAN ============
  if (step === 'scan') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('mode')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Scanează masa</h1>
          <div className="w-16" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <QrCode className="w-12 h-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Scanează codul QR</h2>
          <p className="text-slate-500 mb-6 text-center">Scanează codul de pe suportul de pe masă</p>

          <div className="w-full max-w-sm space-y-4">
            <div className="flex gap-2">
              <Input
                value={qrInput}
                onChange={(e) => {
                  setQrInput(e.target.value);
                  setTableValidationError(null);
                }}
                placeholder="Ex: m2, M9000 — cu M în față, nu doar cifre"
                className="flex-1 h-12"
              />
              <Button onClick={handleScanQR} className="h-12 px-6">
                Verifică
              </Button>
            </div>
            {tableValidationError && (
              <p className="text-sm text-red-600 text-center">{tableValidationError}</p>
            )}

            <Button 
              variant="outline" 
              className="w-full h-14 gap-3"
              onClick={startScanning}
            >
              <Camera className="w-6 h-6" />
              Deschide camera pentru scanare
            </Button>
            
            <p className="text-center text-xs text-slate-400">
              Poziționează camera deasupra codului QR de pe masă
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ SCANNING ANIMATION ============
  if (step === 'scanning') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900">
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" className="text-white" onClick={() => setStep('scan')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Anulează
          </Button>
          <h1 className="text-lg font-bold text-white">Scanare QR</h1>
          <div className="w-16" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Fake camera viewfinder */}
          <div className="relative w-72 h-72 mb-8">
            {/* Background simulating camera feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400')] bg-cover bg-center blur-sm" />
              </div>
            </div>
            
            {/* QR Frame corners */}
            <div className="absolute inset-8 border-4 border-transparent">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
            
            {/* Scanning line animation */}
            <div 
              className="absolute left-8 right-8 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full transition-all duration-100"
              style={{ 
                top: `${8 + (scanningProgress / 100) * 56}%`,
                boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)'
              }}
            />
            
            {/* Center QR icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all",
                scanningProgress > 80 && "bg-green-500/30 scale-110"
              )}>
                <QrCode className={cn(
                  "w-10 h-10 transition-colors",
                  scanningProgress > 80 ? "text-green-400" : "text-white"
                )} />
              </div>
            </div>
          </div>
          
          {/* Progress info */}
          <div className="text-center text-white">
            <div className="flex items-center gap-3 mb-4">
              {scanningProgress < 100 ? (
                <>
                  <Scan className="w-5 h-5 animate-pulse" />
                  <span className="text-lg">Se scanează...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-lg text-green-400">Cod detectat!</span>
                </>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-100",
                  scanningProgress < 100 ? "bg-primary" : "bg-green-500"
                )}
                style={{ width: `${scanningProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {scanningProgress < 100 
                ? 'Menține camera stabilă' 
                : 'Redirecționare...'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ DELIVERY FORM ============
  if (step === 'delivery-form') {
    const isFormValid = deliveryForm.name && deliveryForm.phone && deliveryForm.address;
    
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('mode')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Detalii livrare</h1>
          <div className="w-16" />
        </div>

        <div className="flex-1 p-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <Truck className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-slate-800">Livrare gratuită</p>
                  <p className="text-sm text-slate-500">Pentru comenzi peste 50 RON</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Nume complet
                </label>
                <Input
                  value={deliveryForm.name}
                  onChange={e => setDeliveryForm({...deliveryForm, name: e.target.value})}
                  placeholder="Ion Popescu"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefon
                </label>
                <Input
                  value={deliveryForm.phone}
                  onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                  placeholder="0712 345 678"
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Adresă completă
                </label>
                <Input
                  value={deliveryForm.address}
                  onChange={e => setDeliveryForm({...deliveryForm, address: e.target.value})}
                  placeholder="Str. Exemplu, nr. 10, bl. A1, ap. 5"
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Oraș (opțional)</label>
                  <Input
                    value={deliveryForm.city}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                    placeholder="București"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cod poștal (opțional)</label>
                  <Input
                    value={deliveryForm.postalCode}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, postalCode: e.target.value })}
                    placeholder="010101"
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notă pentru curier (opțional)
                </label>
                <Input
                  value={deliveryForm.notes}
                  onChange={e => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                  placeholder="Ex: Interfon 15, etaj 3"
                  className="h-12"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-md mx-auto">
            <Button 
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              onClick={() => setStep('menu')}
              disabled={!isFormValid}
            >
              Continuă la meniu
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ MENU ============
  if (step === 'menu') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        {/* Header */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <Button variant="ghost" size="sm" onClick={() => {
            // Reset order and go back to mode selection
            setOrderMode(null);
            setScannedTableId(null);
            setStep('mode');
          }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            {orderMode === 'dine-in' && scannedTable ? (
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                <span className="font-bold">Masa {scannedTable.number}</span>
                {tableOrder && tableOrder.devices.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {tableOrder.devices.length}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="font-bold">Livrare</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {orderMode === 'dine-in' && tableOrder && tableOrder.history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-5 h-5" />
              </Button>
            )}
            <button 
              onClick={() => setStep('cart')}
              className="relative p-2"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Order History for Table (if showing) */}
        {showHistory && tableOrder && tableOrder.history.length > 0 && (
          <div className="p-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-800 text-sm">Comenzi anterioare la masă</span>
            </div>
            <div className="space-y-1">
              {tableOrder.history.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-amber-700">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span>{calculateItemTotal(item).toFixed(2)} RON</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="overflow-x-auto bg-white border-b border-slate-200 sticky top-14 z-10">
          <div className="flex gap-2 p-3">
            {categoryList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  activeCategory === cat 
                    ? "bg-primary text-white" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <span>{categoryIcons[cat] || '📦'}</span>
                <span className="font-medium text-sm">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              {filteredMenu.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="rounded-xl bg-white border-2 border-slate-100 hover:border-primary hover:shadow-xl transition-all text-left overflow-hidden group active:scale-95"
                >
                  {item.image && (
                    <div className="aspect-square bg-slate-50 relative">
                      <img
                        src={selfOrderUsesApiMenu ? imageSrc(item.image) : item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 text-slate-800">{item.name}</h3>
                    <p className="text-lg font-black text-primary">{item.price.toFixed(2)} RON</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Bar */}
        {cart.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-200 sticky bottom-0">
            <Button 
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700" 
              onClick={() => setStep(upsellSuggestions.length > 0 ? 'upsell' : 'cart')}
            >
              <span className="flex-1 text-left">Vezi coș ({totalItems})</span>
              <span className="font-black">{totalAmount.toFixed(2)} RON</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============ CUSTOMIZATION ============
  if (step === 'customize' && customizingItem) {
    const customizingFromApi = apiMenuItems.find((mi) => mi.id === Number(customizingItem.id));
    const availableExtrasList =
      customizingFromApi?.availableExtras && customizingFromApi.availableExtras.length > 0
        ? customizingFromApi.availableExtras.map((e) => ({
            name: e.name,
            price: Number(e.price ?? 0),
            image: e.image ? imageSrc(e.image) : getIngredientImage(e.name),
          }))
        : [
            { name: 'Extra carne', price: 8.0, image: ingredientImages['Carne'] },
            { name: 'Extra bacon', price: 5.0, image: ingredientImages['Bacon'] },
            { name: 'Extra brânză', price: 4.0, image: ingredientImages['Brânză'] },
            { name: 'Extra sos', price: 2.0, image: ingredientImages['Maioneză'] },
            { name: 'Extra ciuperci', price: 3.0, image: ingredientImages['Ciuperci'] },
          ];

    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep('menu')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Personalizare</h1>
          <div className="w-10" />
        </div>

        {/* Product Header */}
        <div className="p-4 bg-white border-b border-slate-200">
          <div className="flex items-start gap-4">
            {customizingItem.image && (
              <img
                src={selfOrderUsesApiMenu ? imageSrc(customizingItem.image) : customizingItem.image}
                alt={customizingItem.name}
                className="w-20 h-16 object-cover rounded-xl"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800">{customizingItem.name}</h2>
              <p className="text-xl font-black text-primary">
                {(customizingItem.price + tempExtras.reduce((sum, e) => sum + e.price * e.quantity, 0)).toFixed(2)} RON
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setCustomizeStep('extras')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all",
              customizeStep === 'extras' ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">Extras</span>
          </button>
          <button
            onClick={() => setCustomizeStep('remove')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all",
              customizeStep === 'remove' ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
            )}
          >
            <Minus className="w-4 h-4" />
            <span className="font-medium text-sm">Elimină</span>
          </button>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {customizeStep === 'extras' && (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Alege extras</h3>
                <div className="space-y-3">
                  {availableExtrasList.map((extra) => {
                    const currentQty = tempExtras.find(e => e.name === extra.name)?.quantity || 0;
                    return (
                      <div key={extra.name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                            <img src={extra.image} alt={extra.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{extra.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold text-sm">+{extra.price.toFixed(2)} RON</span>
                          {currentQty > 0 ? (
                            <div className="flex items-center gap-1 bg-green-100 rounded-full p-1">
                              <button 
                                onClick={() => handleExtraQuantity(extra.name, -1, extra.price)}
                                className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold text-sm">{currentQty}</span>
                              <button 
                                onClick={() => handleExtraQuantity(extra.name, 1, extra.price)}
                                className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleExtraQuantity(extra.name, 1, extra.price)}
                              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-green-100 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {customizeStep === 'remove' && (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Elimină ingredient</h3>
                <div className="space-y-3">
                  {customizingItem.ingredients?.map((ing) => {
                    const isRemoved = tempRemovals.includes(ing);
                    return (
                      <button
                        key={ing}
                        onClick={() => {
                          if (isRemoved) {
                            setTempRemovals(tempRemovals.filter(r => r !== ing));
                          } else {
                            setTempRemovals([...tempRemovals, ing]);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                          isRemoved 
                            ? "bg-red-50 border-red-300" 
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                          <img src={getIngredientImage(ing)} alt={ing} className="w-full h-full object-cover" />
                        </div>
                        <span className={cn(
                          "font-medium flex-1 text-left text-sm",
                          isRemoved ? "text-red-600 line-through" : "text-slate-800"
                        )}>
                          Elimină {ing.toLowerCase()}
                        </span>
                        {isRemoved && (
                          <Check className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <Button 
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700" 
            onClick={confirmCustomization}
          >
            <span className="flex-1 text-left">Adaugă în coș</span>
            <span className="font-black">
              {(customizingItem.price + tempExtras.reduce((sum, e) => sum + e.price * e.quantity, 0)).toFixed(2)} RON
            </span>
          </Button>
        </div>
      </div>
    );
  }

  // ============ UPSELL ============
  if (step === 'upsell') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <Sparkles className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Mai adaugi ceva?</h1>
              <p className="text-slate-500">Îți recomandăm</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {upsellSuggestions.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="rounded-xl bg-white border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all text-left overflow-hidden p-3 flex items-center gap-3"
                >
                  {item.image && (
                    <img
                      src={selfOrderUsesApiMenu ? imageSrc(item.image) : item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                    <p className="text-lg font-black text-primary">+{item.price.toFixed(2)} RON</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-12"
                onClick={() => setStep('cart')}
              >
                Nu, mulțumesc
              </Button>
              <Button 
                size="lg" 
                className="h-12 bg-green-600 hover:bg-green-700"
                onClick={() => setStep('cart')}
              >
                Continuă la coș
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ CART ============
  if (step === 'cart') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('menu')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Meniu</span>
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Coșul tău</h1>
          <div className="w-16" />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3 max-w-2xl mx-auto">
            {cart.map(item => (
              <Card key={item.id} className="p-3">
                <div className="flex gap-3">
                  {item.menuItem.image && (
                    <img
                      src={selfOrderUsesApiMenu ? imageSrc(item.menuItem.image) : item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-base text-slate-800 pr-2">{item.menuItem.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-600 flex-shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {item.extras.length > 0 && (
                      <div className="text-xs text-green-600 mb-1">
                        {item.extras.map(e => `+${e.name} (${e.quantity}x)`).join(', ')}
                      </div>
                    )}

                    {item.modifications.removed.length > 0 && (
                      <div className="text-xs text-red-500 mb-1">
                        Fără: {item.modifications.removed.join(', ')}
                      </div>
                    )}

                    {orderMode === 'dine-in' && item.addedBy !== deviceId && (
                      <div className="text-xs text-slate-400 mb-1">
                        Adăugat de alt dispozitiv
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-lg font-black text-primary">{calculateItemTotal(item).toFixed(2)} RON</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Coșul este gol</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {cart.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="max-w-2xl mx-auto">
              {orderMode === 'delivery' && totalAmount > 0 && totalAmount < 50 && (
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Taxă livrare (sub 50 RON)</span>
                  <span>{DELIVERY_FEE_UNDER_50.toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-base text-slate-600">Total de plată:</span>
                <span className="text-2xl font-black text-slate-800">
                  {grandTotalWithDelivery.toFixed(2)} RON
                </span>
              </div>
              <Button 
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700" 
                onClick={() => setStep('payment')}
              >
                Continuă la plată
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ PAYMENT ============
  if (step === 'payment') {
    const finalTotal = deliveryFinalTotal(
      totalAmount,
      orderMode === 'delivery' ? 'delivery' : 'dine-in',
    );
    const customerCash = parseFloat(String(customerCashAmount).replace(',', '.')) || 0;
    const changeAmount = customerCash - finalTotal;
    
    const processPayment = () => {
      setStep('processing');
      setTimeout(() => {
        handleConfirmOrder();
      }, 2000);
    };

    const canPlaceOrder = () => {
      if (paymentMethod === 'cash' && orderMode === 'delivery') {
        if (cashPaymentType === 'need-change') {
          return customerCash >= finalTotal;
        }
      }
      return true;
    };

    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('cart')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Plată</h1>
          <div className="w-16" />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 max-w-md mx-auto space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <h3 className="font-semibold mb-4">Rezumat comandă</h3>
              <div className="space-y-2 mb-4 max-h-32 overflow-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    <span>{calculateItemTotal(item).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>
              {orderMode === 'delivery' && totalAmount > 0 && totalAmount < 50 && (
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Taxă livrare (sub 50 RON)</span>
                  <span>{DELIVERY_FEE_UNDER_50.toFixed(2)} RON</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4 flex justify-between text-xl font-bold">
                <span>Total de plată</span>
                <span className="text-primary">{finalTotal.toFixed(2)} RON</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h3 className="font-semibold mb-3">Metodă de plată</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    "p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'card'
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-white hover:border-primary/50"
                  )}
                >
                  <CreditCard className={cn("w-8 h-8", paymentMethod === 'card' ? "text-primary" : "text-slate-400")} />
                  <span className="text-sm font-bold">Card</span>
                  <span className="text-xs text-slate-500">
                    {orderMode === 'delivery' ? 'Online' : 'La masă'}
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    "p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'cash'
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-white hover:border-primary/50"
                  )}
                >
                  <Banknote className={cn("w-8 h-8", paymentMethod === 'cash' ? "text-primary" : "text-slate-400")} />
                  <span className="text-sm font-bold">Cash</span>
                  <span className="text-xs text-slate-500">
                    {orderMode === 'delivery' ? 'La livrare' : 'La masă'}
                  </span>
                </button>
              </div>
            </div>

            {/* Cash Payment Options for Delivery */}
            {paymentMethod === 'cash' && orderMode === 'delivery' && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  Detalii plată cash
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCashPaymentType('exact')}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      cashPaymentType === 'exact'
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Check className={cn(
                      "w-6 h-6 mx-auto mb-1",
                      cashPaymentType === 'exact' ? "text-green-600" : "text-slate-400"
                    )} />
                    <span className="text-sm font-bold block">Sumă exactă</span>
                    <span className="text-xs text-slate-500">Am {finalTotal.toFixed(2)} RON</span>
                  </button>
                  
                  <button
                    onClick={() => setCashPaymentType('need-change')}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      cashPaymentType === 'need-change'
                        ? "border-amber-500 bg-amber-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Coins className={cn(
                      "w-6 h-6 mx-auto mb-1",
                      cashPaymentType === 'need-change' ? "text-amber-600" : "text-slate-400"
                    )} />
                    <span className="text-sm font-bold block">Am nevoie de rest</span>
                    <span className="text-xs text-slate-500">Introduceți cu cât plătiți</span>
                  </button>
                </div>

                {cashPaymentType === 'need-change' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Cu ce sumă vei plăti?
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={customerCashAmount}
                          onChange={e => setCustomerCashAmount(e.target.value)}
                          placeholder="Ex: 100"
                          className="h-14 text-xl font-bold text-center pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                          RON
                        </span>
                      </div>
                    </div>
                    
                    {/* Quick amount buttons */}
                    <div className="flex gap-2">
                      {[50, 100, 200].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setCustomerCashAmount(amount.toString())}
                          className={cn(
                            "flex-1 py-2 rounded-lg border-2 font-bold transition-all",
                            customerCashAmount === amount.toString()
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {amount} RON
                        </button>
                      ))}
                    </div>

                    {customerCash > 0 && (
                      <div className={cn(
                        "p-4 rounded-xl",
                        customerCash >= finalTotal ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                      )}>
                        {customerCash >= finalTotal ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-700">
                              <Check className="w-5 h-5" />
                              <span className="font-medium">Rest de primit:</span>
                            </div>
                            <span className="text-2xl font-black text-green-700">
                              {changeAmount.toFixed(2)} RON
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <X className="w-5 h-5" />
                            <span className="font-medium">
                              Suma introdusă ({customerCash} RON) este mai mică decât totalul ({finalTotal.toFixed(2)} RON)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cash info for dine-in */}
            {paymentMethod === 'cash' && orderMode === 'dine-in' && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <div className="flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-800">Plată la masă</p>
                    <p className="text-sm text-amber-700">Chelnerul va veni să încaseze {finalTotal.toFixed(2)} RON</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-md mx-auto">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              onClick={processPayment}
              disabled={!canPlaceOrder()}
            >
              {paymentMethod === 'cash' && orderMode === 'delivery' && cashPaymentType === 'need-change' && customerCash >= finalTotal ? (
                <>Plasează comanda (Rest: {changeAmount.toFixed(2)} RON)</>
              ) : (
                <>Plasează comanda - {finalTotal.toFixed(2)} RON</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ PROCESSING ============
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Se procesează comanda...</h1>
          <p className="text-slate-500">Vă rugăm așteptați</p>
        </div>
      </div>
    );
  }

  // ============ CONFIRMATION ============
  if (step === 'confirm') {
    const paidWithCash = parseFloat(String(customerCashAmount).replace(',', '.')) || 0;
    let confirmPaymentSummary: string;
    if (paymentMethod !== 'cash') {
      confirmPaymentSummary = 'Plată card / online';
    } else if (orderMode === 'dine-in') {
      confirmPaymentSummary = 'Plată cash la masă';
    } else if (cashPaymentType === 'exact') {
      confirmPaymentSummary = 'Cash la livrare – sumă exactă';
    } else if (paidWithCash > 0) {
      confirmPaymentSummary = `Cash la livrare – rest ${(paidWithCash - grandTotalWithDelivery).toFixed(2)} RON`;
    } else {
      confirmPaymentSummary = 'Cash la livrare';
    }

    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4"
      >
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">Comandă confirmată!</h1>
          <p className="text-xl font-bold text-green-700 mb-2">
            #{lastPlacedOrderId ?? Date.now().toString().slice(-6)}
          </p>
          <p className="text-green-600 mb-2">
            {orderMode === 'dine-in' 
              ? `Comanda va fi adusă la masa ${scannedTable?.number}`
              : `Livrare la ${deliveryForm.address}`
            }
          </p>
          <p className="text-green-600 mb-6">Mulțumim pentru comandă!</p>
          
          <div className="bg-white rounded-2xl p-4 mb-6 border border-green-200">
            <div className="flex items-center gap-2 mb-4 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">{confirmPaymentSummary}</span>
            </div>
            <div className="border-t border-green-100 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-green-700">{grandTotalWithDelivery.toFixed(2)} RON</span>
            </div>
          </div>

          <Button onClick={resetOrder} className="bg-green-600 hover:bg-green-700">
            Comandă nouă
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomerSelfOrder;
