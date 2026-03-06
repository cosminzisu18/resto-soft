import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Order, OrderItem, menuItems } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, Monitor, Bell, Clock, ShoppingCart, 
  ChevronRight, Globe, Phone, ArrowLeft, Eye,
  CheckCircle, XCircle, Bike, MapPin, User,
  ChefHat, Check, Printer, MessageSquare, AlertTriangle,
  Plus, Zap
} from 'lucide-react';

interface ExternalOrdersNotificationProps {
  orders: Order[];
  onNavigateToDelivery?: () => void;
  onNavigateToKiosk?: () => void;
  onViewOrder?: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
}

const EXTERNAL_SOURCES = ['glovo', 'wolt', 'bolt', 'own_website', 'kiosk'] as const;
const DELIVERY_SOURCES = ['glovo', 'wolt', 'bolt', 'own_website'] as const;

const sourceConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  glovo: { icon: <span className="text-sm">🟡</span>, label: 'Glovo', color: 'bg-yellow-500' },
  wolt: { icon: <span className="text-sm">🔵</span>, label: 'Wolt', color: 'bg-blue-500' },
  bolt: { icon: <span className="text-sm">🟢</span>, label: 'Bolt', color: 'bg-green-500' },
  own_website: { icon: <Globe className="w-4 h-4" />, label: 'Website', color: 'bg-purple-500' },
  kiosk: { icon: <Monitor className="w-4 h-4" />, label: 'Kiosk', color: 'bg-cyan-500' },
  phone: { icon: <Phone className="w-4 h-4" />, label: 'Telefon', color: 'bg-orange-500' },
};

