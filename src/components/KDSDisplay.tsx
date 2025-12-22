import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { KDSStation, OrderItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Clock, Check, ChefHat, LogOut, Truck, AlertTriangle } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

interface KDSDisplayProps {
  station: KDSStation;
  onLogout: () => void;
}

const KDSDisplay: React.FC<KDSDisplayProps> = ({ station, onLogout }) => {
  const { getOrdersForStation, updateOrderItemStatus } = useRestaurant();
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  const stationOrders = getOrdersForStation(station.id);

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
  const getStartTime = (item: OrderItem, orderCreatedAt: Date): { time: Date; shouldStart: boolean; minutesUntil: number } => {
    const prepTime = item.menuItem.prepTime;
    const maxPrepInOrder = 15; // Assume max prep time for sync
    const delayMinutes = maxPrepInOrder - prepTime;
    const startTime = new Date(new Date(orderCreatedAt).getTime() + delayMinutes * 60000);
    const minutesUntil = (startTime.getTime() - currentTime.getTime()) / 60000;
    return { time: startTime, shouldStart: minutesUntil <= 1, minutesUntil };
  };

  const handleMarkCooking = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'cooking');
  };

  const handleMarkReady = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'ready');
  };

  return (
    <div className="h-screen flex flex-col bg-kds-background text-kds-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 bg-kds-card border-b border-kds-border">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-2xl md:text-3xl">{station.icon}</span>
          <div>
            <h1 className="text-lg md:text-2xl font-bold">{station.name}</h1>
            <p className="text-xs md:text-sm text-kds-foreground/60">KDS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSelector compact />
          <div className="text-right">
            <p className="text-xl md:text-3xl font-bold font-mono">
              {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs md:text-sm text-kds-foreground/60">{stationOrders.length} comenzi</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-kds-foreground">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto p-2 md:p-4">
        {stationOrders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ChefHat className="w-12 md:w-16 h-12 md:h-16 mx-auto text-kds-foreground/30 mb-4" />
              <p className="text-lg md:text-xl text-kds-foreground/60">{t('kds.noOrders')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
            {stationOrders.map(({ order, items }) => (
              <div
                key={`${order.id}-${station.id}`}
                className={cn(
                  "rounded-xl border-2 overflow-hidden bg-kds-card",
                  items.some(i => getTimeStatus(i) === 'urgent') 
                    ? "border-kds-waiting animate-pulse" 
                    : items.some(i => getTimeStatus(i) === 'warning')
                      ? "border-kds-cooking"
                      : "border-kds-border"
                )}
              >
                {/* Order Header */}
                <div className={cn(
                  "px-3 md:px-4 py-2 md:py-3 flex items-center justify-between",
                  items.some(i => getTimeStatus(i) === 'urgent') 
                    ? "bg-kds-waiting text-white animate-pulse"
                    : items.some(i => getTimeStatus(i) === 'warning')
                      ? "bg-kds-cooking text-black"
                      : "bg-kds-border/50"
                )}>
                  <div className="flex items-center gap-2 md:gap-3">
                    {order.source !== 'restaurant' && <Truck className="w-4 h-4 md:w-5 md:h-5" />}
                    <span className="text-xl md:text-3xl font-bold">
                      {order.tableNumber ? `#${order.tableNumber}` : order.customerName?.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-xs opacity-80">
                    {order.source !== 'restaurant' ? order.source : order.waiterName?.split(' ')[0]}
                  </span>
                </div>

                {/* Items */}
                <div className="p-2 md:p-3 space-y-2">
                  {items.map(item => {
                    const timeStatus = getTimeStatus(item);
                    const startInfo = getStartTime(item, order.createdAt);
                    const shouldAlert = item.status === 'pending' && startInfo.shouldStart;
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-2 md:p-3 rounded-lg border transition-all",
                          item.status === 'pending' && !shouldAlert && "bg-kds-background border-kds-border",
                          item.status === 'pending' && shouldAlert && "bg-orange-500/20 border-orange-500 animate-pulse",
                          item.status === 'cooking' && "bg-kds-cooking/10 border-kds-cooking"
                        )}
                      >
                        {/* Alert for start time */}
                        {shouldAlert && item.status === 'pending' && (
                          <div className="flex items-center gap-2 mb-2 p-2 rounded bg-orange-500 text-white text-sm font-bold animate-bounce">
                            <AlertTriangle className="w-4 h-4" />
                            {t('kds.attention')}
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-lg md:text-xl font-bold">{item.quantity}x</span>
                            <span className="text-base md:text-lg font-semibold ml-2">{item.menuItem.name}</span>
                          </div>
                          {item.status === 'cooking' && (
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs md:text-sm font-mono",
                              timeStatus === 'urgent' && "bg-kds-waiting text-white animate-pulse",
                              timeStatus === 'warning' && "bg-kds-cooking text-black",
                              timeStatus === 'normal' && "bg-kds-border"
                            )}>
                              <Clock className="w-3 h-3 md:w-4 md:h-4" />
                              {getElapsedTime(item.startedAt)}
                            </div>
                          )}
                        </div>

                        {/* Start time indicator */}
                        {item.status === 'pending' && !shouldAlert && startInfo.minutesUntil > 0 && (
                          <div className="text-xs text-muted-foreground mb-2">
                            {t('kds.startAt')} {startInfo.time.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                            <span className="ml-1">({Math.ceil(startInfo.minutesUntil)} min)</span>
                          </div>
                        )}

                        {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                          <div className="mb-2 text-xs md:text-sm flex flex-wrap gap-1">
                            {item.modifications.added.map(a => (
                              <span key={a} className="px-2 py-0.5 bg-kds-ready/20 text-kds-ready rounded">+{a}</span>
                            ))}
                            {item.modifications.removed.map(r => (
                              <span key={r} className="px-2 py-0.5 bg-kds-waiting/20 text-kds-waiting rounded">-{r}</span>
                            ))}
                          </div>
                        )}

                        {item.modifications.notes && (
                          <p className="text-xs md:text-sm text-kds-cooking mb-2">⚠️ {item.modifications.notes}</p>
                        )}

                        <div className="flex gap-2">
                          {item.status === 'pending' && (
                            <Button
                              className={cn(
                                "flex-1 text-xs md:text-sm h-8 md:h-10",
                                shouldAlert 
                                  ? "bg-orange-500 text-white hover:bg-orange-600 animate-pulse" 
                                  : "bg-kds-cooking text-black hover:bg-kds-cooking/80"
                              )}
                              onClick={() => handleMarkCooking(order.id, item.id)}
                            >
                              <ChefHat className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              {t('kds.start')}
                            </Button>
                          )}
                          {item.status === 'cooking' && (
                            <Button
                              className="flex-1 bg-kds-ready text-white hover:bg-kds-ready/80 text-xs md:text-sm h-8 md:h-10"
                              onClick={() => handleMarkReady(order.id, item.id)}
                            >
                              <Check className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              {t('kds.ready')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KDSDisplay;
