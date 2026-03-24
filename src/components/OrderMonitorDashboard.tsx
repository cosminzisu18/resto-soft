import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Truck,
  Timer,
  Package,
  UtensilsCrossed,
  Bike,
  MapPin,
  Phone,
  RefreshCw,
  Bell,
  Eye,
  PlayCircle
} from 'lucide-react';
import { ordersApi, type OrderApi, type OrderItemApi } from '@/lib/api';

interface OrderMonitorDashboardProps {
  onBack: () => void;
}

type MonitorOrderStatus = 'new' | 'in_progress' | 'ready' | 'ready_for_pickup' | 'completed' | 'delayed';
type RiderStatus = 'arriving' | 'waiting' | 'picked_up' | 'none';

interface MonitorItem {
  name: string;
  station: string;
  status: 'pending' | 'cooking' | 'ready' | 'served' | 'delayed';
  prepTime: number;
  startedAt?: Date;
  completedAt?: Date;
}

interface MonitorOrder {
  id: string;
  type: 'restaurant' | 'delivery';
  table?: number | null;
  source: string;
  platform?: string;
  customer?: { name?: string; phone?: string; address?: string };
  createdAt: Date;
  items: MonitorItem[];
  status: MonitorOrderStatus;
  riderStatus: RiderStatus;
  riderEta?: number;
  delay: number;
}

const platformColors: Record<string, { bg: string; text: string; icon: string }> = {
  glovo: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: '🟡' },
  bolt: { bg: 'bg-green-500/10', text: 'text-green-600', icon: '🟢' },
  wolt: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: '🔵' },
  tazz: { bg: 'bg-purple-500/10', text: 'text-purple-600', icon: '🟣' },
  restaurant: { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: '🍽️' },
  kiosk: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', icon: '📱' },
  waiter: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', icon: '👨‍🍳' },
};

const stationIcons: Record<string, string> = {
  'Pizza': '🍕',
  'Grill': '🔥',
  'Giros': '🥙',
  'Supe': '🍲',
  'Bar': '🍺',
  'Deserturi': '🍰',
};

const DELIVERY_SOURCES = new Set(['glovo', 'wolt', 'bolt', 'own_website', 'phone']);

function mapStationLabel(raw: Record<string, unknown> | null): string {
  if (!raw) return 'Bucătărie';
  const type = typeof raw.kdsStationType === 'string' ? raw.kdsStationType : '';
  if (type === 'soups') return 'Supe';
  if (type === 'pizza') return 'Pizza';
  if (type === 'giros') return 'Giros';
  if (type === 'grill') return 'Grill';

  const category = typeof raw.category === 'string' ? raw.category.toLowerCase() : '';
  if (category.includes('sup')) return 'Supe';
  if (category.includes('pizza')) return 'Pizza';
  if (category.includes('giros') || category.includes('doner')) return 'Giros';
  if (category.includes('desert')) return 'Deserturi';
  if (category.includes('băutur') || category.includes('bar')) return 'Bar';
  return 'Grill';
}

function toMonitorItem(item: OrderItemApi, now: Date): MonitorItem {
  const raw = item.menuItem;
  const prepTime = Number((raw?.prepTime as number | undefined) ?? 0);
  const startedAt = item.startedAt ? new Date(item.startedAt) : undefined;
  const readyAt = item.readyAt ? new Date(item.readyAt) : undefined;
  const elapsed = startedAt ? Math.floor((now.getTime() - startedAt.getTime()) / 60000) : 0;
  const delayed = item.status === 'cooking' && prepTime > 0 && elapsed > prepTime;

  return {
    name: String((raw?.name as string | undefined) ?? `Produs #${item.menuItemId}`),
    station: mapStationLabel(raw),
    status: delayed ? 'delayed' : item.status,
    prepTime,
    startedAt,
    completedAt: readyAt,
  };
}

function toMonitorOrder(order: OrderApi, now: Date): MonitorOrder {
  const source = order.source ?? 'restaurant';
  const type: 'restaurant' | 'delivery' = DELIVERY_SOURCES.has(source) ? 'delivery' : 'restaurant';
  const items = (order.items ?? []).map((i) => toMonitorItem(i, now));
  const delay = Math.max(
    0,
    ...items.map((it) => {
      if (!it.startedAt || it.prepTime <= 0 || it.status === 'ready' || it.status === 'served') return 0;
      const elapsed = Math.floor((now.getTime() - it.startedAt.getTime()) / 60000);
      return Math.max(0, elapsed - it.prepTime);
    }),
  );

  const allPending = items.length > 0 && items.every((it) => it.status === 'pending');
  const allReady = items.length > 0 && items.every((it) => it.status === 'ready' || it.status === 'served');
  const hasCooking = items.some((it) => it.status === 'cooking' || it.status === 'delayed');

  let status: MonitorOrderStatus = 'new';
  if (delay > 0) status = 'delayed';
  else if (allReady) status = type === 'delivery' ? 'ready_for_pickup' : 'ready';
  else if (hasCooking) status = 'in_progress';
  else if (allPending) status = 'new';
  else status = 'in_progress';

  return {
    id: `ORD-${order.id}`,
    type,
    table: order.tableNumber,
    source,
    platform: type === 'delivery' ? source : undefined,
    customer:
      type === 'delivery'
        ? {
            name: order.customerName ?? undefined,
            phone: order.customerPhone ?? undefined,
            address: order.deliveryAddress ?? undefined,
          }
        : undefined,
    createdAt: new Date(order.createdAt),
    items,
    status,
    riderStatus: type === 'delivery' ? (status === 'ready_for_pickup' ? 'arriving' : 'waiting') : 'none',
    riderEta: type === 'delivery' && status === 'ready_for_pickup' ? 5 : undefined,
    delay,
  };
}