const ExternalOrdersNotification: React.FC<ExternalOrdersNotificationProps> = ({
  orders,
  onNavigateToDelivery,
  onNavigateToKiosk,
  onViewOrder,
  onUpdateOrder,
}) => {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { playDelivery, playNewOrder, initAudioContext } = useNotificationSound();
  const { toast } = useToast();
  const { createDeliveryOrder, addItemToOrder } = useRestaurant();
  const prevCountRef = useRef(0);

  const SIMULATION_NAMES = ['Ion Popescu', 'Ana Mihai', 'George Stan', 'Andreea Radu', 'Vlad Neagu', 'Cristina Dinu'];
  const SIMULATION_ADDRESSES = [
    'Str. Victoriei 45, București', 'Bd. Unirii 120, Et. 3', 'Calea Moșilor 88, Sector 2',
    'Str. Lipscani 15, București', 'Bd. Decebal 30, Ap. 12', 'Str. Traian 67, Sector 3'
  ];

  const handleSimulateOrder = useCallback(() => {
    const sources = ['glovo', 'wolt', 'bolt', 'kiosk'] as const;
    const source = sources[Math.floor(Math.random() * sources.length)];
    const name = SIMULATION_NAMES[Math.floor(Math.random() * SIMULATION_NAMES.length)];
    const address = SIMULATION_ADDRESSES[Math.floor(Math.random() * SIMULATION_ADDRESSES.length)];
    const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const platformId = source !== 'kiosk' ? `${source.toUpperCase().slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}` : undefined;

    const newOrder = createDeliveryOrder(source, {
      name,
      phone,
      address: source !== 'kiosk' ? address : undefined,
      platformOrderId: platformId,
    });

    // Add 2-4 random items
    const itemCount = 2 + Math.floor(Math.random() * 3);
    const availableItems = menuItems;
    for (let i = 0; i < itemCount && i < availableItems.length; i++) {
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      addItemToOrder(newOrder.id, randomItem, qty);
    }

    toast({
      title: `🔔 Comandă nouă simulată`,
      description: `${sourceConfig[source]?.label} - ${name}`,
    });
  }, [createDeliveryOrder, addItemToOrder, toast]);

  const externalOrders = useMemo(() =>
    orders.filter(o => 
      EXTERNAL_SOURCES.includes(o.source as any) && 
      o.status === 'active'
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const newOrders = useMemo(() =>
    externalOrders.filter(o => !acknowledgedIds.has(o.id)),
    [externalOrders, acknowledgedIds]
  );

  const newCount = newOrders.length;
  const deliveryNew = newOrders.filter(o => DELIVERY_SOURCES.includes(o.source as any));
  const kioskNew = newOrders.filter(o => o.source === 'kiosk');

  useEffect(() => {
    if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
      if (deliveryNew.length > 0) playDelivery();
      else if (kioskNew.length > 0) playNewOrder();
    }
    prevCountRef.current = newCount;
  }, [newCount, deliveryNew.length, kioskNew.length, playDelivery, playNewOrder]);

  // Keep selectedOrder in sync with orders prop
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, selectedOrder?.id]);

  const handleAcknowledgeOrder = useCallback((orderId: string) => {
    setAcknowledgedIds(prev => new Set([...prev, orderId]));
  }, []);

  const handleAcknowledgeAll = useCallback(() => {
    setAcknowledgedIds(prev => {
      const next = new Set(prev);
      newOrders.forEach(o => next.add(o.id));
      return next;
    });
  }, [newOrders]);

  const handleOpenDialog = () => {
    initAudioContext();
    setShowDialog(true);
  };

  const handleOrderClick = (order: Order) => {
    handleAcknowledgeOrder(order.id);
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handlePickedUpByRider = (order: Order) => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...order, status: 'completed' });
      toast({ title: 'Comandă preluată', description: `Comanda #${order.id.slice(0, 6)} a fost preluată de rider` });
      setSelectedOrder(null);
    }
  };

  const handleCancelOrder = (order: Order) => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...order, status: 'cancelled' });
      toast({ title: 'Comandă anulată', description: `Comanda #${order.id.slice(0, 6)} a fost anulată`, variant: 'destructive' });
      setSelectedOrder(null);
    }
  };

  const handlePrintOrder = (order: Order) => {
    toast({ title: 'Se printează...', description: `Bon comanda #${order.id.slice(0, 6)}` });
  };

  const handleConfirmOrder = (order: Order) => {
    handleAcknowledgeOrder(order.id);
    toast({ title: 'Comandă confirmată', description: `Comanda #${order.id.slice(0, 6)} a fost confirmată` });
  };

  const formatTime = (date: Date) => 
    new Date(date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-muted-foreground" />;
      case 'cooking': return <ChefHat className="w-3 h-3 text-warning" />;
      case 'ready': return <Check className="w-3 h-3 text-green-500" />;
      case 'served': return <Check className="w-3 h-3 text-primary" />;
    }
  };

  const getStatusLabel = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return 'Așteptare';
      case 'cooking': return 'Se prepară';
      case 'ready': return 'Gata';
      case 'served': return 'Servit';
    }
  };

  // Time since order was created
  const getTimeSince = (date: Date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Acum';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Order detail view
  const renderOrderDetail = (order: Order) => {
    const source = sourceConfig[order.source];
    const isDelivery = DELIVERY_SOURCES.includes(order.source as any);
    const isNew = !acknowledgedIds.has(order.id);
    const allReady = order.items.every(i => i.status === 'ready' || i.status === 'served');
    const timeSince = getTimeSince(order.createdAt);

    return (
      <div className="space-y-4">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Înapoi la listă
        </Button>

        {/* Order Header */}
        <div className="p-4 rounded-xl bg-muted">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-primary">#{order.id.slice(0, 6)}</span>
              <Badge className={cn("text-xs text-white", source?.color)}>
                {source?.icon}
                <span className="ml-1">{source?.label}</span>
              </Badge>
              {isNew && <Badge variant="destructive" className="text-xs">NOU</Badge>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(order.createdAt)} {formatTime(order.createdAt)}
              </p>
              <p className="text-xs font-medium text-orange-500">{timeSince} în așteptare</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {order.customerName && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{order.customerName}</span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{order.deliveryAddress}</span>
              </div>
            )}
            {order.tableNumber && (
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Masa {order.tableNumber}</span>
              </div>
            )}
            {(order as any).platformOrderId && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">ID Platformă:</span>
                <span className="font-mono text-xs">{(order as any).platformOrderId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className={cn(
          "p-3 rounded-lg flex items-center gap-2 text-sm font-medium",
          allReady ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-orange-500/10 text-orange-700 dark:text-orange-400"
        )}>
          {allReady ? (
            <><CheckCircle className="w-4 h-4" /> Toate produsele sunt gata - Poate fi preluată</>
          ) : (
            <><ChefHat className="w-4 h-4" /> Se prepară în bucătărie</>
          )}
        </div>

        {/* Items */}
        <div>
          <p className="text-sm font-semibold mb-2">Produse ({order.items.length})</p>
          <div className="space-y-1.5">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-card border text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(item.status)}
                  <span className="font-medium">{item.quantity}×</span>
                  <span className="truncate">{item.menuItem.name}</span>
                  {item.complimentary && <Badge variant="secondary" className="text-[10px] px-1 py-0">Gratis</Badge>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{getStatusLabel(item.status)}</span>
                  <span className={cn("font-medium", item.complimentary && "line-through text-muted-foreground")}>
                    {(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modifications/Notes */}
        {order.items.some(i => i.modifications.added.length > 0 || i.modifications.removed.length > 0 || i.modifications.notes) && (
          <div>
            <p className="text-sm font-semibold mb-2">Modificări & Note</p>
            <div className="space-y-1">
              {order.items.filter(i => i.modifications.added.length > 0 || i.modifications.removed.length > 0 || i.modifications.notes).map(item => (
                <div key={item.id} className="text-xs p-2 rounded bg-muted">
                  <span className="font-medium">{item.menuItem.name}: </span>
                  {item.modifications.added.map(a => <span key={a} className="text-green-600">+{a} </span>)}
                  {item.modifications.removed.map(r => <span key={r} className="text-destructive">-{r} </span>)}
                  {item.modifications.notes && <span className="italic text-muted-foreground">"{item.modifications.notes}"</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">{order.totalAmount.toFixed(2)} RON</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isNew && (
            <Button className="w-full" onClick={() => handleConfirmOrder(order)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmă Comanda
            </Button>
          )}
          
          {isDelivery && (
            <Button 
              variant="outline" 
              className="w-full border-green-500/50 text-green-700 dark:text-green-400 hover:bg-green-500/10"
              onClick={() => handlePickedUpByRider(order)}
            >
              <Bike className="w-4 h-4 mr-2" />
              Preluată de Rider
            </Button>
          )}

          {!isDelivery && order.source === 'kiosk' && (
            <Button 
              variant="outline" 
              className="w-full border-green-500/50 text-green-700 dark:text-green-400 hover:bg-green-500/10"
              onClick={() => handlePickedUpByRider(order)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Comandă Livrată / Ridicată
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handlePrintOrder(order)}>
              <Printer className="w-4 h-4 mr-2" />
              Printează
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => handleCancelOrder(order)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Anulează
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className={cn(
          "relative flex items-center gap-2 transition-all",
          externalOrders.length > 0
            ? "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400"
            : ""
        )}
      >
        <Truck className="w-4 h-4" />
        <span className="hidden md:inline">Comenzi Externe</span>
        {newCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold">
            {newCount}
          </Badge>
        )}
        {externalOrders.length > 0 && newCount === 0 && (
          <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
            {externalOrders.length}
          </Badge>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) setSelectedOrder(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Detalii Comandă
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1">
                <div className="pr-2">
                  {renderOrderDetail(selectedOrder)}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Comenzi Externe
                    {newCount > 0 && (
                      <Badge variant="destructive" className="text-xs">{newCount} noi</Badge>
                    )}
                  </span>
                  {newCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleAcknowledgeAll}>
                      Marchează citite
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Category Summary */}
              {(deliveryNew.length > 0 || kioskNew.length > 0) && (
                <div className="grid grid-cols-2 gap-2">
                  {deliveryNew.length > 0 && (
                    <Card className="p-3 border-orange-500/20 bg-orange-500/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">Delivery</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-500">{deliveryNew.length}</p>
                      <p className="text-xs text-muted-foreground">comenzi noi</p>
                    </Card>
                  )}
                  {kioskNew.length > 0 && (
                    <Card className="p-3 border-cyan-500/20 bg-cyan-500/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Monitor className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-medium">Kiosk</span>
                      </div>
                      <p className="text-2xl font-bold text-cyan-500">{kioskNew.length}</p>
                      <p className="text-xs text-muted-foreground">comenzi noi</p>
                    </Card>
                  )}
                </div>
              )}

              {newCount === 0 && externalOrders.length > 0 && (
                <div className="text-center py-2 text-muted-foreground text-sm">
                  ✓ Toate comenzile au fost vizualizate
                </div>
              )}

              {/* Orders List */}
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="space-y-2 pr-2">
                  {externalOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nu sunt comenzi externe active</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={handleSimulateOrder}
                      >
                        <Zap className="w-4 h-4" />
                        Simulează Comandă
                      </Button>
                    </div>
                  ) : (
                    externalOrders.map(order => {
                      const source = sourceConfig[order.source];
                      const isNew = !acknowledgedIds.has(order.id);
                      const allReady = order.items.every(i => i.status === 'ready' || i.status === 'served');
                      const timeSince = getTimeSince(order.createdAt);
                      return (
                        <Card
                          key={order.id}
                          className={cn(
                            "p-3 cursor-pointer transition-all hover:bg-muted/50",
                            isNew && "border-orange-500/30 bg-orange-500/5 ring-1 ring-orange-500/20"
                          )}
                          onClick={() => handleOrderClick(order)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={cn("text-xs text-white", source?.color)}>
                                {source?.icon}
                                <span className="ml-1">{source?.label}</span>
                              </Badge>
                              {isNew && (
                                <span className="text-[10px] font-bold text-orange-500 uppercase">NOU</span>
                              )}
                              {allReady && !isNew && (
                                <span className="text-[10px] font-bold text-green-500 uppercase">GATA</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-sm font-bold text-primary">
                                  #{order.id.slice(0, 6)}
                                </span>
                                <span className="text-xs text-muted-foreground">{timeSince}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {order.items.length} produse
                                {order.customerName && ` • ${order.customerName}`}
                              </p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] px-1 py-0">
                                    {item.quantity}x {item.menuItem.name.length > 12 ? item.menuItem.name.slice(0, 12) + '…' : item.menuItem.name}
                                  </Badge>
                                ))}
                                {order.items.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">+{order.items.length - 2}</Badge>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-bold text-primary">{order.totalAmount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">RON</p>
                            </div>

                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExternalOrdersNotification;
