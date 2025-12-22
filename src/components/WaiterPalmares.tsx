import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import TableMap from './TableMap';
import OrderPanel from './OrderPanel';
import { Table } from '@/data/mockData';
import { LogOut, User, Bell, Clock, Check, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaiterPalmaresProps {
  onLogout: () => void;
}

const WaiterPalmares: React.FC<WaiterPalmaresProps> = ({ onLogout }) => {
  const { currentUser, orders } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [view, setView] = useState<'map' | 'orders'>('map');

  const myOrders = orders.filter(o => o.waiterId === currentUser?.id && o.status === 'active');
  const readyItems = myOrders.flatMap(o => 
    o.items.filter(i => i.status === 'ready').map(i => ({ order: o, item: i }))
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {currentUser?.avatar}
          </div>
          <div>
            <p className="font-semibold text-sm">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">Ospătar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {readyItems.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="relative border-success text-success"
            >
              <Bell className="w-4 h-4 mr-1" />
              {readyItems.length} gata
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* View Toggle - Mobile */}
      <div className="flex border-b border-border md:hidden">
        <button
          onClick={() => setView('map')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            view === 'map' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          Harta mese
        </button>
        <button
          onClick={() => setView('orders')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            view === 'orders' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
        >
          Comenzile mele
          {myOrders.length > 0 && (
            <span className="absolute top-1 right-4 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center">
              {myOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {selectedTable ? (
          <OrderPanel table={selectedTable} onClose={() => setSelectedTable(null)} />
        ) : (
          <>
            {/* Table Map */}
            <div className={cn(
              "flex-1 overflow-hidden",
              view !== 'map' && "hidden md:block"
            )}>
              <TableMap onTableSelect={setSelectedTable} />
            </div>

            {/* Orders Sidebar */}
            <div className={cn(
              "w-full md:w-80 bg-card border-l border-border overflow-auto",
              view !== 'orders' && "hidden md:block"
            )}>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Comenzile mele</h3>
              </div>

              {myOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nu ai comenzi active
                </p>
              ) : (
                <div className="p-3 space-y-3">
                  {myOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => {
                        const table = { id: order.tableId, number: order.tableNumber } as Table;
                        setSelectedTable(table);
                      }}
                      className="w-full p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Masa {order.tableNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.totalAmount.toFixed(2)} RON
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {order.items.map(item => (
                          <span
                            key={item.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded-full flex items-center gap-1",
                              item.status === 'pending' && "bg-muted text-muted-foreground",
                              item.status === 'cooking' && "bg-warning/20 text-warning",
                              item.status === 'ready' && "bg-success/20 text-success"
                            )}
                          >
                            {item.status === 'pending' && <Clock className="w-3 h-3" />}
                            {item.status === 'cooking' && <ChefHat className="w-3 h-3" />}
                            {item.status === 'ready' && <Check className="w-3 h-3" />}
                            {item.menuItem.name}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WaiterPalmares;
