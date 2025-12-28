import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRestaurant } from '@/context/RestaurantContext';
import { menuCategories, MenuItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Search, Plus, Minus, Trash2, Send, CreditCard, Banknote,
  Clock, ChefHat, Check, Printer, Wifi, WifiOff, Calculator,
  Users, Split, Receipt, Percent, DollarSign, X, UtensilsCrossed,
  Package, Smartphone, QrCode
} from 'lucide-react';
import AllergenBadges from '@/components/AllergenBadges';
import { PageHeader } from '@/components/ui/page-header';

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
    notes: string;
  };
  status: 'pending' | 'cooking' | 'ready' | 'served';
}

const POSModule: React.FC = () => {
  const { menu, tables } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showModifier, setShowModifier] = useState<MenuItem | null>(null);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showTipCalculator, setShowTipCalculator] = useState(false);
  
  // Modifier state
  const [modQuantity, setModQuantity] = useState(1);
  const [modNotes, setModNotes] = useState('');
  const [modRemovals, setModRemovals] = useState<string[]>([]);
  const [modAdditions, setModAdditions] = useState<string[]>([]);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash');
  const [tipPercent, setTipPercent] = useState(0);
  const [splitCount, setSplitCount] = useState(2);

  const filteredMenu = menu.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = searchQuery 
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return searchQuery ? matchesSearch : matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    if (item.ingredients && item.ingredients.length > 0) {
      setShowModifier(item);
      setModQuantity(1);
      setModNotes('');
      setModRemovals([]);
      setModAdditions([]);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        modifications: { added: [], removed: [], notes: '' },
        status: 'pending'
      };
      setCart([...cart, newItem]);
    }
  };

  const confirmModifier = () => {
    if (!showModifier) return;
    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      menuItem: showModifier,
      quantity: modQuantity,
      modifications: { added: modAdditions, removed: modRemovals, notes: modNotes },
      status: 'pending'
    };
    setCart([...cart, newItem]);
    setShowModifier(null);
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

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tipAmount = subtotal * (tipPercent / 100);
  const total = subtotal + tipAmount;
  const perPerson = total / splitCount;

  const getStatusIcon = (status: CartItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-muted-foreground" />;
      case 'cooking': return <ChefHat className="w-3 h-3 text-warning" />;
      case 'ready': return <Check className="w-3 h-3 text-success" />;
      case 'served': return <Check className="w-3 h-3 text-primary" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="POS / Casă" 
        description="Sistem de vânzare optimizat pentru touch"
      />

      {/* Table Selection if no table selected */}
      {selectedTable === null ? (
        <div className="flex-1 p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Selectează masa sau creează comandă rapidă</h2>
          
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table.number)}
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105",
                  table.status === 'free' && "border-success/50 bg-success/10 hover:border-success",
                  table.status === 'occupied' && "border-primary/50 bg-primary/10 hover:border-primary",
                  table.status === 'reserved' && "border-warning/50 bg-warning/10 hover:border-warning"
                )}
              >
                <span className="text-2xl font-bold">{table.number}</span>
                <span className="text-xs text-muted-foreground">{table.seats} loc</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={() => setSelectedTable(0)}
            >
              <Package className="w-5 h-5 mr-2" />
              Comandă La Pachet
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="flex-1"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Comandă Telefon
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Menu Section */}
          <div className="flex-1 flex flex-col border-r border-border">
            {/* Search & Categories */}
            <div className="p-3 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Caută produs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1">
                {menuCategories.map(cat => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                    className="whitespace-nowrap min-w-[100px] h-14 text-base font-semibold"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Menu Grid - Large Touch Buttons */}
            <div className="flex-1 overflow-auto p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-4 rounded-2xl bg-card border-2 border-border hover:border-primary hover:shadow-lg transition-all text-left group active:scale-95"
                  >
                    {item.image && (
                      <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-muted">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <AllergenBadges allergenIds={item.allergenIds} size="sm" className="mb-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">{item.price} RON</span>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="w-80 lg:w-96 flex flex-col bg-muted/30">
            {/* Cart Header */}
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                  <X className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold">
                  {selectedTable === 0 ? 'La Pachet' : `Masa ${selectedTable}`}
                </h3>
              </div>
              <Badge variant="secondary">{cart.length} produse</Badge>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Adaugă produse din meniu</p>
                </div>
              ) : (
                cart.map(item => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="font-medium">{item.menuItem.name}</span>
                        </div>
                        {item.modifications.notes && (
                          <p className="text-xs text-muted-foreground mt-1">"{item.modifications.notes}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-3 border-t border-border space-y-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{subtotal.toFixed(2)} RON</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-14"
                    onClick={() => setShowTipCalculator(true)}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Bacșiș
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-14"
                    onClick={() => setShowSplitPayment(true)}
                  >
                    <Split className="w-4 h-4 mr-2" />
                    Împarte
                  </Button>
                </div>

                <Button className="w-full h-14 text-lg" variant="outline">
                  <Send className="w-5 h-5 mr-2" />
                  Trimite la Bucătărie
                </Button>

                <Button 
                  className="w-full h-14 text-lg"
                  onClick={() => setShowPayment(true)}
                >
                  <Receipt className="w-5 h-5 mr-2" />
                  Finalizează Plata
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modifier Dialog */}
      <Dialog open={!!showModifier} onOpenChange={() => setShowModifier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showModifier?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Cantitate</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setModQuantity(Math.max(1, modQuantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-bold text-xl">{modQuantity}</span>
                <Button variant="outline" size="icon" onClick={() => setModQuantity(modQuantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showModifier?.ingredients && showModifier.ingredients.length > 0 && (
              <div>
                <p className="font-medium mb-2">Ingrediente</p>
                <div className="grid grid-cols-2 gap-2">
                  {showModifier.ingredients.map(ing => (
                    <div key={ing} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="text-sm">{ing}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={modRemovals.includes(ing) ? 'destructive' : 'ghost'}
                          className="h-7 px-2"
                          onClick={() => {
                            if (modRemovals.includes(ing)) {
                              setModRemovals(modRemovals.filter(r => r !== ing));
                            } else {
                              setModRemovals([...modRemovals, ing]);
                            }
                          }}
                        >
                          -
                        </Button>
                        <Button
                          size="sm"
                          variant={modAdditions.includes(ing) ? 'default' : 'ghost'}
                          className="h-7 px-2"
                          onClick={() => {
                            if (modAdditions.includes(ing)) {
                              setModAdditions(modAdditions.filter(a => a !== ing));
                            } else {
                              setModAdditions([...modAdditions, ing]);
                            }
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">Note speciale</p>
              <Input
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="Ex: bine prăjit, fără sare..."
              />
            </div>

            <Button className="w-full h-12" onClick={confirmModifier}>
              Adaugă - {((showModifier?.price || 0) * modQuantity).toFixed(2)} RON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizare Plată</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} RON</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Bacșiș ({tipPercent}%)</span>
                  <span>+{tipAmount.toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{total.toFixed(2)} RON</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-3">Metodă de plată</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'cash' ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <Banknote className={cn("w-8 h-8", paymentMethod === 'cash' && "text-primary")} />
                  <span className="text-sm font-medium">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'card' ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <CreditCard className={cn("w-8 h-8", paymentMethod === 'card' && "text-primary")} />
                  <span className="text-sm font-medium">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('split')}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'split' ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <Split className={cn("w-8 h-8", paymentMethod === 'split' && "text-primary")} />
                  <span className="text-sm font-medium">Split</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'split' && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm mb-2">Împarte la {splitCount} persoane</p>
                <p className="text-lg font-bold text-primary">{perPerson.toFixed(2)} RON / persoană</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                Anulează
              </Button>
              <Button className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Încasează & Printează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tip Calculator Dialog */}
      <Dialog open={showTipCalculator} onOpenChange={setShowTipCalculator}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Calculator Bacșiș</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[0, 5, 10, 15, 20].map(pct => (
                <Button
                  key={pct}
                  variant={tipPercent === pct ? 'default' : 'outline'}
                  onClick={() => setTipPercent(pct)}
                  className="h-14 text-lg"
                >
                  {pct}%
                </Button>
              ))}
            </div>
            
            <div className="p-4 rounded-xl bg-muted text-center">
              <p className="text-sm text-muted-foreground mb-1">Bacșiș calculat</p>
              <p className="text-3xl font-bold text-primary">{tipAmount.toFixed(2)} RON</p>
            </div>

            <Button className="w-full" onClick={() => setShowTipCalculator(false)}>
              Aplică
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Payment Dialog */}
      <Dialog open={showSplitPayment} onOpenChange={setShowSplitPayment}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Împarte Nota</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-14 w-14"
                onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
              >
                <Minus className="w-6 h-6" />
              </Button>
              <div className="text-center">
                <p className="text-4xl font-bold">{splitCount}</p>
                <p className="text-sm text-muted-foreground">persoane</p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-14 w-14"
                onClick={() => setSplitCount(splitCount + 1)}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="p-4 rounded-xl bg-muted text-center">
              <p className="text-sm text-muted-foreground mb-1">Per persoană</p>
              <p className="text-3xl font-bold text-primary">{perPerson.toFixed(2)} RON</p>
            </div>

            <Button className="w-full" onClick={() => setShowSplitPayment(false)}>
              Aplică
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSModule;
