import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { RestaurantProvider, useRestaurant } from '@/context/RestaurantContext';
import { Table, KDSStation, kdsStations } from '@/data/mockData';
import { tablesApi, ordersApi, menuApi, normalizeTablePosition, type TableApi, type OrderApi } from '@/lib/api';
import { sanitizeTablePositionForApi } from '@/lib/tablePosition';
import { kdsStationApiToKdsStation } from '@/lib/kdsUtils';
import { parsePathname, ROUTES } from '@/lib/appRoutes';
import { canAccessDashboardShell, canAccessKitchenDesk } from '@/lib/dashboardAccess';
import LoginScreen from '@/components/LoginScreen';
import TableMap from '@/components/TableMap';
import OrderPanel from '@/components/OrderPanel';
import NotificationCenter from '@/components/NotificationCenter';
import ReservationManager from '@/components/ReservationManager';
import DeliveryOrders from '@/components/DeliveryOrders';
import CustomerSelfOrder from '@/components/CustomerSelfOrder';
import MainLayout, { ModuleType } from '@/components/layout/MainLayout';
import DashboardModule from '@/components/modules/DashboardModule';
import ReportsModule from '@/components/modules/ReportsModule';
import StocksModule from '@/components/modules/StocksModule';
import PlaceholderModule from '@/components/modules/PlaceholderModule';
import KDSEnhancedModule from '@/components/modules/KDSEnhancedModule';
import KDSProductionModule from '@/components/modules/KDSProductionModule';
import POSModule from '@/components/modules/POSModule';
import KioskModule from '@/components/modules/KioskModule';
import HRModule from '@/components/modules/HRModule';
import CustomersModule from '@/components/modules/CustomersModule';
import SuppliersModule from '@/components/modules/SuppliersModule';
import AIModule from '@/components/modules/AIModule';
import AdminConfigModule from '@/components/modules/AdminConfigModule';
import BrandingModule from '@/components/modules/BrandingModule';
import SubscriptionsAdminModule from '@/components/modules/SubscriptionsAdminModule';
import CommunicationModule from '@/components/modules/CommunicationModule';
import OfflineModeModule from '@/components/modules/OfflineModeModule';
import OrderHistoryDialog from '@/components/OrderHistoryDialog';
import WaiterProfileDialog from '@/components/WaiterProfileDialog';
import CashRegisterDialog from '@/components/CashRegisterDialog';
import ExternalOrdersNotification from '@/components/ExternalOrdersNotification';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import {
  ShoppingCart,
  Store,
  UtensilsCrossed,
  Users,
  FileText,
  Building2,
  UserCircle,
  Truck,
  Bot,
  Settings,
  Palette,
  CreditCard,
  MessageSquare,
  Tablet,
  Monitor as MonitorIcon,
  QrCode,
  ArrowLeft,
  PanelLeftClose,
  PanelRightClose,
  Calendar,
  Wifi,
  Eye,
  History,
  UserCircle as UserCircleIcon,
  Calculator,
  type LucideIcon
} from 'lucide-react';

const getCurrentDateParam = () => new Date().toISOString().slice(0, 10);

