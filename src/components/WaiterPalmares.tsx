import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import TableMap from './TableMap';
import OrderPanel from './OrderPanel';
import DeliveryOrders from './DeliveryOrders';
import NotificationCenter from './NotificationCenter';
import { Table, Order, OrderItem } from '@/data/mockData';
import { LogOut, User, Bell, Clock, Check, ChefHat, Truck, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WaiterPalmaresProps {
  onLogout: () => void;
}

const WaiterPalmares: React.FC<WaiterPalmaresProps> = ({ onLogout }) => {
  const { currentUser, orders, notifications, markNotificationRead, clearNotifications, tables } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [view, setView] = useState<'map' | 'orders' | 'delivery'>('map');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const myOrders = orders.filter(o => o.waiterId === currentUser?.id && o.status === 'active');
  const readyItems = myOrders.flatMap(o => 
    o.items.filter(i => i.status === 'ready').map(i => ({ order: o, item: i }))
  );

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-muted-foreground" />;
      case 'cooking': return <ChefHat className="w-3 h-3 text-warning" />;
      case 'ready': return <Check className="w-3 h-3 text-success" />;
      case 'served': return <Check className="w-3 h-3 text-primary" />;
    }
  };

  const getStatusLabel = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return 'Așteptare';
      case 'cooking': return 'Preparare';
      case 'ready': return 'Gata';
      case 'served': return 'Servit';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm md:text-base">
            {currentUser?.avatar}
          </div>
          <div className="hidden sm:block">
            <p className="font-semibold text-sm">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">Ospătar</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {readyItems.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="relative border-success text-success text-xs md:text-sm"
            >
              <Bell className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{readyItems.length} gata</span>
              <span className="sm:hidden">{readyItems.length}</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-success rounded-full animate-pulse" />
            </Button>
          )}
          <NotificationCenter
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onClearAll={clearNotifications}
          />
          <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 md:h-10 md:w-10">
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setView('map')}
          className={cn(
            "flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2",
            view === 'map' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <MapPin className="w-3 h-3 md:w-4 md:h-4" />
          Harta
        </button>
        <button
          onClick={() => setView('orders')}
          className={cn(
            "flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors relative flex items-center justify-center gap-1 md:gap-2",
            view === 'orders' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <Clock className="w-3 h-3 md:w-4 md:h-4" />
          Comenzi
          {myOrders.length > 0 && (
            <span className={cn(
              "w-5 h-5 rounded-full text-xs flex items-center justify-center",
              view === 'orders' ? "bg-primary-foreground text-primary" : "bg-accent text-accent-foreground"
            )}>
              {myOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('delivery')}
          className={cn(
            "flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2",
            view === 'delivery' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <Truck className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Livrări</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedTable ? (
          <OrderPanel table={selectedTable} onClose={() => setSelectedTable(null)} />
        ) : view === 'delivery' ? (
          <DeliveryOrders />
        ) : view === 'map' ? (
          <TableMap onTableSelect={setSelectedTable} />
        ) : (
          /* Orders List */
          <div className="h-full overflow-auto p-3 md:p-4">
            {myOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nu ai comenzi active
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderDetails(order)}
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">
                        {order.tableNumber ? `Masa ${order.tableNumber}` : order.customerName}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {order.totalAmount.toFixed(2)} RON
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.slice(0, 4).map(item => (
                        <span
                          key={item.id}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                            item.status === 'pending' && "bg-muted text-muted-foreground",
                            item.status === 'cooking' && "bg-warning/20 text-warning",
                            item.status === 'ready' && "bg-success/20 text-success"
                          )}
                        >
                          {getStatusIcon(item.status)}
                          <span className="truncate max-w-[80px]">{item.menuItem.name}</span>
                        </span>
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{order.items.length - 4} mai multe
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrderDetails?.tableNumber 
                ? `Masa ${selectedOrderDetails.tableNumber}` 
                : selectedOrderDetails?.customerName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {selectedOrderDetails?.items.map(item => (
              <div
                key={item.id}
                className={cn(
                  "p-3 rounded-lg border",
                  item.status === 'ready' && "border-success bg-success/5",
                  item.status === 'cooking' && "border-warning bg-warning/5",
                  item.status === 'pending' && "border-border"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {item.quantity}x {item.menuItem.name}
                    </p>
                    {(item.modifications.added.length > 0 || item.modifications.removed.length > 0) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.modifications.added.map(a => `+${a}`).join(', ')}
                        {item.modifications.added.length > 0 && item.modifications.removed.length > 0 && ', '}
                        {item.modifications.removed.map(r => `-${r}`).join(', ')}
                      </p>
                    )}
                    {item.modifications.notes && (
                      <p className="text-xs text-muted-foreground italic">"{item.modifications.notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-xs text-muted-foreground">{getStatusLabel(item.status)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-border">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{selectedOrderDetails?.totalAmount.toFixed(2)} RON</span>
              </div>
            </div>

            {selectedOrderDetails?.tableNumber && (
              <Button 
                className="w-full"
                onClick={() => {
                  const table = tables.find(t => t.number === selectedOrderDetails.tableNumber);
                  if (table) {
                    setSelectedOrderDetails(null);
                    setSelectedTable(table);
                  }
                }}
              >
                Deschide comanda
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaiterPalmares;
