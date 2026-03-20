import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { imageSrc, menuApi, ordersApi, type MenuItemApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  Package, UtensilsCrossed, Check, X,
  CreditCard, Loader2, CheckCircle, Clock, Sparkles,
  Volume2, VolumeX, Info, ChevronRight, Home
} from 'lucide-react';
import AllergenBadges from '@/components/AllergenBadges';

type KioskStep = 'idle' | 'mode' | 'menu' | 'cart' | 'customize' | 'upsell' | 'payment' | 'processing' | 'confirm';
type OrderMode = 'dine-in' | 'takeaway';

interface CartItem {
  id: string;
  menuItem: KioskMenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
  };
  extras: { id: number; name: string; quantity: number; price: number }[];
}

interface KioskMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prepTime: number;
  ingredients: string[];
  availableExtras: { id: number; name: string; price: number; image?: string | null }[];
  allergenIds?: string[];
  image?: string;
  availability?: {
    restaurant?: boolean;
    kiosk?: boolean;
    app?: boolean;
    delivery?: boolean;
  };
}

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
  { id: 2, title: 'Kebab XXL', subtitle: 'Nou în meniu!', image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200', color: 'from-yellow-500/80' },
  { id: 3, title: 'Burger Special', subtitle: 'Ediție limitată', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200', color: 'from-orange-500/80' },
];

// Languages
const languages = [
  { code: 'ro', flag: '🇷🇴', name: 'Română' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
];

const KioskModule: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [menu, setMenu] = useState<KioskMenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<string[]>([]);
  const [savedOrderNumber, setSavedOrderNumber] = useState<number | null>(null);
  
  const [step, setStep] = useState<KioskStep>('idle');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [idleTimer, setIdleTimer] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Customization
  const [customizingItem, setCustomizingItem] = useState<KioskMenuItem | null>(null);
  const [customizeStep, setCustomizeStep] = useState<'extras' | 'remove'>('extras');
  const [tempExtras, setTempExtras] = useState<{ id: number; name: string; quantity: number; price: number }[]>([]);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);
  
  // Upsell dialog
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellItem, setUpsellItem] = useState<KioskMenuItem | null>(null);

  const IDLE_TIMEOUT = 120;

  const resetIdleTimer = () => setIdleTimer(0);

  useEffect(() => {
    const mapApiItem = (item: MenuItemApi): KioskMenuItem => ({
      id: String(item.id),
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price ?? 0),
      category: item.category,
      prepTime: Number(item.prepTime ?? 0),
      ingredients:
        item.menuItemIngredients?.map((r) => r.ingredient?.name ?? `Ingredient #${r.ingredientId}`) ??
        item.ingredients?.map((i) => i.name) ??
        [],
      availableExtras:
        item.availableExtras?.map((e) => ({
          id: e.id,
          name: e.name,
          price: Number(e.price ?? 0),
          image: e.image ?? null,
        })) ?? [],
      allergenIds: item.allergens?.map((a) => String(a.id)),
      image: item.image,
      availability: item.availability,
    });

    const fetchKioskMenu = async () => {
      try {
        const [cats, items] = await Promise.all([menuApi.getCategories(), menuApi.getItems()]);
        const categoryNames = cats.map((c) => c.name);
        const mapped = items.map(mapApiItem);
        setMenuCategories(categoryNames);
        setMenu(mapped);
        if (categoryNames.length > 0) setActiveCategory((prev) => prev || categoryNames[0]);
      } catch {
        setMenu([]);
        setMenuCategories([]);
      }
    };

    void fetchKioskMenu();
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

  // Idle timeout
  useEffect(() => {
    if (step !== 'idle' && step !== 'confirm') {
      const interval = setInterval(() => {
        setIdleTimer((prev) => {
          if (prev >= IDLE_TIMEOUT) {
            resetOrder();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Upsell suggestions
  const upsellSuggestions = useMemo(() => {
    if (cart.length === 0) return [];
    const cartCategories = new Set(cart.map(c => c.menuItem.category));
    const suggestions: KioskMenuItem[] = [];
    
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

  const openCustomization = (item: KioskMenuItem) => {
    resetIdleTimer();
    setCustomizingItem(item);
    setTempExtras([]);
    setTempRemovals([]);
    setCustomizeStep('extras');
    setStep('customize');
  };

  const addToCart = (item: KioskMenuItem) => {
    resetIdleTimer();
    if (item.ingredients && item.ingredients.length > 0) {
      openCustomization(item);
    } else {
      const newItem: CartItem = {
        id: `kiosk-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        modifications: { added: [], removed: [] },
        extras: []
      };
      setCart([...cart, newItem]);
    }
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    const newItem: CartItem = {
      id: `kiosk-${Date.now()}`,
      menuItem: customizingItem,
      quantity: 1,
      modifications: { 
        added: tempExtras.map(e => e.name), 
        removed: tempRemovals 
      },
      extras: tempExtras
    };
    setCart([...cart, newItem]);
    setCustomizingItem(null);
    setStep('menu');
  };

  const updateQuantity = (id: string, delta: number) => {
    resetIdleTimer();
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    resetIdleTimer();
    setCart(cart.filter(item => item.id !== id));
  };

  const resetOrder = () => {
    setStep('idle');
    setOrderMode(null);
    setCart([]);
    setActiveCategory(menuCategories[0] ?? '');
    setIdleTimer(0);
    setSavedOrderNumber(null);
  };

  const calculateItemTotal = (item: CartItem) => {
    const extrasTotal = item.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
    return (item.menuItem.price + extrasTotal) * item.quantity;
  };

  const totalAmount = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredMenu = menu.filter((m) => m.category === activeCategory && m.availability?.kiosk !== false);

  const handlePaymentSuccess = async () => {
    if (!orderMode || cart.length === 0) return;
    setStep('processing');
    try {
      const created = await ordersApi.create({
        source: 'kiosk',
        fulfillmentType: orderMode === 'dine-in' ? 'dine_in' : 'takeaway',
        tableNumber: orderMode === 'dine-in' ? 0 : undefined,
        customerName: 'Kiosk Self-Order',
        deliveryAddress: orderMode === 'takeaway' ? 'La pachet (Kiosk)' : null,
        items: cart.map((c) => ({
          menuItemId: Number(c.menuItem.id),
          quantity: c.quantity,
          menuItem: {
            id: Number(c.menuItem.id),
            name: c.menuItem.name,
            category: c.menuItem.category,
            prepTime: c.menuItem.prepTime,
            image: c.menuItem.image ?? null,
          },
          modifications: {
            added: c.modifications.added,
            removed: c.modifications.removed,
            notes: c.extras.length
              ? c.extras.map((e) => `${e.name} x${e.quantity}`).join(', ')
              : '',
          },
        })),
      });
      setSavedOrderNumber(created.id);
      setStep('confirm');
    } catch {
      setStep('payment');
    }
  };

  const handleExtraQuantity = (extraId: number, ingredientName: string, delta: number, price: number) => {
    setTempExtras((prev) => {
      const existing = prev.find((e) => e.id === extraId);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter((e) => e.id !== extraId);
        }
        return prev.map((e) => (e.id === extraId ? { ...e, quantity: newQty } : e));
      }
      if (delta > 0) {
        return [...prev, { id: extraId, name: ingredientName, quantity: 1, price }];
      }
      return prev;
    });
  };

  // ============ IDLE SCREEN ============
  if (step === 'idle') {
    const promo = promotions[currentPromoIndex];
    return (
      <div 
        className="h-full flex flex-col cursor-pointer overflow-hidden relative bg-slate-900"
        onClick={() => { setStep('mode'); resetIdleTimer(); }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
          <div className={cn("absolute inset-0 bg-gradient-to-t to-transparent", promo.color)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Language Selector */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={(e) => { e.stopPropagation(); setLanguage(lang.code as 'ro' | 'en' | 'de' | 'hu'); }}
              className={cn(
                "w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all",
                language === lang.code ? "bg-white shadow-lg scale-110" : "bg-white/30 hover:bg-white/50"
              )}
            >
              {lang.flag}
            </button>
          ))}
        </div>

        {/* Sound Toggle */}
        <button 
          className="absolute top-6 left-6 z-20 p-3 rounded-full bg-black/30 text-white"
          onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-white p-8">
          {/* Product Image */}
          <div className="mb-12">
            <img 
              src={promo.image} 
              alt={promo.title}
              className="w-80 h-64 object-cover rounded-2xl shadow-2xl"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-center">Începeți comanda</h1>

          {/* Order Type Buttons */}
          <div className="flex gap-8 mb-12">
            <button
              onClick={(e) => { e.stopPropagation(); setOrderMode('dine-in'); setStep('menu'); resetIdleTimer(); }}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all min-w-[180px]"
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">🍽️</span>
              </div>
              <span className="text-xl font-bold">În restaurant</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setOrderMode('takeaway'); setStep('menu'); resetIdleTimer(); }}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all min-w-[180px]"
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">🛍️</span>
              </div>
              <span className="text-xl font-bold">La pachet</span>
            </button>
          </div>

          {/* Secondary Links */}
          <div className="flex flex-col items-center gap-2 text-white/70 text-sm">
            <button className="hover:text-white underline">Alergeni și nutriționale</button>
            <button className="hover:text-white underline">Informații Ambalaj</button>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm z-10">
          <p>Doar plata cu cardul</p>
        </div>

        {/* Promo indicators */}
        <div className="absolute bottom-6 right-6 flex gap-2 z-10">
          {promotions.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                idx === currentPromoIndex ? "bg-white w-8" : "bg-white/50"
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
      <div className="h-full flex flex-col bg-slate-100" onClick={resetIdleTimer}>
        {/* Language Selector */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={(e) => { e.stopPropagation(); setLanguage(lang.code as 'ro' | 'en' | 'de' | 'hu'); }}
              className={cn(
                "w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all border-2",
                language === lang.code ? "bg-white border-primary shadow-lg" : "bg-white/80 border-transparent hover:bg-white"
              )}
            >
              {lang.flag}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Product Image */}
          <div className="mb-8">
            <img 
              src={promo.image} 
              alt="Product"
              className="w-72 h-56 object-cover rounded-2xl shadow-xl"
            />
          </div>

          <h1 className="text-4xl font-bold mb-2 text-slate-800">Începeți comanda</h1>
          <p className="text-slate-500 mb-8">Alegeți tipul comenzii</p>

          <div className="flex gap-6">
            <button
              onClick={() => { setOrderMode('dine-in'); setStep('menu'); }}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all min-w-[200px]"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
              <span className="text-xl font-bold text-slate-800">În restaurant</span>
            </button>

            <button
              onClick={() => { setOrderMode('takeaway'); setStep('menu'); }}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all min-w-[200px]"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🛍️</span>
              </div>
              <span className="text-xl font-bold text-slate-800">La pachet</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 mt-8 text-slate-500 text-sm">
            <button className="hover:text-primary underline">Alergeni și nutriționale</button>
            <button className="hover:text-primary underline">Informații Ambalaj</button>
          </div>
        </div>

        <div className="p-4 text-center text-slate-400 text-sm border-t">
          Doar plata cu cardul • Timeout: {IDLE_TIMEOUT - idleTimer}s
        </div>
      </div>
    );
  }

  // ============ MENU ============
  if (step === 'menu') {
    return (
      <div className="h-full flex flex-col md:flex-row bg-slate-100" onClick={resetIdleTimer}>
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white border-b border-slate-200">
          <button 
            onClick={() => setStep('mode')}
            className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Înapoi</span>
          </button>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">{IDLE_TIMEOUT - idleTimer}s</span>
          </div>
          {cart.length > 0 && (
            <Button onClick={() => setStep('cart')} size="sm" className="h-9">
              <ShoppingCart className="w-4 h-4 mr-1" />
              {totalAmount.toFixed(0)} RON
              <Badge className="ml-1 bg-white text-primary text-xs">{totalItems}</Badge>
            </Button>
          )}
        </div>

        {/* Mobile Categories Scroll */}
        <div className="md:hidden bg-white border-b border-slate-200">
          <ScrollArea className="w-full">
            <div className="flex gap-2 p-2">
              {menuCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    activeCategory === cat 
                      ? "bg-primary text-white" 
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  <span>{categoryIcons[cat] || '📦'}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop Left Sidebar - Categories */}
        <div className="hidden md:flex w-40 lg:w-48 bg-white border-r border-slate-200 flex-col">
          {/* Logo/Home */}
          <div className="p-3 lg:p-4 border-b border-slate-200">
            <button 
              onClick={() => setStep('mode')}
              className="w-full flex items-center gap-2 p-2 lg:p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="font-medium text-sm lg:text-base">Înapoi</span>
            </button>
          </div>

          {/* Categories */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {menuCategories.map(cat => {
                const itemCount = menu.filter(m => m.category === cat && m.availability?.kiosk !== false).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "w-full flex items-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-xl text-left transition-all",
                      activeCategory === cat 
                        ? "bg-primary text-white shadow-lg" 
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    <span className="text-xl lg:text-2xl">{categoryIcons[cat] || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-xs lg:text-sm truncate", activeCategory === cat ? "text-white" : "text-slate-800")}>
                        {cat}
                      </p>
                      {activeCategory !== cat && (
                        <p className="text-xs text-slate-400 hidden lg:block">{itemCount} produse</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Language at bottom */}
          <div className="p-3 lg:p-4 border-t border-slate-200">
            <div className="flex justify-center gap-1 lg:gap-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as 'ro' | 'en' | 'de' | 'hu')}
                  className={cn(
                    "w-8 h-8 lg:w-10 lg:h-10 rounded-full text-base lg:text-lg flex items-center justify-center transition-all",
                    language === lang.code ? "bg-primary/10 ring-2 ring-primary" : "bg-slate-100 hover:bg-slate-200"
                  )}
                >
                  {lang.flag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Desktop Header */}
          <div className="hidden md:flex p-3 lg:p-4 bg-white border-b border-slate-200 items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800">{activeCategory}</h1>
              <Badge variant="secondary">{filteredMenu.length} produse</Badge>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Timeout */}
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{IDLE_TIMEOUT - idleTimer}s</span>
              </div>
              
              {/* Cart button */}
              {cart.length > 0 && (
                <Button onClick={() => setStep('cart')} size="lg" className="h-10 lg:h-12 px-4 lg:px-6">
                  <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  <span className="hidden lg:inline">Coș: </span>{totalAmount.toFixed(2)} RON
                  <Badge className="ml-2 bg-white text-primary">{totalItems}</Badge>
                </Button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <ScrollArea className="flex-1">
            <div className="p-3 lg:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="rounded-xl lg:rounded-2xl bg-white border-2 border-slate-100 hover:border-primary hover:shadow-xl transition-all text-left overflow-hidden group active:scale-95"
                  >
                    {item.image && (
                      <div className="aspect-square bg-slate-50 relative">
                        <img src={imageSrc(item.image)} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    )}
                    <div className="p-2 sm:p-3 lg:p-4">
                      <h3 className="font-bold text-xs sm:text-sm lg:text-base mb-1 line-clamp-2 text-slate-800">{item.name}</h3>
                      <p className="text-lg sm:text-xl lg:text-2xl font-black text-primary">{item.price.toFixed(2)} RON</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Bottom Bar */}
          {cart.length > 0 && (
            <div className="p-3 lg:p-4 bg-white border-t border-slate-200">
              <Button 
                className="w-full h-12 lg:h-16 text-base lg:text-xl bg-green-600 hover:bg-green-700" 
                onClick={() => setStep(upsellSuggestions.length > 0 ? 'upsell' : 'cart')}
              >
                <span className="flex-1 text-left">Următorul</span>
                <span className="font-black">Sumă: {totalAmount.toFixed(2)} RON</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ CUSTOMIZATION ============
  if (step === 'customize' && customizingItem) {
    const availableExtras = customizingItem.availableExtras;

    return (
      <div className="h-full flex bg-slate-100" onClick={resetIdleTimer}>
        {/* Left Sidebar - Steps */}
        <div className="w-56 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setStep('menu')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Înapoi la meniu
            </Button>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-bold text-slate-500 mb-4">Setul dvs</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary">
                <Check className="w-5 h-5" />
                <span className="font-medium">Sandwich</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-600">
                <span className="font-medium ml-8">{customizingItem.name}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-500 mt-6 mb-4">Personalizare</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCustomizeStep('extras')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                  customizeStep === 'extras' ? "bg-primary text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                )}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Alege extras</span>
              </button>
              <button
                onClick={() => setCustomizeStep('remove')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                  customizeStep === 'remove' ? "bg-primary text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                )}
              >
                <Minus className="w-5 h-5" />
                <span className="font-medium">Elimină ingredient</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Product Header */}
          <div className="p-6 bg-white border-b border-slate-200">
            <div className="flex items-start gap-6">
              {customizingItem.image && (
                <img src={imageSrc(customizingItem.image)} alt={customizingItem.name} className="w-32 h-24 object-cover rounded-xl" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">{customizingItem.name}</h1>
                    <p className="text-slate-500 mt-1 max-w-xl">{customizingItem.description}</p>
                  </div>
                  <p className="text-2xl font-black text-primary">
                    {(customizingItem.price + tempExtras.reduce((sum, e) => sum + e.price * e.quantity, 0)).toFixed(2)} RON
                  </p>
                </div>
                <AllergenBadges allergenIds={customizingItem.allergenIds} size="md" className="mt-3" />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {customizeStep === 'extras' && (
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Alege extras</h2>
                  {availableExtras.length === 0 && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-500">
                      Nu există ingrediente extra configurate în DB pentru acest produs.
                    </div>
                  )}
                  <div className="space-y-3">
                    {availableExtras.map((extra) => {
                      const currentQty = tempExtras.find((e) => e.id === extra.id)?.quantity || 0;
                      return (
                        <div key={extra.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center gap-4 min-w-0">
                            {extra.image ? (
                              <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                <img
                                  src={imageSrc(extra.image)}
                                  alt={extra.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400"
                                aria-hidden
                              >
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <span className="font-medium text-slate-800 truncate">{extra.name}</span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-primary font-bold">+{extra.price.toFixed(2)} RON</span>
                            {currentQty > 0 ? (
                              <div className="flex items-center gap-2 bg-green-100 rounded-full p-1">
                                <button
                                  type="button"
                                  onClick={() => handleExtraQuantity(extra.id, extra.name, -1, extra.price)}
                                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-bold">{currentQty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleExtraQuantity(extra.id, extra.name, 1, extra.price)}
                                  className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleExtraQuantity(extra.id, extra.name, 1, extra.price)}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-green-100 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="mt-4 text-primary font-medium flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Mai multe produse
                  </button>
                </>
              )}

              {customizeStep === 'remove' && (
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Elimină ingredient</h2>
                  <div className="space-y-3">
                    {customizingItem.ingredients.map((ing) => {
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
                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                            isRemoved 
                              ? "bg-red-50 border-red-300" 
                              : "bg-white border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div
                            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400"
                            aria-hidden
                          >
                            <UtensilsCrossed className="w-6 h-6" />
                          </div>
                          <span className={cn(
                            "font-medium flex-1 text-left",
                            isRemoved ? "text-red-600 line-through" : "text-slate-800"
                          )}>
                            Elimină {ing.toLowerCase()}
                          </span>
                          {isRemoved && (
                            <Check className="w-6 h-6 text-red-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button className="mt-4 text-primary font-medium flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Mai multe produse
                  </button>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Bottom Bar */}
          <div className="p-4 bg-white border-t border-slate-200">
            <Button 
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700" 
              onClick={confirmCustomization}
            >
              <span className="flex-1 text-left">Următorul</span>
              <span className="font-black">
                Sumă: {(customizingItem.price + tempExtras.reduce((sum, e) => sum + e.price * e.quantity, 0)).toFixed(2)} RON
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ UPSELL ============
  if (step === 'upsell') {
    return (
      <div className="h-full flex flex-col bg-slate-100" onClick={resetIdleTimer}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Sau poate ceva mai mare?</h1>
              <p className="text-slate-500">Îți recomandăm să adaugi</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {upsellSuggestions.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="rounded-2xl bg-white border-2 border-slate-200 hover:border-primary hover:shadow-xl transition-all text-left overflow-hidden p-4 flex items-center gap-4"
                >
                  {item.image && (
                    <img src={imageSrc(item.image)} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <p className="text-xl font-black text-primary">+{item.price.toFixed(2)} RON</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 h-14"
                onClick={() => setStep('cart')}
              >
                Nu, mulțumesc
              </Button>
              <Button 
                size="lg" 
                className="flex-1 h-14 bg-green-600 hover:bg-green-700"
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
      <div className="h-full flex flex-col bg-slate-100" onClick={resetIdleTimer}>
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('menu')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi la meniu
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Coșul tău</h1>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{IDLE_TIMEOUT - idleTimer}s</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 max-w-2xl mx-auto">
            {cart.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  {item.menuItem.image && (
                    <img src={imageSrc(item.menuItem.image)} alt={item.menuItem.name} className="w-24 h-24 object-cover rounded-xl" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-800">{item.menuItem.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {item.extras.length > 0 && (
                      <div className="text-sm text-green-600 mb-1">
                        {item.extras.map(e => `+${e.name} (${e.quantity}x)`).join(', ')}
                      </div>
                    )}

                    {item.modifications.removed.length > 0 && (
                      <div className="text-sm text-red-500 mb-1">
                        Fără: {item.modifications.removed.join(', ')}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-10 text-center font-bold text-xl">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="text-xl font-black text-primary">{calculateItemTotal(item).toFixed(2)} RON</span>
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
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg text-slate-600">Total comandă:</span>
                <span className="text-3xl font-black text-slate-800">{totalAmount.toFixed(2)} RON</span>
              </div>
              <Button 
                className="w-full h-16 text-xl bg-green-600 hover:bg-green-700" 
                onClick={() => setStep('payment')}
              >
                <CreditCard className="w-6 h-6 mr-3" />
                Plătește cu cardul
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ PAYMENT ============
  if (step === 'payment') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100" onClick={resetIdleTimer}>
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CreditCard className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Plată cu cardul</h1>
          <p className="text-slate-500 mb-8">Introduceți cardul în terminal</p>
          <p className="text-4xl font-black text-primary mb-8">{totalAmount.toFixed(2)} RON</p>
          
          <Button 
            size="lg" 
            className="w-full h-14 mb-4 bg-green-600 hover:bg-green-700"
            onClick={handlePaymentSuccess}
          >
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Confirmă plata și trimite comanda
          </Button>
          
          <Button variant="outline" size="lg" className="w-full h-14" onClick={() => setStep('cart')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
        </div>
      </div>
    );
  }

  // ============ PROCESSING ============
  if (step === 'processing') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100">
        <Loader2 className="w-24 h-24 text-primary animate-spin mb-8" />
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Se procesează plata...</h1>
        <p className="text-slate-500">Vă rugăm așteptați</p>
      </div>
    );
  }

  // ============ CONFIRMATION ============
  if (step === 'confirm') {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center bg-green-50 cursor-pointer"
        onClick={resetOrder}
      >
        <div className="text-center">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <CheckCircle className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-green-800 mb-4">Comandă confirmată!</h1>
          <p className="text-2xl font-bold text-green-700 mb-2">Număr comandă: #{savedOrderNumber ?? `KSK${Date.now().toString().slice(-4)}`}</p>
          <p className="text-green-600 mb-8">Mulțumim pentru comandă!</p>
          <p className="text-slate-500">Atingeți ecranul pentru o nouă comandă</p>
        </div>
      </div>
    );
  }

  return null;
};

export default KioskModule;