const moduleConfig: Record<ModuleType, { title: string; description: string; icon: LucideIcon | null; features: string[] }> = {
  dashboard: { title: '', description: '', icon: null, features: [] },
  pos: { title: 'RestoSoft', description: 'Sistem de vânzare complet', icon: ShoppingCart, features: ['Comenzi mese', 'La pachet', 'Telefonic', 'Vizualizare comenzi'] },
  kiosk: { title: 'Kiosk Self-Order', description: 'Comenzi self-service pentru clienți', icon: Store, features: ['Upsell automat', 'Plăți card/cash', 'QR status'] },
  kds: { title: 'KDS & Producție', description: 'Afișaj bucătărie și producție', icon: UtensilsCrossed, features: ['Comenzi pe stații', 'Timer preparare', 'Rețetar integrat'] },
  stocks: { title: '', description: '', icon: null, features: [] },
  employees: { title: 'Angajați', description: 'Gestionare personal și KPI', icon: Users, features: ['Pontaj', 'KPI per rol', 'Pauze monitorizate'] },
  reports: { title: '', description: '', icon: null, features: [] },
  management: { title: 'Gestiune Primară', description: 'Facturi, NIR și jurnal', icon: FileText, features: ['Import SPV', 'NIR automat', 'Export SAGA'] },
  suppliers: { title: 'Furnizori B2B', description: 'Portal pentru furnizori', icon: Building2, features: ['Catalog produse', 'Comenzi B2B', 'Rapoarte'] },
  customers: { title: 'Clienți', description: 'Fidelizare și istoric clienți', icon: UserCircle, features: ['Puncte fidelitate', 'Istoric comenzi', 'Notificări'] },
  delivery: { title: 'Delivery & Takeaway', description: 'Integrare Glovo, Bolt, Wolt', icon: Truck, features: ['Comenzi agregate', 'Etichete automate', 'Status live'] },
  ai: { title: 'AI & Automatizări', description: 'Predicții și sugestii inteligente', icon: Bot, features: ['Predicție vânzări', 'Sugestii stoc', 'Detectare pierderi'] },
  admin: { title: 'Admin & Multi-Locație', description: 'Setări și configurări', icon: Settings, features: ['Multi-locație', 'Meniuri diferite', 'Prețuri per locație'] },
  branding: { title: 'Branding & Custom', description: 'Personalizare aplicație', icon: Palette, features: ['Logo custom', 'Culori', 'Template-uri'] },
  subscriptions: { title: 'Abonamente', description: 'Gestionare abonamente clienți', icon: CreditCard, features: ['Facturare', 'Status plăți', 'Rapoarte'] },
  communication: { title: 'Comunicare', description: 'Chat intern și suport', icon: MessageSquare, features: ['Chat echipă', 'Suport', 'Tickete'] },
  offline: { title: 'Mod Offline', description: 'Gestionare conectivitate', icon: Wifi, features: ['Sincronizare', 'Queue local', 'Status conexiune'] },
  chat: { title: 'Chat Intern', description: 'Comunicare internă', icon: MessageSquare, features: ['Chat echipă', 'Suport', 'Notificări'] },
};

