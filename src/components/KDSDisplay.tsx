import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { KDSStation, OrderItem, Order } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Clock, Check, ChefHat, LogOut, Truck, AlertTriangle, Eye, X, Users } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface KDSDisplayProps {
  station: KDSStation;
  onLogout: () => void;
}

const KDSDisplay: React.FC<KDSDisplayProps> = ({ station, onLogout }) => {
  const { getOrdersForStation, updateOrderItemStatus, orders } = useRestaurant();
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const stationOrders = getOrdersForStation(station);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedTime = (startedAt?: Date): string => {
    if (!startedAt) return '0:00';
    const elapsed = Math.floor((currentTime.getTime() - new Date(startedAt).getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeStatus = (item: OrderItem): 'normal' | 'warning' | 'urgent' => {
    if (!item.startedAt) return 'normal';
    const elapsed = (currentTime.getTime() - new Date(item.startedAt).getTime()) / 60000;
    if (elapsed > item.menuItem.prepTime * 1.5) return 'urgent';
    if (elapsed > item.menuItem.prepTime) return 'warning';
    return 'normal';
  };

  // Calculate when to start cooking based on sync timing
  const getStartTime = (item: OrderItem, order: Order): { time: Date; shouldStart: boolean; minutesUntil: number } => {
    const prepTime = item.menuItem.prepTime;
    // Get max prep time from all items in the order for sync
    const allPrepTimes = order.items.map(i => i.menuItem.prepTime);
    const maxPrepInOrder = Math.max(...allPrepTimes);
    const delayMinutes = maxPrepInOrder - prepTime;
    const startTime = new Date(new Date(order.createdAt).getTime() + delayMinutes * 60000);
    const minutesUntil = (startTime.getTime() - currentTime.getTime()) / 60000;
    return { time: startTime, shouldStart: minutesUntil <= 1, minutesUntil };
  };

  const handleMarkCooking = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'cooking');
  };

  const handleMarkReady = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'ready');
  };

  // Get full order details for the modal
  const getFullOrder = (orderId: string): Order | undefined => {
    return orders.find(o => o.id === orderId);
  };

  return (
    <div className="h-screen flex flex-col bg-kds-background text-kds-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 bg-kds-card border-b border-kds-border">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-3xl md:text-4xl">{station.icon}</span>
          <div>
            <h1 className="text-xl md:text-3xl font-bold">{station.name}</h1>
            <p className="text-sm md:text-base text-kds-foreground/60">KDS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSelector compact />
          <div className="text-right">
            <p className="text-2xl md:text-4xl font-bold font-mono">
              {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm md:text-base text-kds-foreground/60">{stationOrders.length} comenzi</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-kds-foreground">
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto p-2 md:p-4">
        {stationOrders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ChefHat className="w-16 md:w-24 h-16 md:h-24 mx-auto text-kds-foreground/30 mb-4" />
              <p className="text-xl md:text-2xl text-kds-foreground/60">{t('kds.noOrders')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {stationOrders.map(({ order, items }) => {
              const hasUrgent = items.some(i => getTimeStatus(i) === 'urgent');
              const hasWarning = items.some(i => getTimeStatus(i) === 'warning');
              
              return (
                <div
                  key={`${order.id}-${station.id}`}
                  className={cn(
                    "rounded-xl border-4 overflow-hidden bg-kds-card",
                    hasUrgent 
                      ? "border-kds-waiting animate-pulse" 
                      : hasWarning
                        ? "border-kds-cooking"
                        : "border-kds-border"
                  )}
                >
                  {/* Order Header */}
                  <div className={cn(
                    "px-4 py-3 flex items-center justify-between",
                    hasUrgent 
                      ? "bg-kds-waiting text-white"
                      : hasWarning
                        ? "bg-kds-cooking text-black"
                        : "bg-kds-border/50"
                  )}>
                    <div className="flex items-center gap-3">
                      {order.source !== 'restaurant' && <Truck className="w-6 h-6" />}
                      <span className="text-3xl md:text-4xl font-black">
                        {order.tableNumber ? `#${order.tableNumber}` : order.customerName?.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.syncTiming && (
                        <Badge variant="outline" className="text-xs bg-background/20">SYNC</Badge>
                      )}
                      <span className="text-sm opacity-80">
                        {order.source !== 'restaurant' ? order.source.toUpperCase() : order.waiterName?.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* View Full Order Button */}
                  <div className="px-3 py-2 border-b border-kds-border bg-kds-card">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full text-sm font-semibold bg-primary hover:bg-primary/90"
                      onClick={() => setSelectedOrder(getFullOrder(order.id) || null)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Vezi toată comanda ({order.items.length} produse)
                    </Button>
                  </div>

                  {/* Items for this station */}
                  <div className="p-3 space-y-3">
                    {items.map(item => {
                      const timeStatus = getTimeStatus(item);
                      const startInfo = getStartTime(item, order);
                      const shouldAlert = item.status === 'pending' && startInfo.shouldStart;
                      
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            item.status === 'pending' && !shouldAlert && "bg-kds-background border-kds-border",
                            item.status === 'pending' && shouldAlert && "bg-orange-500/30 border-orange-500 animate-pulse",
                            item.status === 'cooking' && timeStatus === 'urgent' && "bg-kds-waiting/20 border-kds-waiting",
                            item.status === 'cooking' && timeStatus === 'warning' && "bg-kds-cooking/20 border-kds-cooking",
                            item.status === 'cooking' && timeStatus === 'normal' && "bg-kds-cooking/10 border-kds-cooking"
                          )}
                        >
                          {/* Alert for start time */}
                          {shouldAlert && item.status === 'pending' && (
                            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-orange-500 text-white font-bold animate-bounce">
                              <AlertTriangle className="w-6 h-6" />
                              <span className="text-lg">INCEPE ACUM!</span>
                            </div>
                          )}
                          
                          {/* Item name and quantity - BIGGER */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl md:text-4xl font-black text-primary">{item.quantity}x</span>
                                <span className="text-xl md:text-2xl font-bold">{item.menuItem.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Cooking timer - BIGGER */}
                          {item.status === 'cooking' && (
                            <div className={cn(
                              "flex items-center gap-2 p-3 rounded-lg mb-3 text-xl font-mono font-bold",
                              timeStatus === 'urgent' && "bg-kds-waiting text-white animate-pulse",
                              timeStatus === 'warning' && "bg-kds-cooking text-black",
                              timeStatus === 'normal' && "bg-kds-border"
                            )}>
                              <Clock className="w-6 h-6" />
                              <span className="text-2xl">{getElapsedTime(item.startedAt)}</span>
                              <span className="text-sm opacity-70">/ {item.menuItem.prepTime} min</span>
                            </div>
                          )}

                          {/* Start time indicator - BIGGER & MORE VISIBLE */}
                          {item.status === 'pending' && !shouldAlert && order.syncTiming && (
                            <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/50 mb-3">
                              <div className="flex items-center gap-2 text-blue-400">
                                <Clock className="w-5 h-5" />
                                <span className="text-lg font-bold">
                                  Incepe la: {startInfo.time.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-2xl font-black text-blue-300 mt-1">
                                {startInfo.minutesUntil > 0 
                                  ? `In ${Math.ceil(startInfo.minutesUntil)} minute`
                                  : 'ACUM!'
                                }
                              </div>
                            </div>
                          )}

                          {/* Modifications - BIGGER */}
                          {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {item.modifications.added.map(a => (
                                <span key={a} className="px-3 py-2 bg-kds-ready/20 text-kds-ready rounded-lg text-base font-semibold">
                                  +{a}
                                </span>
                              ))}
                              {item.modifications.removed.map(r => (
                                <span key={r} className="px-3 py-2 bg-kds-waiting/20 text-kds-waiting rounded-lg text-base font-semibold">
                                  -{r}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes - BIGGER */}
                          {item.modifications.notes && (
                            <p className="text-lg text-kds-cooking font-semibold mb-3 p-2 bg-kds-cooking/10 rounded-lg">
                              ⚠️ {item.modifications.notes}
                            </p>
                          )}

                          {/* Action buttons - BIGGER */}
                          <div className="flex gap-2">
                            {item.status === 'pending' && (
                              <Button
                                className={cn(
                                  "flex-1 text-lg h-14 font-bold",
                                  shouldAlert 
                                    ? "bg-orange-500 text-white hover:bg-orange-600 animate-pulse" 
                                    : "bg-kds-cooking text-black hover:bg-kds-cooking/80"
                                )}
                                onClick={() => handleMarkCooking(order.id, item.id)}
                              >
                                <ChefHat className="w-6 h-6 mr-2" />
                                {t('kds.start')}
                              </Button>
                            )}
                            {item.status === 'cooking' && (
                              <Button
                                className="flex-1 bg-kds-ready text-white hover:bg-kds-ready/80 text-lg h-14 font-bold"
                                onClick={() => handleMarkReady(order.id, item.id)}
                              >
                                <Check className="w-6 h-6 mr-2" />
                                {t('kds.ready')}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Order Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-kds-card text-kds-foreground border-kds-border">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {selectedOrder?.source !== 'restaurant' && <Truck className="w-6 h-6" />}
              Comanda {selectedOrder?.tableNumber ? `Masa #${selectedOrder.tableNumber}` : selectedOrder?.customerName}
              {selectedOrder?.syncTiming && (
                <Badge className="ml-2 bg-blue-500">SYNC ACTIV</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-kds-background">
                <div>
                  <p className="text-sm text-muted-foreground">Sursa</p>
                  <p className="font-bold text-lg">{selectedOrder.source.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ospatar</p>
                  <p className="font-bold text-lg">{selectedOrder.waiterName}</p>
                </div>
                {selectedOrder.customerPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-bold">{selectedOrder.customerPhone}</p>
                  </div>
                )}
                {selectedOrder.deliveryAddress && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Adresa</p>
                    <p className="font-bold">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}
              </div>

              {/* All items */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Toate produsele ({selectedOrder.items.length})</h3>
                {selectedOrder.items.map(item => (
                  <div 
                    key={item.id}
                    className={cn(
                      "p-4 rounded-lg border-2",
                      item.status === 'pending' && "border-gray-500 bg-gray-500/10",
                      item.status === 'cooking' && "border-kds-cooking bg-kds-cooking/10",
                      item.status === 'ready' && "border-kds-ready bg-kds-ready/10",
                      item.status === 'served' && "border-primary bg-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black">{item.quantity}x</span>
                        <div>
                          <p className="text-lg font-bold">{item.menuItem.name}</p>
                          <p className="text-sm text-muted-foreground">Statie: {item.menuItem.kdsStation}</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-base px-3 py-1",
                        item.status === 'pending' && "bg-gray-500",
                        item.status === 'cooking' && "bg-kds-cooking text-black",
                        item.status === 'ready' && "bg-kds-ready",
                        item.status === 'served' && "bg-primary"
                      )}>
                        {item.status === 'pending' && 'In asteptare'}
                        {item.status === 'cooking' && 'Se prepara'}
                        {item.status === 'ready' && 'GATA'}
                        {item.status === 'served' && 'Servit'}
                      </Badge>
                    </div>
                    {(item.modifications.added.length > 0 || item.modifications.removed.length > 0 || item.modifications.notes) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.modifications.added.map(a => (
                          <span key={a} className="px-2 py-1 bg-kds-ready/20 text-kds-ready rounded text-sm">+{a}</span>
                        ))}
                        {item.modifications.removed.map(r => (
                          <span key={r} className="px-2 py-1 bg-kds-waiting/20 text-kds-waiting rounded text-sm">-{r}</span>
                        ))}
                        {item.modifications.notes && (
                          <span className="px-2 py-1 bg-kds-cooking/20 text-kds-cooking rounded text-sm">📝 {item.modifications.notes}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sync info */}
              {selectedOrder.syncTiming && (
                <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-500">
                  <p className="font-bold text-blue-400 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Sincronizare activa
                  </p>
                  <p className="text-sm text-blue-300 mt-1">
                    Toate produsele trebuie sa fie gata in acelasi timp pentru a fi servite impreuna.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KDSDisplay;
