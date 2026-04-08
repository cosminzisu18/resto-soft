import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { KDSStation, OrderItem, Order, MenuItem, allergens } from '@/data/mockData';
import { ordersApi } from '@/lib/api';
import { orderApiToPosOrder } from '@/lib/posOrderMapper';
import { orderItemMatchesKdsStation, kdsOrderDisplayNumber } from '@/lib/kdsUtils';
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
  allergenIds?: string[];
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
  const { directoryUsers } = useRestaurant();
  const { language, setLanguage, languages } = useLanguage();
  const [apiOrders, setApiOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [employeeSelectItem, setEmployeeSelectItem] = useState<{ orderId: string; itemId: string } | null>(null);
  const [itemStarterBy, setItemStarterBy] = useState<Record<string, string>>({});
  const [recipeViewItem, setRecipeViewItem] = useState<MenuItem | null>(null);
  const [labelPreview, setLabelPreview] = useState<LabelData | null>(null);
  
  const labelRef = useRef<HTMLDivElement>(null);
  const allergenLabelRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const list = await ordersApi.getAll();
      setApiOrders(list.map(orderApiToPosOrder));
    } catch {
      setApiOrders([]);
      toast({
        title: 'Comenzile nu s-au putut încărca',
        description: 'Verifică backend-ul /orders.',
        variant: 'destructive',
      });
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    const interval = setInterval(() => void fetchOrders(), 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const stationOrders = useMemo(
    () =>
      apiOrders
        .filter((o) => o.status === 'active')
        .map((order) => ({
          order,
          items: order.items.filter(
            (item) =>
              orderItemMatchesKdsStation(item, station) &&
              (item.status === 'pending' || item.status === 'cooking'),
          ),
        }))
        .filter((x) => x.items.length > 0),
    [apiOrders, station],
  );
  const completedStationOrders = useMemo(
    () =>
      apiOrders
        .filter((o) => o.status === 'active')
        .map((order) => ({
          order,
          items: order.items.filter(
            (item) =>
              orderItemMatchesKdsStation(item, station) &&
              (item.status === 'ready' || item.status === 'served'),
          ),
        }))
        .filter((x) => x.items.length > 0),
    [apiOrders, station],
  );
  const kitchenEmployees = directoryUsers.filter((u) => u.role === 'kitchen');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate order status
  const getOrderStatus = (items: OrderItem[]): 'urgent' | 'normal' | 'delayed' => {
    const hasActiveItems = items.some((i) => {
      if (i.status !== 'cooking' || !i.startedAt) return false;
      const elapsed = (currentTime.getTime() - new Date(i.startedAt).getTime()) / 60000;
      return elapsed > i.menuItem.prepTime * 1.5;
    });
    
    if (hasActiveItems) return 'urgent';
    
    const hasCooking = items.some(i => i.status === 'cooking');
    const allPending = items.every(i => i.status === 'pending');
    
    if (allPending) return 'normal';
    if (hasCooking) {
      const someDelayed = items.some((i) => {
        if (!i.startedAt) return false;
        const elapsed = (currentTime.getTime() - new Date(i.startedAt).getTime()) / 60000;
        return elapsed > i.menuItem.prepTime;
      });
      return someDelayed ? 'delayed' : 'normal';
    }
    return 'normal';
  };

  // Calculate sync timing - when to start cooking based on longest prep time in order
  const getSyncStartTime = (item: OrderItem, order: Order): { 
    shouldStartNow: boolean; 
    minutesUntilStart: number; 
    syncActive: boolean;
    startTime: Date | null;
  } => {
    // Get all items from the full order across all stations
    const fullOrder = apiOrders.find(o => o.id === order.id);
    if (!fullOrder || !fullOrder.syncTiming) {
      return { shouldStartNow: true, minutesUntilStart: 0, syncActive: false, startTime: null };
    }

    // Find max prep time across ALL items in order (all stations)
    const maxPrepTime = Math.max(...fullOrder.items.map(i => i.menuItem.prepTime));
    const itemPrepTime = item.menuItem.prepTime;
    
    // Calculate delay for this item to finish at the same time as longest item
    const delayMinutes = maxPrepTime - itemPrepTime;
    
    if (delayMinutes <= 0) {
      // This is the longest prep item, start immediately
      return { shouldStartNow: true, minutesUntilStart: 0, syncActive: true, startTime: null };
    }

    // Calculate when this item should start
    const orderCreatedAt = new Date(fullOrder.createdAt);
    const startTime = new Date(orderCreatedAt.getTime() + delayMinutes * 60000);
    const minutesUntilStart = (startTime.getTime() - currentTime.getTime()) / 60000;
    
    // Should start if less than 1 minute until start time
    const shouldStartNow = minutesUntilStart <= 1;

    return { shouldStartNow, minutesUntilStart, syncActive: true, startTime };
  };

  // Calculate order progress
  const getOrderProgress = (items: OrderItem[]): number => {
    const completed = items.filter(i => i.status === 'ready' || i.status === 'served').length;
    return Math.round((completed / items.length) * 100);
  };

  // Get remaining time - 10% rule for completion
  const getRemainingTime = (item: OrderItem): { display: string; percent: number; canComplete: boolean } => {
    const prepTimeMs = item.menuItem.prepTime * 60 * 1000;

    if (!item.startedAt || item.status !== 'cooking') {
      return { display: `${item.menuItem.prepTime} min`, percent: 0, canComplete: false };
    }

    const elapsed = currentTime.getTime() - new Date(item.startedAt).getTime();
    const remaining = Math.max(0, prepTimeMs - elapsed);
    const percent = Math.min(100, (elapsed / prepTimeMs) * 100);
    
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);
    
    return {
      display: remaining > 0 ? `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}` : '0:00',
      percent,
      canComplete: percent >= 10 // 10% rule
    };
  };

  // Filter orders
  const filteredOrders = stationOrders.filter(({ items }) => {
    if (filterMode === 'all') return true;
    const status = getOrderStatus(items);
    return status === filterMode;
  });

  // Handlers
  const handleItemTap = (orderId: string, itemId: string) => {
    const item = stationOrders
      .flatMap((so) => so.items)
      .find((i) => String(i.id) === String(itemId));
    
    if (!item || item.status !== 'cooking') {
      setEmployeeSelectItem({ orderId, itemId });
    } else {
      const { canComplete } = getRemainingTime(item);
      if (canComplete) {
        handleCompleteItem(orderId, itemId);
      } else {
        toast({
          title: "Nu se poate finaliza încă",
          description: "Trebuie să treacă minim 10% din timpul de preparare",
          variant: "destructive"
        });
      }
    }
  };

  const handleStartCooking = async (employeeName: string) => {
    if (!employeeSelectItem) return;
    const { orderId, itemId } = employeeSelectItem;
    const order = apiOrders.find((o) => String(o.id) === String(orderId));
    const item = order?.items.find((i) => String(i.id) === String(itemId));
    if (order && item) {
      const sync = getSyncStartTime(item, order);
      if (sync.syncActive && !sync.shouldStartNow) {
        toast({
          title: 'Sincronizare activă',
          description: `Acest preparat pornește peste ${Math.max(1, Math.ceil(sync.minutesUntilStart))} min.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      await ordersApi.updateItemStatus(Number(orderId), Number(itemId), 'cooking', {
        employeeName,
      });
      setItemStarterBy((prev) => ({ ...prev, [`${orderId}:${itemId}`]: employeeName }));
      await fetchOrders();
    } catch {
      toast({
        title: 'Eroare la update status',
        description: 'Nu s-a putut marca produsul ca cooking.',
        variant: 'destructive',
      });
    }
    setEmployeeSelectItem(null);
    
    toast({
      title: "Preparat pornit",
      description: `${employeeName} a început prepararea`,
    });
  };

  const handleCompleteItem = async (orderId: string, itemId: string) => {
    const order = apiOrders.find((o) => String(o.id) === String(orderId));
    const item = order?.items.find((i) => String(i.id) === String(itemId));
    const startedBy = itemStarterBy[`${orderId}:${itemId}`] ?? 'N/A';
    
    if (order && item) {
      const stationItems = order.items.filter((i) => orderItemMatchesKdsStation(i, station));
      const productIndex = stationItems.findIndex((i) => String(i.id) === String(itemId)) + 1;

      // Create label data
      const labelData: LabelData = {
        orderNumber: kdsOrderDisplayNumber(order),
        productNumber: productIndex,
        totalProducts: stationItems.length,
        productName: item.menuItem.name,
        quantity: item.quantity,
        modifications: item.modifications,
        station: station.name,
        preparedBy: startedBy,
        timestamp: new Date(),
        allergenIds: item.menuItem.allergenIds
      };

      // Show label preview
      setLabelPreview(labelData);
    }

    try {
      await ordersApi.updateItemStatus(Number(orderId), Number(itemId), 'ready');
      await fetchOrders();
    } catch {
      toast({
        title: 'Eroare la update status',
        description: 'Nu s-a putut marca produsul ca ready.',
        variant: 'destructive',
      });
    }

    // Completed list is now derived directly from DB statuses.
  };

  const handleStartAllItems = (orderId: string, items: OrderItem[]) => {
    const pendingItems = items.filter(i => i.status === 'pending');
    if (pendingItems.length > 0) {
      setEmployeeSelectItem({ orderId, itemId: pendingItems[0].id });
    }
  };

  const handleShowRecipe = (item: OrderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipeViewItem(item.menuItem);
  };

  const handlePrintLabelForItem = (order: Order, item: OrderItem, stationItems: OrderItem[], e: React.MouseEvent) => {
    e.stopPropagation();
    
    const productIndex = stationItems.findIndex(i => i.id === item.id) + 1;

    const labelData: LabelData = {
      orderNumber: kdsOrderDisplayNumber(order),
      productNumber: productIndex,
      totalProducts: stationItems.length,
      productName: item.menuItem.name,
      quantity: item.quantity,
      modifications: item.modifications,
      station: station.name,
      preparedBy: 'N/A',
      timestamp: new Date(),
      allergenIds: item.menuItem.allergenIds
    };

    setLabelPreview(labelData);
  };

  // Print all labels (product + allergen)
  const handlePrintAllLabels = () => {
    // Print product label
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
    
    // Print allergen label
    if (allergenLabelRef.current) {
      setTimeout(() => {
        const printContent = allergenLabelRef.current?.innerHTML;
        if (printContent) {
          const printWindow = window.open('', '', 'width=400,height=600');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Etichetă Alergeni</title>
                  <style>
                    body { font-family: 'Courier New', monospace; padding: 10mm; margin: 0; }
                    .label { width: 60mm; border: 2px solid #000; padding: 5mm; }
                    .header { text-align: center; font-size: 14pt; font-weight: bold; background: #ff6b6b; color: white; padding: 3mm; border-radius: 3mm 3mm 0 0; }
                    .product-name { font-size: 12pt; font-weight: bold; text-align: center; margin: 3mm 0; }
                    .allergen-list { margin: 3mm 0; }
                    .allergen-item { display: flex; align-items: center; gap: 2mm; padding: 2mm; margin: 1mm 0; background: #fff3cd; border-radius: 3mm; font-size: 11pt; }
                    .warning { text-align: center; font-size: 10pt; font-weight: bold; color: #dc3545; margin-top: 3mm; padding: 2mm; border: 1px solid #dc3545; }
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
      }, 500);
    }
    
    toast({
      title: "Etichete trimise la imprimantă",
      description: `Produs + Alergeni: ${labelPreview?.productName}`,
    });
    
    setLabelPreview(null);
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

  // Get notes only for items in this order that have notes
  const getOrderNotes = (items: OrderItem[]): string | null => {
    const itemNotes = items
      .filter(i => i.modifications.notes && i.modifications.notes.trim() !== '')
      .map(i => `${i.menuItem.name}: ${i.modifications.notes}`)
      .join(' | ');
    
    return itemNotes || null;
  };

  const getTotalOrderTime = (items: OrderItem[]): { display: string; status: 'normal' | 'warning' | 'urgent' } => {
    const maxPrepTime = Math.max(...items.map(i => i.menuItem.prepTime));
    
    const cookingItems = items.filter(i => i.status === 'cooking');
    if (cookingItems.length === 0 && items.some(i => i.status === 'pending')) {
      return { display: `~${maxPrepTime} min`, status: 'normal' };
    }

    const startedItems = items.filter(
      (i) => i.startedAt && (i.status === 'cooking' || i.status === 'ready' || i.status === 'served'),
    );
    if (startedItems.length > 0) {
      const earliestStart = Math.min(
        ...startedItems.map((i) => new Date(i.startedAt as Date).getTime()),
      );
      const elapsed = Math.floor((currentTime.getTime() - earliestStart) / 60000);
      const remaining = Math.max(0, maxPrepTime - elapsed);
      
      if (elapsed > maxPrepTime * 1.5) return { display: `${remaining} min`, status: 'urgent' };
      if (elapsed > maxPrepTime) return { display: `${remaining} min`, status: 'warning' };
      return { display: `${remaining} min`, status: 'normal' };
    }

    return { display: `~${maxPrepTime} min`, status: 'normal' };
  };

  // Render item with full details (used in all views)
  const renderItemRow = (order: Order, item: OrderItem, items: OrderItem[], showButtons: boolean = true) => {
    const timeInfo = getRemainingTime(item);
    const isCompleted = isItemCompleted(item);
    const isActive = item.status === 'cooking';
    const hasModifications = item.modifications.added.length > 0 || item.modifications.removed.length > 0;
    const syncInfo = getSyncStartTime(item, order);
    const isPending = item.status === 'pending';
    const shouldAlertStart = isPending && syncInfo.syncActive && syncInfo.shouldStartNow;
    
    return (
      <div key={item.id} className="flex flex-col">
        {/* Removed alert banner - using button animation instead */}
        
        {/* Sync timing indicator for pending items */}
        {isPending && syncInfo.syncActive && !syncInfo.shouldStartNow && syncInfo.startTime && (
          <div className="mx-3 mt-2 p-2 rounded-lg bg-blue-100 border border-blue-300 text-blue-700 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              Sincronizat - Începe la: {syncInfo.startTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              <span className="font-bold ml-2">
                (în {Math.ceil(syncInfo.minutesUntilStart)} min)
              </span>
            </span>
          </div>
        )}
        
        <div
          onClick={() => !isCompleted && handleItemTap(order.id, item.id)}
          className={cn(
            "flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-200",
            isCompleted && "bg-slate-100 opacity-60",
            isActive && !isCompleted && "bg-green-50 border-l-4 border-green-500",
            !isActive && !isCompleted && "hover:bg-slate-50",
            shouldAlertStart && "bg-orange-100 border-l-4 border-orange-500"
          )}
        >
          {/* Product Image */}
          <div className="w-10 h-10 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden mr-2">
            {item.menuItem.image ? (
              <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
          
          <div className={cn("flex flex-col flex-1 min-w-0", isCompleted && "line-through text-slate-400")}>
            {/* First Row: Quantity + Name */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-black text-lg",
                isActive && !isCompleted ? "text-green-600" : "text-primary",
                isCompleted && "text-slate-400"
              )}>
                {item.quantity}x
              </span>
              <span className={cn("font-medium truncate flex-1", isCompleted && "text-slate-400")}>
                {item.menuItem.name}
              </span>
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
            </div>
            
            {/* Second Row: Employee/Time + Buttons */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 min-w-0">
                {/* Time display */}
                <div className={cn(
                  "flex items-center gap-1 text-sm font-mono font-bold",
                  isCompleted && "line-through text-slate-400",
                  isActive && !isCompleted && (timeInfo.percent >= 100 ? "text-red-600" : timeInfo.percent >= 75 ? "text-yellow-600" : "text-green-600")
                )}>
                  {!isCompleted && (
                    isActive ? (
                      <>
                        <div className="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
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
                    )
                  )}
                </div>
              </div>
              
              {/* Recipe & Label Buttons on second row */}
              {showButtons && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {!isCompleted && (
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
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", isCompleted ? "text-green-500 hover:text-green-600" : "text-slate-400 hover:text-orange-500")}
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
          </div>
        </div>
        
        {/* Show modifications inline */}
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
        
        {/* Show item-specific notes */}
        {item.modifications.notes && item.modifications.notes.trim() !== '' && !isCompleted && (
          <div className="px-3 pb-2">
            <div className="flex items-start gap-1 text-xs text-amber-700 bg-amber-50 p-1.5 rounded">
              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{item.modifications.notes}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {filteredOrders.map(({ order, items }) => {
        const status = getOrderStatus(items);
        const progress = getOrderProgress(items);
        const config = platformConfig[order.source] || platformConfig.restaurant;
        const totalTime = getTotalOrderTime(items);
        const hasPendingItems = items.some(i => i.status === 'pending');
        const fullOrder = apiOrders.find(o => o.id === order.id);
        const isSyncOrder = fullOrder?.syncTiming;
        
        // Check if any pending item should start now (for alert)
        const hasItemToStartNow = items.some(item => {
          if (item.status !== 'pending') return false;
          const syncInfo = getSyncStartTime(item, order);
          return syncInfo.syncActive && syncInfo.shouldStartNow;
        });
        
        return (
          <Card 
            key={`${order.id}-${station.id}`} 
            className={cn(
              "bg-white text-slate-900 border-0 shadow-lg overflow-hidden transition-all duration-300 animate-fade-in",
              status === 'urgent' && "ring-2 ring-red-500 animate-pulse",
              status === 'delayed' && "ring-2 ring-yellow-500",
              hasItemToStartNow && "ring-2 ring-orange-500"
            )}
          >
            <CardHeader className="p-3 pb-2 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-primary">
                    #{kdsOrderDisplayNumber(order)}
                  </span>
                  {status === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />}
                  {isSyncOrder && (
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                      SYNC
                    </Badge>
                  )}
                </div>
                <Badge className={cn("h-7 text-xs font-bold px-2 flex items-center gap-1", config.color, "text-white")}>
                  {getSourceIcon(order.source)}
                  <span>{config.label}</span>
                </Badge>
              </div>
              
            </CardHeader>

            <CardContent className="p-0">
              {/* Timer moved inside content */}
              <div className={cn(
                "flex items-center gap-2 mx-3 mt-2 px-3 py-1.5 rounded-lg text-sm font-bold",
                totalTime.status === 'urgent' && "bg-red-100 text-red-700",
                totalTime.status === 'warning' && "bg-yellow-100 text-yellow-700",
                totalTime.status === 'normal' && "bg-slate-100 text-slate-700"
              )}>
                <Timer className="w-4 h-4" />
                <span>{totalTime.display}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mx-3 mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progres</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <ScrollArea className="max-h-[300px] mt-2">
                <div className="divide-y divide-slate-100">
                  {items.map(item => renderItemRow(order, item, items))}
                </div>
              </ScrollArea>

              {hasPendingItems && (
                <div className="p-2 border-t border-slate-200">
                  <Button 
                    className={cn(
                      "w-full font-bold transition-all duration-1000",
                      hasItemToStartNow 
                        ? "bg-orange-500 hover:bg-orange-600 text-white animate-[pulse_2s_ease-in-out_infinite]" 
                        : "bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02]"
                    )}
                    size="sm"
                    onClick={() => handleStartAllItems(order.id, items)}
                  >
                    {hasItemToStartNow ? (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        ÎNCEPE ACUM!
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Render List View - full details like grid
  const renderListView = () => (
    <div className="space-y-4">
      {filteredOrders.map(({ order, items }) => {
        const status = getOrderStatus(items);
        const progress = getOrderProgress(items);
        const config = platformConfig[order.source] || platformConfig.restaurant;
        const totalTime = getTotalOrderTime(items);
        const hasPendingItems = items.some(i => i.status === 'pending');
        const fullOrder = apiOrders.find(o => o.id === order.id);
        const isSyncOrder = fullOrder?.syncTiming;
        
        // Check if any pending item should start now (for alert)
        const hasItemToStartNow = items.some(item => {
          if (item.status !== 'pending') return false;
          const syncInfo = getSyncStartTime(item, order);
          return syncInfo.syncActive && syncInfo.shouldStartNow;
        });
        
        return (
          <Card 
            key={`${order.id}-${station.id}`}
            className={cn(
              "bg-white text-slate-900 shadow-md transition-all duration-300 animate-fade-in overflow-hidden",
              status === 'urgent' && "ring-2 ring-red-500",
              status === 'delayed' && "ring-2 ring-yellow-500",
              hasItemToStartNow && "ring-2 ring-orange-500"
            )}
          >
            {/* Header Row */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-primary">#{kdsOrderDisplayNumber(order)}</span>
                {status === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                {isSyncOrder && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    SYNC
                  </Badge>
                )}
              </div>
              
              <Badge className={cn("h-7 px-3", config.color, "text-white")}>
                {getSourceIcon(order.source)}
                <span className="ml-1">{config.label}</span>
              </Badge>
              
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold",
                totalTime.status === 'urgent' && "bg-red-100 text-red-700",
                totalTime.status === 'warning' && "bg-yellow-100 text-yellow-700",
                totalTime.status === 'normal' && "bg-slate-100 text-slate-700"
              )}>
                <Timer className="w-4 h-4" />
                <span>{totalTime.display}</span>
              </div>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-2 w-40">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-bold text-slate-600">{progress}%</span>
              </div>
              
              {hasPendingItems && (
                <Button 
                  size="sm" 
                  className={cn(
                    "transition-all duration-1000",
                    hasItemToStartNow 
                      ? "bg-orange-500 hover:bg-orange-600 animate-[pulse_2s_ease-in-out_infinite]" 
                      : "bg-green-600 hover:bg-green-700"
                  )} 
                  onClick={() => handleStartAllItems(order.id, items)}
                >
                  {hasItemToStartNow ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-1" /> ÎNCEPE ACUM!
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" /> Start
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Items */}
            <div className="divide-y divide-slate-100">
              {items.map(item => renderItemRow(order, item, items))}
            </div>
          </Card>
        );
      })}
    </div>
  );

  // Render Timeline View - Kanban style with full details
  const renderTimelineView = () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Pending Column */}
      <div className="flex-shrink-0 w-96">
        <div className="bg-slate-200 rounded-t-xl px-4 py-2 font-bold text-slate-700 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          În așteptare ({filteredOrders.filter(({ items }) => items.every(i => i.status === 'pending')).length})
        </div>
        <div className="bg-slate-100 rounded-b-xl p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-250px)] overflow-y-auto">
          {filteredOrders.filter(({ items }) => items.every(i => i.status === 'pending')).map(({ order, items }) => {
            const config = platformConfig[order.source] || platformConfig.restaurant;
            return (
              <Card key={order.id} className="bg-white shadow-sm animate-fade-in overflow-hidden">
                <CardHeader className="p-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-primary text-lg">#{kdsOrderDisplayNumber(order)}</span>
                    <Badge className={cn("text-xs", config.color, "text-white")}>
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {items.map(item => renderItemRow(order, item, items))}
                  </div>
                  <div className="p-2 border-t border-slate-100">
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStartAllItems(order.id, items)}>
                      <Play className="w-4 h-4 mr-1" /> Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cooking Column */}
      <div className="flex-shrink-0 w-96">
        <div className="bg-yellow-500 rounded-t-xl px-4 py-2 font-bold text-white flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          În preparare ({filteredOrders.filter(({ items }) => items.some(i => i.status === 'cooking') && !items.every(i => i.status === 'ready' || i.status === 'served')).length})
        </div>
        <div className="bg-yellow-50 rounded-b-xl p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-250px)] overflow-y-auto">
          {filteredOrders.filter(({ items }) => items.some(i => i.status === 'cooking') && !items.every(i => i.status === 'ready' || i.status === 'served')).map(({ order, items }) => {
            const config = platformConfig[order.source] || platformConfig.restaurant;
            const progress = getOrderProgress(items);
            return (
              <Card key={order.id} className="bg-white shadow-sm border-l-4 border-yellow-500 animate-fade-in overflow-hidden">
                <CardHeader className="p-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-primary text-lg">#{kdsOrderDisplayNumber(order)}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-16 h-2" />
                      <span className="text-xs font-bold">{progress}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {items.map(item => renderItemRow(order, item, items))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ready Column */}
      <div className="flex-shrink-0 w-96">
        <div className="bg-green-500 rounded-t-xl px-4 py-2 font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Gata ({filteredOrders.filter(({ items }) => items.every(i => i.status === 'ready' || i.status === 'served')).length})
        </div>
        <div className="bg-green-50 rounded-b-xl p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-250px)] overflow-y-auto">
          {filteredOrders.filter(({ items }) => items.every(i => i.status === 'ready' || i.status === 'served')).map(({ order, items }) => (
            <Card key={order.id} className="bg-white shadow-sm border-l-4 border-green-500 animate-fade-in">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-green-600 text-lg">#{kdsOrderDisplayNumber(order)}</span>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="text-sm text-slate-600 line-through flex items-center gap-2">
                      <span className="font-bold">{item.quantity}x</span>
                      <span>{item.menuItem.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Completed Orders
  const renderCompletedOrders = () => (
    completedStationOrders.length === 0 ? (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-20 h-20 mx-auto text-slate-600 mb-4" />
          <p className="text-xl text-slate-400">Nu sunt comenzi finalizate</p>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {completedStationOrders.map(({ order, items: stationItems }) => {
          const config = platformConfig[order.source] || platformConfig.restaurant;
          
          return (
            <Card key={order.id} className="bg-green-50 border-green-200 text-slate-900">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-green-700">
                    #{kdsOrderDisplayNumber(order)}
                  </span>
                  <Badge className={cn("text-xs", config.color, "text-white")}>
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {stationItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-green-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="line-through">{item.quantity}x {item.menuItem.name}</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              const productIndex = stationItems.findIndex(i => i.id === item.id) + 1;
                              const labelData: LabelData = {
                                orderNumber: kdsOrderDisplayNumber(order),
                                productNumber: productIndex,
                                totalProducts: stationItems.length,
                                productName: item.menuItem.name,
                                quantity: item.quantity,
                                modifications: item.modifications,
                                station: station.name,
                                preparedBy: 'Finalizat',
                                timestamp: new Date(),
                                allergenIds: item.menuItem.allergenIds
                              };
                              setLabelPreview(labelData);
                            }}
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
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    )
  );

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Header - Responsive */}
      <header className="bg-slate-800 border-b border-slate-700">
        {/* First Row: Title + Time + Logout */}
        <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <span className="text-2xl md:text-3xl flex-shrink-0">{station.icon}</span>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold truncate">{station.name}</h1>
              <p className="text-xs md:text-sm text-slate-400 hidden sm:block">
                {ordersLoading ? 'KDS Enhanced · se încarcă din DB…' : 'KDS Enhanced · sursă: DB'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-lg md:text-2xl font-bold font-mono">
                {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs md:text-sm text-slate-400">{filteredOrders.length} comenzi</p>
            </div>
            
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-white hover:bg-slate-700 h-8 w-8 md:h-10 md:w-10">
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
        
        {/* Second Row: Controls - Scrollable on mobile */}
        <div className="flex items-center gap-2 px-3 pb-2 md:px-4 md:pb-3 overflow-x-auto">
          {/* Tabs Active/Completed */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')} className="h-auto flex-shrink-0">
            <TabsList className="bg-slate-700 h-8">
              <TabsTrigger value="active" className="text-xs md:text-sm px-2 md:px-3 h-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Active ({stationOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs md:text-sm px-2 md:px-3 h-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Finalizate ({completedStationOrders.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Mode Switcher */}
          <div className="flex bg-slate-700 rounded-lg p-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-2 h-7", viewMode === 'grid' && "bg-primary text-white")}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-2 h-7", viewMode === 'list' && "bg-primary text-white")}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-2 h-7", viewMode === 'timeline' && "bg-primary text-white")}
              onClick={() => setViewMode('timeline')}
            >
              <AlignJustify className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter */}
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-28 md:w-36 h-7 md:h-8 bg-slate-700 border-slate-600 text-white text-xs md:text-sm flex-shrink-0">
              <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="urgent">🔴 Urgente</SelectItem>
              <SelectItem value="delayed">🟡 Întârziate</SelectItem>
              <SelectItem value="normal">🟢 Normale</SelectItem>
            </SelectContent>
          </Select>

          {/* Language Selector */}
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="w-14 h-7 md:h-8 text-base md:text-lg bg-slate-700 border-slate-600 text-white flex-shrink-0">
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
        {activeTab === 'active' ? (
          filteredOrders.length === 0 ? (
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
          )
        ) : (
          renderCompletedOrders()
        )}
      </div>

      {/* Employee Selection Dialog */}
      <Dialog open={!!employeeSelectItem} onOpenChange={() => setEmployeeSelectItem(null)}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5" />
              Selectează angajatul care prepară
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {kitchenEmployees.map(employee => (
              <Button
                key={employee.id}
                onClick={() => handleStartCooking(employee.name)}
                className="h-20 text-lg font-bold bg-primary hover:bg-primary/90 transition-transform hover:scale-105 flex flex-col gap-1"
              >
                <span className="text-2xl">{employee.avatar}</span>
                <span>{employee.name}</span>
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

      {/* Label Print Preview Dialog - Both Labels Stacked */}
      <Dialog open={!!labelPreview} onOpenChange={() => setLabelPreview(null)}>
        <DialogContent className="sm:max-w-lg bg-white text-slate-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Etichete Produs
            </DialogTitle>
          </DialogHeader>
          
          {labelPreview && (
            <div className="space-y-4 pt-4">
              {/* Product Label */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">1</span>
                  ETICHETĂ PRODUS
                </h3>
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
              </div>

              {/* Allergen Label */}
              <div>
                <h3 className="text-sm font-bold text-amber-600 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                  ETICHETĂ ALERGENI
                </h3>
                <div ref={allergenLabelRef} className="border-2 border-dashed border-amber-400 p-4 rounded-lg bg-amber-50 font-mono">
                  <div className="label">
                    <div className="header text-center text-base font-bold bg-amber-500 text-white -m-4 mb-3 p-2 rounded-t">
                      ⚠️ INFORMAȚII ALERGENI ⚠️
                    </div>
                    
                    <div className="product-name text-center text-lg font-bold my-2 p-2 bg-white rounded border border-amber-300">
                      {labelPreview.quantity}x {labelPreview.productName}
                    </div>
                    
                    <div className="text-center text-sm text-slate-600 mb-2">
                      Comandă #{labelPreview.orderNumber}
                    </div>
                    
                    <div className="allergen-list mt-3">
                      <div className="text-sm font-bold text-slate-700 mb-2">Conține următorii alergeni:</div>
                      {labelPreview.allergenIds && labelPreview.allergenIds.length > 0 ? (
                        <div className="space-y-1">
                          {labelPreview.allergenIds.map(allergenId => {
                            const allergen = allergens.find(a => a.id === allergenId);
                            return allergen ? (
                              <div key={allergenId} className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200">
                                <span className="text-xl">{allergen.icon}</span>
                                <span className="font-medium">{allergen.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-green-100 rounded text-center text-green-700 font-medium">
                          ✓ Nu conține alergeni declarați
                        </div>
                      )}
                    </div>
                    
                    <div className="warning text-center text-xs font-bold text-red-600 mt-3 p-2 border border-red-300 rounded bg-red-50">
                      Verificați întotdeauna ingredientele!
                    </div>
                    
                    <div className="footer text-center text-xs border-t-2 border-dashed border-amber-400 pt-2 mt-2">
                      {labelPreview.timestamp.toLocaleString('ro-RO')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setLabelPreview(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Anulează
                </Button>
                <Button className="flex-1 bg-primary" onClick={handlePrintAllLabels}>
                  <Printer className="w-4 h-4 mr-2" />
                  Printează Toate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default KDSEnhancedModule;
