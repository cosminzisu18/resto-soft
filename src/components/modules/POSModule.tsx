import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useRestaurant } from '@/context/RestaurantContext';
import { Table, Order, OrderItem, PaymentMethod } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Search, Plus, CreditCard, Banknote, Clock, ChefHat, Check, Printer,
  Package, Phone, ArrowLeft, List, Eye, Filter, Utensils, Monitor, 
  Globe, RefreshCw, Calendar, PanelLeftClose, PanelRightClose,
  Download, FileText, Receipt, Barcode, Edit2, User, Calculator
} from 'lucide-react';
import CashRegisterDialog from '@/components/CashRegisterDialog';
import ExternalOrdersNotification from '@/components/ExternalOrdersNotification';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import TableMap from '@/components/TableMap';
import OrderPanel from '@/components/OrderPanel';
import ReservationManager from '@/components/ReservationManager';
import { useToast } from '@/hooks/use-toast';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

type POSView = 'tables' | 'all-orders';

const POSModule: React.FC = () => {
  const { 
    tables, orders, reservations, createReservation, updateReservation, deleteReservation, updateOrder
  } = useRestaurant();
  const { toast } = useToast();
  
  const [posView, setPosView] = useState<POSView>('tables');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  // Orders filter state
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterWaiter, setFilterWaiter] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  
  // Invoice state
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceCui, setInvoiceCui] = useState('');
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('');
  const [invoiceCompanyAddress, setInvoiceCompanyAddress] = useState('');
  
  // Payment edit state
  const [editingPaymentOrderId, setEditingPaymentOrderId] = useState<string | null>(null);
  
  // Phone/Takeaway order dialog
  const [showPhoneOrderDialog, setShowPhoneOrderDialog] = useState(false);
  const [showTakeawayDialog, setShowTakeawayDialog] = useState(false);
  const [phoneCustomerName, setPhoneCustomerName] = useState('');
  const [phoneCustomerPhone, setPhoneCustomerPhone] = useState('');

  // Unique values for filters
  const uniqueWaiters = useMemo(() => [...new Set(orders.map(o => o.waiterName).filter(Boolean))], [orders]);

  // Swipe gesture for sidebar position on mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setSidebarPosition('right'),
    onSwipeRight: () => setSidebarPosition('left'),
    threshold: 75,
    enabled: sidebarOpen,
  });

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
  };

  const handleOrderClose = () => {
    setSelectedTable(null);
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
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (ordersFilter !== 'all' && order.status !== ordersFilter) return false;
      if (sourceFilter !== 'all' && order.source !== sourceFilter) return false;
      if (filterPayment !== 'all') {
        if (filterPayment === 'unpaid' && order.paymentMethod) return false;
        if (filterPayment !== 'unpaid' && order.paymentMethod !== filterPayment) return false;
      }
      if (filterWaiter !== 'all' && order.waiterName !== filterWaiter) return false;
      if (filterDate) {
        const orderDate = new Date(order.createdAt);
        if (orderDate.toDateString() !== filterDate.toDateString()) return false;
      }
      if (ordersSearchQuery) {
        const searchLower = ordersSearchQuery.toLowerCase();
        const matchesTable = order.tableNumber?.toString().includes(searchLower);
        const matchesId = order.id.toLowerCase().includes(searchLower);
        const matchesWaiter = order.waiterName?.toLowerCase().includes(searchLower);
        const matchesCustomer = order.customerName?.toLowerCase().includes(searchLower);
        if (!matchesTable && !matchesId && !matchesWaiter && !matchesCustomer) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, ordersFilter, sourceFilter, filterPayment, filterWaiter, filterDate, ordersSearchQuery]);

  // Summary stats for filtered orders
  const filteredRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const filteredTips = filteredOrders.reduce((s, o) => s + (o.tip || 0), 0);

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

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'cooking': return <ChefHat className="w-4 h-4 text-warning" />;
      case 'ready': return <Check className="w-4 h-4 text-success" />;
      case 'served': return <Check className="w-4 h-4 text-primary" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  };

  const handleStartPhoneOrder = () => {
    if (!phoneCustomerName.trim()) {
      toast({ title: 'Introduceți numele clientului', variant: 'destructive' });
      return;
    }
    const freeTable = tables.find(t => t.status === 'free');
    if (freeTable) {
      setShowPhoneOrderDialog(false);
      setSelectedTable(freeTable);
      toast({ title: `Comandă telefonică pentru ${phoneCustomerName}`, description: 'Adaugă produsele în comandă' });
    } else {
      toast({ title: 'Nu există mese disponibile', variant: 'destructive' });
    }
    setPhoneCustomerName('');
    setPhoneCustomerPhone('');
  };

  const getPaymentLabel = (method?: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'usage_card': return 'Card Utilizare';
      default: return 'Neplătit';
    }
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'usage_card': return <Barcode className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleChangePaymentMethod = (orderId: string, newMethod: PaymentMethod) => {
    const order = orders.find(o => o.id === orderId);
    if (order && updateOrder) {
      updateOrder({ ...order, paymentMethod: newMethod });
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails({ ...order, paymentMethod: newMethod });
      }
      toast({ title: 'Metodă de plată actualizată', description: `Schimbată la ${getPaymentLabel(newMethod)}` });
    }
    setEditingPaymentOrderId(null);
  };

  const handleGenerateInvoice = (order: Order) => {
    setInvoiceOrder(order);
    setInvoiceCui(order.cui || '');
    setInvoiceCompanyName('');
    setInvoiceCompanyAddress('');
  };

  const handlePrintInvoice = () => {
    if (!invoiceOrder) return;
    if (!invoiceCui.trim()) {
      toast({ title: 'CUI obligatoriu', description: 'Introduceți CUI-ul pentru factură', variant: 'destructive' });
      return;
    }
    toast({ title: 'Factură generată', description: `Factura pentru comanda #${invoiceOrder.id.slice(0, 8)} a fost generată` });
    setInvoiceOrder(null);
  };

  const handleExportExcel = () => {
    const headers = ['ID Comandă', 'Data', 'Masa', 'Sursă', 'Ospătar', 'Client', 'Produse', 'Cantitate', 'Subtotal', 'Bacșiș', 'Total', 'Metodă Plată', 'Status', 'CUI'];
    const rows = filteredOrders.map(order => {
      const products = order.items.map(i => `${i.quantity}x ${i.menuItem.name}${i.complimentary ? ' (gratis)' : ''}`).join('; ');
      const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
      const source = sourceConfig[order.source]?.label || order.source;
      return [
        order.id.slice(0, 8),
        new Date(order.createdAt).toLocaleString('ro-RO'),
        order.tableNumber || 'N/A',
        source,
        order.waiterName || 'N/A',
        order.customerName || 'N/A',
        products,
        totalItems,
        order.totalAmount.toFixed(2),
        (order.tip || 0).toFixed(2),
        (order.totalAmount + (order.tip || 0)).toFixed(2),
        getPaymentLabel(order.paymentMethod),
        order.status === 'completed' ? 'Finalizat' : order.status === 'active' ? 'Activ' : 'Anulat',
        order.cui || ''
      ];
    });
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comenzi-pos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export realizat', description: `${filteredOrders.length} comenzi exportate` });
  };

  const handleStartTakeawayOrder = () => {
    const freeTable = tables.find(t => t.status === 'free');
    if (freeTable) {
      setShowTakeawayDialog(false);
      setSelectedTable(freeTable);
      toast({ title: 'Comandă la pachet', description: 'Adaugă produsele în comandă' });
    } else {
      toast({ title: 'Nu există mese disponibile', variant: 'destructive' });
    }
  };

  // If a table is selected, show OrderPanel (same as waiter view)
  if (selectedTable) {
    return (
      <div className="h-full">
        <OrderPanel table={selectedTable} onClose={handleOrderClose} />
      </div>
    );
  }

  // Reservation Sidebar (same as waiter view)
  const ReservationSidebar = (
    <div className={cn(
      "w-80 border-border bg-card flex flex-col h-full",
      sidebarPosition === 'left' ? "border-r" : "border-l"
    )}>
      <div className="p-2 border-b border-border flex items-center justify-between bg-muted/50">
        <span className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Rezervări
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
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
            onClick={() => setSidebarOpen(false)}
            title="Închide"
          >
            <ArrowLeft className={cn("w-4 h-4", sidebarPosition === 'right' && "rotate-180")} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <ReservationManager 
          reservations={reservations}
          tables={tables}
          onCreateReservation={createReservation}
          onUpdateReservation={updateReservation}
          onDeleteReservation={deleteReservation}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col" {...swipeHandlers}>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <h1 className="font-semibold">RestoPOS</h1>
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTakeawayDialog(true)}
            className="hidden md:flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            La Pachet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPhoneOrderDialog(true)}
            className="hidden md:flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Telefon
          </Button>
          {!sidebarOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden md:inline">Rezervări</span>
            </Button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="px-4 pt-2 border-b border-border bg-background">
        <Tabs value={posView} onValueChange={(v) => setPosView(v as POSView)}>
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="tables" className="flex-1">
              <Utensils className="w-4 h-4 mr-2" />
              Harta Mese
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        {sidebarOpen && sidebarPosition === 'left' && posView === 'tables' && (
          <div className="hidden md:flex">
            {ReservationSidebar}
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {posView === 'tables' ? (
            <div className="h-full flex flex-col">
              {/* Mobile Quick Actions */}
              <div className="flex gap-2 p-2 border-b border-border md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowTakeawayDialog(true)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  La Pachet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowPhoneOrderDialog(true)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Telefon
                </Button>
              </div>
              
              {/* Table Map - same as waiter view */}
              <div className="flex-1 overflow-auto">
                <TableMap onTableSelect={handleTableSelect} />
              </div>
            </div>
          ) : (
            /* All Orders View */
            <div className="h-full flex flex-col p-4">
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
              <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Caută după masă, ID, ospătar, client..." 
                      value={ordersSearchQuery}
                      onChange={(e) => setOrdersSearchQuery(e.target.value)}
                      className="pl-9 h-8"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportExcel}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Se actualizează...' })}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-8 text-xs", filterDate && "border-primary text-primary")}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {filterDate ? format(filterDate, 'dd MMM yyyy', { locale: ro }) : 'Toate zilele'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        className={cn("p-3 pointer-events-auto")}
                      />
                      {filterDate && (
                        <div className="p-2 border-t">
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => setFilterDate(undefined)}>
                            Resetează
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
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

                  <Select value={filterWaiter} onValueChange={setFilterWaiter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Ospătar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toți ospătarii</SelectItem>
                      {uniqueWaiters.map(w => (
                        <SelectItem key={w} value={w!}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterPayment} onValueChange={setFilterPayment}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Plată" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="usage_card">Card Utilizare</SelectItem>
                      <SelectItem value="unpaid">Neplătit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="flex gap-3 text-sm mb-3">
                <span className="text-muted-foreground">{filteredOrders.length} comenzi</span>
                <span className="font-medium">Total: {filteredRevenue.toFixed(2)} RON</span>
                {filteredTips > 0 && <span className="text-muted-foreground">Bacșișuri: {filteredTips.toFixed(2)} RON</span>}
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
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {item.quantity}x {item.menuItem.name.length > 15 ? item.menuItem.name.slice(0, 15) + '...' : item.menuItem.name}
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
                                {!order.paymentMethod && order.status === 'active' && <><Clock className="w-3 h-3" /> Neplătit</>}
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
          )}
        </div>
        
        {/* Right sidebar */}
        {sidebarOpen && sidebarPosition === 'right' && posView === 'tables' && (
          <div className="hidden md:flex">
            {ReservationSidebar}
          </div>
        )}
      </div>

      {/* Phone Order Dialog */}
      <Dialog open={showPhoneOrderDialog} onOpenChange={setShowPhoneOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Comandă Telefonică
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nume Client *</label>
              <Input
                value={phoneCustomerName}
                onChange={(e) => setPhoneCustomerName(e.target.value)}
                placeholder="Ex: Ion Popescu"
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Telefon</label>
              <Input
                value={phoneCustomerPhone}
                onChange={(e) => setPhoneCustomerPhone(e.target.value)}
                placeholder="Ex: 0722 123 456"
                className="h-12"
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPhoneOrderDialog(false)}>
                Anulează
              </Button>
              <Button className="flex-1" onClick={handleStartPhoneOrder}>
                Începe Comanda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Takeaway Dialog */}
      <Dialog open={showTakeawayDialog} onOpenChange={setShowTakeawayDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Comandă La Pachet
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Se va crea o comandă nouă pentru ridicare la pachet.
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowTakeawayDialog(false)}>
                Anulează
              </Button>
              <Button className="flex-1" onClick={handleStartTakeawayOrder}>
                <Package className="w-4 h-4 mr-2" />
                Începe Comanda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrderDetails && !invoiceOrder} onOpenChange={() => setSelectedOrderDetails(null)}>
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
                  {editingPaymentOrderId === selectedOrderDetails.id ? (
                    <div className="flex gap-1 mt-1">
                      {(['cash', 'card', 'usage_card'] as PaymentMethod[]).map(method => (
                        <button
                          key={method}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors",
                            selectedOrderDetails.paymentMethod === method
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => handleChangePaymentMethod(selectedOrderDetails.id, method)}
                        >
                          {getPaymentIcon(method)}
                          {getPaymentLabel(method)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => setEditingPaymentOrderId(selectedOrderDetails.id)}>
                      {getPaymentIcon(selectedOrderDetails.paymentMethod)}
                      <span className="font-medium">{getPaymentLabel(selectedOrderDetails.paymentMethod)}</span>
                      <Edit2 className="w-3 h-3 text-muted-foreground ml-1" />
                    </div>
                  )}
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
                          {item.complimentary && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">Gratis</Badge>
                          )}
                        </div>
                        {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {item.modifications.added.map(a => `+${a}`).join(', ')}
                            {item.modifications.removed.map(r => `-${r}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className={cn("font-medium", item.complimentary && "line-through text-muted-foreground")}>
                        {(item.menuItem.price * item.quantity).toFixed(2)} RON
                      </span>
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
                <Button variant="outline" className="flex-1" onClick={() => handleGenerateInvoice(selectedOrderDetails)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Factură
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

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceOrder} onOpenChange={() => setInvoiceOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generare Factură
            </DialogTitle>
          </DialogHeader>
          {invoiceOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p>Comandă: <span className="font-mono font-medium">#{invoiceOrder.id.slice(0, 8)}</span></p>
                <p>Total: <span className="font-bold">{invoiceOrder.totalAmount.toFixed(2)} RON</span></p>
                <p>Data: {new Date(invoiceOrder.createdAt).toLocaleString('ro-RO')}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CUI *</label>
                <Input
                  value={invoiceCui}
                  onChange={(e) => setInvoiceCui(e.target.value)}
                  placeholder="Ex: RO12345678"
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Denumire Firmă</label>
                <Input
                  value={invoiceCompanyName}
                  onChange={(e) => setInvoiceCompanyName(e.target.value)}
                  placeholder="Ex: SC Firma SRL"
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Adresă</label>
                <Input
                  value={invoiceCompanyAddress}
                  onChange={(e) => setInvoiceCompanyAddress(e.target.value)}
                  placeholder="Ex: Str. Exemplu nr. 1, București"
                  className="h-10"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setInvoiceOrder(null)}>
                  Anulează
                </Button>
                <Button className="flex-1" onClick={handlePrintInvoice}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generează Factură
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSModule;
