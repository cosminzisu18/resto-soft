import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurant } from '@/context/RestaurantContext';
import { Table, menuCategories, MenuItem, OrderItem, Order } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Search, Plus, Minus, Trash2, Send, CreditCard, Banknote,
  Clock, ChefHat, Check, Printer, Calculator,
  Split, Receipt, X, UtensilsCrossed,
  Package, Phone, ArrowLeft, Edit2, ChevronUp, ChevronDown,
  PanelLeftClose, PanelRightClose, ShoppingCart, List, Eye,
  Filter, Utensils, Monitor, Smartphone, Truck, Globe, RefreshCw
} from 'lucide-react';
import AllergenBadges from '@/components/AllergenBadges';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

type OrderType = 'table' | 'takeaway' | 'phone';
type POSView = 'new-order' | 'all-orders';

const POSModule: React.FC = () => {
  const { 
    menu, tables, createOrder, getActiveOrderForTable, addItemToOrder, 
    updateOrder, completeOrder, updateOrderItemStatus, orders
  } = useRestaurant();
  const { toast } = useToast();
  
  const [posView, setPosView] = useState<POSView>('new-order');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  // Phone order extra info
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Payment state
  const [tipType, setTipType] = useState<'percent' | 'value'>('percent');
  const [tipValue, setTipValue] = useState('');
  const [cui, setCui] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'usage_card'>('cash');
  const [showTipCalculator, setShowTipCalculator] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [tipPercent, setTipPercent] = useState(0);
  const [splitCount, setSplitCount] = useState(2);
  
  // Orders filter state
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');

  // Swipe gesture for sidebar position on mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setSidebarPosition('right'),
    onSwipeRight: () => setSidebarPosition('left'),
    threshold: 75,
    enabled: true,
  });

  // Get or create order based on selection
  const getOrder = (): Order | null => {
    if (orderType === 'table' && selectedTable) {
      let order = getActiveOrderForTable(selectedTable.id);
      if (!order) {
        order = createOrder(selectedTable.id);
      }
      return order;
    }
    // For takeaway/phone, we'll use a virtual table ID
    if (orderType === 'takeaway' || orderType === 'phone') {
      const tempTableId = orderType === 'takeaway' ? 'takeaway-temp' : 'phone-temp';
      let order = orders.find(o => o.tableId === tempTableId && o.status === 'active');
      if (!order) {
        // For demo purposes, create order using first free table as base
        // In a real app, this would be handled by the backend
        const freeTable = tables.find(t => t.status === 'free');
        if (freeTable) {
          return createOrder(freeTable.id);
        }
      }
      return order || null;
    }
    return null;
  };

  const order = getOrder();

  const handleBack = () => {
    setSelectedTable(null);
    setOrderType(null);
    setPhoneNumber('');
    setCustomerName('');
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setOrderType('table');
  };

  const handleTakeaway = () => {
    setOrderType('takeaway');
  };

  const handlePhoneOrder = () => {
    setOrderType('phone');
  };

  const handleAddItem = (item: MenuItem) => {
    if (item.ingredients && item.ingredients.length > 0) {
      setShowModifier(item);
      setEditingItem(null);
      setModAdditions([]);
      setModRemovals([]);
      setModNotes('');
      setModQuantity(1);
    } else if (order) {
      addItemToOrder(order.id, item, 1);
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
  };

  const handleRemoveItem = (itemId: string) => {
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (item && item.status !== 'pending') {
      toast({ title: 'Nu se poate șterge - deja în preparare', variant: 'destructive' });
      return;
    }
    const updatedItems = order.items.filter(i => i.id !== itemId);
    const totalAmount = updatedItems.reduce((sum, i) => sum + (i.menuItem.price * i.quantity), 0);
    updateOrder({ ...order, items: updatedItems, totalAmount });
    toast({ title: 'Produs eliminat' });
  };

  const handleConfirmModifier = () => {
    if (!showModifier || !order) return;
    
    if (editingItem) {
      const updatedItems = order.items.map(item => {
        if (item.id !== editingItem.id) return item;
        return {
          ...item,
          quantity: modQuantity,
          modifications: {
            added: modAdditions,
            removed: modRemovals,
            notes: modNotes,
          }
        };
      });
      const totalAmount = updatedItems.reduce((sum, i) => sum + (i.menuItem.price * i.quantity), 0);
      updateOrder({ ...order, items: updatedItems, totalAmount });
      toast({ title: 'Produs actualizat' });
    } else {
      addItemToOrder(order.id, showModifier, modQuantity, {
        added: modAdditions,
        removed: modRemovals,
        notes: modNotes,
      });
      toast({ title: `${showModifier.name} adăugat` });
    }
    
    setShowModifier(null);
    setEditingItem(null);
  };

  const handleSendToKitchen = () => {
    if (!order) return;
    
    const pendingItems = order.items.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) {
      toast({ title: 'Nu sunt articole noi de trimis', variant: 'destructive' });
      return;
    }

    pendingItems.forEach(item => {
      updateOrderItemStatus(order.id, item.id, 'cooking');
    });

    toast({ 
      title: 'Comandă trimisă la bucătărie',
      description: `${pendingItems.length} articole trimise`,
    });
  };

  const subtotal = order?.items.reduce((sum, i) => sum + (i.menuItem.price * i.quantity), 0) || 0;
  const tipAmount = subtotal * (tipPercent / 100);
  const total = subtotal + tipAmount;
  const perPerson = total / splitCount;

  const calculateTip = (): number => {
    if (!tipValue) return 0;
    const val = parseFloat(tipValue);
    if (isNaN(val)) return 0;
    return tipType === 'percent' ? (subtotal * val / 100) : val;
  };

  const handleCompletePayment = () => {
    if (!order) return;
    const tip = tipPercent > 0 ? tipAmount : calculateTip();
    completeOrder(order.id, tip, cui || undefined);
    toast({ 
      title: 'Plată procesată',
      description: `Total: ${(subtotal + tip).toFixed(2)} RON`,
    });
    setShowPayment(false);
    handleBack();
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

  const getOrderTitle = () => {
    if (orderType === 'takeaway') return 'La Pachet';
    if (orderType === 'phone') return `Telefon${customerName ? ` - ${customerName}` : ''}`;
    if (selectedTable) return `Masa ${selectedTable.number}`;
    return 'Comandă';
  };

  // Source configuration for display
  const sourceConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    restaurant: { icon: <Utensils className="w-4 h-4" />, label: 'POS', color: 'bg-primary' },
    glovo: { icon: <span className="text-sm">🟡</span>, label: 'Glovo', color: 'bg-yellow-500' },
    wolt: { icon: <span className="text-sm">🔵</span>, label: 'Wolt', color: 'bg-blue-500' },
    bolt: { icon: <span className="text-sm">🟢</span>, label: 'Bolt', color: 'bg-green-500' },
    own_website: { icon: <Globe className="w-4 h-4" />, label: 'Website', color: 'bg-purple-500' },
    phone: { icon: <Phone className="w-4 h-4" />, label: 'Telefon', color: 'bg-orange-500' },
    kiosk: { icon: <Monitor className="w-4 h-4" />, label: 'Kiosk', color: 'bg-cyan-500' },
  };

  // Filter orders for All Orders view
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (ordersFilter !== 'all' && order.status !== ordersFilter) return false;
    
    // Source filter
    if (sourceFilter !== 'all' && order.source !== sourceFilter) return false;
    
    // Search filter
    if (ordersSearchQuery) {
      const searchLower = ordersSearchQuery.toLowerCase();
      const matchesTable = order.tableNumber?.toString().includes(searchLower);
      const matchesId = order.id.toLowerCase().includes(searchLower);
      const matchesWaiter = order.waiterName?.toLowerCase().includes(searchLower);
      if (!matchesTable && !matchesId && !matchesWaiter) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Order stats
  const orderStats = {
    total: orders.length,
    active: orders.filter(o => o.status === 'active').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-blue-500">Activ</Badge>;
      case 'completed': return <Badge className="bg-green-500">Finalizat</Badge>;
      case 'cancelled': return <Badge variant="destructive">Anulat</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  };

  // Render All Orders View
  const renderAllOrdersView = () => (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="RestoPOS" 
        description="Toate comenzile"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className={cn(
            "p-3 cursor-pointer transition-all",
            ordersFilter === 'all' && "ring-2 ring-primary"
          )} onClick={() => setOrdersFilter('all')}>
            <p className="text-2xl font-bold">{orderStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className={cn(
            "p-3 cursor-pointer transition-all",
            ordersFilter === 'active' && "ring-2 ring-blue-500"
          )} onClick={() => setOrdersFilter('active')}>
            <p className="text-2xl font-bold text-blue-500">{orderStats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          <Card className={cn(
            "p-3 cursor-pointer transition-all",
            ordersFilter === 'completed' && "ring-2 ring-green-500"
          )} onClick={() => setOrdersFilter('completed')}>
            <p className="text-2xl font-bold text-green-500">{orderStats.completed}</p>
            <p className="text-xs text-muted-foreground">Finalizate</p>
          </Card>
          <Card className={cn(
            "p-3 cursor-pointer transition-all",
            ordersFilter === 'cancelled' && "ring-2 ring-destructive"
          )} onClick={() => setOrdersFilter('cancelled')}>
            <p className="text-2xl font-bold text-destructive">{orderStats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Anulate</p>
          </Card>
        </div>

        {/* Filters Row */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Caută după masă, ID, ospătar..." 
              value={ordersSearchQuery}
              onChange={(e) => setOrdersSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sursă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate sursele</SelectItem>
              <SelectItem value="restaurant">POS</SelectItem>
              <SelectItem value="kiosk">Kiosk</SelectItem>
              <SelectItem value="phone">Telefon</SelectItem>
              <SelectItem value="glovo">Glovo</SelectItem>
              <SelectItem value="wolt">Wolt</SelectItem>
              <SelectItem value="bolt">Bolt</SelectItem>
              <SelectItem value="own_website">Website</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => toast({ title: 'Se actualizează...' })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Orders List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nu sunt comenzi care să corespundă filtrelor</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const source = sourceConfig[order.source] || sourceConfig.restaurant;
                return (
                  <Card 
                    key={order.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-all"
                    onClick={() => setSelectedOrderDetails(order)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Order Number & Source */}
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-2xl font-black text-primary">
                            #{order.tableNumber || order.id.slice(-4)}
                          </p>
                          <Badge className={cn("text-xs", source.color, "text-white")}>
                            {source.icon}
                            <span className="ml-1">{source.label}</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getOrderStatusBadge(order.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {order.items.length} produse • {order.waiterName || 'Self-service'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item.quantity}x {item.menuItem.name.slice(0, 15)}...
                            </Badge>
                          ))}
                          {order.items.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{order.items.length - 3}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Total & Payment */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{order.totalAmount.toFixed(2)} RON</p>
                        <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                          {order.paymentMethod === 'cash' && <><Banknote className="w-3 h-3" /> Cash</>}
                          {order.paymentMethod === 'card' && <><CreditCard className="w-3 h-3" /> Card</>}
                          {!order.paymentMethod && order.status === 'active' && <Clock className="w-3 h-3" />}
                          {!order.paymentMethod && order.status === 'active' && 'Neplătit'}
                        </div>
                      </div>

                      {/* View Button */}
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  // Selection screen with tabs
  if (!orderType && posView === 'new-order') {
    return (
      <div className="h-full flex flex-col">
        <PageHeader 
          title="RestoPOS" 
          description="Sistem de vânzare complet"
        />
        
        {/* View Tabs */}
        <div className="px-4 pt-2">
          <Tabs value={posView} onValueChange={(v) => setPosView(v as POSView)}>
            <TabsList className="w-full">
              <TabsTrigger value="new-order" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Comandă Nouă
              </TabsTrigger>
              <TabsTrigger value="all-orders" className="flex-1">
                <List className="w-4 h-4 mr-2" />
                Toate Comenzile
                {orderStats.active > 0 && (
                  <Badge className="ml-2 bg-blue-500">{orderStats.active}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <h2 className="text-lg font-semibold mb-4">Selectează masa sau tipul comenzii</h2>
          
          {/* Tables Grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table)}
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

          {/* Order Type Buttons */}
          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1 h-16 text-lg"
              onClick={handleTakeaway}
            >
              <Package className="w-6 h-6 mr-3" />
              Comandă La Pachet
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="flex-1 h-16 text-lg"
              onClick={handlePhoneOrder}
            >
              <Phone className="w-6 h-6 mr-3" />
              Comandă Telefon
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // All Orders view
  if (posView === 'all-orders') {
    return (
      <div className="h-full flex flex-col">
        <PageHeader 
          title="RestoPOS" 
          description="Toate comenzile"
        />
        
        {/* View Tabs */}
        <div className="px-4 pt-2">
          <Tabs value={posView} onValueChange={(v) => setPosView(v as POSView)}>
            <TabsList className="w-full">
              <TabsTrigger value="new-order" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Comandă Nouă
              </TabsTrigger>
              <TabsTrigger value="all-orders" className="flex-1">
                <List className="w-4 h-4 mr-2" />
                Toate Comenzile
                {orderStats.active > 0 && (
                  <Badge className="ml-2 bg-blue-500">{orderStats.active}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {renderAllOrdersView()}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Comandă #{selectedOrderDetails?.tableNumber || selectedOrderDetails?.id.slice(-4)}
                {selectedOrderDetails && getOrderStatusBadge(selectedOrderDetails.status)}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrderDetails && (
              <div className="space-y-4">
                {/* Order Meta */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Sursă</p>
                    <div className="flex items-center gap-1">
                      {sourceConfig[selectedOrderDetails.source]?.icon}
                      <span className="font-medium">{sourceConfig[selectedOrderDetails.source]?.label}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ospătar</p>
                    <p className="font-medium">{selectedOrderDetails.waiterName || 'Self-service'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data/Ora</p>
                    <p className="font-medium">{formatDate(selectedOrderDetails.createdAt)} {formatTime(selectedOrderDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plată</p>
                    <div className="flex items-center gap-1">
                      {selectedOrderDetails.paymentMethod === 'cash' && <><Banknote className="w-3 h-3" /> Cash</>}
                      {selectedOrderDetails.paymentMethod === 'card' && <><CreditCard className="w-3 h-3" /> Card</>}
                      {!selectedOrderDetails.paymentMethod && <span className="text-muted-foreground">Neplătit</span>}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="font-semibold mb-2">Produse</h4>
                  <div className="space-y-2">
                    {selectedOrderDetails.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-card border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.quantity}x</span>
                            <span>{item.menuItem.name}</span>
                            {getStatusIcon(item.status)}
                          </div>
                          {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                            <p className="text-xs text-muted-foreground">
                              {item.modifications.added.map(a => `+${a}`).join(', ')}
                              {item.modifications.removed.map(r => `-${r}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-medium">{(item.menuItem.price * item.quantity).toFixed(2)} RON</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{selectedOrderDetails.totalAmount.toFixed(2)} RON</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedOrderDetails(null)}>
                    Închide
                  </Button>
                  <Button className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Printează
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Phone order customer info dialog
  if (orderType === 'phone' && !customerName) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader 
          title="RestoPOS" 
          description="Comandă Telefonică"
        />
        
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <Phone className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Comandă Telefonică</h2>
              <p className="text-muted-foreground">Introduceți datele clientului</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nume Client *</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Ion Popescu"
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Telefon</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ex: 0722 123 456"
                  className="h-12 text-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi
              </Button>
              <Button 
                className="flex-1 h-12" 
                disabled={!customerName.trim()}
                onClick={() => {
                  if (customerName.trim()) {
                    // Customer name is set, proceed to order
                  }
                }}
              >
                Continuă
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main POS interface
  return (
    <div className="h-full flex flex-col" {...swipeHandlers}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              {orderType === 'takeaway' && <Package className="w-5 h-5 text-primary" />}
              {orderType === 'phone' && <Phone className="w-5 h-5 text-primary" />}
              {getOrderTitle()}
            </h2>
            {orderType === 'phone' && phoneNumber && (
              <p className="text-xs md:text-sm text-muted-foreground">{phoneNumber}</p>
            )}
            {orderType === 'table' && selectedTable && (
              <p className="text-xs md:text-sm text-muted-foreground">{selectedTable.seats} locuri</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={orderType === 'takeaway' ? 'default' : orderType === 'phone' ? 'secondary' : 'outline'}>
            {orderType === 'takeaway' ? 'La Pachet' : orderType === 'phone' ? 'Telefon' : 'În Local'}
          </Badge>
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
                  className="rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left overflow-hidden"
                >
                  {item.image && (
                    <div className="aspect-video w-full bg-secondary">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3 md:p-4">
                    <h3 className="font-medium text-xs md:text-sm mb-1 line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1 hidden md:block">
                      {item.description}
                    </p>
                    <AllergenBadges allergenIds={item.allergenIds} size="sm" className="mb-1" />
                    {item.ingredients && item.ingredients.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">
                        Conține: {item.ingredients.slice(0, 3).join(', ')}{item.ingredients.length > 3 ? '...' : ''}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary text-sm">{item.price} RON</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.prepTime}'
                      </span>
                    </div>
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
              {!order || order.items.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 md:py-8 text-xs md:text-sm">
                  Adaugă produse din meniu
                </p>
              ) : (
                <div className="space-y-2">
                  {order.items.map(item => (
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
                            {(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>
                          <div className="flex gap-1">
                            {item.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                            {item.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {!orderCollapsed && order && order.items.length > 0 && (
            <div className="p-2 md:p-3 border-t border-border space-y-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{subtotal.toFixed(2)} RON</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTipCalculator(true)}
                >
                  <Calculator className="w-4 h-4 mr-1" />
                  Bacșiș
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSplitPayment(true)}
                >
                  <Split className="w-4 h-4 mr-1" />
                  Împarte
                </Button>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleSendToKitchen}
              >
                <Send className="w-4 h-4 mr-2" />
                Trimite la Bucătărie
              </Button>

              <Button className="w-full" onClick={() => setShowPayment(true)}>
                <Receipt className="w-4 h-4 mr-2" />
                Finalizează Plata
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modifier Dialog */}
      <Dialog open={!!showModifier} onOpenChange={() => setShowModifier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editare' : 'Adaugă'} - {showModifier?.name}</DialogTitle>
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
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
                  {showModifier.ingredients.map(ing => (
                    <div 
                      key={ing} 
                      className={cn(
                        "p-2 rounded-lg border text-sm flex items-center justify-between",
                        modRemovals.includes(ing) && "bg-destructive/10 border-destructive",
                        modAdditions.includes(ing) && "bg-success/10 border-success"
                      )}
                    >
                      <span className={cn(modRemovals.includes(ing) && "line-through")}>{ing}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={modRemovals.includes(ing) ? 'destructive' : 'ghost'}
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (modRemovals.includes(ing)) {
                              setModRemovals(modRemovals.filter(r => r !== ing));
                            } else {
                              setModRemovals([...modRemovals, ing]);
                              setModAdditions(modAdditions.filter(a => a !== ing));
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={modAdditions.includes(ing) ? 'default' : 'ghost'}
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (modAdditions.includes(ing)) {
                              setModAdditions(modAdditions.filter(a => a !== ing));
                            } else {
                              setModAdditions([...modAdditions, ing]);
                              setModRemovals(modRemovals.filter(r => r !== ing));
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
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

            <Button className="w-full h-12" onClick={handleConfirmModifier}>
              {editingItem ? 'Actualizează' : 'Adaugă'} - {((showModifier?.price || 0) * modQuantity).toFixed(2)} RON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizare Plată - {getOrderTitle()}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} RON</span>
              </div>
              {tipPercent > 0 && (
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
                  onClick={() => setPaymentMethod('usage_card')}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'usage_card' ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <Split className={cn("w-8 h-8", paymentMethod === 'usage_card' && "text-primary")} />
                  <span className="text-sm font-medium">Split</span>
                </button>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">CUI pentru factură (opțional)</p>
              <Input
                value={cui}
                onChange={(e) => setCui(e.target.value)}
                placeholder="RO12345678"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                Anulează
              </Button>
              <Button className="flex-1" onClick={handleCompletePayment}>
                <Printer className="w-4 h-4 mr-2" />
                Încasează
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
            <div className="grid grid-cols-5 gap-2">
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