const OrderMonitorDashboard: React.FC<OrderMonitorDashboardProps> = ({ onBack }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<MonitorOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const apiOrders = await ordersApi.getAll();
        const activeApiOrders = apiOrders.filter((o) => o.status === 'active');
        setOrders(activeApiOrders.map((o) => toMonitorOrder(o, new Date())));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
    if (!autoRefresh) return;
    const interval = setInterval(() => void loadOrders(), 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getElapsedMinutes = (date: Date) => {
    return Math.floor((currentTime.getTime() - date.getTime()) / 60000);
  };

  const getRemainingTime = (item: any) => {
    if (item.status === 'ready' || item.status === 'completed') return 0;
    if (!item.startedAt) return item.prepTime;
    const elapsed = getElapsedMinutes(item.startedAt);
    return Math.max(0, item.prepTime - elapsed);
  };

  const getOrderProgress = (order: any) => {
    const completedItems = order.items.filter((i: any) => i.status === 'ready' || i.status === 'completed').length;
    return (completedItems / order.items.length) * 100;
  };

  const getOrderRemainingTime = (order: any) => {
    const pendingItems = order.items.filter((i: any) => i.status !== 'ready' && i.status !== 'completed');
    if (pendingItems.length === 0) return 0;
    return Math.max(...pendingItems.map((i: any) => getRemainingTime(i)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'ready': case 'ready_for_pickup': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'delayed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouă';
      case 'in_progress': return 'În Preparare';
      case 'ready': case 'ready_for_pickup': return 'Gata';
      case 'completed': return 'Finalizată';
      case 'delayed': return 'Întârziată';
      case 'pending': return 'În Așteptare';
      case 'cooking': return 'Se Prepară';
      default: return status;
    }
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'cooking': return <PlayCircle className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'ready': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'delayed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRiderStatusBadge = (status: string, eta?: number) => {
    switch (status) {
      case 'arriving':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
            <Bike className="w-3 h-3" />
            Vine în {eta} min
          </Badge>
        );
      case 'waiting':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
            <Clock className="w-3 h-3" />
            Așteaptă
          </Badge>
        );
      case 'picked_up':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
            <Truck className="w-3 h-3" />
            Ridicată
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Fără curier
          </Badge>
        );
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'restaurant') return order.type === 'restaurant';
    if (activeTab === 'delivery') return order.type === 'delivery';
    if (activeTab === 'delayed') return order.status === 'delayed' || (order.delay && order.delay > 0);
    return true;
  });

  const stats = {
    total: orders.length,
    inProgress: orders.filter(o => o.status === 'in_progress' || o.status === 'new').length,
    ready: orders.filter(o => o.status === 'ready_for_pickup' || o.status === 'ready').length,
    delayed: orders.filter(o => o.status === 'delayed' || (o.delay && o.delay > 0)).length,
    delivery: orders.filter(o => o.type === 'delivery').length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Monitorizare Comenzi</h1>
                <p className="text-sm text-muted-foreground">Status KDS & Delivery în timp real</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold font-mono">{currentTime.toLocaleTimeString('ro-RO')}</p>
              <p className="text-xs text-muted-foreground">{currentTime.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} style={{ animationDuration: '3s' }} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex-shrink-0 bg-muted/30 border-b border-border p-4">
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Comenzi</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-yellow-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <ChefHat className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">În Preparare</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-green-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
                <p className="text-xs text-muted-foreground">Gata</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-red-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
                <p className="text-xs text-muted-foreground">Întârziate</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-blue-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.delivery}</p>
                <p className="text-xs text-muted-foreground">Delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Orders List */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex-shrink-0 px-4 pt-4">
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  Toate <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="restaurant" className="gap-2">
                  🍽️ Restaurant
                </TabsTrigger>
                <TabsTrigger value="delivery" className="gap-2">
                  🛵 Delivery
                </TabsTrigger>
                <TabsTrigger value="delayed" className="gap-2 text-red-600">
                  ⚠️ Întârziate
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="flex-1 min-h-0 mt-0 p-4">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {loading ? (
                    <Card className="col-span-full">
                      <CardContent className="p-6 text-sm text-muted-foreground">
                        Se încarcă comenzile din baza de date...
                      </CardContent>
                    </Card>
                  ) : filteredOrders.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="p-6 text-sm text-muted-foreground">
                        Nu există comenzi active pentru filtrul selectat.
                      </CardContent>
                    </Card>
                  ) : filteredOrders.map((order) => {
                    const progress = getOrderProgress(order);
                    const remainingTime = getOrderRemainingTime(order);
                    const elapsed = getElapsedMinutes(order.createdAt);
                    const isDelayed = order.delay && order.delay > 0;
                    const platform = order.type === 'delivery' ? order.platform : order.source;

                    return (
                      <Card
                        key={order.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg",
                          selectedOrder === order.id && "ring-2 ring-primary",
                          isDelayed && "border-red-500/50 bg-red-500/5",
                          order.status === 'ready_for_pickup' && "border-green-500/50 bg-green-500/5"
                        )}
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{order.id}</span>
                              <Badge variant="outline" className={platformColors[platform || 'restaurant']?.bg + ' ' + platformColors[platform || 'restaurant']?.text}>
                                {platformColors[platform || 'restaurant']?.icon} {platform?.toUpperCase()}
                              </Badge>
                            </div>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            {order.type === 'restaurant' ? (
                              <span className="flex items-center gap-1">
                                <UtensilsCrossed className="w-4 h-4" />
                                Masă {order.table ?? '-'}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {(order.customer?.address ?? 'Adresă indisponibilă').substring(0, 25)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {elapsed} min
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progres preparare</span>
                              <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress 
                              value={progress} 
                              className={cn(
                                "h-2",
                                isDelayed && "[&>div]:bg-red-500"
                              )}
                            />
                          </div>

                          {/* Time Info */}
                          <div className="flex items-center justify-between">
                            {remainingTime > 0 ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Timer className="w-4 h-4 text-primary" />
                                <span className="font-medium">{remainingTime} min rămas</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-medium">Gata pentru servire</span>
                              </div>
                            )}
                            {isDelayed && (
                              <Badge variant="destructive" className="animate-pulse">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                +{order.delay} min întârziere
                              </Badge>
                            )}
                          </div>

                          {/* Rider Status for Delivery */}
                          {order.type === 'delivery' && (
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <span className="text-sm text-muted-foreground">Status Curier:</span>
                              {getRiderStatusBadge(order.riderStatus || 'none', order.riderEta)}
                            </div>
                          )}

                          {/* Items Detail - Expandable */}
                          {selectedOrder === order.id && (
                            <div className="pt-3 border-t border-border space-y-2 animate-fade-in">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Produse:</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    {getItemStatusIcon(item.status)}
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {stationIcons[item.station]} {item.station}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {item.status === 'cooking' && (
                                      <span className="text-xs text-yellow-600 font-medium">
                                        {getRemainingTime(item)} min
                                      </span>
                                    )}
                                    {item.status === 'delayed' && (
                                      <span className="text-xs text-red-600 font-medium">
                                        Întârziat!
                                      </span>
                                    )}
                                    {item.status === 'ready' && (
                                      <span className="text-xs text-green-600 font-medium">
                                        ✓ Gata
                                      </span>
                                    )}
                                    {item.status === 'pending' && (
                                      <span className="text-xs text-muted-foreground">
                                        Așteaptă
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Delivery Customer Info */}
                              {order.type === 'delivery' && order.customer && (
                                <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                  <p className="text-xs font-medium text-blue-600 mb-2">Info Livrare:</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="flex items-center gap-2">
                                      <span className="text-muted-foreground">Client:</span>
                                      <span className="font-medium">{order.customer.name ?? 'N/A'}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <Phone className="w-3 h-3 text-muted-foreground" />
                                      <span>{order.customer.phone ?? 'N/A'}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <MapPin className="w-3 h-3 text-muted-foreground" />
                                      <span>{order.customer.address ?? 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Timeline Sidebar */}
        <div className="w-80 border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Activitate Live
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {orders
                .slice()
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 8)
                .map((order, idx) => {
                  const activityType =
                    order.status === 'delayed'
                      ? 'warning'
                      : order.status === 'ready' || order.status === 'ready_for_pickup'
                        ? 'success'
                        : order.status === 'new'
                          ? 'new'
                          : 'info';
                  const activityText =
                    order.status === 'delayed'
                      ? `${order.id} întârziată +${order.delay}min`
                      : order.status === 'ready_for_pickup'
                        ? `${order.id} gata pentru curier`
                        : order.status === 'ready'
                          ? `${order.id} gata pentru servire`
                          : order.status === 'new'
                            ? `${order.id} comandă nouă`
                            : `${order.id} în preparare`;
                  return {
                    time: order.createdAt.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                    event: activityText,
                    type: activityType,
                  };
                })
                .map((activity, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="text-xs text-muted-foreground font-mono w-12">{activity.time}</span>
                  <div className={cn(
                    "flex-1 p-2 rounded-lg",
                    activity.type === 'success' && "bg-green-500/10 text-green-700",
                    activity.type === 'warning' && "bg-red-500/10 text-red-700",
                    activity.type === 'info' && "bg-blue-500/10 text-blue-700",
                    activity.type === 'new' && "bg-yellow-500/10 text-yellow-700",
                    activity.type === 'complete' && "bg-muted text-muted-foreground"
                  )}>
                    {activity.event}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default OrderMonitorDashboard;
