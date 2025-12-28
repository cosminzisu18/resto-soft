import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { KDSStation, OrderItem, Order, users } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Clock, LogOut, Truck, MessageSquare, ChefHat, CheckCircle2, Timer, 
  Grid3X3, List, AlignJustify, Filter, AlertTriangle, Play, User, 
  Printer, Book, Plus, Minus, X, Monitor, Smartphone, ShoppingBag,
  MapPin, Utensils, Image
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

interface KDSEnhancedModuleProps {
  station: KDSStation;
  onLogout: () => void;
}

type ViewMode = 'grid' | 'list' | 'timeline';
type FilterMode = 'all' | 'urgent' | 'normal' | 'delayed';

interface ActiveItem {
  orderId: string;
  itemId: string;
  employeeName: string;
  startedAt: Date;
}

// Platform icons and colors
const platformConfig = {
  restaurant: { icon: Utensils, color: 'bg-primary', label: 'POS' },
  glovo: { icon: () => <span className="text-lg">🟡</span>, color: 'bg-yellow-500', label: 'Glovo' },
  wolt: { icon: () => <span className="text-lg">🔵</span>, color: 'bg-blue-500', label: 'Wolt' },
  bolt: { icon: () => <span className="text-lg">🟢</span>, color: 'bg-green-500', label: 'Bolt' },
  own_website: { icon: Monitor, color: 'bg-purple-500', label: 'Website' },
  phone: { icon: ShoppingBag, color: 'bg-orange-500', label: 'Telefon' },
  kiosk: { icon: Smartphone, color: 'bg-cyan-500', label: 'Kiosk' },
};

