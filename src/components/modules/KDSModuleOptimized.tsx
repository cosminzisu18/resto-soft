import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { KDSStation, OrderItem, Order, users, MenuItem } from '@/data/mockData';
import { orderItemMatchesKdsStation } from '@/lib/kdsUtils';
import { cn } from '@/lib/utils';
import { Clock, LogOut, Truck, MessageSquare, MapPin, Monitor, ShoppingBag, ChefHat, CheckCircle2, Timer, Utensils, Book, Play, User, Printer, Plus, Minus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

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

interface LabelData {
  orderNumber: string;
  productNumber: number;
  totalProducts: number;
  productName: string;
  quantity: number;
  modifications: { added: string[]; removed: string[] };
  station: string;
  preparedBy: string;
  timestamp: Date;
}

// Mock ingredient quantities for recipe
const ingredientQuantities: Record<string, string> = {
  'Burtă': '200g',
  'Smântână': '50ml',
  'Usturoi': '3 căței',
  'Oțet': '2 linguri',
  'Ardei iute': '1 buc',
  'Pui': '250g',
  'Tăiței': '100g',
  'Morcov': '50g',
  'Țelină': '30g',
  'Pătrunjel': '10g',
  'Cartofi': '200g',
  'Fasole verde': '100g',
  'Roșii': '100g',
  'Leuștean': '5g',
  'Sos roșii': '80ml',
  'Mozzarella': '150g',
  'Busuioc': '5g',
  'Ulei de măsline': '20ml',
  'Gorgonzola': '50g',
  'Parmezan': '30g',
  'Brie': '50g',
  'Salam picant': '80g',
  'Prosciutto': '60g',
  'Rucola': '20g',
  'Carne de vită': '150g',
  'Carne de porc': '150g',
  'Condimente': 'după gust',
  'Muștar': '30g',
  'Cotlet porc': '300g',
  'Rozmarin': '5g',
  'Ceafă porc': '300g',
  'Ceapă': '50g',
  'Mujdei': '30ml',
  'Carne tocată': '200g',
  'Orez': '50g',
  'Varză': '100g',
  'Mămăligă': '150g',
  'Boia': '5g',
  'Salată': '50g',
  'Sos usturoi': '30ml',
  'Castraveți': '30g',
  'Sos': '40ml',
  'Cartofi prăjiți': '150g',
  'Carne doner': '200g',
  'Carne pui': '200g',
  'Sare': 'după gust',
  'Vită': '200g',
};

const KDSModuleOptimized: React.FC<KDSModuleOptimizedProps> = ({ station, onLogout }) => {
  const { getOrdersForStation, updateOrderItemStatus, orders } = useRestaurant();
  const { language, setLanguage, languages } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [employeeSelectItem, setEmployeeSelectItem] = useState<{ orderId: string; itemId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [recipeViewItem, setRecipeViewItem] = useState<MenuItem | null>(null);
  const [labelPreview, setLabelPreview] = useState<LabelData | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const stationOrders = getOrdersForStation(station);
  const kitchenEmployees = users.filter(u => u.role === 'kitchen');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      canComplete: percent >= 50
    };
  };

  const getTotalOrderTime = (items: OrderItem[]): { display: string; status: 'normal' | 'warning' | 'urgent' } => {
    const maxPrepTime = Math.max(...items.map(i => i.menuItem.prepTime));
    
    const cookingItems = items.filter(i => i.status === 'cooking');
    if (cookingItems.length === 0 && items.some(i => i.status === 'pending')) {
      return { display: `~${maxPrepTime} min`, status: 'normal' };
    }

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

  const getOrderTypeInfo = (order: Order): { label: string; icon: React.ReactNode; color: string } => {
    if (order.source === 'glovo') return { label: 'Glovo', icon: <Truck className="w-4 h-4" />, color: 'bg-yellow-500 text-black' };
    if (order.source === 'wolt') return { label: 'Wolt', icon: <Truck className="w-4 h-4" />, color: 'bg-blue-500 text-white' };
    if (order.source === 'bolt') return { label: 'Bolt', icon: <Truck className="w-4 h-4" />, color: 'bg-green-500 text-white' };
    if (order.source === 'own_website') return { label: 'Website', icon: <Monitor className="w-4 h-4" />, color: 'bg-purple-500 text-white' };
    if (order.source === 'phone') return { label: 'Telefon', icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-orange-500 text-white' };
    if (order.tableNumber) return { label: `Masă ${order.tableNumber}`, icon: <Utensils className="w-4 h-4" />, color: 'bg-primary text-primary-foreground' };
    return { label: 'Ridicare', icon: <MapPin className="w-4 h-4" />, color: 'bg-slate-500 text-white' };
  };

  const handleItemTap = (orderId: string, itemId: string) => {
    const activeItem = activeItems.find(ai => ai.orderId === orderId && ai.itemId === itemId);
    
    if (!activeItem) {
      setEmployeeSelectItem({ orderId, itemId });
    } else {
      const item = stationOrders
        .flatMap(so => so.items)
        .find(i => i.id === itemId);
      
      if (item) {
        const { canComplete } = getRemainingTime(item, activeItem);
        if (canComplete) {
          handleCompleteItem(orderId, itemId, activeItem.employeeName);
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

  const handleStartAllItems = (orderId: string, items: OrderItem[]) => {
    const pendingItems = items.filter(i => i.status === 'pending');
    if (pendingItems.length > 0) {
      setEmployeeSelectItem({ orderId, itemId: pendingItems[0].id });
    }
  };

  const handleStartCooking = (employeeName: string) => {
    if (!employeeSelectItem) return;
    
    const { orderId, itemId } = employeeSelectItem;
    
    setActiveItems(prev => [...prev, {
      orderId,
      itemId,
      employeeName,
      startedAt: new Date()
    }]);

    updateOrderItemStatus(orderId, itemId, 'cooking');
    setEmployeeSelectItem(null);
    console.log('🍳 Started cooking - Glovo status would change to "preparing"');
  };

  // Complete item and show label preview
  const handleCompleteItem = (orderId: string, itemId: string, employeeName: string) => {
    const order = orders.find(o => o.id === orderId);
    const item = order?.items.find(i => i.id === itemId);
    
    if (order && item) {
      const stationItems = order.items.filter((i) => orderItemMatchesKdsStation(i, station));
      const productIndex = stationItems.findIndex(i => i.id === itemId) + 1;

      // Create label data
      const labelData: LabelData = {
        orderNumber: order.tableNumber?.toString() || order.id.slice(-4),
        productNumber: productIndex,
        totalProducts: stationItems.length,
        productName: item.menuItem.name,
        quantity: item.quantity,
        modifications: item.modifications,
        station: station.name,
        preparedBy: employeeName,
        timestamp: new Date()
      };

      // Show label preview
      setLabelPreview(labelData);
    }

    setActiveItems(prev => prev.filter(ai => !(ai.orderId === orderId && ai.itemId === itemId)));
    updateOrderItemStatus(orderId, itemId, 'ready');

    if (order) {
      const stationItems = order.items.filter((i) => orderItemMatchesKdsStation(i, station));
      const allReady = stationItems.every(i => i.id === itemId || i.status === 'ready');
      
      if (allReady) {
        setCompletedOrders(prev => [...prev, order]);
        console.log('✅ Order complete - Glovo status would change to "ready"');
      }
    }
  };

  // Print label
  const handlePrintLabel = () => {
    if (labelRef.current) {
      const printContent = labelRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Etichetă Produs</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 10mm; margin: 0; }
                .label { width: 60mm; border: 2px solid #000; padding: 5mm; }
                .header { text-align: center; font-size: 16pt; font-weight: bold; border-bottom: 2px dashed #000; padding-bottom: 3mm; margin-bottom: 3mm; }
                .order-num { font-size: 24pt; font-weight: bold; text-align: center; margin: 3mm 0; }
                .product-name { font-size: 14pt; font-weight: bold; text-align: center; margin: 3mm 0; }
                .quantity { font-size: 18pt; font-weight: bold; text-align: center; margin: 3mm 0; }
                .info-row { display: flex; justify-content: space-between; font-size: 10pt; margin: 2mm 0; }
                .modifications { font-size: 10pt; margin: 3mm 0; padding: 2mm; background: #f0f0f0; }
                .mod-add { color: green; }
                .mod-remove { color: red; text-decoration: line-through; }
                .footer { text-align: center; font-size: 8pt; border-top: 2px dashed #000; padding-top: 3mm; margin-top: 3mm; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
    
    toast({
      title: "Etichetă trimisă la imprimantă",
      description: `Produs: ${labelPreview?.productName}`,
    });
    
    setLabelPreview(null);
  };

  const handleShowRecipe = (item: OrderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipeViewItem(item.menuItem);
  };

  // Print label for a specific item (before completing)
  const handlePrintLabelForItem = (order: Order, item: OrderItem, stationItems: OrderItem[], e: React.MouseEvent) => {
    e.stopPropagation();
    
    const productIndex = stationItems.findIndex(i => i.id === item.id) + 1;
    const activeItem = getActiveItemInfo(order.id, item.id);

    const labelData: LabelData = {
      orderNumber: order.tableNumber?.toString() || order.id.slice(-4),
      productNumber: productIndex,
      totalProducts: stationItems.length,
      productName: item.menuItem.name,
      quantity: item.quantity,
      modifications: item.modifications,
      station: station.name,
      preparedBy: activeItem?.employeeName || 'N/A',
      timestamp: new Date()
    };

    setLabelPreview(labelData);
  };

  const getOrderNotes = (order: Order): string | null => {
    const itemNotes = order.items
      .filter(i => i.modifications.notes)
      .map(i => `${i.menuItem.name}: ${i.modifications.notes}`)
      .join(' | ');
    
    return itemNotes || null;
  };

  const getActiveItemInfo = (orderId: string, itemId: string): ActiveItem | undefined => {
    return activeItems.find(ai => ai.orderId === orderId && ai.itemId === itemId);
  };

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
              <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Active ({stationOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Finalizate ({completedOrders.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="w-16 h-8 text-lg bg-slate-700 border-slate-600 text-white">
              <SelectValue>
                {languages.find(l => l.code === language)?.flag}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
                const hasPendingItems = items.some(i => i.status === 'pending');
                
                return (
                  <Card key={`${order.id}-${station.id}`} className="bg-white text-slate-900 border-0 shadow-lg overflow-hidden">
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
                        <Badge className={cn("h-7 text-xs font-bold px-2", orderTypeInfo.color)}>
                          {orderTypeInfo.icon}
                          <span className="ml-1">{orderTypeInfo.label}</span>
                        </Badge>
                      </div>
                      
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
                      {notes && (
                        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800 font-medium">{notes}</p>
                          </div>
                        </div>
                      )}

                      <ScrollArea className="max-h-[300px]">
                        <div className="divide-y divide-slate-100">
                          {items.map(item => {
                            const activeItem = getActiveItemInfo(order.id, item.id);
                            const timeInfo = getRemainingTime(item, activeItem);
                            const isCompleted = isItemCompleted(item);
                            const isActive = !!activeItem;
                            const hasModifications = item.modifications.added.length > 0 || item.modifications.removed.length > 0;
                            
                            return (
                              <div key={item.id} className="flex flex-col">
                                <div
                                  onClick={() => !isCompleted && handleItemTap(order.id, item.id)}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 cursor-pointer transition-all",
                                    isCompleted && "bg-slate-100",
                                    isActive && !isCompleted && "bg-green-50 border-l-4 border-green-500",
                                    !isActive && !isCompleted && "hover:bg-slate-50"
                                  )}
                                >
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
                                    
                                    {!isCompleted && (
                                      <div className="flex items-center gap-0.5">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-primary"
                                                onClick={(e) => handleShowRecipe(item, e)}
                                              >
                                                <Book className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Vezi rețetar</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-orange-500"
                                                onClick={(e) => handlePrintLabelForItem(order, item, items, e)}
                                              >
                                                <Printer className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Printează etichetă</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    )}
                                  </div>

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
                                
                                {/* Show actual modifications inline */}
                                {hasModifications && !isCompleted && (
                                  <div className="px-3 pb-2 flex flex-wrap gap-1">
                                    {item.modifications.added.map((mod, idx) => (
                                      <span key={`add-${idx}`} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                        <Plus className="w-3 h-3" />{mod}
                                      </span>
                                    ))}
                                    {item.modifications.removed.map((mod, idx) => (
                                      <span key={`rem-${idx}`} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full line-through">
                                        <Minus className="w-3 h-3" />{mod}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>

                      {hasPendingItems && (
                        <div className="p-2 border-t border-slate-200">
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
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
          )
        ) : (
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
                const stationItems = order.items.filter((i) => orderItemMatchesKdsStation(i, station));
                
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
                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90"
              >
                {employee.name.split(' ')[0]}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe View Dialog */}
      <Dialog open={!!recipeViewItem} onOpenChange={() => setRecipeViewItem(null)}>
        <DialogContent className="sm:max-w-lg bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              Rețetar: {recipeViewItem?.name}
            </DialogTitle>
          </DialogHeader>
          
          {recipeViewItem && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                <Timer className="w-5 h-5 text-primary" />
                <span className="font-medium">Timp preparare: {recipeViewItem.prepTime} minute</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-500 mb-2">DESCRIERE</h4>
                <p className="text-slate-700">{recipeViewItem.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-500 mb-2">INGREDIENTE CU CANTITĂȚI</h4>
                <div className="grid grid-cols-1 gap-2">
                  {recipeViewItem.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{ingredient}</span>
                      </div>
                      <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                        {ingredientQuantities[ingredient] || 'după rețetă'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-500 mb-2">PAȘI PREPARARE</h4>
                <ol className="space-y-2">
                  <li className="flex gap-3 p-2 bg-blue-50 rounded-lg">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <span className="text-sm">Pregătește toate ingredientele conform cantităților specificate</span>
                  </li>
                  <li className="flex gap-3 p-2 bg-blue-50 rounded-lg">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <span className="text-sm">Gătește conform procedurii standard pentru {recipeViewItem.name}</span>
                  </li>
                  <li className="flex gap-3 p-2 bg-blue-50 rounded-lg">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <span className="text-sm">Verifică prezentarea și servește la temperatura corectă</span>
                  </li>
                </ol>
              </div>

              <Button className="w-full" onClick={() => setRecipeViewItem(null)}>
                Închide
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Label Print Preview Dialog */}
      <Dialog open={!!labelPreview} onOpenChange={() => setLabelPreview(null)}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Etichetă Produs
            </DialogTitle>
          </DialogHeader>
          
          {labelPreview && (
            <div className="space-y-4 pt-4">
              {/* Label Preview */}
              <div ref={labelRef} className="border-2 border-dashed border-slate-300 p-4 rounded-lg bg-white font-mono">
                <div className="label">
                  <div className="header text-center text-lg font-bold border-b-2 border-dashed border-slate-400 pb-2 mb-2">
                    {labelPreview.station}
                  </div>
                  
                  <div className="order-num text-center text-3xl font-black my-2">
                    #{labelPreview.orderNumber}
                  </div>
                  
                  <div className="text-center text-sm text-slate-500 mb-2">
                    Produs {labelPreview.productNumber} din {labelPreview.totalProducts}
                  </div>
                  
                  <div className="product-name text-center text-xl font-bold my-2 p-2 bg-slate-100 rounded">
                    {labelPreview.quantity}x {labelPreview.productName}
                  </div>
                  
                  {(labelPreview.modifications.added.length > 0 || labelPreview.modifications.removed.length > 0) && (
                    <div className="modifications text-sm my-2 p-2 bg-slate-50 rounded">
                      {labelPreview.modifications.added.map((m, i) => (
                        <div key={`a-${i}`} className="mod-add text-green-600 font-medium">+ {m}</div>
                      ))}
                      {labelPreview.modifications.removed.map((m, i) => (
                        <div key={`r-${i}`} className="mod-remove text-red-600 line-through">- {m}</div>
                      ))}
                    </div>
                  )}
                  
                  <div className="info-row flex justify-between text-xs mt-3 pt-2 border-t border-slate-200">
                    <span>Preparat de:</span>
                    <span className="font-bold">{labelPreview.preparedBy}</span>
                  </div>
                  
                  <div className="footer text-center text-xs border-t-2 border-dashed border-slate-400 pt-2 mt-2">
                    {labelPreview.timestamp.toLocaleString('ro-RO')}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setLabelPreview(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Anulează
                </Button>
                <Button className="flex-1 bg-primary" onClick={handlePrintLabel}>
                  <Printer className="w-4 h-4 mr-2" />
                  Printează
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KDSModuleOptimized;
