import React, { useState } from 'react';
import { RestaurantProvider } from '@/context/RestaurantContext';
import MainLayout, { ModuleType } from '@/components/layout/MainLayout';
import DashboardModule from '@/components/modules/DashboardModule';
import ReportsModule from '@/components/modules/ReportsModule';
import StocksModule from '@/components/modules/StocksModule';
import PlaceholderModule from '@/components/modules/PlaceholderModule';
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
  MessageSquare 
} from 'lucide-react';

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

const RestaurantApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'reports':
        return <ReportsModule />;
      case 'stocks':
        return <StocksModule />;
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

  return (
    <MainLayout
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      isOnline={true}
      restaurantName="Restaurant Demo"
      currentLocation="Locația Principală"
      onLogout={() => {}}
    >
      {renderModule()}
    </MainLayout>
  );
};

const Index: React.FC = () => (
  <RestaurantProvider>
    <RestaurantApp />
  </RestaurantProvider>
);

export default Index;