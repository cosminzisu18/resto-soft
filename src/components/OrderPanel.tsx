import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, MenuItem, Order, OrderItem, menuCategories } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { 
  X, Plus, Minus, ChefHat, Clock, Check, 
  CreditCard, ArrowLeft, Send, Edit2,
  Trash2, Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Receipt from './Receipt';

interface OrderPanelProps {
  table: Table;
  onClose: () => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({ table, onClose }) => {
  const { 
    menu, createOrder, getActiveOrderForTable, addItemToOrder, 
    updateOrder, completeOrder, updateOrderItemStatus 
  } = useRestaurant();
  const { toast } = useToast();
  
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [showPayment, setShowPayment] = useState(false);
  const [showModifier, setShowModifier] = useState<MenuItem | null>(null);
  const [modAdditions, setModAdditions] = useState<string[]>([]);
  const [modRemovals, setModRemovals] = useState<string[]>([]);
  const [modNotes, setModNotes] = useState('');
  const [modQuantity, setModQuantity] = useState(1);
  
  // Payment state
  const [tipType, setTipType] = useState<'percent' | 'value'>('percent');
  const [tipValue, setTipValue] = useState('');
  const [cui, setCui] = useState('');

  let order = getActiveOrderForTable(table.id);
  if (!order) {
    order = createOrder(table.id);
  }

  const handleAddItem = (item: MenuItem) => {
    if (item.ingredients.length > 0) {
      setShowModifier(item);
      setModAdditions([]);
      setModRemovals([]);
      setModNotes('');
      setModQuantity(1);
    } else {
      addItemToOrder(order!.id, item, 1);
      toast({ title: `${item.name} adăugat` });
    }
  };

  const handleConfirmModifier = () => {
    if (!showModifier || !order) return;
    
    addItemToOrder(order.id, showModifier, modQuantity, {
      added: modAdditions,
      removed: modRemovals,
      notes: modNotes,
    });
    
    toast({ title: `${showModifier.name} adăugat` });
    setShowModifier(null);
  };

  const handleSendToKitchen = () => {
    if (!order) return;
    
    const pendingItems = order.items.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) {
      toast({ title: 'Nu sunt articole noi de trimis', variant: 'destructive' });
      return;
    }

    // Calculate timing for sync
    if (order.syncTiming) {
      const maxPrepTime = Math.max(...pendingItems.map(i => i.menuItem.prepTime));
      
      pendingItems.forEach(item => {
        const delay = maxPrepTime - item.menuItem.prepTime;
        // In real app, this would schedule the cooking start
        setTimeout(() => {
          updateOrderItemStatus(order!.id, item.id, 'cooking');
        }, delay * 1000); // Simulating delay
      });
    } else {
      pendingItems.forEach(item => {
        updateOrderItemStatus(order!.id, item.id, 'cooking');
      });
    }

    toast({ 
      title: 'Comandă trimisă la bucătărie',
      description: `${pendingItems.length} articole trimise`,
    });
  };

  const calculateTip = (): number => {
    if (!tipValue || !order) return 0;
    const val = parseFloat(tipValue);
    if (isNaN(val)) return 0;
    return tipType === 'percent' ? (order.totalAmount * val / 100) : val;
  };

  const handleCompletePayment = () => {
    if (!order) return;
    const tip = calculateTip();
    completeOrder(order.id, tip, cui || undefined);
    toast({ 
      title: 'Plată procesată',
      description: `Total: ${(order.totalAmount + tip).toFixed(2)} RON`,
    });
    onClose();
  };

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'cooking': return <ChefHat className="w-4 h-4 text-warning" />;
      case 'ready': return <Check className="w-4 h-4 text-success" />;
      case 'served': return <Check className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusLabel = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return 'În așteptare';
      case 'cooking': return 'Se prepară';
      case 'ready': return 'Gata';
      case 'served': return 'Servit';
    }
  };

  const filteredMenu = menu.filter(item => item.category === activeCategory);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">Masa {table.number}</h2>
            <p className="text-sm text-muted-foreground">{table.seats} locuri</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPayment(true)}
            disabled={!order || order.items.length === 0}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Plată
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Categories */}
          <div className="flex gap-2 p-3 overflow-x-auto border-b border-border">
            {menuCategories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMenu.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{item.price} RON</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.prepTime}'
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-80 flex flex-col bg-secondary/30">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold">Comandă curentă</h3>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {order?.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Adaugă produse din meniu
              </p>
            ) : (
              <div className="space-y-2">
                {order?.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg bg-card border",
                      item.status === 'ready' && "border-success",
                      item.status === 'cooking' && "border-warning"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.quantity}x</span>
                          <span className="font-medium text-sm">{item.menuItem.name}</span>
                        </div>
                        {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.modifications.added.map(a => (
                              <span key={a} className="text-success">+{a} </span>
                            ))}
                            {item.modifications.removed.map(r => (
                              <span key={r} className="text-destructive">-{r} </span>
                            ))}
                          </div>
                        )}
                        {item.modifications.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "{item.modifications.notes}"
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-sm">
                          {(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(item.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {order && order.items.length > 0 && (
            <div className="p-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{order.totalAmount.toFixed(2)} RON</span>
              </div>
              
              <Button 
                className="w-full gradient-primary"
                onClick={handleSendToKitchen}
                disabled={order.items.filter(i => i.status === 'pending').length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                Trimite la bucătărie ({order.items.filter(i => i.status === 'pending').length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modifier Dialog */}
      <Dialog open={!!showModifier} onOpenChange={() => setShowModifier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showModifier?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Cantitate</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModQuantity(Math.max(1, modQuantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-bold">{modQuantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModQuantity(modQuantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Ingredients */}
            {showModifier && showModifier.ingredients.length > 0 && (
              <div>
                <p className="font-medium mb-2">Ingrediente</p>
                <div className="space-y-2">
                  {showModifier.ingredients.map(ing => (
                    <div key={ing} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                      <span className="text-sm">{ing}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={modRemovals.includes(ing) ? 'destructive' : 'ghost'}
                          onClick={() => {
                            if (modRemovals.includes(ing)) {
                              setModRemovals(modRemovals.filter(r => r !== ing));
                            } else {
                              setModRemovals([...modRemovals, ing]);
                              setModAdditions(modAdditions.filter(a => a !== ing));
                            }
                          }}
                        >
                          Fără
                        </Button>
                        <Button
                          size="sm"
                          variant={modAdditions.includes(ing) ? 'default' : 'ghost'}
                          onClick={() => {
                            if (modAdditions.includes(ing)) {
                              setModAdditions(modAdditions.filter(a => a !== ing));
                            } else {
                              setModAdditions([...modAdditions, ing]);
                              setModRemovals(modRemovals.filter(r => r !== ing));
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
            )}

            {/* Notes */}
            <div>
              <p className="font-medium mb-2">Note speciale</p>
              <Input
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                placeholder="Ex: bine prăjit, fără sare..."
              />
            </div>

            <Button className="w-full" onClick={handleConfirmModifier}>
              Adaugă în comandă - {((showModifier?.price || 0) * modQuantity).toFixed(2)} RON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesare plată - Masa {table.number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span>{order?.totalAmount.toFixed(2)} RON</span>
              </div>
              {calculateTip() > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Bacșiș</span>
                  <span>+{calculateTip().toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t border-border">
                <span>Total</span>
                <span>{((order?.totalAmount || 0) + calculateTip()).toFixed(2)} RON</span>
              </div>
            </div>

            {/* Tip */}
            <div>
              <p className="font-medium mb-2">Bacșiș</p>
              <div className="flex gap-2 mb-2">
                {['10', '15', '20'].map(pct => (
                  <Button
                    key={pct}
                    variant={tipType === 'percent' && tipValue === pct ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTipType('percent'); setTipValue(pct); }}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={tipType === 'value' ? tipValue : ''}
                  onChange={(e) => { setTipType('value'); setTipValue(e.target.value); }}
                  placeholder="Sumă fixă (RON)"
                />
              </div>
            </div>

            {/* CUI */}
            <div>
              <p className="font-medium mb-2">CUI Firmă (opțional)</p>
              <Input
                value={cui}
                onChange={(e) => setCui(e.target.value)}
                placeholder="RO12345678"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pentru factură fiscală
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                Anulează
              </Button>
              <Button className="flex-1 gradient-primary" onClick={handleCompletePayment}>
                <Receipt className="w-4 h-4 mr-2" />
                Finalizează plata
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderPanel;
