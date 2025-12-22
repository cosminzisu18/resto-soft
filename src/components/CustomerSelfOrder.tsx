import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { menuItems, menuCategories, MenuItem, Table, extraIngredients } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, Send, QrCode, 
  UtensilsCrossed, Home, ArrowLeft, Check, Truck, Edit2, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSelector from '@/components/LanguageSelector';
import AllergenBadges from '@/components/AllergenBadges';

type CustomerOrderStep = 'scan' | 'menu' | 'cart' | 'customize' | 'confirm';
type OrderType = 'dine-in' | 'delivery';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
    extras: string[];
  };
}

interface CustomerSelfOrderProps {
  initialTableId?: string;
}

const CustomerSelfOrder: React.FC<CustomerSelfOrderProps> = ({ initialTableId }) => {
  const { tables, menu, createDeliveryOrder, addItemToOrder, createOrder } = useRestaurant();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<CustomerOrderStep>(initialTableId ? 'menu' : 'scan');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [scannedTableId, setScannedTableId] = useState<string | null>(initialTableId || null);
  const [qrInput, setQrInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  
  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({ name: '', phone: '', address: '' });

  // Customization state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempAdditions, setTempAdditions] = useState<string[]>([]);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);
  const [tempExtras, setTempExtras] = useState<string[]>([]);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);

  const scannedTable = scannedTableId ? tables.find(t => t.id === scannedTableId) : null;

  // Group extra ingredients by category
  const extrasByCategory = extraIngredients.reduce((acc, ing) => {
    if (!acc[ing.category]) acc[ing.category] = [];
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, typeof extraIngredients>);

  const handleScanQR = () => {
    const table = tables.find(t => t.qrCode === qrInput || t.id.includes(qrInput.toLowerCase()));
    if (table) {
      setScannedTableId(table.id);
      setOrderType('dine-in');
      setStep('menu');
      toast({ title: `Masa ${table.number} detectată!` });
    } else {
      toast({ title: 'Cod QR invalid', variant: 'destructive' });
    }
  };

  const openCustomization = (item: MenuItem, editIndex?: number) => {
    setCustomizingItem(item);
    setTempAdditions([]);
    setTempRemovals([]);
    setTempExtras([]);
    setEditingCartIndex(editIndex ?? null);
    
    if (editIndex !== undefined) {
      const cartItem = cart[editIndex];
      if (cartItem) {
        setTempAdditions(cartItem.modifications.added);
        setTempRemovals(cartItem.modifications.removed);
        setTempExtras(cartItem.modifications.extras);
      }
    }
    setStep('customize');
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    
    if (editingCartIndex !== null) {
      setCart(prev => prev.map((item, idx) => 
        idx === editingCartIndex 
          ? { ...item, modifications: { added: tempAdditions, removed: tempRemovals, extras: tempExtras } }
          : item
      ));
    } else {
      setCart(prev => [...prev, { 
        menuItem: customizingItem, 
        quantity: 1, 
        modifications: { added: tempAdditions, removed: tempRemovals, extras: tempExtras } 
      }]);
    }
    
    setCustomizingItem(null);
    setEditingCartIndex(null);
    setStep('menu');
  };

  const addToCartQuick = (item: MenuItem) => {
    if (item.ingredients && item.ingredients.length > 0) {
      openCustomization(item);
    } else {
      setCart(prev => [...prev, { 
        menuItem: item, 
        quantity: 1, 
        modifications: { added: [], removed: [], extras: [] } 
      }]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((c, idx) => {
      if (idx === index) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculate extra price
  const getExtraPrice = (extras: string[]) => {
    return extras.reduce((sum, extraName) => {
      const extra = extraIngredients.find(e => e.name === extraName);
      return sum + (extra?.price || 0);
    }, 0);
  };

  const totalAmount = cart.reduce((sum, c) => 
    sum + (c.menuItem.price + getExtraPrice(c.modifications.extras)) * c.quantity, 0
  );
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = () => {
    if (orderType === 'dine-in' && scannedTable) {
      const order = createOrder(scannedTable.id, 'restaurant');
      cart.forEach(item => {
        addItemToOrder(order.id, item.menuItem, item.quantity);
      });
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
    
    toast({ title: 'Comandă trimisă!' });
    setStep('confirm');
  };

  const resetOrder = () => {
    setStep('scan');
    setScannedTableId(null);
    setQrInput('');
    setCart([]);
    setDeliveryForm({ name: '', phone: '', address: '' });
  };

  const filteredMenu = menu.filter(m => m.category === activeCategory);

  // QR Scan / Order Type Selection
  if (step === 'scan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Comandă Online</h1>
          <LanguageSelector />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Dine-in option */}
          <div className="w-full max-w-md space-y-6 mb-12">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <QrCode className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Scanează codul QR</h2>
              <p className="text-muted-foreground">Scanează codul de pe masă pentru a comanda</p>
            </div>

            <div className="flex gap-2">
              <Input
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                placeholder="Introdu codul manual..."
                className="flex-1"
              />
              <Button onClick={handleScanQR}>
                Verifică
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14"
              onClick={() => {
                // Simulate camera scan - pick first free table
                const freeTable = tables.find(t => t.status === 'free');
                if (freeTable) {
                  setScannedTableId(freeTable.id);
                  setOrderType('dine-in');
                  setStep('menu');
                  toast({ title: `Masa ${freeTable.number} detectată!` });
                }
              }}
            >
              <QrCode className="w-5 h-5 mr-2" />
              Deschide camera
            </Button>
          </div>

          <div className="w-full max-w-md">
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">sau</span>
              </div>
            </div>

            {/* Delivery option */}
            <Button 
              variant="secondary" 
              className="w-full h-14"
              onClick={() => { setOrderType('delivery'); setStep('menu'); }}
            >
              <Truck className="w-5 h-5 mr-2" />
              Comandă pentru livrare
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Menu
  if (step === 'menu' || step === 'cart') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-3 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
          <Button variant="ghost" size="sm" onClick={() => setStep('scan')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Înapoi
          </Button>
          <div className="text-center">
            {orderType === 'dine-in' && scannedTable ? (
              <p className="font-medium">Masa {scannedTable.number}</p>
            ) : (
              <p className="font-medium">Livrare la domiciliu</p>
            )}
          </div>
          <button 
            onClick={() => setStep('cart')}
            className="relative p-2"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </header>

        {step === 'menu' ? (
          <>
            {/* Categories */}
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-border sticky top-14 bg-background z-10">
              {menuCategories.map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant={activeCategory === cat ? 'default' : 'secondary'}
                  onClick={() => setActiveCategory(cat)}
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-3">
              <div className="space-y-3">
                {filteredMenu.map(item => {
                  const inCart = cart.filter(c => c.menuItem.id === item.id);
                  const totalQty = inCart.reduce((sum, c) => sum + c.quantity, 0);
                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "rounded-xl border transition-all overflow-hidden",
                        totalQty > 0 ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      {/* Product Image */}
                      {item.image && (
                        <div className="aspect-video w-full bg-secondary">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <span className="text-lg font-bold text-primary ml-4">{item.price} RON</span>
                        </div>
                        
                        {/* Allergens badges */}
                        <AllergenBadges allergenIds={item.allergenIds} size="sm" className="mb-2" />
                        
                        {/* Ingredients */}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="mb-3 p-2 rounded-lg bg-secondary/50">
                            <p className="text-xs font-medium text-foreground">Conține:</p>
                            <p className="text-xs text-muted-foreground">{item.ingredients.join(', ')}</p>
                          </div>
                        )}
                        
                        <Button size="sm" className="w-full" onClick={() => addToCartQuick(item)}>
                          <Plus className="w-4 h-4 mr-1" />
                          {item.ingredients?.length ? 'Personalizează' : 'Adaugă în coș'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Bar */}
            {totalItems > 0 && (
              <div className="sticky bottom-0 p-4 border-t border-border bg-background">
                <Button className="w-full h-12" onClick={() => setStep('cart')}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Vezi coș ({totalItems}) - {totalAmount.toFixed(2)} RON
                </Button>
              </div>
            )}
          </>
        ) : (
          // Cart View
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-auto">
              <h2 className="text-xl font-bold mb-4">Coșul tău</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Coșul este gol</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.menuItem.name}</p>
                          {/* Show modifications */}
                          {(item.modifications.added.length > 0 || item.modifications.removed.length > 0 || item.modifications.extras.length > 0) && (
                            <div className="text-xs text-muted-foreground mt-1 space-x-1">
                              {item.modifications.added.map(a => (
                                <span key={a} className="text-emerald-500">+Extra {a}</span>
                              ))}
                              {item.modifications.removed.map(r => (
                                <span key={r} className="text-destructive">-{r}</span>
                              ))}
                              {item.modifications.extras.map(e => (
                                <span key={e} className="text-primary">+{e}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-primary font-bold">
                            {((item.menuItem.price + getExtraPrice(item.modifications.extras)) * item.quantity).toFixed(2)} RON
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.menuItem.ingredients?.length > 0 && (
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openCustomization(item.menuItem, idx)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(idx, -1)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-6 text-center font-bold">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(idx, 1)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeFromCart(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery form */}
              {orderType === 'delivery' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold">Detalii livrare</h3>
                  <Input
                    value={deliveryForm.name}
                    onChange={e => setDeliveryForm({...deliveryForm, name: e.target.value})}
                    placeholder="Nume complet"
                  />
                  <Input
                    value={deliveryForm.phone}
                    onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                    placeholder="Telefon"
                  />
                  <Input
                    value={deliveryForm.address}
                    onChange={e => setDeliveryForm({...deliveryForm, address: e.target.value})}
                    placeholder="Adresă completă"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{totalAmount.toFixed(2)} RON</span>
              </div>
              <Button 
                className="w-full h-12" 
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || (orderType === 'delivery' && (!deliveryForm.name || !deliveryForm.phone || !deliveryForm.address))}
              >
                <Send className="w-5 h-5 mr-2" />
                Trimite comanda
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('menu')}>
                Continuă cumpărăturile
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Customization Screen
  if (step === 'customize' && customizingItem) {
    const ingredients = customizingItem.ingredients || [];
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
          <Button variant="ghost" size="sm" onClick={() => { setStep('menu'); setCustomizingItem(null); }}>
            <X className="w-4 h-4 mr-1" />
            Anulează
          </Button>
          <h1 className="text-lg font-bold">Personalizează</h1>
          <div className="w-20" />
        </header>

        <div className="flex-1 overflow-auto p-4">
          {/* Product Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1">{customizingItem.name}</h2>
            <p className="text-muted-foreground text-sm mb-2">{customizingItem.description}</p>
            <p className="text-xl font-bold text-primary">{customizingItem.price} RON</p>
          </div>

          {/* Current Ingredients */}
          {ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Ingrediente incluse
              </h3>
              <div className="space-y-2">
                {ingredients.map(ing => {
                  const isRemoved = tempRemovals.includes(ing);
                  const isExtra = tempAdditions.includes(ing);
                  
                  return (
                    <div 
                      key={ing}
                      className={cn(
                        "p-3 rounded-lg border flex items-center justify-between",
                        isRemoved && "border-destructive/50 bg-destructive/10",
                        isExtra && "border-primary bg-primary/10",
                        !isRemoved && !isExtra && "border-border"
                      )}
                    >
                      <span className={cn("font-medium", isRemoved && "line-through text-muted-foreground")}>
                        {ing}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isRemoved ? 'destructive' : 'outline'}
                          onClick={() => {
                            if (isRemoved) {
                              setTempRemovals(tempRemovals.filter(r => r !== ing));
                            } else {
                              setTempRemovals([...tempRemovals, ing]);
                              setTempAdditions(tempAdditions.filter(a => a !== ing));
                            }
                          }}
                        >
                          Fără
                        </Button>
                        <Button
                          size="sm"
                          variant={isExtra ? 'default' : 'outline'}
                          onClick={() => {
                            if (isExtra) {
                              setTempAdditions(tempAdditions.filter(a => a !== ing));
                            } else {
                              setTempAdditions([...tempAdditions, ing]);
                              setTempRemovals(tempRemovals.filter(r => r !== ing));
                            }
                          }}
                        >
                          Extra
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra Ingredients from Admin List */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adaugă ingrediente extra
            </h3>
            {Object.entries(extrasByCategory).map(([category, items]) => (
              <div key={category} className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(extra => {
                    const isSelected = tempExtras.includes(extra.name);
                    return (
                      <button
                        key={extra.id}
                        onClick={() => {
                          if (isSelected) {
                            setTempExtras(tempExtras.filter(e => e !== extra.name));
                          } else {
                            setTempExtras([...tempExtras, extra.name]);
                          }
                        }}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-sm transition-all",
                          isSelected 
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {extra.name} (+{extra.price} RON)
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Modifications Summary */}
          {(tempAdditions.length > 0 || tempRemovals.length > 0 || tempExtras.length > 0) && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border mb-4">
              <h4 className="font-medium mb-2 text-sm">Modificări:</h4>
              <div className="flex flex-wrap gap-1">
                {tempAdditions.map(a => (
                  <span key={a} className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">+Extra {a}</span>
                ))}
                {tempRemovals.map(r => (
                  <span key={r} className="px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs">-{r}</span>
                ))}
                {tempExtras.map(e => (
                  <span key={e} className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 text-xs">+{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="p-4 border-t border-border">
          <Button className="w-full h-12" onClick={confirmCustomization}>
            <Check className="w-4 h-4 mr-2" />
            {editingCartIndex !== null ? 'Actualizează' : 'Adaugă în coș'} - {(customizingItem.price + getExtraPrice(tempExtras)).toFixed(2)} RON
          </Button>
        </div>
      </div>
    );
  }
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 via-background to-emerald-500/10 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center">Comandă trimisă!</h1>
        <p className="text-muted-foreground text-center mb-6">
          {orderType === 'dine-in' 
            ? `Comanda va fi adusă la masa ${scannedTable?.number}`
            : 'Comanda va fi livrată la adresa indicată'
          }
        </p>
        
        <div className="bg-card rounded-xl p-4 mb-6 w-full max-w-sm">
          {cart.map((item, idx) => (
            <div key={idx} className="py-1 text-sm">
              <div className="flex justify-between">
                <span>{item.quantity}x {item.menuItem.name}</span>
                <span>{((item.menuItem.price + getExtraPrice(item.modifications.extras)) * item.quantity).toFixed(2)} RON</span>
              </div>
              {(item.modifications.added.length > 0 || item.modifications.removed.length > 0 || item.modifications.extras.length > 0) && (
                <div className="text-xs text-muted-foreground pl-4">
                  {item.modifications.removed.map(r => <span key={r}>-{r} </span>)}
                  {item.modifications.added.map(a => <span key={a}>+{a} </span>)}
                  {item.modifications.extras.map(e => <span key={e}>+{e} </span>)}
                </div>
              )}
            </div>
          ))}
          <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{totalAmount.toFixed(2)} RON</span>
          </div>
        </div>

        <Button onClick={resetOrder}>Comandă nouă</Button>
      </div>
    );
  }

  return null;
};

export default CustomerSelfOrder;