const RestaurantApp: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const route = useMemo(() => parsePathname(pathname), [pathname]);

  const { toast } = useToast();
  const {
    currentUser,
    logout,
    staffSessionHydrated,
    notifications,
    markNotificationRead,
    clearNotifications,
    reservations,
    tables,
    orders,
    updateOrder,
    createReservation,
    updateReservation,
    deleteReservation
  } = useRestaurant();

  const activeModule: ModuleType =
    route.kind === 'dashboard' || route.kind === 'kitchenDesk' ? route.module : 'dashboard';

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [kdsModuleStation, setKdsModuleStation] = useState<KDSStation | null>(null);
  const [orderRouteLoading, setOrderRouteLoading] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);

  // Ospătar: mese și comandă din API
  const [waiterTables, setWaiterTables] = useState<Table[]>([]);
  const [waiterOrder, setWaiterOrder] = useState<OrderApi | null>(null);
  const [waiterTablesLoading, setWaiterTablesLoading] = useState(false);

  /** Stații KDS pentru modulul din dashboard (din kds_stations / API). */
  const [dashboardKdsStations, setDashboardKdsStations] = useState<KDSStation[]>(kdsStations);
  const [dashboardKdsLoading, setDashboardKdsLoading] = useState(false);

  const mapApiTableToTable = useCallback(
    (api: TableApi, fallbackPosition?: { x: number; y: number }): Table => ({
      id: api.id,
      number: api.number,
      seats: api.seats,
      status: api.status,
      position: normalizeTablePosition(api.position) ?? fallbackPosition ?? { x: 50, y: 50 },
      shape: api.shape,
      currentOrderId: api.currentOrderId ?? undefined,
      reservationId: api.reservationId ?? undefined,
      currentGuests: api.currentGuests,
      mergedWith: api.mergedWith ?? undefined,
      qrCode: api.qrCode ?? undefined,
    }),
    [],
  );

  /** Sincronizare hartă mese (drag/editor) cu state-ul ospătarului și DB. */
  const persistWaiterTableToStateAndApi = useCallback(
    async (t: Table) => {
      const pos = sanitizeTablePositionForApi(t.position);
      if (!pos) {
        toast({
          title: 'Poziție invalidă',
          description: 'Coordonatele mesei nu sunt numerice valide.',
          variant: 'destructive',
        });
        return;
      }
      setWaiterTables((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      try {
        await tablesApi.updateTable(t.id, {
          position: pos,
          number: t.number,
          seats: t.seats,
          shape: t.shape,
          status: t.status,
          ...(t.mergedWith !== undefined ? { mergedWith: t.mergedWith } : {}),
        });
      } catch {
        toast({
          title: 'Eroare la salvarea mesei',
          description: 'Verifică API-ul PATCH /tables/:id.',
          variant: 'destructive',
        });
        throw new Error('PATCH /tables/:id failed');
      }
    },
    [toast],
  );

  const createWaiterTableInApi = useCallback(
    async (draft: Omit<Table, 'id'>) => {
      try {
        const created = await tablesApi.createTable({
          number: draft.number,
          seats: draft.seats,
          shape: draft.shape,
          status: draft.status,
          position: { x: draft.position.x, y: draft.position.y },
        });
        setWaiterTables((prev) => [...prev, mapApiTableToTable(created)]);
      } catch {
        toast({
          title: 'Eroare la adăugarea mesei',
          description: 'Verifică API-ul POST /tables.',
          variant: 'destructive',
        });
      }
    },
    [mapApiTableToTable, toast],
  );

  useEffect(() => {
    if (route.kind === 'unknown') {
      router.replace(ROUTES.login);
    }
  }, [route.kind, router]);

  useEffect(() => {
    if (route.kind !== 'waiter') return;
    setWaiterTablesLoading(true);
    tablesApi
      .getTables()
      .then((list) => setWaiterTables(list.map((api) => mapApiTableToTable(api))))
      .catch(() => setWaiterTables([]))
      .finally(() => setWaiterTablesLoading(false));
  }, [route.kind, mapApiTableToTable]);

  useEffect(() => {
    if (route.kind !== 'dashboard' && route.kind !== 'kitchenDesk') return;
    setDashboardKdsLoading(true);
    menuApi
      .getKdsStations()
      .then((list) => {
        setDashboardKdsStations(
          list.length > 0 ? list.map(kdsStationApiToKdsStation) : kdsStations,
        );
      })
      .catch(() => setDashboardKdsStations(kdsStations))
      .finally(() => setDashboardKdsLoading(false));
  }, [route.kind]);

  /** Protecție `/dashboard` și `/admin`: doar rolul Administrator. */
  useEffect(() => {
    if (!staffSessionHydrated) return;
    if (route.kind !== 'dashboard') return;
    if (canAccessDashboardShell(currentUser)) return;
    if (currentUser) {
      toast({
        title: 'Acces refuzat',
        description: 'Zona Dashboard este disponibilă doar pentru Administrator.',
        variant: 'destructive',
      });
    }
    logout();
    router.replace(ROUTES.login);
  }, [staffSessionHydrated, route.kind, currentUser, router, logout, toast]);

  /** Protecție `/kitchen`: bucătărie sau același admin ca la dashboard. */
  useEffect(() => {
    if (!staffSessionHydrated) return;
    if (route.kind !== 'kitchenDesk') return;
    if (canAccessKitchenDesk(currentUser)) return;
    if (currentUser) {
      toast({
        title: 'Acces refuzat',
        description: 'Zona bucătărie necesită cont de bucătărie sau administrator.',
        variant: 'destructive',
      });
    }
    logout();
    router.replace(ROUTES.login);
  }, [staffSessionHydrated, route.kind, currentUser, router, logout, toast]);

  useEffect(() => {
    if (route.kind !== 'order') {
      setSelectedTable(null);
      setOrderRouteLoading(false);
      return;
    }
    const tableId = route.tableId;
    let cancelled = false;
    setOrderRouteLoading(true);
    Promise.all([tablesApi.getTable(tableId), ordersApi.getByTableId(tableId, getCurrentDateParam())])
      .then(([api, orderList]) => {
        if (cancelled) return;
        if (!api) {
          toast({ title: 'Masa nu există', variant: 'destructive' });
          router.replace(ROUTES.waiter);
          return;
        }
        setSelectedTable(mapApiTableToTable(api));
        const active = orderList.find((o) => o.status === 'active');
        setWaiterOrder(active ?? null);
      })
      .catch(() => {
        toast({
          title: 'Comanda nu s-a putut încărca',
          description: 'Verifică API-ul /orders.',
          variant: 'destructive',
        });
        router.replace(ROUTES.waiter);
      })
      .finally(() => {
        if (!cancelled) setOrderRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [route, router, toast, mapApiTableToTable]);

  useEffect(() => {
    if (route.kind === 'waiter') {
      setWaiterOrder(null);
    }
  }, [route.kind]);

  const refetchWaiterOrder = useCallback(() => {
    if (!selectedTable) return;
    return ordersApi.getByTableId(selectedTable.id, getCurrentDateParam()).then((list) => {
      const active = list.find((o) => o.status === 'active');
      setWaiterOrder(active ?? null);
    });
  }, [selectedTable]);

  // Swipe gesture for sidebar position on mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setSidebarPosition('right'),
    onSwipeRight: () => setSidebarPosition('left'),
    threshold: 75,
    enabled: sidebarOpen,
  });

  const handleLoginSuccess = (role: 'admin' | 'kitchen' | 'waiter') => {
    if (role === 'admin') {
      router.push(ROUTES.dashboard('dashboard'));
    } else if (role === 'kitchen') {
      router.push(ROUTES.kitchen('kds'));
    } else {
      router.push(ROUTES.waiter);
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedTable(null);
    setKdsModuleStation(null);
    router.push(ROUTES.login);
  };

  const handleTableSelect = (table: Table) => {
    router.push(ROUTES.order(table.id));
  };

  const handleOrderClose = () => {
    router.push(ROUTES.waiter);
  };

  // Render module content for new dashboard
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'reports':
        return <ReportsModule />;
      case 'stocks':
        return <StocksModule />;
      case 'pos':
        return <POSModule />;
      case 'kiosk':
        return <KioskModule />;
      case 'kds':
        if (kdsModuleStation) {
          return (
            <KDSEnhancedModule
              station={kdsModuleStation}
              onLogout={() => setKdsModuleStation(null)}
            />
          );
        }
        return (
          <div className="p-3 sm:p-6 h-full flex flex-col min-h-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex-shrink-0">KDS & Producție</h2>

            <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-muted-foreground flex-shrink-0">
              Stații KDS
            </h3>
            {dashboardKdsLoading ? (
              <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground mb-4 sm:mb-8">
                Se încarcă stațiile…
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8 flex-shrink-0">
                {dashboardKdsStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => setKdsModuleStation(station)}
                    className="p-3 sm:p-6 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:scale-105"
                  >
                    <span className="text-2xl sm:text-4xl block mb-1 sm:mb-3">{station.icon}</span>
                    <h3 className="font-bold text-xs sm:text-base">{station.name}</h3>
                  </button>
                ))}
              </div>
            )}

            <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-muted-foreground flex-shrink-0">Producție & Rețetar</h3>
            <div className="bg-card rounded-xl border overflow-hidden flex-1 min-h-0">
              <KDSProductionModule />
            </div>
          </div>
        );
      case 'delivery':
        return <DeliveryOrders />;
      case 'employees':
        return <HRModule />;
      case 'customers':
        return <CustomersModule />;
      case 'suppliers':
        return <SuppliersModule />;
      case 'ai':
        return <AIModule />;
      case 'admin':
        return <AdminConfigModule />;
      case 'branding':
        return <BrandingModule />;
      case 'subscriptions':
        return <SubscriptionsAdminModule />;
      case 'communication':
        return <CommunicationModule />;
      case 'offline':
        return <OfflineModeModule />;
      default: {
        const config = moduleConfig[activeModule];
        if (!config.icon) return null;
        return (
          <PlaceholderModule
            title={config.title}
            description={config.description}
            icon={config.icon}
            features={config.features}
          />
        );
      }
    }
  };

  if (route.kind === 'login') {
    return (
      <div className="min-h-screen flex flex-col">
        <LoginScreen onLoginSuccess={handleLoginSuccess} />

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 bg-card/90 backdrop-blur p-3 rounded-2xl border shadow-lg max-w-[95vw]">
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.kiosk} className="flex items-center gap-2">
              <Tablet className="w-4 h-4" />
              Kiosk Demo
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.selfOrder} className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Self-Order
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.dashboard('dashboard')} className="flex items-center gap-2">
              <MonitorIcon className="w-4 h-4" />
              Dashboard Nou
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.orderMonitor} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Monitorizare Comenzi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (route.kind === 'kiosk') {
    return (
      <div className="relative">
        <KioskModule />
        <Button variant="outline" className="fixed top-4 left-4 z-50" asChild>
          <Link href={ROUTES.login} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ieși
          </Link>
        </Button>
      </div>
    );
  }

  if (route.kind === 'self-order') {
    return (
      <div className="relative">
        <CustomerSelfOrder />
        <Button variant="outline" className="fixed top-4 left-4 z-50" asChild>
          <Link href={ROUTES.login} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ieși
          </Link>
        </Button>
      </div>
    );
  }

  if (route.kind === 'dashboard' || route.kind === 'kitchenDesk') {
    if (!staffSessionHydrated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          Se încarcă sesiunea…
        </div>
      );
    }
    const shellAllowed =
      route.kind === 'dashboard'
        ? canAccessDashboardShell(currentUser)
        : canAccessKitchenDesk(currentUser);
    if (!shellAllowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          Redirecționare la autentificare…
        </div>
      );
    }
    return (
      <MainLayout
        isOnline={true}
        restaurantName="Restaurant Demo"
        currentLocation="Locația Principală"
        onLogout={handleLogout}
      >
        {renderModule()}
      </MainLayout>
    );
  }

  if (route.kind === 'waiter') {
    const ReservationSidebar = (
      <div className={cn(
        "w-80 border-border bg-card flex flex-col h-full",
        sidebarPosition === 'left' ? "border-r" : "border-l"
      )}>
        <div className="p-2 border-b border-border flex items-center justify-between bg-muted/50">
          <span className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Rezervări
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')} title={sidebarPosition === 'left' ? 'Mută la dreapta' : 'Mută la stânga'}>
              {sidebarPosition === 'left' ? <PanelRightClose className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)} title="Închide">
              <ArrowLeft className={cn("w-4 h-4", sidebarPosition === 'right' && "rotate-180")} />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <ReservationManager
            reservations={reservations}
            tables={tables}
            onCreateReservation={createReservation}
            onUpdateReservation={updateReservation}
            onDeleteReservation={deleteReservation}
          />
        </div>
      </div>
    );

    return (
      <div className="h-screen flex flex-col" {...swipeHandlers}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <h1 className="font-semibold">RestoSoft - Ospătar ({currentUser?.name})</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="flex items-center gap-2">
              <UserCircleIcon className="w-4 h-4" />
              <span className="hidden md:inline">Profilul Meu</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCashRegister(true)} className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden md:inline">Casierie</span>
            </Button>
            <ExternalOrdersNotification orders={orders} onUpdateOrder={updateOrder} />
            <Button variant="outline" size="sm" onClick={() => setShowGlobalHistory(true)} className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden md:inline">Istoric</span>
            </Button>
            {!sidebarOpen && (
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)} className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rezervări
              </Button>
            )}
            <NotificationCenter notifications={notifications} onMarkRead={markNotificationRead} onClearAll={clearNotifications} />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {sidebarOpen && sidebarPosition === 'left' && <div className="hidden md:flex">{ReservationSidebar}</div>}
          <div className="flex-1 overflow-auto">
            {waiterTablesLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">Se încarcă mesele...</div>
            ) : (
              <TableMap
                tables={waiterTables}
                getActiveOrderForTable={waiterOrder ? (tableId) => (waiterOrder.tableId === tableId ? waiterOrder : undefined) : undefined}
                onTableSelect={handleTableSelect}
                onTableUpdated={persistWaiterTableToStateAndApi}
                onTableCreated={createWaiterTableInApi}
              />
            )}
          </div>
          {sidebarOpen && sidebarPosition === 'right' && <div className="hidden md:flex">{ReservationSidebar}</div>}
        </div>
        {!sidebarOpen && (
          <Button variant="outline" size="icon" className="fixed bottom-20 right-4 md:hidden h-12 w-12 rounded-full shadow-lg" onClick={() => setSidebarOpen(true)}>
            <Calendar className="w-5 h-5" />
          </Button>
        )}
        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button variant="outline" asChild>
            <Link href={ROUTES.dashboard('dashboard')} className="flex items-center gap-2">
              <MonitorIcon className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Deconectare
          </Button>
        </div>
        <OrderHistoryDialog open={showGlobalHistory} onClose={() => setShowGlobalHistory(false)} orders={orders} onUpdateOrder={updateOrder} />
        <WaiterProfileDialog open={showProfile} onClose={() => setShowProfile(false)} user={currentUser} orders={orders} onLogout={handleLogout} />
        <CashRegisterDialog open={showCashRegister} onClose={() => setShowCashRegister(false)} orders={orders} operatorName={currentUser?.name || 'Operator'} />
      </div>
    );
  }

  if (route.kind === 'order') {
    if (orderRouteLoading || !selectedTable) {
      return (
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Se încarcă comanda…
        </div>
      );
    }
    return (
      <div className="h-screen">
        <OrderPanel
          table={selectedTable}
          onClose={handleOrderClose}
          apiOrder={waiterOrder}
          refetchOrder={refetchWaiterOrder}
        />
      </div>
    );
  }

  if (route.kind === 'order-monitor') {
    const OrderMonitorDashboard = React.lazy(() => import('@/components/OrderMonitorDashboard'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Se încarcă...</div>}>
        <OrderMonitorDashboard onBack={() => router.push(ROUTES.login)} />
      </React.Suspense>
    );
  }

  return null;
};

const Index: React.FC = () => (
  <RestaurantProvider>
    <RestaurantApp />
  </RestaurantProvider>
);

export default Index;
