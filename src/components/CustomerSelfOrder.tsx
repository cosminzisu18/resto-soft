import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { menuItems, menuCategories, MenuItem, Table } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Plus, Minus, Trash2, Send, QrCode, 
  UtensilsCrossed, Home, ArrowLeft, Check, Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSelector from '@/components/LanguageSelector';

type CustomerOrderStep = 'scan' | 'menu' | 'cart' | 'confirm';
type OrderType = 'dine-in' | 'delivery';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
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

  const scannedTable = scannedTableId ? tables.find(t => t.id === scannedTableId) : null;

  const handleScanQR = () => {
    // Simulate QR scanning - in reality would use camera
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
                  const inCart = cart.find(c => c.menuItem.id === item.id);
                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        inCart ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <span className="text-lg font-bold text-primary ml-4">{item.price} RON</span>
                      </div>
                      
                      {inCart ? (
                        <div className="flex items-center gap-3 mt-3">
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold w-8 text-center">{inCart.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="mt-3" onClick={() => addToCart(item)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Adaugă
                        </Button>
                      )}
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
                  {cart.map(item => (
                    <div key={item.menuItem.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="flex-1">
                        <p className="font-medium">{item.menuItem.name}</p>
                        <p className="text-sm text-primary font-bold">{(item.menuItem.price * item.quantity).toFixed(2)} RON</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, -1)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
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

  // Confirmation
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
          {cart.map(item => (
            <div key={item.menuItem.id} className="flex justify-between py-1 text-sm">
              <span>{item.quantity}x {item.menuItem.name}</span>
              <span>{(item.menuItem.price * item.quantity).toFixed(2)} RON</span>
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
