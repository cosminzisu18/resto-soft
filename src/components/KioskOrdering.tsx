import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { menuItems, menuCategories, MenuItem, Table } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, Send, ArrowLeft, ArrowRight,
  Home, Package, UtensilsCrossed, QrCode, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSelector from '@/components/LanguageSelector';

type KioskStep = 'mode' | 'table' | 'menu' | 'cart' | 'confirm';
type OrderMode = 'dine-in' | 'takeaway';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

const KioskOrdering: React.FC = () => {
  const { tables, menu, createDeliveryOrder, addItemToOrder } = useRestaurant();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<KioskStep>('mode');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);

  // Available table numbers for dine-in
  const availableNumbers = Array.from({ length: 50 }, (_, i) => i + 1);

  // Get suggestions based on cart items
  const suggestions = useMemo(() => {
    if (cart.length === 0) return [];
    const cartCategories = new Set(cart.map(c => c.menuItem.category));
    const suggestedItems: MenuItem[] = [];
    
    // Suggest drinks if no drinks in cart
    if (!cartCategories.has('Băuturi')) {
      suggestedItems.push(...menu.filter(m => m.category === 'Băuturi').slice(0, 2));
    }
    // Suggest sides if main course in cart
    if (cartCategories.has('Grill') || cartCategories.has('Pizza') || cartCategories.has('Giros')) {
      if (!cartCategories.has('Garnituri')) {
        suggestedItems.push(...menu.filter(m => m.category === 'Garnituri').slice(0, 2));
      }
    }
    // Suggest soups if no soup
    if (!cartCategories.has('Supe')) {
      suggestedItems.push(...menu.filter(m => m.category === 'Supe').slice(0, 1));
    }
    
    return suggestedItems.slice(0, 4);
  }, [cart, menu]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItem.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
  };

  const totalAmount = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleConfirmOrder = () => {
    // Create mock order
    const order = createDeliveryOrder('own_website', {
      name: orderMode === 'dine-in' ? `Kiosk - Nr. ${selectedTable}` : 'Kiosk - La pachet',
      phone: 'Kiosk',
    });
    
    cart.forEach(item => {
      addItemToOrder(order.id, item.menuItem, item.quantity);
    });

    toast({ title: 'Comandă plasată cu succes!' });
    setStep('confirm');
  };

  const resetOrder = () => {
    setStep('mode');
    setOrderMode(null);
    setSelectedTable(null);
    setCart([]);
  };

  const filteredMenu = menu.filter(m => m.category === activeCategory);

  // Mode Selection
  if (step === 'mode') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col">
        <header className="p-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Bine ai venit!</h1>
          <LanguageSelector />
        </header>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <button
              onClick={() => { setOrderMode('dine-in'); setStep('table'); }}
              className="group p-12 rounded-3xl bg-card border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-6"
            >
              <div className="w-32 h-32 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <UtensilsCrossed className="w-16 h-16 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Mănânc aici</h2>
                <p className="text-muted-foreground">Comandă și consumă în restaurant</p>
              </div>
            </button>

            <button
              onClick={() => { setOrderMode('takeaway'); setStep('menu'); }}
              className="group p-12 rounded-3xl bg-card border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-6"
            >
              <div className="w-32 h-32 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Package className="w-16 h-16 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">La pachet</h2>
                <p className="text-muted-foreground">Comandă și ia cu tine</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Table Number Selection (for dine-in)
  if (step === 'table') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col">
        <header className="p-6 flex justify-between items-center border-b border-border">
          <Button variant="ghost" onClick={() => setStep('mode')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
          <h1 className="text-2xl font-bold">Selectează numărul de la masă</h1>
          <LanguageSelector />
        </header>
        
        <div className="flex-1 p-8">
          <p className="text-center text-muted-foreground mb-8">
            Uită-te la numărul de pe suportul de pe masă și selectează-l mai jos
          </p>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3 max-w-4xl mx-auto">
            {availableNumbers.map(num => (
              <button
                key={num}
                onClick={() => setSelectedTable(num)}
                className={cn(
                  "aspect-square rounded-xl text-2xl font-bold transition-all border-2",
                  selectedTable === num
                    ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg"
                    : "bg-card border-border hover:border-primary hover:scale-105"
                )}
              >
                {num}
              </button>
            ))}
          </div>
          
          {selectedTable && (
            <div className="mt-8 flex justify-center">
              <Button size="lg" className="text-xl px-12 py-6" onClick={() => setStep('menu')}>
                Continuă cu meniul
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Menu & Cart
  if (step === 'menu' || step === 'cart') {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Menu Section */}
        <div className={cn("flex-1 flex flex-col", step === 'cart' && "hidden md:flex")}>
          <header className="p-4 border-b border-border flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(orderMode === 'dine-in' ? 'table' : 'mode')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Înapoi
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Meniu</h1>
              <p className="text-sm text-muted-foreground">
                {orderMode === 'dine-in' ? `Masa nr. ${selectedTable}` : 'La pachet'}
              </p>
            </div>
            <LanguageSelector compact />
          </header>

          {/* Categories */}
          <div className="flex gap-2 p-4 overflow-x-auto border-b border-border">
            {menuCategories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'secondary'}
                onClick={() => setActiveCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map(item => {
                const inCart = cart.find(c => c.menuItem.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all hover:scale-102",
                      inCart ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <h3 className="font-bold mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">{item.price} RON</span>
                      {inCart && (
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Ți-ar plăcea și...</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {suggestions.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="flex-shrink-0 w-48 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary transition-all"
                    >
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-primary font-bold">{item.price} RON</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Cart Button */}
          <div className="md:hidden p-4 border-t border-border">
            <Button className="w-full h-14 text-lg" onClick={() => setStep('cart')} disabled={cart.length === 0}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Vezi coș ({totalItems}) - {totalAmount.toFixed(2)} RON
            </Button>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className={cn(
          "w-full md:w-96 border-l border-border bg-card flex flex-col",
          step !== 'cart' && "hidden md:flex"
        )}>
          <header className="p-4 border-b border-border flex items-center justify-between">
            <Button variant="ghost" className="md:hidden" onClick={() => setStep('menu')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Coșul tău
            </h2>
            <span className="text-muted-foreground">{totalItems} produse</span>
          </header>

          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
                <p>Coșul este gol</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                    <div className="flex-1">
                      <p className="font-medium">{item.menuItem.name}</p>
                      <p className="text-sm text-primary font-bold">{(item.menuItem.price * item.quantity).toFixed(2)} RON</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeFromCart(item.menuItem.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border space-y-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{totalAmount.toFixed(2)} RON</span>
            </div>
            <Button className="w-full h-14 text-lg" disabled={cart.length === 0} onClick={handleConfirmOrder}>
              Plasează comanda
              <Send className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 via-background to-emerald-500/10 flex flex-col items-center justify-center p-8">
        <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center mb-8 animate-bounce">
          <Check className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center">Comandă plasată!</h1>
        <p className="text-xl text-muted-foreground mb-2">
          {orderMode === 'dine-in' 
            ? `Comanda ta va fi adusă la masa nr. ${selectedTable}`
            : 'Comanda ta va fi pregătită în curând'
          }
        </p>
        <p className="text-muted-foreground mb-8">Urmărește statusul pe monitorul din restaurant</p>
        
        <div className="bg-card rounded-2xl p-6 mb-8 min-w-[300px]">
          <h3 className="font-semibold mb-3">Rezumat comandă</h3>
          {cart.map(item => (
            <div key={item.menuItem.id} className="flex justify-between py-1">
              <span>{item.quantity}x {item.menuItem.name}</span>
              <span>{(item.menuItem.price * item.quantity).toFixed(2)} RON</span>
            </div>
          ))}
          <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{totalAmount.toFixed(2)} RON</span>
          </div>
        </div>

        <Button size="lg" onClick={resetOrder}>
          Comandă nouă
        </Button>
      </div>
    );
  }

  return null;
};

export default KioskOrdering;