const KDSEnhancedModule: React.FC<KDSEnhancedModuleProps> = ({ station, onLogout }) => {
  const { getOrdersForStation, updateOrderItemStatus, orders } = useRestaurant();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [employeeSelectItem, setEmployeeSelectItem] = useState<{ orderId: string; itemId: string } | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  const stationOrders = getOrdersForStation(station.id);
  const kitchenEmployees = users.filter(u => u.role === 'kitchen');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate order status
  const getOrderStatus = (items: OrderItem[]): 'urgent' | 'normal' | 'delayed' => {
    const hasActiveItems = items.some(i => {
      const activeItem = activeItems.find(ai => ai.itemId === i.id);
      if (!activeItem) return false;
      const elapsed = (currentTime.getTime() - new Date(activeItem.startedAt).getTime()) / 60000;
      return elapsed > i.menuItem.prepTime * 1.5;
    });
    
    if (hasActiveItems) return 'urgent';
    
    const hasCooking = items.some(i => i.status === 'cooking');
    const allPending = items.every(i => i.status === 'pending');
    
    if (allPending) return 'normal';
    if (hasCooking) {
      const someDelayed = items.some(i => {
        const activeItem = activeItems.find(ai => ai.itemId === i.id);
        if (!activeItem) return false;
        const elapsed = (currentTime.getTime() - new Date(activeItem.startedAt).getTime()) / 60000;
        return elapsed > i.menuItem.prepTime;
      });
      return someDelayed ? 'delayed' : 'normal';
    }
    return 'normal';
  };

  // Calculate order progress
  const getOrderProgress = (items: OrderItem[]): number => {
    const completed = items.filter(i => i.status === 'ready' || i.status === 'served').length;
    return Math.round((completed / items.length) * 100);
  };

  // Get remaining time
  const getRemainingTime = (item: OrderItem, activeItem?: ActiveItem): { display: string; percent: number; canComplete: boolean } => {
    const prepTimeMs = item.menuItem.prepTime * 60 * 1000;
    
    if (!activeItem) {
      return { display: `${item.menuItem.prepTime} min`, percent: 0, canComplete: false };
    }

    const elapsed = currentTime.getTime() - new Date(activeItem.startedAt).getTime();
    const remaining = Math.max(0, prepTimeMs - elapsed);
    const percent = Math.min(100, (elapsed / prepTimeMs) * 100);
    
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);
    
    return {
      display: remaining > 0 ? `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}` : '0:00',
      percent,
      canComplete: percent >= 50
    };
  };

  const getActiveItemInfo = (orderId: string, itemId: string): ActiveItem | undefined => {
    return activeItems.find(ai => ai.orderId === orderId && ai.itemId === itemId);
  };

  // Filter orders
  const filteredOrders = stationOrders.filter(({ items }) => {
    if (filterMode === 'all') return true;
    const status = getOrderStatus(items);
    return status === filterMode;
  });

  // Handlers
  const handleItemTap = (orderId: string, itemId: string) => {
    const activeItem = activeItems.find(ai => ai.orderId === orderId && ai.itemId === itemId);
    
    if (!activeItem) {
      setEmployeeSelectItem({ orderId, itemId });
    } else {
      const item = stationOrders.flatMap(so => so.items).find(i => i.id === itemId);
      if (item) {
        const { canComplete } = getRemainingTime(item, activeItem);
        if (canComplete) {
          handleCompleteItem(orderId, itemId);
        } else {
          toast({
            title: "Nu se poate finaliza încă",
            description: "Trebuie să treacă minim 50% din timpul de preparare",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handleStartCooking = (employeeName: string) => {
    if (!employeeSelectItem) return;
    const { orderId, itemId } = employeeSelectItem;
    
    setActiveItems(prev => [...prev, {
      orderId, itemId, employeeName, startedAt: new Date()
    }]);
    updateOrderItemStatus(orderId, itemId, 'cooking');
    setEmployeeSelectItem(null);
  };

  const handleCompleteItem = (orderId: string, itemId: string) => {
    setActiveItems(prev => prev.filter(ai => !(ai.orderId === orderId && ai.itemId === itemId)));
    updateOrderItemStatus(orderId, itemId, 'ready');
    toast({ title: "Produs finalizat", description: "Eticheta a fost trimisă la imprimantă" });
  };

  const handleStartAllItems = (orderId: string, items: OrderItem[]) => {
    const pendingItems = items.filter(i => i.status === 'pending');
    if (pendingItems.length > 0) {
      setEmployeeSelectItem({ orderId, itemId: pendingItems[0].id });
    }
  };

  // Get source icon component
  const getSourceIcon = (source: Order['source']) => {
    const config = platformConfig[source] || platformConfig.restaurant;
    const IconComponent = config.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const isItemCompleted = (item: OrderItem): boolean => {
    return item.status === 'ready' || item.status === 'served';
  };

  // Render Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {filteredOrders.map(({ order, items }) => {
        const status = getOrderStatus(items);
        const progress = getOrderProgress(items);
        const config = platformConfig[order.source] || platformConfig.restaurant;
        
        return (
          <Card 
            key={`${order.id}-${station.id}`} 
            className={cn(
              "bg-white text-slate-900 border-0 shadow-lg overflow-hidden transition-all duration-300 animate-fade-in",
              status === 'urgent' && "ring-2 ring-red-500 animate-pulse",
              status === 'delayed' && "ring-2 ring-yellow-500"
            )}
          >
            <CardHeader className="p-3 pb-2 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-primary">
                    #{order.tableNumber || order.id.slice(-4)}
                  </span>
                  {status === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />}
                </div>
                <Badge className={cn("h-7 text-xs font-bold px-2 flex items-center gap-1", config.color, "text-white")}>
                  {getSourceIcon(order.source)}
                  <span>{config.label}</span>
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progres</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="max-h-[250px]">
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
                          "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-200",
                          isCompleted && "bg-slate-100 opacity-60",
                          isActive && !isCompleted && "bg-green-50 border-l-4 border-green-500",
                          !isActive && !isCompleted && "hover:bg-slate-50"
                        )}
                      >
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                          {item.menuItem.image ? (
                            <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-medium text-sm truncate", isCompleted && "line-through text-slate-400")}>
                            <span className={cn("font-black", isActive ? "text-green-600" : "text-primary")}>{item.quantity}x</span>{' '}
                            {item.menuItem.name}
                          </div>
                          
                          {/* Timer */}
                          {isActive && !isCompleted && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-1000",
                                    timeInfo.percent >= 100 ? "bg-red-500" : timeInfo.percent >= 75 ? "bg-yellow-500" : "bg-green-500"
                                  )}
                                  style={{ width: `${Math.min(100, timeInfo.percent)}%` }}
                                />
                              </div>
                              <span className={cn(
                                "text-xs font-mono font-bold",
                                timeInfo.percent >= 100 ? "text-red-600" : timeInfo.percent >= 75 ? "text-yellow-600" : "text-green-600"
                              )}>
                                {timeInfo.display}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {items.some(i => i.status === 'pending') && (
                <div className="p-2 border-t border-slate-200">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold transition-transform hover:scale-[1.02]"
                    size="sm"
                    onClick={() => handleStartAllItems(order.id, items)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-2">
      {filteredOrders.map(({ order, items }) => {
        const status = getOrderStatus(items);
        const progress = getOrderProgress(items);
        const config = platformConfig[order.source] || platformConfig.restaurant;
        
        return (
          <div 
            key={`${order.id}-${station.id}`}
            className={cn(
              "bg-white rounded-xl p-4 shadow-md transition-all duration-300 animate-fade-in",
              status === 'urgent' && "ring-2 ring-red-500",
              status === 'delayed' && "ring-2 ring-yellow-500"
            )}
          >
            <div className="flex items-center gap-4">
              {/* Order Info */}
              <div className="flex items-center gap-3 w-32">
                <span className="text-2xl font-black text-primary">#{order.tableNumber || order.id.slice(-4)}</span>
                {status === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-500" />}
              </div>
              
              {/* Source Badge */}
              <Badge className={cn("h-7 px-3", config.color, "text-white")}>
                {getSourceIcon(order.source)}
                <span className="ml-1">{config.label}</span>
              </Badge>
              
              {/* Items Summary */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {items.map(item => {
                  const isCompleted = isItemCompleted(item);
                  const isActive = !!getActiveItemInfo(order.id, item.id);
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => !isCompleted && handleItemTap(order.id, item.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all",
                        isCompleted && "bg-green-100 text-green-700",
                        isActive && !isCompleted && "bg-yellow-100 text-yellow-700",
                        !isActive && !isCompleted && "bg-slate-100 hover:bg-slate-200"
                      )}
                    >
                      <span className="font-bold">{item.quantity}x</span>
                      <span className="text-sm truncate max-w-[100px]">{item.menuItem.name}</span>
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>
              
              {/* Progress */}
              <div className="w-32 flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-bold text-slate-600">{progress}%</span>
              </div>
              
              {items.some(i => i.status === 'pending') && (
                <Button size="sm" className="bg-green-600" onClick={() => handleStartAllItems(order.id, items)}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render Timeline View
  const renderTimelineView = () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Pending Column */}
      <div className="flex-shrink-0 w-80">
        <div className="bg-slate-200 rounded-t-xl px-4 py-2 font-bold text-slate-700 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          În așteptare
        </div>
        <div className="bg-slate-100 rounded-b-xl p-3 space-y-3 min-h-[400px]">
          {filteredOrders.filter(({ items }) => items.every(i => i.status === 'pending')).map(({ order, items }) => (
            <Card key={order.id} className="bg-white shadow-sm animate-fade-in">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-primary">#{order.tableNumber || order.id.slice(-4)}</span>
                  <Badge className={cn("text-xs", platformConfig[order.source]?.color || 'bg-primary', "text-white")}>
                    {platformConfig[order.source]?.label || 'POS'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  {items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                </div>
                <Button size="sm" className="w-full mt-2 bg-green-600" onClick={() => handleStartAllItems(order.id, items)}>
                  <Play className="w-4 h-4 mr-1" /> Start
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cooking Column */}
      <div className="flex-shrink-0 w-80">
        <div className="bg-yellow-500 rounded-t-xl px-4 py-2 font-bold text-white flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          În preparare
        </div>
        <div className="bg-yellow-50 rounded-b-xl p-3 space-y-3 min-h-[400px]">
          {filteredOrders.filter(({ items }) => items.some(i => i.status === 'cooking')).map(({ order, items }) => (
            <Card key={order.id} className="bg-white shadow-sm border-l-4 border-yellow-500 animate-fade-in">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-primary">#{order.tableNumber || order.id.slice(-4)}</span>
                  <Progress value={getOrderProgress(items)} className="w-16 h-2" />
                </div>
                {items.filter(i => i.status === 'cooking').map(item => {
                  const activeItem = getActiveItemInfo(order.id, item.id);
                  const timeInfo = getRemainingTime(item, activeItem);
                  return (
                    <div key={item.id} className="flex items-center justify-between py-1 border-b last:border-0">
                      <span className="text-sm">{item.quantity}x {item.menuItem.name}</span>
                      <span className={cn(
                        "text-xs font-mono font-bold",
                        timeInfo.percent >= 100 ? "text-red-600" : "text-yellow-600"
                      )}>
                        {timeInfo.display}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ready Column */}
      <div className="flex-shrink-0 w-80">
        <div className="bg-green-500 rounded-t-xl px-4 py-2 font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Gata
        </div>
        <div className="bg-green-50 rounded-b-xl p-3 space-y-3 min-h-[400px]">
          {filteredOrders.filter(({ items }) => items.every(i => i.status === 'ready' || i.status === 'served')).map(({ order, items }) => (
            <Card key={order.id} className="bg-white shadow-sm border-l-4 border-green-500 animate-fade-in">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-green-600">#{order.tableNumber || order.id.slice(-4)}</span>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-sm text-slate-600 line-through mt-1">
                  {items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{station.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{station.name}</h1>
            <p className="text-sm text-slate-400">KDS Enhanced</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3", viewMode === 'grid' && "bg-primary text-white")}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3", viewMode === 'list' && "bg-primary text-white")}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3", viewMode === 'timeline' && "bg-primary text-white")}
              onClick={() => setViewMode('timeline')}
            >
              <AlignJustify className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter */}
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-36 bg-slate-700 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="urgent">🔴 Urgente</SelectItem>
              <SelectItem value="delayed">🟡 Întârziate</SelectItem>
              <SelectItem value="normal">🟢 Normale</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-right">
            <p className="text-2xl font-bold font-mono">
              {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-slate-400">{filteredOrders.length} comenzi</p>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-white hover:bg-slate-700">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ChefHat className="w-20 h-20 mx-auto text-slate-600 mb-4" />
              <p className="text-xl text-slate-400">Nu sunt comenzi active</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'timeline' && renderTimelineView()}
          </>
        )}
      </div>

      {/* Employee Selection Dialog */}
      <Dialog open={!!employeeSelectItem} onOpenChange={() => setEmployeeSelectItem(null)}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5" />
              Selectează angajatul
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {kitchenEmployees.map(employee => (
              <Button
                key={employee.id}
                onClick={() => handleStartCooking(employee.name)}
                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
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

export default KDSEnhancedModule;
