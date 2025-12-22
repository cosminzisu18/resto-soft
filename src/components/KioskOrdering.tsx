import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { menuItems, menuCategories, MenuItem, Table, extraIngredients } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, Send, ArrowLeft, ArrowRight,
  Home, Package, UtensilsCrossed, QrCode, Check, Edit2, X,
  Banknote, CreditCard, Loader2, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSelector from '@/components/LanguageSelector';

type KioskStep = 'mode' | 'table' | 'menu' | 'cart' | 'customize' | 'payment' | 'processing' | 'confirm';
type OrderMode = 'dine-in' | 'takeaway';
type KioskPaymentMethod = 'cash' | 'card';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
  };
}

const KioskOrdering: React.FC = () => {
  const { tables, menu, createDeliveryOrder, addItemToOrder } = useRestaurant();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<KioskStep>('mode');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  
  // Customization state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempAdditions, setTempAdditions] = useState<string[]>([]);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);
  const [tempExtraIngredients, setTempExtraIngredients] = useState<string[]>([]);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  
  // Payment state
  const [kioskPaymentMethod, setKioskPaymentMethod] = useState<KioskPaymentMethod>('card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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

  const openCustomization = (item: MenuItem, isEditing: boolean = false, cartItemId?: string) => {
    setCustomizingItem(item);
    setTempAdditions([]);
    setTempRemovals([]);
    setEditingCartItemId(cartItemId || null);
    
    if (isEditing && cartItemId) {
      const cartItem = cart.find(c => c.menuItem.id === cartItemId);
      if (cartItem) {
        setTempAdditions(cartItem.modifications.added);
        setTempRemovals(cartItem.modifications.removed);
      }
    }
    setStep('customize');
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    
    if (editingCartItemId) {
      // Update existing cart item
      setCart(prev => prev.map(c => 
        c.menuItem.id === editingCartItemId 
          ? { ...c, modifications: { added: tempAdditions, removed: tempRemovals } }
          : c
      ));
    } else {
      // Add new item to cart
      setCart(prev => {
        const existing = prev.find(c => 
          c.menuItem.id === customizingItem.id && 
          JSON.stringify(c.modifications) === JSON.stringify({ added: tempAdditions, removed: tempRemovals })
        );
        if (existing) {
          return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
        }
        return [...prev, { 
          menuItem: customizingItem, 
          quantity: 1, 
          modifications: { added: tempAdditions, removed: tempRemovals } 
        }];
      });
    }
    
    setCustomizingItem(null);
    setEditingCartItemId(null);
    setStep('menu');
  };

  const addToCartQuick = (item: MenuItem) => {
    if (item.ingredients && item.ingredients.length > 0) {
      openCustomization(item);
    } else {
      setCart(prev => {
        const existing = prev.find(c => c.menuItem.id === item.id);
        if (existing) {
          return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
        }
        return [...prev, { menuItem: item, quantity: 1, modifications: { added: [], removed: [] } }];
      });
    }
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

  // Table Number Selection (for dine-in) - with manual input
  if (step === 'table') {
    const handleTableSelect = (num: number) => {
      setSelectedTable(num);
      setTableNumberInput(num.toString());
    };

    const handleInputChange = (value: string) => {
      setTableNumberInput(value);
      const num = parseInt(value);
      if (!isNaN(num) && num >= 1 && num <= 50) {
        setSelectedTable(num);
      } else {
        setSelectedTable(null);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col">
        <header className="p-6 flex justify-between items-center border-b border-border">
          <Button variant="ghost" onClick={() => setStep('mode')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
          <h1 className="text-2xl font-bold">Introdu numărul mesei</h1>
          <LanguageSelector />
        </header>
        
        <div className="flex-1 p-8">
          {/* Manual Input */}
          <div className="max-w-md mx-auto mb-8">
            <p className="text-center text-muted-foreground mb-4">
              Introdu numărul de pe suportul de pe masă
            </p>
            <Input
              type="number"
              value={tableNumberInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Ex: 12"
              className="text-center text-4xl h-20 font-bold"
              min={1}
              max={50}
            />
          </div>

          <p className="text-center text-muted-foreground mb-4">sau selectează din listă</p>
          
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3 max-w-4xl mx-auto">
            {availableNumbers.map(num => (
              <button
                key={num}
                onClick={() => handleTableSelect(num)}
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
                    onClick={() => addToCartQuick(item)}
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
                      onClick={() => addToCartQuick(item)}
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
                {cart.map((item, idx) => (
                  <div key={`${item.menuItem.id}-${idx}`} className="p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{item.menuItem.name}</p>
                        {/* Show modifications */}
                        {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                          <div className="text-sm mt-1 space-x-2">
                            {item.modifications.added.map(a => (
                              <span key={a} className="text-emerald-500">+{a}</span>
                            ))}
                            {item.modifications.removed.map(r => (
                              <span key={r} className="text-destructive">-{r}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-primary font-bold mt-1">{(item.menuItem.price * item.quantity).toFixed(2)} RON</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.menuItem.ingredients && item.menuItem.ingredients.length > 0 && (
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8" 
                            onClick={() => openCustomization(item.menuItem, true, item.menuItem.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
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
            <Button className="w-full h-14 text-lg" disabled={cart.length === 0} onClick={() => setStep('payment')}>
              Continuă la plată
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ingredient Customization Screen
  if (step === 'customize' && customizingItem) {
    const ingredients = customizingItem.ingredients || [];
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-6 border-b border-border flex items-center justify-between">
          <Button variant="ghost" onClick={() => { setStep('menu'); setCustomizingItem(null); }}>
            <X className="w-5 h-5 mr-2" />
            Anulează
          </Button>
          <h1 className="text-2xl font-bold">Personalizează</h1>
          <div className="w-24" />
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Product Info */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{customizingItem.name}</h2>
              <p className="text-muted-foreground mb-2">{customizingItem.description}</p>
              <p className="text-2xl font-bold text-primary">{customizingItem.price} RON</p>
            </div>

            {/* Ingredients List */}
            {ingredients.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5" />
                    Ingrediente ({ingredients.length})
                  </h3>
                  <div className="grid gap-3">
                    {ingredients.map(ing => {
                      const isRemoved = tempRemovals.includes(ing);
                      const isExtra = tempAdditions.includes(ing);
                      
                      return (
                        <div 
                          key={ing}
                          className={cn(
                            "p-4 rounded-xl border-2 flex items-center justify-between transition-all",
                            isRemoved && "border-destructive/50 bg-destructive/10",
                            isExtra && "border-primary bg-primary/10",
                            !isRemoved && !isExtra && "border-border bg-card"
                          )}
                        >
                          <span className={cn(
                            "text-lg font-medium",
                            isRemoved && "line-through text-muted-foreground"
                          )}>
                            {ing}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="lg"
                              variant={isRemoved ? 'destructive' : 'outline'}
                              onClick={() => {
                                if (isRemoved) {
                                  setTempRemovals(tempRemovals.filter(r => r !== ing));
                                } else {
                                  setTempRemovals([...tempRemovals, ing]);
                                  setTempAdditions(tempAdditions.filter(a => a !== ing));
                                }
                              }}
                              className="min-w-[100px]"
                            >
                              {isRemoved ? '✓ Fără' : 'Fără'}
                            </Button>
                            <Button
                              size="lg"
                              variant={isExtra ? 'default' : 'outline'}
                              onClick={() => {
                                if (isExtra) {
                                  setTempAdditions(tempAdditions.filter(a => a !== ing));
                                } else {
                                  setTempAdditions([...tempAdditions, ing]);
                                  setTempRemovals(tempRemovals.filter(r => r !== ing));
                                }
                              }}
                              className="min-w-[100px]"
                            >
                              {isExtra ? '✓ Extra' : 'Extra'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modifications Summary */}
                {(tempAdditions.length > 0 || tempRemovals.length > 0) && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h4 className="font-semibold mb-2">Modificări selectate:</h4>
                    <div className="flex flex-wrap gap-2">
                      {tempAdditions.map(a => (
                        <span key={a} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                          + Extra {a}
                        </span>
                      ))}
                      {tempRemovals.map(r => (
                        <span key={r} className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium">
                          - Fără {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Acest produs nu are ingrediente personalizabile</p>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-6 border-t border-border">
          <div className="max-w-2xl mx-auto">
            <Button 
              size="lg" 
              className="w-full h-16 text-xl"
              onClick={confirmCustomization}
            >
              <Check className="w-6 h-6 mr-2" />
              {editingCartItemId ? 'Actualizează produsul' : 'Adaugă în coș'} - {customizingItem.price} RON
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Screen
  if (step === 'payment') {
    const processPayment = () => {
      setStep('processing');
      // Simulate payment processing
      setTimeout(() => {
        handleConfirmOrder();
      }, 3000);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col">
        <header className="p-6 border-b border-border flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('cart')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi la coș
          </Button>
          <h1 className="text-2xl font-bold">Selectează metoda de plată</h1>
          <div className="w-24" />
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            {/* Order Summary */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold mb-4">Rezumat comandă</h3>
              <div className="space-y-2 mb-4 max-h-40 overflow-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    <span>{(item.menuItem.price * item.quantity).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex justify-between text-2xl font-bold">
                <span>Total de plată</span>
                <span className="text-primary">{totalAmount.toFixed(2)} RON</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setKioskPaymentMethod('cash')}
                className={cn(
                  "p-8 rounded-3xl border-4 flex flex-col items-center gap-4 transition-all",
                  kioskPaymentMethod === 'cash'
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  kioskPaymentMethod === 'cash' ? "bg-primary/20" : "bg-secondary"
                )}>
                  <Banknote className={cn("w-12 h-12", kioskPaymentMethod === 'cash' ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-1">Cash</h3>
                  <p className="text-muted-foreground">Plătește cu numerar</p>
                  <p className="text-xs text-muted-foreground mt-2">Introdu bancnotele și monezile în automatul de plată</p>
                </div>
              </button>

              <button
                onClick={() => setKioskPaymentMethod('card')}
                className={cn(
                  "p-8 rounded-3xl border-4 flex flex-col items-center gap-4 transition-all",
                  kioskPaymentMethod === 'card'
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  kioskPaymentMethod === 'card' ? "bg-primary/20" : "bg-secondary"
                )}>
                  <CreditCard className={cn("w-12 h-12", kioskPaymentMethod === 'card' ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-1">Card</h3>
                  <p className="text-muted-foreground">Plătește contactless sau cu PIN</p>
                  <p className="text-xs text-muted-foreground mt-2">Apropie cardul de POS sau introdu-l în cititor</p>
                </div>
              </button>
            </div>

            {/* Confirm Button */}
            <Button 
              size="lg" 
              className="w-full h-16 text-xl"
              onClick={processPayment}
            >
              {kioskPaymentMethod === 'cash' ? (
                <>
                  <Banknote className="w-6 h-6 mr-2" />
                  Plătește {totalAmount.toFixed(2)} RON în numerar
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6 mr-2" />
                  Plătește {totalAmount.toFixed(2)} RON cu cardul
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Processing
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          {kioskPaymentMethod === 'cash' ? (
            <>
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-8 animate-pulse">
                <Banknote className="w-16 h-16 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Introdu numerarul</h1>
              <p className="text-xl text-muted-foreground mb-2">
                Total: <span className="text-primary font-bold">{totalAmount.toFixed(2)} RON</span>
              </p>
              <p className="text-muted-foreground mb-8">
                Introdu bancnotele și monezile în automatul de plată din dreapta
              </p>
              <div className="bg-card rounded-2xl p-6 border border-border mb-8">
                <div className="flex items-center justify-center gap-2 text-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Se procesează plata...</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-8 animate-pulse">
                <CreditCard className="w-16 h-16 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Apropie cardul</h1>
              <p className="text-xl text-muted-foreground mb-2">
                Total: <span className="text-primary font-bold">{totalAmount.toFixed(2)} RON</span>
              </p>
              <p className="text-muted-foreground mb-8">
                Apropie cardul de POS sau introdu-l în cititor pentru plata cu PIN
              </p>
              <div className="bg-card rounded-2xl p-6 border border-border mb-8">
                <div className="flex items-center justify-center gap-2 text-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Se procesează plata...</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 via-background to-emerald-500/10 flex flex-col items-center justify-center p-8">
        <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">Plată confirmată!</h1>
        <p className="text-xl text-muted-foreground mb-2">Comandă trimisă la bucătărie</p>
        <p className="text-xl text-muted-foreground mb-2">
          {orderMode === 'dine-in' 
            ? `Comanda ta va fi adusă la masa nr. ${selectedTable}`
            : 'Comanda ta va fi pregătită în curând'
          }
        </p>
        <p className="text-muted-foreground mb-8">Urmărește statusul pe monitorul din restaurant</p>
        
        <div className="bg-card rounded-2xl p-6 mb-8 min-w-[300px]">
          <div className="flex items-center gap-2 mb-4 text-emerald-500">
            <Check className="w-5 h-5" />
            <span className="font-medium">Plătit cu {kioskPaymentMethod === 'cash' ? 'numerar' : 'card'}</span>
          </div>
          <h3 className="font-semibold mb-3">Rezumat comandă</h3>
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1">
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
