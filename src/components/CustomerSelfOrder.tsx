import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { menuCategories, MenuItem, extraIngredients as extraIngredientsData } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  Check, X, CreditCard, Loader2, CheckCircle, Clock, Sparkles,
  Volume2, VolumeX, ChevronRight, Banknote, QrCode, Truck, 
  UtensilsCrossed, MapPin, Phone, User, History, Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AllergenBadges from '@/components/AllergenBadges';

type SelfOrderStep = 'idle' | 'mode' | 'scan' | 'delivery-form' | 'menu' | 'cart' | 'customize' | 'upsell' | 'payment' | 'processing' | 'confirm';
type OrderMode = 'dine-in' | 'delivery';
type PaymentMethod = 'cash' | 'card' | 'online';

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
  };
  extras: { name: string; quantity: number; price: number }[];
  addedBy?: string; // Device/user identifier for sync
  timestamp?: number;
}

interface TableOrder {
  tableId: string;
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
  
  const [step, setStep] = useState<SelfOrderStep>(initialTableId ? 'menu' : 'idle');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  // Table ordering
  const [scannedTableId, setScannedTableId] = useState<string | null>(initialTableId || null);
  const [qrInput, setQrInput] = useState('');
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  // Customization
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizeStep, setCustomizeStep] = useState<'extras' | 'remove'>('extras');
  const [tempExtras, setTempExtras] = useState<{ name: string; quantity: number; price: number }[]>([]);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);

  const scannedTable = scannedTableId ? tables.find(t => t.id === scannedTableId) : null;

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

  // Upsell suggestions
  const upsellSuggestions = useMemo(() => {
    if (cart.length === 0) return [];
    const cartCategories = new Set(cart.map(c => c.menuItem.category));
    const suggestions: MenuItem[] = [];
    
    if (!cartCategories.has('Băuturi')) {
      suggestions.push(...menu.filter(m => m.category === 'Băuturi').slice(0, 2));
    }
    if (cartCategories.has('Grill') || cartCategories.has('Pizza') || cartCategories.has('Giros')) {
      if (!cartCategories.has('Garnituri')) {
        suggestions.push(...menu.filter(m => m.category === 'Garnituri').slice(0, 2));
      }
    }
    return suggestions.slice(0, 4);
  }, [cart, menu]);

  const handleScanQR = () => {
    const table = tables.find(t => t.qrCode === qrInput || t.id.includes(qrInput.toLowerCase()) || t.number.toString() === qrInput);
    if (table) {
      setScannedTableId(table.id);
      setOrderMode('dine-in');
      setStep('menu');
      toast({ title: `Masa ${table.number} detectată!` });
    } else {
      toast({ title: 'Cod QR invalid', variant: 'destructive' });
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
    setDeliveryForm({ name: '', phone: '', address: '', notes: '' });
    setTableOrder(null);
    setPaymentMethod('card');
  };

  const calculateItemTotal = (item: CartItem) => {
    const extrasTotal = item.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
    return (item.menuItem.price + extrasTotal) * item.quantity;
  };

  const totalAmount = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredMenu = menu.filter(m => m.category === activeCategory && m.availability?.app !== false);

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

  const handleConfirmOrder = () => {
    if (orderMode === 'dine-in' && scannedTable) {
      const order = createOrder(scannedTable.id, 'restaurant');
      cart.forEach(item => {
        addItemToOrder(order.id, item.menuItem, item.quantity);
      });
      
      // Move items to history
      if (tableOrder) {
        setTableOrder({
          ...tableOrder,
          items: [],
          history: [...tableOrder.history, ...cart]
        });
      }
    } else {
      const order = createDeliveryOrder('own_website', {
        name: deliveryForm.name,
        phone: deliveryForm.phone,
        address: deliveryForm.address,
      });
      cart.forEach(item => {
        addItemToOrder(order.id, item.menuItem, item.quantity);
      });
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
                onChange={e => setQrInput(e.target.value)}
                placeholder="Introdu numărul mesei..."
                className="flex-1 h-12"
              />
              <Button onClick={handleScanQR} className="h-12 px-6">
                Verifică
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14"
              onClick={() => {
                const freeTable = tables.find(t => t.status === 'free' || t.status === 'occupied');
                if (freeTable) {
                  setScannedTableId(freeTable.id);
                  setOrderMode('dine-in');
                  setStep('menu');
                  toast({ title: `Masa ${freeTable.number} detectată!` });
                }
              }}
            >
              <QrCode className="w-5 h-5 mr-2" />
              Deschide camera
            </Button>
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
          <Button variant="ghost" size="sm" onClick={() => setStep(orderMode === 'delivery' ? 'delivery-form' : 'scan')}>
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
            {menuCategories.map(cat => (
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
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
    const availableExtras = [
      { name: 'Extra carne', price: 8.00, image: ingredientImages['Carne'] },
      { name: 'Extra bacon', price: 5.00, image: ingredientImages['Bacon'] },
      { name: 'Extra brânză', price: 4.00, image: ingredientImages['Brânză'] },
      { name: 'Extra sos', price: 2.00, image: ingredientImages['Maioneză'] },
      { name: 'Extra ciuperci', price: 3.00, image: ingredientImages['Ciuperci'] },
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
              <img src={customizingItem.image} alt={customizingItem.name} className="w-20 h-16 object-cover rounded-xl" />
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
                  {availableExtras.map((extra) => {
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
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl" />
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
                    <img src={item.menuItem.image} alt={item.menuItem.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
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
              <div className="flex items-center justify-between mb-4">
                <span className="text-base text-slate-600">Total comandă:</span>
                <span className="text-2xl font-black text-slate-800">{totalAmount.toFixed(2)} RON</span>
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
    const processPayment = () => {
      setStep('processing');
      setTimeout(() => {
        handleConfirmOrder();
      }, 2000);
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

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
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
              {orderMode === 'delivery' && totalAmount < 50 && (
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Livrare</span>
                  <span>10.00 RON</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {(totalAmount + (orderMode === 'delivery' && totalAmount < 50 ? 10 : 0)).toFixed(2)} RON
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-3">
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
              </button>

              {orderMode === 'dine-in' && (
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
                </button>
              )}

              {orderMode === 'delivery' && (
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={cn(
                    "p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'online'
                      ? "border-primary bg-primary/10"
                      : "border-slate-200 bg-white hover:border-primary/50"
                  )}
                >
                  <CreditCard className={cn("w-8 h-8", paymentMethod === 'online' ? "text-primary" : "text-slate-400")} />
                  <span className="text-sm font-bold">Online</span>
                </button>
              )}
            </div>

            {/* Confirm Button */}
            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              onClick={processPayment}
            >
              Plasează comanda
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
            #{Date.now().toString().slice(-6)}
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
              <span className="font-medium">
                {paymentMethod === 'cash' ? 'Plată la livrare/masă' : 'Plătit online'}
              </span>
            </div>
            <div className="border-t border-green-100 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-green-700">{totalAmount.toFixed(2)} RON</span>
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
