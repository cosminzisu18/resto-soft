import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/context/RestaurantContext';
import { Table } from '@/data/mockData';
import TableMap from '@/components/TableMap';
import NotificationCenter from '@/components/NotificationCenter';
import ReservationManager from '@/components/ReservationManager';
import OrderHistoryDialog from '@/components/OrderHistoryDialog';
import WaiterProfileDialog from '@/components/WaiterProfileDialog';
import CashRegisterDialog from '@/components/CashRegisterDialog';
import ExternalOrdersNotification from '@/components/ExternalOrdersNotification';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import {
  Monitor as MonitorIcon,
  ArrowLeft,
  PanelLeftClose,
  PanelRightClose,
  Calendar,
  History,
  UserCircle as UserCircleIcon,
  Calculator
} from 'lucide-react';

const WaiterPage: React.FC = () => {
  const navigate = useNavigate();
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

  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => setSidebarPosition('right'),
    onSwipeRight: () => setSidebarPosition('left'),
    threshold: 75,
    enabled: sidebarOpen,
  });

  const handleTableSelect = (table: Table) => {
    navigate(`/waiter/table/${table.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            {sidebarPosition === 'left' ? <PanelRightClose className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
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
          <NotificationCenter
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onClearAll={clearNotifications}
          />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && sidebarPosition === 'left' && (
          <div className="hidden md:flex">{ReservationSidebar}</div>
        )}
        <div className="flex-1 overflow-auto">
          <TableMap onTableSelect={handleTableSelect} />
        </div>
        {sidebarOpen && sidebarPosition === 'right' && (
          <div className="hidden md:flex">{ReservationSidebar}</div>
        )}
      </div>

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
        <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2">
          <MonitorIcon className="w-4 h-4" />
          Dashboard
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
};

export default WaiterPage;
