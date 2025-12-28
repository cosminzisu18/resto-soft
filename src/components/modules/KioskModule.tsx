import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRestaurant } from '@/context/RestaurantContext';
import { menuCategories, MenuItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  Home, Package, UtensilsCrossed, QrCode, Check, X,
  Banknote, CreditCard, Loader2, CheckCircle, Clock, Sparkles,
  Volume2, VolumeX, RefreshCw, Play, Pause
} from 'lucide-react';
import AllergenBadges from '@/components/AllergenBadges';
import { PageHeader } from '@/components/ui/page-header';

type KioskStep = 'idle' | 'mode' | 'menu' | 'cart' | 'customize' | 'upsell' | 'payment' | 'processing' | 'confirm';
type OrderMode = 'dine-in' | 'takeaway';

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
  };
}

// Idle screen ads/promotions
const promotions = [
  { id: 1, title: 'Pizza Margherita', subtitle: 'Doar 32 RON', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', color: 'from-red-500/80' },
  { id: 2, title: 'Kebab XXL', subtitle: 'Nou în meniu!', image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800', color: 'from-yellow-500/80' },
  { id: 3, title: 'Meniu Familie', subtitle: 'Reducere 20%', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800', color: 'from-green-500/80' },
];

const KioskModule: React.FC = () => {
  const { menu } = useRestaurant();
  const [step, setStep] = useState<KioskStep>('idle');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [idleTimer, setIdleTimer] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Customization
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempAdditions, setTempAdditions] = useState<string[]>([]);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);

  // Idle timeout - return to idle after 60 seconds of inactivity
  const IDLE_TIMEOUT = 60;

  // Reset idle timer on any interaction
  const resetIdleTimer = () => {
    setIdleTimer(0);
  };

  // Auto-rotate promotions in idle mode
  useEffect(() => {
    if (step === 'idle') {
      const interval = setInterval(() => {
        setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Idle timeout counter
  useEffect(() => {
    if (step !== 'idle' && step !== 'confirm') {
      const interval = setInterval(() => {
        setIdleTimer((prev) => {
          if (prev >= IDLE_TIMEOUT) {
            // Reset everything and go to idle
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
    const suggestions: MenuItem[] = [];
    
    if (!cartCategories.has('Băuturi')) {
      suggestions.push(...menu.filter(m => m.category === 'Băuturi').slice(0, 2));
    }
    if (cartCategories.has('Grill') || cartCategories.has('Pizza')) {
      if (!cartCategories.has('Garnituri')) {
        suggestions.push(...menu.filter(m => m.category === 'Garnituri').slice(0, 2));
      }
    }
    return suggestions.slice(0, 4);
  }, [cart, menu]);

  const addToCart = (item: MenuItem) => {
    resetIdleTimer();
    if (item.ingredients && item.ingredients.length > 0) {
      setCustomizingItem(item);
      setTempAdditions([]);
      setTempRemovals([]);
      setStep('customize');
    } else {
      const newItem: CartItem = {
        id: `kiosk-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        modifications: { added: [], removed: [] }
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
      modifications: { added: tempAdditions, removed: tempRemovals }
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
    setTableNumber(null);
    setCart([]);
    setActiveCategory(menuCategories[0]);
    setIdleTimer(0);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredMenu = menu.filter(m => m.category === activeCategory && m.availability?.kiosk !== false);

  // Idle Screen with Ads
  if (step === 'idle') {
    const promo = promotions[currentPromoIndex];
    return (
      <div 
        className="h-full flex flex-col cursor-pointer overflow-hidden relative"
        onClick={() => { setStep('mode'); resetIdleTimer(); }}
      >
        {/* Full screen promo */}
        <div className="absolute inset-0">
          <img 
            src={promo.image} 
            alt={promo.title}
            className="w-full h-full object-cover"
          />
          <div className={cn("absolute inset-0 bg-gradient-to-t to-transparent", promo.color)} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-white p-8">
          <div className="text-center mb-8 animate-pulse">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">Atinge pentru a comanda</h1>
            <p className="text-2xl md:text-3xl opacity-80">Touch to order</p>
          </div>

          <div className="absolute bottom-20 text-center">
            <h2 className="text-4xl font-bold mb-2">{promo.title}</h2>
            <p className="text-2xl">{promo.subtitle}</p>
          </div>

          {/* Promo indicators */}
          <div className="absolute bottom-8 flex gap-2">
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

        {/* Sound toggle */}
        <button 
          className="absolute top-4 right-4 p-3 rounded-full bg-black/30 text-white"
          onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>
    );
  }

  // Mode Selection
  if (step === 'mode') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-primary/10 via-background to-primary/5" onClick={resetIdleTimer}>
        {/* Timeout indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{IDLE_TIMEOUT - idleTimer}s</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <button
              onClick={() => { setOrderMode('dine-in'); setStep('menu'); }}
              className="group p-12 rounded-3xl bg-card border-2 border-border hover:border-primary hover:shadow-2xl transition-all"
            >
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-6">
                <UtensilsCrossed className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Servire la masă</h2>
              <p className="text-muted-foreground text-lg">Mănânc aici</p>
            </button>

            <button
              onClick={() => { setOrderMode('takeaway'); setStep('menu'); }}
              className="group p-12 rounded-3xl bg-card border-2 border-border hover:border-primary hover:shadow-2xl transition-all"
            >
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-6">
                <Package className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">La pachet</h2>
              <p className="text-muted-foreground text-lg">Takeaway</p>
            </button>
          </div>
        </div>

        <div className="p-6 flex justify-center">
          <Button variant="ghost" size="lg" onClick={resetOrder}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
        </div>
      </div>
    );
  }

  // Menu
  if (step === 'menu') {
    return (
      <div className="h-full flex flex-col" onClick={resetIdleTimer}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setStep('mode')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {orderMode === 'dine-in' ? 'Servire la masă' : 'La pachet'}
              </h1>
            </div>
          </div>
          
          {/* Timeout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{IDLE_TIMEOUT - idleTimer}s</span>
            </div>
            
            {/* Cart summary */}
            {cart.length > 0 && (
              <Button onClick={() => setStep('cart')} className="relative">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {totalAmount.toFixed(0)} RON
                <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                  {totalItems}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="p-3 border-b border-border overflow-x-auto">
          <div className="flex gap-2">
            {menuCategories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveCategory(cat)}
                className="whitespace-nowrap h-14 px-6 text-base"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenu.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="rounded-2xl bg-card border-2 border-border hover:border-primary hover:shadow-xl transition-all text-left overflow-hidden group active:scale-95"
              >
                {item.image && (
                  <div className="aspect-video bg-muted">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                  <AllergenBadges allergenIds={item.allergenIds} size="sm" className="mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{item.price} RON</span>
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Plus className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-border bg-card">
            <Button 
              className="w-full h-16 text-xl" 
              onClick={() => setStep(upsellSuggestions.length > 0 ? 'upsell' : 'cart')}
            >
              <ShoppingCart className="w-6 h-6 mr-3" />
              Vezi coșul ({totalItems} produse) - {totalAmount.toFixed(2)} RON
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Customization
  if (step === 'customize' && customizingItem) {
    return (
      <div className="h-full flex flex-col" onClick={resetIdleTimer}>
        <div className="p-4 border-b border-border flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('menu')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Personalizează: {customizingItem.name}</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {customizingItem.image && (
            <div className="aspect-video max-w-md mx-auto rounded-2xl overflow-hidden mb-6">
              <img src={customizingItem.image} alt={customizingItem.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Ingrediente</h2>
            <div className="grid grid-cols-2 gap-3">
              {customizingItem.ingredients.map(ing => (
                <div key={ing} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                  <span className="font-medium">{ing}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={tempRemovals.includes(ing) ? 'destructive' : 'outline'}
                      onClick={() => {
                        if (tempRemovals.includes(ing)) {
                          setTempRemovals(tempRemovals.filter(r => r !== ing));
                        } else {
                          setTempRemovals([...tempRemovals, ing]);
                        }
                      }}
                    >
                      Fără
                    </Button>
                    <Button
                      size="sm"
                      variant={tempAdditions.includes(ing) ? 'default' : 'outline'}
                      onClick={() => {
                        if (tempAdditions.includes(ing)) {
                          setTempAdditions(tempAdditions.filter(a => a !== ing));
                        } else {
                          setTempAdditions([...tempAdditions, ing]);
                        }
                      }}
                    >
                      Extra
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-card">
          <Button className="w-full h-16 text-xl" onClick={confirmCustomization}>
            <Check className="w-6 h-6 mr-3" />
            Adaugă în coș - {customizingItem.price} RON
          </Button>
        </div>
      </div>
    );
  }

  // Upsell
  if (step === 'upsell') {
    return (
      <div className="h-full flex flex-col" onClick={resetIdleTimer}>
        <div className="p-4 border-b border-border flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('menu')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              Îți mai recomandăm
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {upsellSuggestions.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  addToCart(item);
                  setStep('upsell');
                }}
                className="rounded-2xl bg-card border-2 border-border hover:border-primary transition-all text-left overflow-hidden"
              >
                {item.image && (
                  <div className="aspect-square bg-muted">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold mb-1">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">+{item.price} RON</span>
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-card flex gap-3">
          <Button variant="outline" className="flex-1 h-14" onClick={() => setStep('cart')}>
            Nu, mulțumesc
          </Button>
          <Button className="flex-1 h-14" onClick={() => setStep('cart')}>
            Continuă
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Cart
  if (step === 'cart') {
    return (
      <div className="h-full flex flex-col" onClick={resetIdleTimer}>
        <div className="p-4 border-b border-border flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('menu')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Coșul tău</h1>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.map(item => (
            <Card key={item.id} className="p-4 mb-3">
              <div className="flex items-center gap-4">
                {item.menuItem.image && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.menuItem.name}</h3>
                  {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                    <div className="text-sm text-muted-foreground">
                      {item.modifications.added.map(a => <span key={a} className="text-success">+{a} </span>)}
                      {item.modifications.removed.map(r => <span key={r} className="text-destructive">-{r} </span>)}
                    </div>
                  )}
                  <p className="text-xl font-bold text-primary mt-1">
                    {(item.menuItem.price * item.quantity).toFixed(2)} RON
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => updateQuantity(item.id, -1)}>
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-2xl font-bold w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => updateQuantity(item.id, 1)}>
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-card space-y-3">
          <div className="flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span className="text-primary">{totalAmount.toFixed(2)} RON</span>
          </div>
          <Button className="w-full h-16 text-xl" onClick={() => setStep('payment')}>
            Continuă la plată
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Payment
  if (step === 'payment') {
    return (
      <div className="h-full flex flex-col" onClick={resetIdleTimer}>
        <div className="p-4 border-b border-border flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('cart')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Selectează metoda de plată</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
            <button
              onClick={() => setStep('processing')}
              className="group p-12 rounded-3xl bg-card border-2 border-border hover:border-primary hover:shadow-2xl transition-all"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-6">
                <CreditCard className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Card</h2>
              <p className="text-muted-foreground">Contactless sau chip</p>
            </button>

            <button
              onClick={() => setStep('processing')}
              className="group p-12 rounded-3xl bg-card border-2 border-border hover:border-primary hover:shadow-2xl transition-all"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-6">
                <Banknote className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Numerar</h2>
              <p className="text-muted-foreground">Plătește la casa de marcat</p>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted">
          <div className="text-center">
            <span className="text-lg">Total de plată: </span>
            <span className="text-3xl font-bold text-primary">{totalAmount.toFixed(2)} RON</span>
          </div>
        </div>
      </div>
    );
  }

  // Processing
  if (step === 'processing') {
    setTimeout(() => setStep('confirm'), 2000);
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="w-24 h-24 mx-auto text-primary animate-spin mb-6" />
          <h1 className="text-3xl font-bold mb-2">Se procesează plata...</h1>
          <p className="text-muted-foreground text-lg">Vă rugăm așteptați</p>
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirm') {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-success/10 via-background to-success/5">
        <div className="text-center max-w-lg">
          <div className="w-32 h-32 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Comandă plasată!</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Numărul comenzii: <span className="font-bold text-primary">#1234</span>
          </p>
          
          <div className="p-6 rounded-2xl bg-card border border-border mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <QrCode className="w-24 h-24 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Scanează codul QR de pe bon pentru a urmări statusul comenzii
            </p>
          </div>

          <Button size="lg" className="h-16 px-12 text-xl" onClick={resetOrder}>
            Comandă nouă
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default KioskModule;
