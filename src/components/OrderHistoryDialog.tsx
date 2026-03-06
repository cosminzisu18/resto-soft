import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Order } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  FileText, Printer, ChevronDown, ChevronUp, Calendar, 
  User, CreditCard, Banknote, Barcode, Receipt, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  tableNumber?: number;
}

const OrderHistoryDialog: React.FC<OrderHistoryDialogProps> = ({ open, onClose, orders, tableNumber }) => {
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceCui, setInvoiceCui] = useState('');
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('');
  const [invoiceCompanyAddress, setInvoiceCompanyAddress] = useState('');

  const relevantOrders = orders
    .filter(o => tableNumber ? o.tableNumber === tableNumber : true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  return (
    <>
      <Dialog open={open && !invoiceOrder} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Istoric Comenzi {tableNumber ? `- Masa ${tableNumber}` : ''}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[70vh]">
            {relevantOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nu există comenzi în istoric</p>
            ) : (
              <div className="space-y-2 pr-4">
                {relevantOrders.map(order => {
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
                          {order.customerName && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3" />
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
                              <div className="flex items-center gap-1 font-medium mt-0.5">
                                {getPaymentIcon(order.paymentMethod)}
                                {getPaymentLabel(order.paymentMethod)}
                              </div>
                            </div>
                            {order.tip && order.tip > 0 && (
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
                            {order.tip && order.tip > 0 && (
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Bacșiș</span>
                                <span>+{order.tip.toFixed(2)} RON</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold mt-1 pt-1 border-t border-border">
                              <span>Total</span>
                              <span>{((order.totalAmount) + (order.tip || 0)).toFixed(2)} RON</span>
                            </div>
                          </div>

                          {/* Actions */}
                          {order.status === 'completed' && (
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
                          )}
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
                  <span>{((invoiceOrder.totalAmount) + (invoiceOrder.tip || 0)).toFixed(2)} RON</span>
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
