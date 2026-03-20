import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kdsStations, KDSStation } from '@/data/mockData';
import MainLayout, { ModuleType } from '@/components/layout/MainLayout';
import DashboardModule from '@/components/modules/DashboardModule';
import ReportsModule from '@/components/modules/ReportsModule';
import StocksModule from '@/components/modules/StocksModule';
import POSModule from '@/components/modules/POSModule';
import KioskModule from '@/components/modules/KioskModule';
import KDSEnhancedModule from '@/components/modules/KDSEnhancedModule';
import KDSProductionModule from '@/components/modules/KDSProductionModule';
import HRModule from '@/components/modules/HRModule';
import CustomersModule from '@/components/modules/CustomersModule';
import SuppliersModule from '@/components/modules/SuppliersModule';
import AIModule from '@/components/modules/AIModule';
import AdminConfigModule from '@/components/modules/AdminConfigModule';
import BrandingModule from '@/components/modules/BrandingModule';
import SubscriptionsAdminModule from '@/components/modules/SubscriptionsAdminModule';
import CommunicationModule from '@/components/modules/CommunicationModule';
import OfflineModeModule from '@/components/modules/OfflineModeModule';
import DeliveryOrders from '@/components/DeliveryOrders';
import PlaceholderModule from '@/components/modules/PlaceholderModule';
import {
  ShoppingCart, Store, UtensilsCrossed, Users, FileText,
  Building2, UserCircle, Truck, Bot, Settings, Palette,
  CreditCard, MessageSquare, Wifi
} from 'lucide-react';

const moduleConfig: Record<string, { title: string; description: string; icon: any; features: string[] }> = {
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

const AdminPage: React.FC = () => {
  const { module } = useParams<{ module: string }>();
  const navigate = useNavigate();
  const [kdsModuleStation, setKdsModuleStation] = useState<KDSStation | null>(null);

  const activeModule = (module || 'dashboard') as ModuleType;

  const handleModuleChange = (mod: ModuleType) => {
    navigate(`/admin/${mod}`);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardModule />;
      case 'reports': return <ReportsModule />;
      case 'stocks': return <StocksModule />;
      case 'pos': return <POSModule />;
      case 'kiosk': return <KioskModule />;
      case 'kds':
        if (kdsModuleStation) {
          return <KDSEnhancedModule station={kdsModuleStation} onLogout={() => setKdsModuleStation(null)} />;
        }
        return (
          <div className="p-3 sm:p-6 h-full flex flex-col min-h-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex-shrink-0">KDS & Producție</h2>
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
            <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-muted-foreground flex-shrink-0">Producție & Rețetar</h3>
            <div className="bg-card rounded-xl border overflow-hidden flex-1 min-h-0">
              <KDSProductionModule />
            </div>
          </div>
        );
      case 'delivery': return <DeliveryOrders />;
      case 'employees': return <HRModule />;
      case 'customers': return <CustomersModule />;
      case 'suppliers': return <SuppliersModule />;
      case 'ai': return <AIModule />;
      case 'admin': return <AdminConfigModule />;
      case 'branding': return <BrandingModule />;
      case 'subscriptions': return <SubscriptionsAdminModule />;
      case 'communication': return <CommunicationModule />;
      case 'offline': return <OfflineModeModule />;
      default: {
        const config = moduleConfig[activeModule];
        if (!config) return <DashboardModule />;
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

  return (
    <MainLayout
      activeModule={activeModule}
      onModuleChange={handleModuleChange}
      isOnline={true}
      restaurantName="Restaurant Demo"
      currentLocation="Locația Principală"
      onLogout={() => navigate('/')}
    >
      {renderModule()}
    </MainLayout>
  );
};

export default AdminPage;
