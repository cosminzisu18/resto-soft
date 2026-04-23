import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  UtensilsCrossed, 
  Package, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Truck,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { ordersApi, tablesApi, type OrderApi, type TableApi } from '@/lib/api';

type DashboardOrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

interface RecentOrderRow {
  id: string;
  label: string;
  status: DashboardOrderStatus;
  itemsCount: number;
  elapsedMinutes: number;
}

interface DashboardStats {
  salesToday: number;
  salesTrendPercent: number;
  salesTrendPositive: boolean;
  activeOrders: number;
  pendingOrders: number;
  avgServiceMinutes: number;
  avgServiceTrendPercent: number;
  avgServiceTrendPositive: boolean;
  deliveryInProgress: number;
  deliveryBreakdown: string;
}

function mapOrderStatus(order: OrderApi): DashboardOrderStatus {
  if (order.status === 'completed') return 'completed';
  const hasCooking = order.items.some((item) => item.status === 'cooking');
  if (hasCooking) return 'preparing';
  const hasPending = order.items.some((item) => item.status === 'pending');
  if (hasPending) return 'pending';
  const hasReady = order.items.some((item) => item.status === 'ready' || item.status === 'served');
  if (hasReady) return 'ready';
  return 'pending';
}

function statusBadgeVariant(status: DashboardOrderStatus): 'success' | 'warning' | 'secondary' | 'info' {
  if (status === 'ready') return 'success';
  if (status === 'preparing') return 'warning';
  if (status === 'completed') return 'secondary';
  return 'info';
}

function statusLabel(status: DashboardOrderStatus): string {
  if (status === 'ready') return 'Gata';
  if (status === 'preparing') return 'Se prepara';
  if (status === 'completed') return 'Finalizat';
  return 'In asteptare';
}

