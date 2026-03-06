import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, MenuItem, Order, OrderItem, menuCategories, UnitType } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { 
  X, Plus, Minus, ChefHat, Clock, Check, 
  CreditCard, ArrowLeft, Send, Edit2,
  Trash2, Printer, FileText, Banknote, CreditCard as CardIcon, Barcode, Search, ChevronUp, ChevronDown,
  PanelLeftClose, PanelRightClose, ShoppingCart, Info, Gift, Users, ListChecks, Hash, History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Receipt from './Receipt';
import AllergenBadges from './AllergenBadges';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import UpsellQuestionsDialog from './UpsellQuestionsDialog';
import OrderHistoryDialog from './OrderHistoryDialog';

interface OrderPanelProps {
  table: Table;
  onClose: () => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({ table, onClose }) => {
  const { 
    menu, createOrder, getActiveOrderForTable, addItemToOrder, 
    updateOrder, completeOrder, updateOrderItemStatus, orders
  } = useRestaurant();
  const { toast } = useToast();
  
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderCollapsed, setOrderCollapsed] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');
  const [showPayment, setShowPayment] = useState(false);
  const [showModifier, setShowModifier] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [modAdditions, setModAdditions] = useState<string[]>([]);
  const [modRemovals, setModRemovals] = useState<string[]>([]);
  const [modNotes, setModNotes] = useState('');
  const [modQuantity, setModQuantity] = useState(1);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [modWeightGrams, setModWeightGrams] = useState<string>('');
  const [upsellAnsweredForOrder, setUpsellAnsweredForOrder] = useState<string | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Payment state
  const [tipType, setTipType] = useState<'percent' | 'value'>('percent');
  const [tipValue, setTipValue] = useState('');
  const [cui, setCui] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'usage_card'>('cash');
  const [usageCardCode, setUsageCardCode] = useState('');
  
  // Split payment state
  const [splitMode, setSplitMode] = useState<'full' | 'custom' | 'items' | 'persons'>('full');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayItems, setSelectedPayItems] = useState<Record<string, number>>({});
  const [splitPersons, setSplitPersons] = useState(2);
  const [paidAmounts, setPaidAmounts] = useState<number[]>([]);

  // Swipe gesture for sidebar position on mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setSidebarPosition('right'),
    onSwipeRight: () => setSidebarPosition('left'),
    threshold: 75,
    enabled: true,
  });

  const getUnitLabel = (unitType?: UnitType) => {
    switch (unitType) {
      case 'portie': return 'Por.';
      case 'gram': return '100g';
      default: return 'Buc';
    }
  };

  const getItemPrice = (item: MenuItem | OrderItem['menuItem'], quantity: number, weightGrams?: number) => {
    if (item.unitType === 'gram' && weightGrams) {
      return item.price * weightGrams / 100;
    }
    return item.price * quantity;
  };

  let order = getActiveOrderForTable(table.id);
  if (!order) {
    order = createOrder(table.id);
  }

  const handleAddItem = (item: MenuItem) => {
    if (item.ingredients.length > 0 || item.unitType === 'gram') {
      setShowModifier(item);
      setEditingItem(null);
      setModAdditions([]);
      setModRemovals([]);
      setModNotes('');
      setModQuantity(1);
      setModWeightGrams(item.unitType === 'gram' ? '200' : '');
    } else {
      addItemToOrder(order!.id, item, 1);
      toast({ title: `${item.name} adăugat` });
    }
  };

  const handleEditItem = (item: OrderItem) => {
    if (item.status !== 'pending') {
      toast({ title: 'Nu se poate modifica - deja în preparare', variant: 'destructive' });
      return;
    }
    setEditingItem(item);
    setShowModifier(item.menuItem);
    setModAdditions(item.modifications.added);
    setModRemovals(item.modifications.removed);
    setModNotes(item.modifications.notes);
    setModQuantity(item.quantity);
    setModWeightGrams(item.weightGrams ? String(item.weightGrams) : '');
  };

  const handleRemoveItem = (itemId: string) => {
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (item && item.status !== 'pending') {
      toast({ title: 'Nu se poate șterge - deja în preparare', variant: 'destructive' });
      return;
    }
    const updatedItems = order.items.filter(i => i.id !== itemId);
    const totalAmount = updatedItems.reduce((sum, i) => sum + getItemPrice(i.menuItem, i.quantity, i.weightGrams), 0);
    updateOrder({ ...order, items: updatedItems, totalAmount });
    toast({ title: 'Produs eliminat' });
  };

  const handleClearAll = () => {
    if (!order) return;
    const nonPendingItems = order.items.filter(i => i.status !== 'pending');
    const totalAmount = nonPendingItems.reduce((sum, i) => sum + getItemPrice(i.menuItem, i.quantity, i.weightGrams), 0);
    updateOrder({ ...order, items: nonPendingItems, totalAmount });
    setShowClearConfirm(false);
    toast({ title: 'Toate produsele noi au fost șterse' });
  };

  const handleConfirmModifier = () => {
    if (!showModifier || !order) return;
    
    if (editingItem) {
      const wg = showModifier.unitType === 'gram' ? parseInt(modWeightGrams) || 0 : undefined;
      const updatedItems = order.items.map(item => {
        if (item.id !== editingItem.id) return item;
        return {
          ...item,
          quantity: modQuantity,
          weightGrams: wg,
          modifications: {
            added: modAdditions,
            removed: modRemovals,
            notes: modNotes,
          }
        };
      });
      const totalAmount = updatedItems.reduce((sum, i) => sum + getItemPrice(i.menuItem, i.quantity, i.weightGrams), 0);
      updateOrder({ ...order, items: updatedItems, totalAmount });
      toast({ title: 'Produs actualizat' });
    } else {
      const wg = showModifier.unitType === 'gram' ? parseInt(modWeightGrams) || 0 : undefined;
      const newItem: OrderItem = {
        id: Date.now().toString(),
        menuItemId: showModifier.id,
        menuItem: showModifier,
        quantity: modQuantity,
        weightGrams: wg,
        modifications: {
          added: modAdditions,
          removed: modRemovals,
          notes: modNotes,
        },
        status: 'pending',
      };
      const updatedItems = [...order.items, newItem];
      const totalAmount = updatedItems.reduce((sum, i) => sum + getItemPrice(i.menuItem, i.quantity, i.weightGrams), 0);
      updateOrder({ ...order, items: updatedItems, totalAmount });
      toast({ title: `${showModifier.name} adăugat` });
    }
    
    setShowModifier(null);
    setEditingItem(null);
  };

  const handleSendToKitchenClick = () => {
    if (!order) return;
    
    const pendingItems = order.items.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) {
      toast({ title: 'Nu sunt articole noi de trimis', variant: 'destructive' });
      return;
    }

    // Only show upsell dialog if not already answered for this order
    if (upsellAnsweredForOrder !== order.id) {
      setShowUpsellDialog(true);
    } else {
      // Already answered, send directly to kitchen
      handleSendToKitchen();
    }
  };

  const handleUpsellConfirm = (selectedProducts: MenuItem[]) => {
    setShowUpsellDialog(false);
    
    // Mark this order as having answered upsell questions
    if (order) {
      setUpsellAnsweredForOrder(order.id);
    }
    
    // Add selected products to order
    if (selectedProducts.length > 0 && order) {
      selectedProducts.forEach(product => {
        addItemToOrder(order.id, product, 1);
      });
      toast({ 
        title: `${selectedProducts.length} produse adăugate`,
        description: 'Produsele au fost adăugate în comandă',
      });
    }
    
    // Now send to kitchen
    handleSendToKitchen();
  };

  const handleSendToKitchen = () => {
    if (!order) return;
    
    const pendingItems = order.items.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) {
      return;
    }

    if (order.syncTiming) {
      const maxPrepTime = Math.max(...pendingItems.map(i => i.menuItem.prepTime));
      
      pendingItems.forEach(item => {
        const delay = maxPrepTime - item.menuItem.prepTime;
        setTimeout(() => {
          updateOrderItemStatus(order!.id, item.id, 'cooking');
        }, delay * 1000);
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

  const getPayableAmount = (): number => {
    if (!order) return 0;
    const remaining = order.totalAmount - paidAmounts.reduce((s, a) => s + a, 0);
    switch (splitMode) {
      case 'full': return remaining;
      case 'custom': return Math.min(parseFloat(customAmount) || 0, remaining);
      case 'items': return Object.entries(selectedPayItems).reduce((sum, [itemId, qty]) => {
        const item = order.items.find(i => i.id === itemId);
        if (!item) return sum;
        return sum + (item.complimentary ? 0 : item.menuItem.price * qty);
      }, 0);
      case 'persons': return remaining / splitPersons;
      default: return remaining;
    }
  };

  const calculateTip = (): number => {
    if (!tipValue || !order) return 0;
    const val = parseFloat(tipValue);
    if (isNaN(val)) return 0;
    const base = getPayableAmount();
    return tipType === 'percent' ? (base * val / 100) : val;
  };

  const handleCompletePayment = () => {
    if (!order) return;
    const amount = getPayableAmount();
    const tip = calculateTip();
    const remaining = order.totalAmount - paidAmounts.reduce((s, a) => s + a, 0);
    
    if (splitMode !== 'full' && amount < remaining) {
      // Partial payment
      setPaidAmounts([...paidAmounts, amount]);
      toast({ 
        title: 'Plată parțială procesată',
        description: `${amount.toFixed(2)} RON plătit. Rămas: ${(remaining - amount).toFixed(2)} RON`,
      });
      // Reset for next partial payment
      setCustomAmount('');
      setSelectedPayItems({});
      setTipValue('');
      return;
    }
    
    // Full/final payment
    completeOrder(order.id, tip, cui || undefined);
    toast({ 
      title: 'Plată procesată',
      description: `Total: ${(amount + tip).toFixed(2)} RON`,
    });
    setPaidAmounts([]);
    setShowReceipt(true);
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

  const filteredMenu = menu.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = searchQuery 
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return searchQuery ? matchesSearch : matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-background" {...swipeHandlers}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg md:text-xl font-bold">Masa {table.number}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">{table.seats} locuri</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowOrderHistory(true)}
          >
            <History className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Istoric</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPayment(true)}
            disabled={!order || order.items.length === 0}
          >
            <CreditCard className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Plată</span>
          </Button>
        </div>
      </div>

      <div className={cn(
        "flex-1 flex flex-col md:flex-row overflow-hidden",
        sidebarPosition === 'left' && "md:flex-row-reverse"
      )}>
        {/* Menu Section */}
        <div className={cn(
          "flex flex-col overflow-hidden border-b md:border-b-0 border-border transition-all",
          sidebarPosition === 'left' ? "md:border-l" : "md:border-r",
          orderCollapsed ? "flex-1" : "flex-1 md:flex-[2]"
        )}>
          {/* Search */}
          <div className="p-2 md:p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Caută în meniu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Categories */}
          {!searchQuery && (
            <div className="flex gap-2 p-2 md:p-3 overflow-x-auto border-b border-border">
              {menuCategories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="whitespace-nowrap text-xs md:text-sm"
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {/* Menu Items */}
          <div className="flex-1 overflow-auto p-2 md:p-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {filteredMenu.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left overflow-hidden min-h-[120px] md:min-h-[140px]"
                >
                  {/* Product Image with overlay info */}
                  <div className="relative aspect-[4/3] w-full bg-secondary">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                    {/* Title & Price overlay top */}
                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent p-2.5 md:p-3 pb-6 md:pb-8">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2 leading-tight">{item.name}</h3>
                        <span className="font-bold text-white text-sm md:text-base whitespace-nowrap">{item.price} RON/{getUnitLabel(item.unitType)}</span>
                      </div>
                    </div>
                    {/* Clock badge */}
                    <span className="absolute bottom-1.5 left-1.5 text-xs md:text-sm text-white bg-black/60 rounded-full px-2 py-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.prepTime}'
                    </span>
                    {/* Info button */}
                    <Popover>
                      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 md:p-2 transition-colors">
                          <Info className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 text-sm" side="top" onClick={(e) => e.stopPropagation()}>
                        {item.description && (
                          <p className="text-muted-foreground mb-2">{item.description}</p>
                        )}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium text-foreground">Conține:</span> {item.ingredients.join(', ')}
                          </p>
                        )}
                        {item.allergenIds && item.allergenIds.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-foreground">Alergeni:</span>
                            <AllergenBadges allergenIds={item.allergenIds} size="sm" className="mt-1" />
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary - Collapsible with Position Toggle */}
        <div className={cn(
          "flex flex-col bg-secondary/30 transition-all duration-300",
          orderCollapsed 
            ? "h-14 md:h-auto md:w-14" 
            : "h-1/2 md:h-auto md:w-72 lg:w-80"
        )}>
          {/* Header with Position Toggle */}
          <div className="p-2 md:p-3 border-b border-border flex items-center justify-between bg-muted/50">
            {!orderCollapsed && (
              <>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  <h3 className="font-semibold text-sm md:text-base">Comandă</h3>
                </div>
                <div className="flex items-center gap-1">
                  {/* Position Toggle Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hidden md:flex"
                    onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')}
                    title={sidebarPosition === 'left' ? 'Mută la dreapta' : 'Mută la stânga'}
                  >
                    {sidebarPosition === 'left' ? (
                      <PanelRightClose className="w-4 h-4" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
                    )}
                  </Button>
                  {/* Collapse Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setOrderCollapsed(!orderCollapsed)}
                  >
                    {orderCollapsed ? (
                      <ChevronUp className="w-4 h-4 md:hidden" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:hidden" />
                    )}
                    <ChevronDown className={cn(
                      "w-4 h-4 hidden md:block transition-transform",
                      sidebarPosition === 'left' ? "-rotate-90" : "rotate-90",
                      !orderCollapsed && (sidebarPosition === 'left' ? "rotate-90" : "-rotate-90")
                    )} />
                  </Button>
                </div>
              </>
            )}
            {orderCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 mx-auto"
                onClick={() => setOrderCollapsed(false)}
              >
                <ShoppingCart className="w-4 h-4" />
                {order && order.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {order.items.length}
                  </span>
                )}
              </Button>
            )}
          </div>

          {!orderCollapsed && (
            <div className="flex-1 overflow-auto p-2 md:p-3">
              {order?.items.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 md:py-8 text-xs md:text-sm">
                  Adaugă produse din meniu
                </p>
              ) : (
              <div className="space-y-2">
                {order?.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-2 md:p-3 rounded-lg bg-card border",
                      item.status === 'ready' && "border-success",
                      item.status === 'cooking' && "border-warning"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="font-medium text-xs md:text-sm">{item.quantity}x</span>
                          <span className="font-medium text-xs md:text-sm truncate">{item.menuItem.name}</span>
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
                          <p className="text-xs text-muted-foreground italic mt-1 truncate">
                            "{item.modifications.notes}"
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(item.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-xs md:text-sm">
                          {item.complimentary ? (
                            <span className="text-success line-through decoration-success/50">{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                          ) : (
                            (item.menuItem.price * item.quantity).toFixed(2)
                          )}
                        </span>
                        {item.complimentary && (
                          <span className="text-[10px] text-success font-medium">Din partea casei</span>
                        )}
                        {item.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 md:h-7 md:w-7"
                              onClick={() => {
                                const updatedItems = order!.items.map(i => {
                                  if (i.id !== item.id) return i;
                                  return { ...i, complimentary: !i.complimentary };
                                });
                                const totalAmount = updatedItems.reduce((sum, i) => sum + (i.complimentary ? 0 : i.menuItem.price * i.quantity), 0);
                                updateOrder({ ...order!, items: updatedItems, totalAmount });
                                toast({ title: item.complimentary ? 'Produs taxat normal' : 'Produs oferit din partea casei' });
                              }}
                              title="Din partea casei"
                            >
                              <Gift className={cn("w-3.5 h-3.5", item.complimentary && "text-success")} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 md:h-7 md:w-7"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 md:h-7 md:w-7 text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {!orderCollapsed && order && order.items.length > 0 && (
            <div className="p-2 md:p-3 border-t border-border space-y-2 md:space-y-3">
              <div className="flex items-center justify-between font-bold text-base md:text-lg">
                <span>Total</span>
                <span>{order.totalAmount.toFixed(2)} RON</span>
              </div>
              
              {showClearConfirm ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                  <span className="text-sm text-destructive font-medium flex-1">Ștergi toate produsele?</span>
                  <Button size="sm" variant="destructive" onClick={handleClearAll}>
                    Da, șterge
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                    Nu
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Șterge tot
                  </Button>
                  <Button 
                    className="flex-1 gradient-primary text-sm"
                    onClick={handleSendToKitchenClick}
                    disabled={order.items.filter(i => i.status === 'pending').length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Trimite ({order.items.filter(i => i.status === 'pending').length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modifier Dialog */}
      <Dialog open={!!showModifier} onOpenChange={() => { setShowModifier(null); setEditingItem(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Modifică' : ''} {showModifier?.name}
            </DialogTitle>
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
                <div className="space-y-2 max-h-40 overflow-auto">
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
              {editingItem ? 'Actualizează' : 'Adaugă în comandă'} - {((showModifier?.price || 0) * modQuantity).toFixed(2)} RON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={(open) => { setShowPayment(open); if (!open) { setSplitMode('full'); setPaidAmounts([]); setCustomAmount(''); setSelectedPayItems({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Procesare plată - Masa {table.number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Paid amounts indicator */}
            {paidAmounts.length > 0 && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success mb-1">Plăți efectuate:</p>
                {paidAmounts.map((amt, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>Plata {i + 1}</span>
                    <span className="font-medium">{amt.toFixed(2)} RON</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-success/20">
                  <span>Rămas de plată</span>
                  <span>{((order?.totalAmount || 0) - paidAmounts.reduce((s, a) => s + a, 0)).toFixed(2)} RON</span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 rounded-lg bg-secondary">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total comandă</span>
                <span>{order?.totalAmount.toFixed(2)} RON</span>
              </div>
              {splitMode !== 'full' && (
                <div className="flex justify-between text-lg font-bold mt-1">
                  <span>De plată acum</span>
                  <span className="text-primary">{getPayableAmount().toFixed(2)} RON</span>
                </div>
              )}
              {calculateTip() > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Bacșiș</span>
                  <span>+{calculateTip().toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t border-border">
                <span>Total</span>
                <span>{(getPayableAmount() + calculateTip()).toFixed(2)} RON</span>
              </div>
            </div>

            {/* Split Mode Selection */}
            <div>
              <p className="font-medium mb-3">Tip plată</p>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { mode: 'full' as const, label: 'Integral', icon: CreditCard },
                  { mode: 'custom' as const, label: 'Sumă', icon: Hash },
                  { mode: 'items' as const, label: 'Produse', icon: ListChecks },
                  { mode: 'persons' as const, label: 'Persoane', icon: Users },
                ]).map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => { setSplitMode(mode); setSelectedPayItems({}); setCustomAmount(''); }}
                    className={cn(
                      "p-3 md:p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all",
                      splitMode === mode
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn("w-6 h-6 md:w-7 md:h-7", splitMode === mode ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-xs md:text-sm font-medium", splitMode === mode && "text-primary")}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            {splitMode === 'custom' && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium mb-2 text-sm">Sumă de plată</p>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Introduceți suma (RON)"
                  className="text-lg font-mono"
                  max={(order?.totalAmount || 0) - paidAmounts.reduce((s, a) => s + a, 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maxim: {((order?.totalAmount || 0) - paidAmounts.reduce((s, a) => s + a, 0)).toFixed(2)} RON
                </p>
              </div>
            )}

            {/* Select Items */}
            {splitMode === 'items' && order && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 max-h-48 overflow-auto">
                <p className="font-medium mb-2 text-sm">Selectează produsele de plată</p>
                <div className="space-y-2">
                  {order.items.map(item => {
                    const selectedQty = selectedPayItems[item.id] || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{item.menuItem.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.menuItem.price} RON × {item.quantity}
                            {item.complimentary && ' (gratis)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={selectedQty === 0}
                            onClick={() => setSelectedPayItems({ ...selectedPayItems, [item.id]: selectedQty - 1 })}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{selectedQty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={selectedQty >= item.quantity}
                            onClick={() => setSelectedPayItems({ ...selectedPayItems, [item.id]: selectedQty + 1 })}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split by Persons */}
            {splitMode === 'persons' && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium mb-2 text-sm">Împarte la</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    disabled={splitPersons <= 2}
                    onClick={() => setSplitPersons(splitPersons - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-2xl font-bold w-12 text-center">{splitPersons}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    disabled={splitPersons >= 20}
                    onClick={() => setSplitPersons(splitPersons + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">persoane</span>
                </div>
                <p className="text-sm mt-2">
                  Fiecare plătește: <span className="font-bold text-primary">{getPayableAmount().toFixed(2)} RON</span>
                </p>
              </div>
            )}

            {/* Payment Method Selection */}
            <div>
              <p className="font-medium mb-3">Metodă de plată</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    "p-3 md:p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'cash'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Banknote className={cn("w-7 h-7 md:w-8 md:h-8", paymentMethod === 'cash' ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", paymentMethod === 'cash' && "text-primary")}>Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    "p-3 md:p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'card'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <CardIcon className={cn("w-7 h-7 md:w-8 md:h-8", paymentMethod === 'card' ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", paymentMethod === 'card' && "text-primary")}>Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('usage_card')}
                  className={cn(
                    "p-3 md:p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'usage_card'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Barcode className={cn("w-7 h-7 md:w-8 md:h-8", paymentMethod === 'usage_card' ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium text-center", paymentMethod === 'usage_card' && "text-primary")}>Card Utilizare</span>
                </button>
              </div>
            </div>

            {/* Usage Card Code Input */}
            {paymentMethod === 'usage_card' && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium mb-2 flex items-center gap-2 text-sm">
                  <Barcode className="w-4 h-4" />
                  Cod card de utilizare
                </p>
                <Input
                  value={usageCardCode}
                  onChange={(e) => setUsageCardCode(e.target.value)}
                  placeholder="Scanează sau introdu codul"
                  className="font-mono text-lg"
                />
              </div>
            )}

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
              <Input
                type="number"
                value={tipType === 'value' ? tipValue : ''}
                onChange={(e) => { setTipType('value'); setTipValue(e.target.value); }}
                placeholder="Sumă fixă (RON)"
              />
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
              <Button 
                className="flex-1 gradient-primary" 
                onClick={handleCompletePayment}
                disabled={(paymentMethod === 'usage_card' && !usageCardCode) || (splitMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)) || (splitMode === 'items' && Object.values(selectedPayItems).every(v => v === 0))}
              >
                {paymentMethod === 'cash' && <Banknote className="w-4 h-4 mr-2" />}
                {paymentMethod === 'card' && <CardIcon className="w-4 h-4 mr-2" />}
                {paymentMethod === 'usage_card' && <Barcode className="w-4 h-4 mr-2" />}
                {splitMode !== 'full' && getPayableAmount() < ((order?.totalAmount || 0) - paidAmounts.reduce((s, a) => s + a, 0))
                  ? `Plătește ${getPayableAmount().toFixed(2)} RON`
                  : 'Finalizează'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      {order && (
        <Receipt 
          order={order} 
          isOpen={showReceipt} 
          onClose={() => { setShowReceipt(false); onClose(); }} 
        />
      )}

      {/* Upsell Questions Dialog */}
      <UpsellQuestionsDialog
        open={showUpsellDialog}
        onClose={() => setShowUpsellDialog(false)}
        onConfirm={handleUpsellConfirm}
        currentOrderItems={order?.items.map(i => i.menuItem.id) || []}
      />

      {/* Order History Dialog */}
      <OrderHistoryDialog
        open={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
        orders={orders}
        tableNumber={table.number}
        onUpdateOrder={updateOrder}
      />
    </div>
  );
};

export default OrderPanel;
