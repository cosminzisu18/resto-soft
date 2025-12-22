import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { Order, OrderItem } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Clock, ChefHat, Check, Package, Truck, UtensilsCrossed, Timer } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

interface OrderStatusMonitorProps {
  mode: 'restaurant' | 'delivery';
}

const OrderStatusMonitor: React.FC<OrderStatusMonitorProps> = ({ mode }) => {
  const { orders } = useRestaurant();
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(o => 
    o.status === 'active' && 
    (mode === 'restaurant' ? o.source === 'restaurant' : o.source !== 'restaurant')
  );

  const getOrderProgress = (order: Order): { percentage: number; status: string; color: string } => {
    const total = order.items.length;
    if (total === 0) return { percentage: 0, status: 'În așteptare', color: 'bg-muted' };
    
    const pending = order.items.filter(i => i.status === 'pending').length;
    const cooking = order.items.filter(i => i.status === 'cooking').length;
    const ready = order.items.filter(i => i.status === 'ready' || i.status === 'served').length;
    
    if (ready === total) return { percentage: 100, status: 'Gata!', color: 'bg-emerald-500' };
    if (cooking > 0) return { percentage: Math.round(((ready + cooking * 0.5) / total) * 100), status: 'Se prepară...', color: 'bg-amber-500' };
    return { percentage: Math.round((ready / total) * 100), status: 'În așteptare', color: 'bg-blue-500' };
  };

  const getEstimatedTime = (order: Order): number => {
    const maxPrepTime = Math.max(...order.items.map(i => i.menuItem.prepTime));
    const cookingItems = order.items.filter(i => i.status === 'cooking');
    if (cookingItems.length > 0) {
      const oldestStart = Math.min(...cookingItems.map(i => new Date(i.startedAt!).getTime()));
      const elapsed = (currentTime.getTime() - oldestStart) / 60000;
      return Math.max(0, Math.round(maxPrepTime - elapsed));
    }
    return maxPrepTime;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {mode === 'restaurant' ? (
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            ) : (
              <Truck className="w-8 h-8 text-primary" />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {mode === 'restaurant' ? 'Status Comenzi Restaurant' : 'Status Livrări'}
              </h1>
              <p className="text-sm text-white/60">Urmărește-ți comanda în timp real</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector compact />
            <div className="text-right">
              <p className="text-3xl font-bold font-mono">
                {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="p-6">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
            <Package className="w-24 h-24 mb-4" />
            <p className="text-2xl">Nu sunt comenzi active</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeOrders.map(order => {
              const progress = getOrderProgress(order);
              const estimatedMin = getEstimatedTime(order);
              
              return (
                <div 
                  key={order.id}
                  className={cn(
                    "rounded-2xl overflow-hidden transition-all duration-500",
                    progress.percentage === 100 && "animate-pulse ring-4 ring-emerald-500/50"
                  )}
                >
                  {/* Order Header */}
                  <div className={cn("px-5 py-4", progress.percentage === 100 ? "bg-emerald-500" : "bg-white/10")}>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">
                        {order.tableNumber ? `#${order.tableNumber}` : order.customerName?.split(' ')[0]}
                      </span>
                      {progress.percentage < 100 && (
                        <div className="flex items-center gap-2 bg-black/30 rounded-full px-3 py-1">
                          <Timer className="w-4 h-4" />
                          <span className="font-mono">{estimatedMin} min</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/5">
                    <div className="h-2 bg-black/20">
                      <div 
                        className={cn("h-full transition-all duration-1000", progress.color)}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white/5 p-4 space-y-3">
                    {order.items.map(item => (
                      <div 
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          item.status === 'pending' && "bg-white/5",
                          item.status === 'cooking' && "bg-amber-500/20 border border-amber-500/30",
                          item.status === 'ready' && "bg-emerald-500/20 border border-emerald-500/30"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          item.status === 'pending' && "bg-white/10",
                          item.status === 'cooking' && "bg-amber-500 animate-pulse",
                          item.status === 'ready' && "bg-emerald-500"
                        )}>
                          {item.status === 'pending' && <Clock className="w-5 h-5 text-white/50" />}
                          {item.status === 'cooking' && <ChefHat className="w-5 h-5" />}
                          {item.status === 'ready' && <Check className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.quantity}x {item.menuItem.name}</p>
                          <p className="text-sm text-white/50">
                            {item.status === 'pending' && 'În așteptare'}
                            {item.status === 'cooking' && 'Se prepară...'}
                            {item.status === 'ready' && 'Gata!'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Footer */}
                  <div className={cn(
                    "px-5 py-3 text-center font-semibold",
                    progress.percentage === 100 ? "bg-emerald-500" : "bg-white/10"
                  )}>
                    {progress.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusMonitor;
