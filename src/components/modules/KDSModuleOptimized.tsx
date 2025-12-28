import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { KDSStation, OrderItem, Order, users } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Clock, LogOut, Truck, MessageSquare, MapPin, Monitor, ShoppingBag, ChefHat, CheckCircle2, AlertCircle, Timer, Utensils, X } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface KDSModuleOptimizedProps {
  station: KDSStation;
  onLogout: () => void;
}

interface ActiveItem {
  orderId: string;
  itemId: string;
  employeeName: string;
  startedAt: Date;
}

const KDSModuleOptimized: React.FC<KDSModuleOptimizedProps> = ({ station, onLogout }) => {
  const { getOrdersForStation, updateOrderItemStatus, orders } = useRestaurant();
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [employeeSelectItem, setEmployeeSelectItem] = useState<{ orderId: string; itemId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const stationOrders = getOrdersForStation(station.id);
  const kitchenEmployees = users.filter(u => u.role === 'kitchen');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get remaining time for item (countdown)
  const getRemainingTime = (item: OrderItem, activeItem?: ActiveItem): { display: string; percent: number; canComplete: boolean } => {
    const prepTimeMs = item.menuItem.prepTime * 60 * 1000;
    
    if (!activeItem) {
      return { 
        display: `${item.menuItem.prepTime} min`, 
        percent: 0,
        canComplete: false
      };
    }

    const elapsed = currentTime.getTime() - new Date(activeItem.startedAt).getTime();
    const remaining = Math.max(0, prepTimeMs - elapsed);
    const percent = Math.min(100, (elapsed / prepTimeMs) * 100);
    
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);
    
    return {
      display: remaining > 0 ? `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}` : '0:00',
      percent,
      canComplete: percent >= 50 // Can only complete after 50% of time passed
    };
  };

  // Calculate total order time
  const getTotalOrderTime = (items: OrderItem[]): { display: string; status: 'normal' | 'warning' | 'urgent' } => {
    const maxPrepTime = Math.max(...items.map(i => i.menuItem.prepTime));
    
    // Check if any items are being cooked
    const cookingItems = items.filter(i => i.status === 'cooking');
    if (cookingItems.length === 0 && items.some(i => i.status === 'pending')) {
      return { display: `~${maxPrepTime} min`, status: 'normal' };
    }

    // Find the earliest started item
    const startedItems = activeItems.filter(ai => items.some(i => i.id === ai.itemId));
    if (startedItems.length > 0) {
      const earliestStart = Math.min(...startedItems.map(ai => new Date(ai.startedAt).getTime()));
      const elapsed = Math.floor((currentTime.getTime() - earliestStart) / 60000);
      const remaining = Math.max(0, maxPrepTime - elapsed);
      
      if (elapsed > maxPrepTime * 1.5) return { display: `${remaining} min`, status: 'urgent' };
      if (elapsed > maxPrepTime) return { display: `${remaining} min`, status: 'warning' };
      return { display: `${remaining} min`, status: 'normal' };
    }

    return { display: `~${maxPrepTime} min`, status: 'normal' };
  };

  // Get order type label and icon
  const getOrderTypeInfo = (order: Order): { label: string; icon: React.ReactNode; color: string } => {
    if (order.source === 'glovo') return { label: 'Glovo', icon: <Truck className="w-4 h-4" />, color: 'bg-yellow-500 text-black' };
    if (order.source === 'wolt') return { label: 'Wolt', icon: <Truck className="w-4 h-4" />, color: 'bg-blue-500 text-white' };
    if (order.source === 'bolt') return { label: 'Bolt', icon: <Truck className="w-4 h-4" />, color: 'bg-green-500 text-white' };
    if (order.source === 'own_website') return { label: 'Website', icon: <Monitor className="w-4 h-4" />, color: 'bg-purple-500 text-white' };
    if (order.source === 'phone') return { label: 'Telefon', icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-orange-500 text-white' };
    if (order.tableNumber) return { label: `Masă ${order.tableNumber}`, icon: <Utensils className="w-4 h-4" />, color: 'bg-primary text-primary-foreground' };
    return { label: 'Ridicare', icon: <MapPin className="w-4 h-4" />, color: 'bg-slate-500 text-white' };
  };

  // Handle first tap - open employee selection
  const handleItemTap = (orderId: string, itemId: string) => {
    const activeItem = activeItems.find(ai => ai.orderId === orderId && ai.itemId === itemId);
    
    if (!activeItem) {
      // First tap - open employee selection
      setEmployeeSelectItem({ orderId, itemId });
    } else {
      // Second tap - try to complete if 50% time passed
      const item = stationOrders
        .flatMap(so => so.items)
        .find(i => i.id === itemId);
      
      if (item) {
        const { canComplete } = getRemainingTime(item, activeItem);
        if (canComplete) {
          handleCompleteItem(orderId, itemId);
        }
      }
    }
  };

  // Start cooking with employee selection
  const handleStartCooking = (employeeName: string) => {
    if (!employeeSelectItem) return;
    
    const { orderId, itemId } = employeeSelectItem;
    
    // Add to active items
    setActiveItems(prev => [...prev, {
      orderId,
      itemId,
      employeeName,
      startedAt: new Date()
    }]);

    // Update status
    updateOrderItemStatus(orderId, itemId, 'cooking');
    
    // Close dialog
    setEmployeeSelectItem(null);

    // TODO: Update Glovo/Bolt status to "preparing"
    console.log('🍳 Started cooking - Glovo status would change to "preparing"');
  };

  // Complete item
  const handleCompleteItem = (orderId: string, itemId: string) => {
    // Remove from active items
    setActiveItems(prev => prev.filter(ai => !(ai.orderId === orderId && ai.itemId === itemId)));
    
    // Update status to ready
    updateOrderItemStatus(orderId, itemId, 'ready');

    // TODO: Print label for completed item
    console.log('🏷️ Printing label for completed item');

    // Check if all items in order are ready
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const stationItems = order.items.filter(i => i.menuItem.kdsStation === station.id);
      const allReady = stationItems.every(i => i.id === itemId || i.status === 'ready');
      
      if (allReady) {
        // Move to completed orders
        setCompletedOrders(prev => [...prev, order]);
        console.log('✅ Order complete - Glovo status would change to "ready"');
      }
    }
  };

  // Check if item has customer notes
  const getOrderNotes = (order: Order): string | null => {
    const itemNotes = order.items
      .filter(i => i.modifications.notes)
      .map(i => `${i.menuItem.name}: ${i.modifications.notes}`)
      .join(' | ');
    
    return itemNotes || null;
  };

  // Get active item info
  const getActiveItemInfo = (orderId: string, itemId: string): ActiveItem | undefined => {
    return activeItems.find(ai => ai.orderId === orderId && ai.itemId === itemId);
  };

  // Check if item is completed (crossed out)
  const isItemCompleted = (item: OrderItem): boolean => {
    return item.status === 'ready' || item.status === 'served';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{station.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{station.name}</h1>
            <p className="text-sm text-slate-400">KDS Optimizat</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')} className="h-auto">
            <TabsList className="bg-slate-700">
              <TabsTrigger value="active" className="data-[state=active]:bg-primary">
                Active ({stationOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-600">
                Finalizate ({completedOrders.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <LanguageSelector compact />
          
          <div className="text-right">
            <p className="text-2xl font-bold font-mono">
              {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-white hover:bg-slate-700">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'active' ? (
          // Active Orders Grid
          stationOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ChefHat className="w-20 h-20 mx-auto text-slate-600 mb-4" />
                <p className="text-xl text-slate-400">Nu sunt comenzi active</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {stationOrders.map(({ order, items }) => {
                const orderTypeInfo = getOrderTypeInfo(order);
                const totalTime = getTotalOrderTime(items);
                const notes = getOrderNotes(order);
                
                return (
                  <Card key={`${order.id}-${station.id}`} className="bg-white text-slate-900 border-0 shadow-lg overflow-hidden">
                    {/* Order Header */}
                    <CardHeader className="p-3 pb-2 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-primary">
                            #{order.tableNumber || order.id.slice(-4)}
                          </span>
                          {order.customerName && (
                            <span className="text-sm text-slate-500">{order.customerName.split(' ')[0]}</span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className={cn("h-7 text-xs font-bold", orderTypeInfo.color)}
                        >
                          {orderTypeInfo.icon}
                          <span className="ml-1">{orderTypeInfo.label}</span>
                        </Button>
                      </div>
                      
                      {/* Total Time */}
                      <div className={cn(
                        "flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-sm font-bold",
                        totalTime.status === 'urgent' && "bg-red-100 text-red-700",
                        totalTime.status === 'warning' && "bg-yellow-100 text-yellow-700",
                        totalTime.status === 'normal' && "bg-slate-100 text-slate-700"
                      )}>
                        <Timer className="w-4 h-4" />
                        <span>Timp total: {totalTime.display}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      {/* Notes Section (only if exists) */}
                      {notes && (
                        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800 font-medium">{notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Items List - Compact */}
                      <ScrollArea className="max-h-[300px]">
                        <div className="divide-y divide-slate-100">
                          {items.map(item => {
                            const activeItem = getActiveItemInfo(order.id, item.id);
                            const timeInfo = getRemainingTime(item, activeItem);
                            const isCompleted = isItemCompleted(item);
                            const isActive = !!activeItem;
                            
                            return (
                              <div
                                key={item.id}
                                onClick={() => !isCompleted && handleItemTap(order.id, item.id)}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 cursor-pointer transition-all",
                                  isCompleted && "bg-slate-100",
                                  isActive && !isCompleted && "bg-green-50 border-l-4 border-green-500",
                                  !isActive && !isCompleted && "hover:bg-slate-50"
                                )}
                              >
                                {/* Quantity + Name */}
                                <div className={cn(
                                  "flex items-center gap-2 flex-1 min-w-0",
                                  isCompleted && "line-through text-slate-400"
                                )}>
                                  <span className={cn(
                                    "font-black text-lg",
                                    isActive && !isCompleted ? "text-green-600" : "text-primary",
                                    isCompleted && "text-slate-400"
                                  )}>
                                    {item.quantity}x
                                  </span>
                                  <span className={cn(
                                    "font-medium truncate",
                                    isCompleted && "text-slate-400"
                                  )}>
                                    {item.menuItem.name}
                                  </span>
                                  
                                  {/* Modifications badges */}
                                  {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                                    <div className="flex gap-1">
                                      {item.modifications.added.length > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 border-green-300">
                                          +{item.modifications.added.length}
                                        </Badge>
                                      )}
                                      {item.modifications.removed.length > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-100 text-red-700 border-red-300">
                                          -{item.modifications.removed.length}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Time */}
                                <div className={cn(
                                  "flex items-center gap-1 text-sm font-mono font-bold flex-shrink-0 ml-2",
                                  isCompleted && "line-through text-slate-400",
                                  isActive && !isCompleted && (timeInfo.percent >= 100 ? "text-red-600" : timeInfo.percent >= 75 ? "text-yellow-600" : "text-green-600")
                                )}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : isActive ? (
                                    <>
                                      <div className="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                          className={cn(
                                            "h-full transition-all",
                                            timeInfo.percent >= 100 ? "bg-red-500" : timeInfo.percent >= 75 ? "bg-yellow-500" : "bg-green-500"
                                          )}
                                          style={{ width: `${Math.min(100, timeInfo.percent)}%` }}
                                        />
                                      </div>
                                      <span>{timeInfo.display}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span className="text-slate-500">{timeInfo.display}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>

                      {/* Start All Button */}
                      {items.some(i => i.status === 'pending') && (
                        <div className="p-2 border-t border-slate-200">
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                            size="sm"
                          >
                            Start
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          // Completed Orders
          completedOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="w-20 h-20 mx-auto text-slate-600 mb-4" />
                <p className="text-xl text-slate-400">Nu sunt comenzi finalizate</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedOrders.map(order => {
                const orderTypeInfo = getOrderTypeInfo(order);
                const stationItems = order.items.filter(i => i.menuItem.kdsStation === station.id);
                
                return (
                  <Card key={order.id} className="bg-green-50 border-green-200 text-slate-900">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-green-700">
                          #{order.tableNumber || order.id.slice(-4)}
                        </span>
                        <Badge className={cn("text-xs", orderTypeInfo.color)}>
                          {orderTypeInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      {stationItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="line-through">{item.quantity}x {item.menuItem.name}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Employee Selection Dialog */}
      <Dialog open={!!employeeSelectItem} onOpenChange={() => setEmployeeSelectItem(null)}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Selectează angajatul</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {kitchenEmployees.map(employee => (
              <Button
                key={employee.id}
                onClick={() => handleStartCooking(employee.name)}
                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90"
              >
                {employee.name.split(' ')[0]}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KDSModuleOptimized;
