import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from '@/context/RestaurantContext';
import { Table, KDSStation, kdsStations } from '@/data/mockData';
import LoginScreen from '@/components/LoginScreen';
import TableMap from '@/components/TableMap';
import OrderPanel from '@/components/OrderPanel';
import AdminPanel from '@/components/AdminPanel';
import KDSDisplay from '@/components/KDSDisplay';
import NotificationCenter from '@/components/NotificationCenter';
import ReservationManager from '@/components/ReservationManager';
import DeliveryOrders from '@/components/DeliveryOrders';
import KioskOrdering from '@/components/KioskOrdering';
import CustomerSelfOrder from '@/components/CustomerSelfOrder';
import MainLayout, { ModuleType } from '@/components/layout/MainLayout';
import DashboardModule from '@/components/modules/DashboardModule';
import ReportsModule from '@/components/modules/ReportsModule';
import StocksModule from '@/components/modules/StocksModule';
import PlaceholderModule from '@/components/modules/PlaceholderModule';
import KDSModuleOptimized from '@/components/modules/KDSModuleOptimized';
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
  History
} from 'lucide-react';

type AppView = 'login' | 'waiter' | 'order' | 'admin' | 'kds-select' | 'kds' | 'kiosk' | 'self-order' | 'new-dashboard' | 'order-monitor';

