import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { KDSStation, OrderItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Clock, Check, ChefHat, AlertCircle, LogOut } from 'lucide-react';

interface KDSDisplayProps {
  station: KDSStation;
  onLogout: () => void;
}

const KDSDisplay: React.FC<KDSDisplayProps> = ({ station, onLogout }) => {
  const { getOrdersForStation, updateOrderItemStatus } = useRestaurant();
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

  const handleMarkCooking = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'cooking');
  };

  const handleMarkReady = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'ready');
  };

  return (
    <div className="h-screen flex flex-col kds-theme bg-kds-background text-kds-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-kds-card border-b border-kds-border">
        <div className="flex items-center gap-4">
          <span className="text-3xl">{station.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{station.name}</h1>
            <p className="text-kds-foreground/60">KDS - Kitchen Display</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold font-mono">
              {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-kds-foreground/60">
              {stationOrders.length} comenzi active
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex-1 overflow-auto p-4">
        {stationOrders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ChefHat className="w-16 h-16 mx-auto text-kds-foreground/30 mb-4" />
              <p className="text-xl text-kds-foreground/60">Nu sunt comenzi active</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stationOrders.map(({ order, items }) => (
              <div
                key={`${order.id}-${station.id}`}
                className={cn(
                  "rounded-xl border-2 overflow-hidden",
                  "bg-kds-card",
                  items.some(i => getTimeStatus(i) === 'urgent') 
                    ? "border-kds-waiting order-urgent" 
                    : items.some(i => getTimeStatus(i) === 'warning')
                      ? "border-kds-cooking"
                      : "border-kds-border"
                )}
              >
                {/* Order Header */}
                <div className={cn(
                  "px-4 py-3 flex items-center justify-between",
                  items.some(i => getTimeStatus(i) === 'urgent') 
                    ? "bg-kds-waiting"
                    : items.some(i => getTimeStatus(i) === 'warning')
                      ? "bg-kds-cooking"
                      : "bg-kds-border/50"
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold">#{order.tableNumber}</span>
                    <span className="text-sm opacity-80">{order.waiterName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60">
                      {new Date(order.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="p-3 space-y-2">
                  {items.map(item => {
                    const timeStatus = getTimeStatus(item);
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          item.status === 'pending' && "bg-kds-background border-kds-border",
                          item.status === 'cooking' && "bg-kds-cooking/10 border-kds-cooking"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-xl font-bold">{item.quantity}x</span>
                            <span className="text-lg font-semibold ml-2">{item.menuItem.name}</span>
                          </div>
                          {item.status === 'cooking' && (
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-mono",
                              timeStatus === 'urgent' && "bg-kds-waiting text-white",
                              timeStatus === 'warning' && "bg-kds-cooking",
                              timeStatus === 'normal' && "bg-kds-border"
                            )}>
                              <Clock className="w-4 h-4" />
                              {getElapsedTime(item.startedAt)}
                            </div>
                          )}
                        </div>

                        {/* Modifications */}
                        {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                          <div className="mb-2 text-sm">
                            {item.modifications.added.map(a => (
                              <span key={a} className="inline-block px-2 py-0.5 bg-kds-ready/20 text-kds-ready rounded mr-1 mb-1">
                                +{a}
                              </span>
                            ))}
                            {item.modifications.removed.map(r => (
                              <span key={r} className="inline-block px-2 py-0.5 bg-kds-waiting/20 text-kds-waiting rounded mr-1 mb-1">
                                -{r}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.modifications.notes && (
                          <p className="text-sm text-kds-cooking italic mb-2">
                            ⚠️ {item.modifications.notes}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {item.status === 'pending' && (
                            <Button
                              className="flex-1 bg-kds-cooking text-black hover:bg-kds-cooking/80"
                              onClick={() => handleMarkCooking(order.id, item.id)}
                            >
                              <ChefHat className="w-4 h-4 mr-2" />
                              Începe
                            </Button>
                          )}
                          {item.status === 'cooking' && (
                            <Button
                              className="flex-1 bg-kds-ready text-white hover:bg-kds-ready/80"
                              onClick={() => handleMarkReady(order.id, item.id)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              GATA
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sync timing indicator */}
                {order.syncTiming && (
                  <div className="px-4 py-2 border-t border-kds-border text-xs text-kds-foreground/60 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Sincronizat - toate preparatele ieșire simultană
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KDSDisplay;
