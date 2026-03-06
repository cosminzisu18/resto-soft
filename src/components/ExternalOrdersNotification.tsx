import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Order } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { 
  Truck, Monitor, Bell, Clock, ShoppingCart, 
  ChevronRight, Utensils, Globe, Phone
} from 'lucide-react';

interface ExternalOrdersNotificationProps {
  orders: Order[];
  onNavigateToDelivery?: () => void;
  onNavigateToKiosk?: () => void;
  onViewOrder?: (order: Order) => void;
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
}) => {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const { playDelivery, playNewOrder, initAudioContext } = useNotificationSound();
  const prevCountRef = useRef(0);

  // External orders that haven't been acknowledged
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

  // Play sound when new orders arrive
  useEffect(() => {
    if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
      if (deliveryNew.length > 0) playDelivery();
      else if (kioskNew.length > 0) playNewOrder();
    }
    prevCountRef.current = newCount;
  }, [newCount, deliveryNew.length, kioskNew.length, playDelivery, playNewOrder]);

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
    onViewOrder?.(order);
  };

  const formatTime = (date: Date) => 
    new Date(date).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className={cn(
          "relative flex items-center gap-2 transition-all",
          newCount > 0 && "border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 animate-pulse"
        )}
      >
        <Truck className={cn("w-4 h-4", newCount > 0 ? "text-orange-500" : "text-muted-foreground")} />
        <span className="hidden md:inline">Comenzi Externe</span>
        {newCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold">
            {newCount}
          </Badge>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
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
                  Marchează toate citite
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Category Summary */}
          <div className="grid grid-cols-2 gap-2">
            {deliveryNew.length > 0 && (
              <Card 
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-orange-500/20 bg-orange-500/5"
                onClick={() => { onNavigateToDelivery?.(); setShowDialog(false); }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Delivery</span>
                </div>
                <p className="text-2xl font-bold text-orange-500">{deliveryNew.length}</p>
                <p className="text-xs text-muted-foreground">comenzi noi</p>
              </Card>
            )}
            {kioskNew.length > 0 && (
              <Card 
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-cyan-500/20 bg-cyan-500/5"
                onClick={() => { onNavigateToKiosk?.(); setShowDialog(false); }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">Kiosk</span>
                </div>
                <p className="text-2xl font-bold text-cyan-500">{kioskNew.length}</p>
                <p className="text-xs text-muted-foreground">comenzi noi</p>
              </Card>
            )}
            {newCount === 0 && (
              <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                ✓ Toate comenzile externe au fost vizualizate
              </div>
            )}
          </div>

          {/* Orders List */}
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {externalOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nu sunt comenzi externe active</p>
                </div>
              ) : (
                externalOrders.map(order => {
                  const source = sourceConfig[order.source];
                  const isNew = !acknowledgedIds.has(order.id);
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
                        {/* Source Badge */}
                        <div className="flex flex-col items-center gap-1">
                          <Badge className={cn("text-xs text-white", source?.color)}>
                            {source?.icon}
                            <span className="ml-1">{source?.label}</span>
                          </Badge>
                          {isNew && (
                            <span className="text-[10px] font-bold text-orange-500 uppercase">NOU</span>
                          )}
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-sm font-bold text-primary">
                              #{order.id.slice(0, 6)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                            </span>
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

                        {/* Total */}
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExternalOrdersNotification;