const moduleConfig: Record<ModuleType, { title: string; description: string; icon: any; features: string[] }> = {
  dashboard: { title: '', description: '', icon: null, features: [] },
  pos: { title: 'RestoPOS', description: 'Sistem de vânzare complet', icon: ShoppingCart, features: ['Comenzi mese', 'La pachet', 'Telefonic', 'Vizualizare comenzi'] },
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

// KDS Selector component inline
const KDSSelectorInline: React.FC<{ onSelectStation: (station: KDSStation) => void; onBack: () => void }> = ({ onSelectStation, onBack }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b border-border">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la login
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <MonitorIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold">Selectează stația KDS</h1>
            <p className="text-muted-foreground mt-2">Alege stația de bucătărie pentru afișare</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {kdsStations.map(station => (
              <button
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={cn(
                  "p-8 rounded-2xl border-2 border-border transition-all",
                  "hover:border-primary hover:scale-105",
                  "bg-card"
                )}
              >
                <span className="text-5xl block mb-4">{station.icon}</span>
                <h2 className="text-xl font-bold">{station.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click pentru a deschide
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RestaurantApp: React.FC = () => {
  const { 
    currentUser, 
    logout, 
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
  
  const [view, setView] = useState<AppView>('login');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedStation, setSelectedStation] = useState<KDSStation | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [kdsModuleStation, setKdsModuleStation] = useState<KDSStation | null>(null);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);

  // Swipe gesture for sidebar position on mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setSidebarPosition('right'),
    onSwipeRight: () => setSidebarPosition('left'),
    threshold: 75,
    enabled: sidebarOpen,
  });

  const handleLoginSuccess = (role: 'admin' | 'kitchen' | 'waiter') => {
    if (role === 'admin') {
      setView('new-dashboard');
      setActiveModule('dashboard');
    } else if (role === 'kitchen') {
      // Kitchen staff goes to new dashboard with KDS module
      setView('new-dashboard');
      setActiveModule('kds');
    } else {
      setView('waiter');
    }
  };

  const handleLogout = () => {
    logout();
    setView('login');
    setSelectedTable(null);
    setSelectedStation(null);
    setKdsModuleStation(null);
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setView('order');
  };

  const handleOrderClose = () => {
    setSelectedTable(null);
    setView('waiter');
  };

  const handleKdsSelect = (station: KDSStation) => {
    setSelectedStation(station);
    setView('kds');
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
            
            {/* KDS Stations */}
            <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-muted-foreground flex-shrink-0">Stații KDS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8 flex-shrink-0">
              {kdsStations.map(station => (
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

            {/* Production Module */}
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
      default:
        const config = moduleConfig[activeModule];
        return (
          <PlaceholderModule
            title={config.title}
            description={config.description}
            icon={config.icon}
            features={config.features}
          />
        );
    }
  };

  // Main view switching
  if (view === 'login') {
    return (
      <div className="min-h-screen flex flex-col">
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        
        {/* Quick access buttons for demo */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-card/90 backdrop-blur p-3 rounded-2xl border shadow-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('kiosk')}
            className="flex items-center gap-2"
          >
            <Tablet className="w-4 h-4" />
            Kiosk Demo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('self-order')}
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Self-Order
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('new-dashboard')}
            className="flex items-center gap-2"
          >
            <MonitorIcon className="w-4 h-4" />
            Dashboard Nou
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('order-monitor')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Monitorizare Comenzi
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'kiosk') {
    return (
      <div className="relative">
        <KioskOrdering />
        <Button 
          variant="outline" 
          className="fixed top-4 left-4 z-50"
          onClick={() => setView('login')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ieși
        </Button>
      </div>
    );
  }

  if (view === 'self-order') {
    return (
      <div className="relative">
        <CustomerSelfOrder initialTableId="t1" />
        <Button 
          variant="outline" 
          className="fixed top-4 left-4 z-50"
          onClick={() => setView('login')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ieși
        </Button>
      </div>
    );
  }

  if (view === 'new-dashboard') {
    return (
      <MainLayout
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        isOnline={true}
        restaurantName="Restaurant Demo"
        currentLocation="Locația Principală"
        onLogout={() => setView('login')}
      >
        {renderModule()}
      </MainLayout>
    );
  }

  if (view === 'waiter' && !selectedTable) {
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')}
              title={sidebarPosition === 'left' ? 'Mută la dreapta' : 'Mută la stânga'}
            >
              {sidebarPosition === 'left' ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSidebarOpen(false)}
              title="Închide"
            >
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
          <h1 className="font-semibold">RestoPOS - Ospătar</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGlobalHistory(true)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">Istoric</span>
            </Button>
            {!sidebarOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Rezervări
              </Button>
            )}
            <NotificationCenter 
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onClearAll={clearNotifications}
            />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          {sidebarOpen && sidebarPosition === 'left' && (
            <div className="hidden md:flex">
              {ReservationSidebar}
            </div>
          )}
          
          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <TableMap onTableSelect={handleTableSelect} />
          </div>
          
          {/* Right sidebar */}
          {sidebarOpen && sidebarPosition === 'right' && (
            <div className="hidden md:flex">
              {ReservationSidebar}
            </div>
          )}
        </div>
        
        {/* Mobile reservation toggle */}
        {!sidebarOpen && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-20 right-4 md:hidden h-12 w-12 rounded-full shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Calendar className="w-5 h-5" />
          </Button>
        )}
        
        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setView('new-dashboard')}
            className="flex items-center gap-2"
          >
            <MonitorIcon className="w-4 h-4" />
            Dashboard
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Deconectare
          </Button>
        </div>

        <OrderHistoryDialog
          open={showGlobalHistory}
          onClose={() => setShowGlobalHistory(false)}
          orders={orders}
          onUpdateOrder={updateOrder}
        />
      </div>
    );
  }

  if (view === 'order' && selectedTable) {
    return (
      <div className="h-screen">
        <OrderPanel table={selectedTable} onClose={handleOrderClose} />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <MainLayout
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        isOnline={true}
        restaurantName="Restaurant Demo"
        currentLocation="Locația Principală"
        onLogout={handleLogout}
      >
        {renderModule()}
      </MainLayout>
    );
  }

  // Old KDS views removed - now using new dashboard KDS module

  if (view === 'order-monitor') {
    const OrderMonitorDashboard = React.lazy(() => import('@/components/OrderMonitorDashboard'));
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Se încarcă...</div>}>
        <OrderMonitorDashboard onBack={() => setView('login')} />
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
