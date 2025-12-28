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
import POSModule from '@/components/modules/POSModule';
import KioskModule from '@/components/modules/KioskModule';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  ArrowLeft
} from 'lucide-react';

type AppView = 'login' | 'waiter' | 'order' | 'admin' | 'kds-select' | 'kds' | 'kiosk' | 'self-order' | 'new-dashboard';

const moduleConfig: Record<ModuleType, { title: string; description: string; icon: any; features: string[] }> = {
  dashboard: { title: '', description: '', icon: null, features: [] },
  pos: { title: 'POS / Casă', description: 'Sistem de vânzare pentru ospătari și casieri', icon: ShoppingCart, features: ['Comenzi rapide', 'Plăți multiple', 'Bon fiscal'] },
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
    createReservation,
    updateReservation,
    deleteReservation
  } = useRestaurant();
  
  const [view, setView] = useState<AppView>('login');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedStation, setSelectedStation] = useState<KDSStation | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [kdsModuleStation, setKdsModuleStation] = useState<KDSStation | null>(null);

  const handleLoginSuccess = () => {
    if (currentUser?.role === 'admin') {
      setView('admin');
    } else if (currentUser?.role === 'kitchen') {
      setView('kds-select');
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
            <KDSModuleOptimized 
              station={kdsModuleStation}
              onLogout={() => setKdsModuleStation(null)}
            />
          );
        }
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Selectează stația KDS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kdsStations.map(station => (
                <button
                  key={station.id}
                  onClick={() => setKdsModuleStation(station)}
                  className="p-6 rounded-xl border-2 border-border hover:border-primary transition-all bg-card hover:scale-105"
                >
                  <span className="text-4xl block mb-3">{station.icon}</span>
                  <h3 className="font-bold">{station.name}</h3>
                </button>
              ))}
            </div>
          </div>
        );
      case 'delivery':
        return <DeliveryOrders />;
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
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <h1 className="font-semibold">RestoPOS - Ospătar</h1>
          <NotificationCenter 
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onClearAll={clearNotifications}
          />
        </div>
        <div className="flex-1 flex">
          <div className="flex-1">
            <TableMap onTableSelect={handleTableSelect} />
          </div>
          <div className="w-80 border-l border-border hidden lg:block">
            <ReservationManager 
              reservations={reservations}
              tables={tables}
              onCreateReservation={createReservation}
              onUpdateReservation={updateReservation}
              onDeleteReservation={deleteReservation}
            />
          </div>
        </div>
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
      <div className="h-screen flex flex-col">
        <div className="flex-1">
          <AdminPanel onLogout={handleLogout} />
        </div>
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            onClick={() => setView('new-dashboard')}
            className="flex items-center gap-2"
          >
            <MonitorIcon className="w-4 h-4" />
            Dashboard Nou
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'kds-select') {
    return (
      <KDSSelectorInline 
        onSelectStation={handleKdsSelect}
        onBack={handleLogout}
      />
    );
  }

  if (view === 'kds' && selectedStation) {
    return (
      <KDSDisplay 
        station={selectedStation} 
        onLogout={() => {
          setSelectedStation(null);
          setView('kds-select');
        }} 
      />
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