function isSameDay(dateValue: string, target: Date): boolean {
  const d = new Date(dateValue);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function getCompletionDate(order: OrderApi): Date | null {
  const paidAt = (order as OrderApi & { paidAt?: string | null }).paidAt;
  if (paidAt) return new Date(paidAt);
  const itemReadyTimes = order.items
    .map((item) => item.readyAt)
    .filter((readyAt): readyAt is string => !!readyAt)
    .map((readyAt) => new Date(readyAt))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (itemReadyTimes.length === 0) return null;
  return itemReadyTimes.sort((a, b) => b.getTime() - a.getTime())[0];
}

function percentChange(current: number, previous: number): { percent: number; positive: boolean } {
  if (previous <= 0) {
    return { percent: current > 0 ? 100 : 0, positive: current >= previous };
  }
  const delta = ((current - previous) / previous) * 100;
  return { percent: Math.abs(Math.round(delta)), positive: delta >= 0 };
}

export const DashboardModule: React.FC = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderApi[]>([]);
  const [tables, setTables] = useState<TableApi[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingOrders(true);
    ordersApi
      .getAll()
      .then((list) => {
        if (cancelled) return;
        setOrders(list);
      })
      .catch(() => {
        if (cancelled) return;
        setOrders([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    tablesApi
      .getTables()
      .then((list) => {
        if (cancelled) return;
        setTables(list);
      })
      .catch(() => {
        if (cancelled) return;
        setTables([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentOrders = useMemo<RecentOrderRow[]>(() => {
    const now = Date.now();
    const today = new Date();
    return orders
      .filter((order) => isSameDay(order.createdAt, today))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map((order) => {
        const elapsed = Math.max(
          0,
          Math.floor((now - new Date(order.createdAt).getTime()) / 60000),
        );
        return {
          id: `#${order.id}`,
          label: order.tableNumber ? `Masa ${order.tableNumber}` : 'Delivery',
          status: mapOrderStatus(order),
          itemsCount: order.items.reduce((acc, item) => acc + (item.quantity ?? 0), 0),
          elapsedMinutes: elapsed,
        };
      });
  }, [orders]);

  const stats = useMemo<DashboardStats>(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todayOrders = orders.filter((order) => isSameDay(order.createdAt, today));
    const yesterdayOrders = orders.filter((order) => isSameDay(order.createdAt, yesterday));

    const completedToday = todayOrders.filter((order) => order.status === 'completed');
    const completedYesterday = yesterdayOrders.filter((order) => order.status === 'completed');

    const salesToday = completedToday.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const salesYesterday = completedYesterday.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const salesTrend = percentChange(salesToday, salesYesterday);

    const activeToday = todayOrders.filter((order) => order.status === 'active');
    const pendingOrders = activeToday.filter((order) =>
      order.items.some((item) => item.status === 'pending'),
    ).length;

    const avgDurationForDay = (dayCompletedOrders: OrderApi[]): number => {
      const durations = dayCompletedOrders
        .map((order) => {
          const startAt = new Date(order.createdAt);
          const endAt = getCompletionDate(order);
          if (!endAt) return null;
          const minutes = Math.floor((endAt.getTime() - startAt.getTime()) / 60000);
          return minutes >= 0 ? minutes : null;
        })
        .filter((value): value is number => value !== null);
      if (durations.length === 0) return 0;
      return Math.round(durations.reduce((acc, value) => acc + value, 0) / durations.length);
    };

    const avgServiceToday = avgDurationForDay(completedToday);
    const avgServiceYesterday = avgDurationForDay(completedYesterday);
    const avgServiceTrend = percentChange(avgServiceToday, avgServiceYesterday);

    const activeDeliveries = activeToday.filter(
      (order) => order.source !== 'restaurant' && order.source !== 'kiosk',
    );
    const bySource = new Map<string, number>();
    activeDeliveries.forEach((order) => {
      const key = (order.source || 'delivery').toLowerCase();
      bySource.set(key, (bySource.get(key) ?? 0) + 1);
    });
    const labelMap: Record<string, string> = {
      glovo: 'Glovo',
      bolt: 'Bolt',
      wolt: 'Wolt',
      own_website: 'Site',
      phone: 'Telefon',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
    };
    const deliveryBreakdown = [...bySource.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => `${count} ${labelMap[source] ?? source}`)
      .join(', ');

    return {
      salesToday,
      salesTrendPercent: salesTrend.percent,
      salesTrendPositive: salesTrend.positive,
      activeOrders: activeToday.length,
      pendingOrders,
      avgServiceMinutes: avgServiceToday,
      avgServiceTrendPercent: avgServiceTrend.percent,
      avgServiceTrendPositive: avgServiceToday === 0 ? true : avgServiceTrend.positive,
      deliveryInProgress: activeDeliveries.length,
      deliveryBreakdown: deliveryBreakdown || 'Fara livrari active',
    };
  }, [orders]);

  const quickStats = useMemo(() => {
    const today = new Date();
    const todayOrders = orders.filter((order) => isSameDay(order.createdAt, today));
    const completedToday = todayOrders.filter((order) => order.status === 'completed');

    const preparedItemsToday = todayOrders.reduce(
      (sum, order) => sum + order.items.reduce((lineAcc, item) => lineAcc + (item.quantity ?? 0), 0),
      0,
    );

    const activeEmployeeIds = new Set(
      todayOrders
        .map((order) => order.waiterId)
        .filter((waiterId): waiterId is string => !!waiterId && waiterId.trim().length > 0),
    );

    const tablesUsedToday = new Set(
      todayOrders
        .map((order) => order.tableId)
        .filter((tableId): tableId is number => typeof tableId === 'number'),
    );
    const occupancyPercent =
      tables.length > 0 ? Math.round((tablesUsedToday.size / tables.length) * 100) : 0;

    const completedOnTime = completedToday.filter((order) => {
      const endAt = getCompletionDate(order);
      if (!endAt) return false;
      const startAt = new Date(order.createdAt);
      const durationMinutes = Math.floor((endAt.getTime() - startAt.getTime()) / 60000);
      return durationMinutes >= 0 && durationMinutes <= 20;
    }).length;
    const onTimePercent =
      completedToday.length > 0 ? Math.round((completedOnTime / completedToday.length) * 100) : 0;

    return {
      preparedItemsToday,
      activeEmployeesToday: activeEmployeeIds.size,
      occupancyPercent,
      onTimePercent,
    };
  }, [orders, tables]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Rezumat activitate restaurant"
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Astăzi
          </Button>
          <Button size="sm" className="text-xs sm:text-sm">
            Raport Complet
          </Button>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Vânzări Azi"
          value={`${stats.salesToday.toLocaleString('ro-RO')} RON`}
          icon={CreditCard}
          trend={{ value: stats.salesTrendPercent, isPositive: stats.salesTrendPositive }}
          color="green"
        />
        <StatCard
          title="Comenzi Active"
          value={String(stats.activeOrders)}
          icon={ShoppingCart}
          subtitle={`${stats.pendingOrders} in asteptare`}
          color="blue"
        />
        <StatCard
          title="Timp Mediu Servire"
          value={`${stats.avgServiceMinutes} min`}
          icon={Clock}
          trend={{ value: stats.avgServiceTrendPercent, isPositive: stats.avgServiceTrendPositive }}
          color="orange"
        />
        <StatCard
          title="Livrări în Curs"
          value={String(stats.deliveryInProgress)}
          icon={Truck}
          subtitle={stats.deliveryBreakdown}
          color="blue"
        />
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Comenzi Recente</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/pos')}
            >
              Vezi toate
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingOrders ? (
                <div className="p-4 text-sm text-muted-foreground">Se incarca comenzile...</div>
              ) : recentOrders.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Nu exista comenzi disponibile.</div>
              ) : recentOrders.map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-medium text-primary">{order.id}</span>
                    <span className="text-foreground">{order.label}</span>
                    <span className="text-muted-foreground text-sm">{order.itemsCount} produse</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{order.elapsedMinutes} min</span>
                    <Badge 
                      variant={statusBadgeVariant(order.status)}
                    >
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Stoc Minim</p>
                    <p className="text-sm text-muted-foreground">Carne vită - 2.5 kg</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Comandă Întârziată</p>
                    <p className="text-sm text-muted-foreground">Masa 8 - 25 min</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-success">Inventar Complet</p>
                    <p className="text-sm text-muted-foreground">Bar verificat</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{quickStats.preparedItemsToday}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Preparate Azi</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{quickStats.activeEmployeesToday}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Angajați Activi</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold">{quickStats.occupancyPercent}%</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Ocupare Mese</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-success">{quickStats.onTimePercent}%</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Comenzi la Timp</p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardModule;