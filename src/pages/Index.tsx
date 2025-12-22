import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from '@/context/RestaurantContext';
import LoginScreen from '@/components/LoginScreen';
import WaiterPalmares from '@/components/WaiterPalmares';
import AdminPanel from '@/components/AdminPanel';
import KDSDisplay from '@/components/KDSDisplay';
import KDSSelector from '@/components/KDSSelector';
import { kdsStations } from '@/data/mockData';

const RestaurantApp: React.FC = () => {
  const { currentUser, logout } = useRestaurant();
  const [selectedKDSStation, setSelectedKDSStation] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setSelectedKDSStation(null);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Admin view
  if (currentUser.role === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  // Kitchen view - select station first
  if (currentUser.role === 'kitchen') {
    if (!selectedKDSStation) {
      return (
        <KDSSelector 
          onSelectStation={setSelectedKDSStation}
          onBack={handleLogout}
        />
      );
    }
    
    const station = kdsStations.find(s => s.id === selectedKDSStation);
    if (!station) return null;
    
    return <KDSDisplay station={station} onLogout={handleLogout} />;
  }

  // Waiter view
  return <WaiterPalmares onLogout={handleLogout} />;
};

const Index: React.FC = () => {
  return (
    <RestaurantProvider>
      <RestaurantApp />
    </RestaurantProvider>
  );
};

export default Index;
