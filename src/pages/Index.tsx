import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from '@/context/RestaurantContext';
import LoginScreen from '@/components/LoginScreen';
import WaiterPalmares from '@/components/WaiterPalmares';
import AdminPanel from '@/components/AdminPanel';
import KDSDisplay from '@/components/KDSDisplay';
import KDSSelector from '@/components/KDSSelector';
import OrderStatusMonitor from '@/components/OrderStatusMonitor';
import KioskOrdering from '@/components/KioskOrdering';
import CustomerSelfOrder from '@/components/CustomerSelfOrder';
import { kdsStations } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone, ArrowLeft } from 'lucide-react';

type AppMode = 'staff' | 'monitor' | 'kiosk' | 'customer';

const RestaurantApp: React.FC = () => {
  const { currentUser, logout } = useRestaurant();
  const [selectedKDSStation, setSelectedKDSStation] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('staff');
  const [monitorType, setMonitorType] = useState<'restaurant' | 'delivery'>('restaurant');

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setSelectedKDSStation(null);
  };

  // Mode Selection
  if (appMode !== 'staff') {
    return (
      <div className="relative">
        {/* Home button - positioned in a non-overlapping corner */}
        <div className="fixed bottom-4 right-4 z-[60]">
          <Button 
            variant="default" 
            size="lg" 
            className="shadow-lg"
            onClick={() => setAppMode('staff')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Acasă
          </Button>
        </div>
        {appMode === 'monitor' && <OrderStatusMonitor mode={monitorType} />}
        {appMode === 'kiosk' && <KioskOrdering />}
        {appMode === 'customer' && <CustomerSelfOrder />}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
        {/* Quick access buttons */}
        <div className="fixed bottom-4 left-4 right-4 flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => { setAppMode('monitor'); setMonitorType('restaurant'); }}>
            <Monitor className="w-4 h-4 mr-2" />Monitor
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAppMode('kiosk')}>
            <Tablet className="w-4 h-4 mr-2" />Kiosk
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAppMode('customer')}>
            <Smartphone className="w-4 h-4 mr-2" />Client
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (currentUser.role === 'kitchen') {
    if (!selectedKDSStation) {
      return <KDSSelector onSelectStation={setSelectedKDSStation} onBack={handleLogout} />;
    }
    const station = kdsStations.find(s => s.id === selectedKDSStation);
    if (!station) return null;
    return <KDSDisplay station={station} onLogout={handleLogout} />;
  }

  return <WaiterPalmares onLogout={handleLogout} />;
};

const Index: React.FC = () => (
  <RestaurantProvider>
    <RestaurantApp />
  </RestaurantProvider>
);

export default Index;
