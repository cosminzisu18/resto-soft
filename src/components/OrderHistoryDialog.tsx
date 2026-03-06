import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Order, PaymentMethod } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  FileText, Printer, ChevronDown, ChevronUp, Calendar, 
  User, CreditCard, Banknote, Barcode, Receipt, Download,
  Filter, Search, UtensilsCrossed, Edit2, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrderHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  tableNumber?: number;
  onUpdateOrder?: (order: Order) => void;
}

const OrderHistoryDialog: React.FC<OrderHistoryDialogProps> = ({ open, onClose, orders, tableNumber, onUpdateOrder }) => {
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceCui, setInvoiceCui] = useState('');
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('');
  const [invoiceCompanyAddress, setInvoiceCompanyAddress] = useState('');

  // Filter state
  const [viewMode, setViewMode] = useState<'table' | 'all'>(tableNumber ? 'table' : 'all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWaiter, setFilterWaiter] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPaymentOrderId, setEditingPaymentOrderId] = useState<string | null>(null);

  // Unique values for filters
  const uniqueWaiters = useMemo(() => [...new Set(orders.map(o => o.waiterName).filter(Boolean))], [orders]);
  const uniqueTables = useMemo(() => [...new Set(orders.map(o => o.tableNumber).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0)), [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (viewMode === 'table' && tableNumber) return o.tableNumber === tableNumber;
        return true;
      })
      .filter(o => filterStatus === 'all' || o.status === filterStatus)
      .filter(o => filterWaiter === 'all' || o.waiterName === filterWaiter)
      .filter(o => filterTable === 'all' || String(o.tableNumber) === filterTable)
      .filter(o => filterPayment === 'all' || o.paymentMethod === filterPayment)
      .filter(o => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return o.id.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.waiterName?.toLowerCase().includes(q) ||
          o.items.some(i => i.menuItem.name.toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, viewMode, tableNumber, filterStatus, filterWaiter, filterTable, filterPayment, searchQuery]);

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
    toast({ title: 'Factură generată', description: `Factura pentru comanda ${invoiceOrder.id.slice(0, 8)} a fost generată` });
    setInvoiceOrder(null);
  };

  const handleChangePaymentMethod = (orderId: string, newMethod: PaymentMethod) => {
    const order = orders.find(o => o.id === orderId);
    if (order && onUpdateOrder) {
      onUpdateOrder({ ...order, paymentMethod: newMethod });
      toast({ title: 'Metodă de plată actualizată', description: `Metoda de plată a fost schimbată la ${getPaymentLabel(newMethod)}` });
    }
    setEditingPaymentOrderId(null);
  };

  const handleExportExcel = () => {
    const headers = ['ID Comandă', 'Data', 'Masa', 'Ospătar', 'Client', 'Produse', 'Cantitate', 'Subtotal', 'Bacșiș', 'Total', 'Metodă Plată', 'Status', 'CUI'];
    
    const rows = filteredOrders.map(order => {
      const products = order.items.map(i => `${i.quantity}x ${i.menuItem.name}${i.complimentary ? ' (gratis)' : ''}`).join('; ');
      const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
      return [
        order.id.slice(0, 8),
        new Date(order.createdAt).toLocaleString('ro-RO'),
        order.tableNumber || 'N/A',
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
    link.download = `istoric-comenzi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export realizat', description: `${filteredOrders.length} comenzi exportate` });
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'usage_card': return <Barcode className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentLabel = (method?: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'usage_card': return 'Card Utilizare';
      default: return 'N/A';
    }
  };

  // Summary stats
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalTips = filteredOrders.reduce((s, o) => s + (o.tip || 0), 0);

  return (
    <>
      <Dialog open={open && !invoiceOrder} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Istoric Comenzi
              </span>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* View Mode Toggle */}
          {tableNumber && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <UtensilsCrossed className="w-4 h-4 mr-1" />
                Masa {tableNumber}
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                Toate comenzile
              </Button>
            </div>
          )}

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Caută după ID, client, ospătar, produs..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Finalizate</SelectItem>
                  <SelectItem value="cancelled">Anulate</SelectItem>
                </SelectContent>
              </Select>

              {viewMode === 'all' && (
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Masa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate mesele</SelectItem>
                    {uniqueTables.map(t => (
                      <SelectItem key={t} value={String(t)}>Masa {t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filterWaiter} onValueChange={setFilterWaiter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Ospătar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți ospătarii</SelectItem>
                  {uniqueWaiters.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="flex gap-3 text-sm">
            <span className="text-muted-foreground">{filteredOrders.length} comenzi</span>
            <span className="font-medium">Total: {totalRevenue.toFixed(2)} RON</span>
            {totalTips > 0 && <span className="text-muted-foreground">Bacșișuri: {totalTips.toFixed(2)} RON</span>}
          </div>

          {/* Orders List */}
          <ScrollArea className="flex-1 max-h-[50vh]">
            {filteredOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nu există comenzi care se potrivesc filtrelor</p>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredOrders.map(order => {
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <div key={order.id} className="rounded-xl border border-border overflow-hidden">
                      {/* Order Header */}
                      <button
                        className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-medium text-primary">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleString('ro-RO', { 
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex flex-col text-xs text-muted-foreground">
                            {order.tableNumber && <span>Masa {order.tableNumber}</span>}
                            {order.waiterName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.waiterName}</span>}
                          </div>
                          {order.customerName && (
                            <span className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
                              {order.customerName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={order.status === 'completed' ? 'success' : order.status === 'active' ? 'warning' : 'secondary'}>
                            {order.status === 'completed' ? 'Finalizat' : order.status === 'active' ? 'Activ' : 'Anulat'}
                          </Badge>
                          <span className="font-bold text-sm">{order.totalAmount.toFixed(2)} RON</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-border p-3 md:p-4 space-y-3 bg-muted/20">
                          {/* Items */}
                          <div>
                            <p className="text-sm font-medium mb-2">Produse</p>
                            <div className="space-y-1.5">
                              {order.items.map(item => (
                                <div key={item.id} className="flex items-start justify-between text-sm p-2 rounded-lg bg-card">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{item.quantity}×</span>
                                      <span className="truncate">{item.menuItem.name}</span>
                                      {item.complimentary && (
                                        <Badge variant="success" className="text-[10px] px-1 py-0">Gratis</Badge>
                                      )}
                                    </div>
                                    {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                                      <div className="text-xs text-muted-foreground mt-0.5 ml-6">
                                        {item.modifications.added.map(a => (
                                          <span key={a} className="text-success">+{a} </span>
                                        ))}
                                        {item.modifications.removed.map(r => (
                                          <span key={r} className="text-destructive">-{r} </span>
                                        ))}
                                      </div>
                                    )}
                                    {item.modifications.notes && (
                                      <p className="text-xs text-muted-foreground italic ml-6">"{item.modifications.notes}"</p>
                                    )}
                                  </div>
                                  <span className={cn("font-medium whitespace-nowrap", item.complimentary && "line-through text-muted-foreground")}>
                                    {(item.menuItem.price * item.quantity).toFixed(2)} RON
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 rounded-lg bg-card">
                              <span className="text-muted-foreground">Plată</span>
                              {editingPaymentOrderId === order.id ? (
                                <div className="flex gap-1 mt-1">
                                  {(['cash', 'card', 'usage_card'] as PaymentMethod[]).map(method => (
                                    <button
                                      key={method}
                                      className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors",
                                        order.paymentMethod === method
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-border hover:border-primary/50"
                                      )}
                                      onClick={() => handleChangePaymentMethod(order.id, method)}
                                    >
                                      {method === 'cash' && <Banknote className="w-3 h-3" />}
                                      {method === 'card' && <CreditCard className="w-3 h-3" />}
                                      {method === 'usage_card' && <Barcode className="w-3 h-3" />}
                                      {getPaymentLabel(method)}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 font-medium mt-0.5">
                                  {getPaymentIcon(order.paymentMethod)}
                                  {getPaymentLabel(order.paymentMethod)}
                                  {onUpdateOrder && (
                                    <button
                                      className="ml-1 p-0.5 rounded hover:bg-muted transition-colors"
                                      onClick={() => setEditingPaymentOrderId(order.id)}
                                    >
                                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {order.tip != null && order.tip > 0 && (
                              <div className="p-2 rounded-lg bg-card">
                                <span className="text-muted-foreground">Bacșiș</span>
                                <p className="font-medium mt-0.5">{order.tip.toFixed(2)} RON</p>
                              </div>
                            )}
                            {order.cui && (
                              <div className="p-2 rounded-lg bg-card">
                                <span className="text-muted-foreground">CUI</span>
                                <p className="font-medium mt-0.5">{order.cui}</p>
                              </div>
                            )}
                            {order.waiterName && (
                              <div className="p-2 rounded-lg bg-card">
                                <span className="text-muted-foreground">Ospătar</span>
                                <p className="font-medium mt-0.5">{order.waiterName}</p>
                              </div>
                            )}
                            {order.source !== 'restaurant' && (
                              <div className="p-2 rounded-lg bg-card">
                                <span className="text-muted-foreground">Sursă</span>
                                <p className="font-medium mt-0.5 capitalize">{order.source}</p>
                              </div>
                            )}
                            {order.paidAt && (
                              <div className="p-2 rounded-lg bg-card">
                                <span className="text-muted-foreground">Plătit la</span>
                                <p className="font-medium mt-0.5">
                                  {new Date(order.paidAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Total Summary */}
                          <div className="p-3 rounded-lg bg-secondary">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal</span>
                              <span>{order.totalAmount.toFixed(2)} RON</span>
                            </div>
                            {order.tip != null && order.tip > 0 && (
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Bacșiș</span>
                                <span>+{order.tip.toFixed(2)} RON</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold mt-1 pt-1 border-t border-border">
                              <span>Total</span>
                              <span>{(order.totalAmount + (order.tip || 0)).toFixed(2)} RON</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleGenerateInvoice(order)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Generează Factură
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Invoice Generation Dialog */}
      <Dialog open={!!invoiceOrder} onOpenChange={(v) => !v && setInvoiceOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generează Factură
            </DialogTitle>
          </DialogHeader>

          {invoiceOrder && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary text-sm">
                <div className="flex justify-between">
                  <span>Comanda</span>
                  <span className="font-mono">#{invoiceOrder.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between font-bold mt-1">
                  <span>Total</span>
                  <span>{(invoiceOrder.totalAmount + (invoiceOrder.tip || 0)).toFixed(2)} RON</span>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2 text-sm">CUI Firmă *</p>
                <Input
                  value={invoiceCui}
                  onChange={(e) => setInvoiceCui(e.target.value)}
                  placeholder="RO12345678"
                  className="font-mono"
                />
              </div>

              <div>
                <p className="font-medium mb-2 text-sm">Denumire Firmă</p>
                <Input
                  value={invoiceCompanyName}
                  onChange={(e) => setInvoiceCompanyName(e.target.value)}
                  placeholder="SC Exemplu SRL"
                />
              </div>

              <div>
                <p className="font-medium mb-2 text-sm">Adresă Firmă</p>
                <Input
                  value={invoiceCompanyAddress}
                  onChange={(e) => setInvoiceCompanyAddress(e.target.value)}
                  placeholder="Str. Exemplu nr. 1, București"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setInvoiceOrder(null)}>
                  Anulează
                </Button>
                <Button className="flex-1 gradient-primary" onClick={handlePrintInvoice}>
                  <Printer className="w-4 h-4 mr-2" />
                  Generează & Printează
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderHistoryDialog;
