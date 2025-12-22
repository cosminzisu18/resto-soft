import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import TableMap from './TableMap';
import OrderPanel from './OrderPanel';
import DeliveryOrders from './DeliveryOrders';
import NotificationCenter from './NotificationCenter';
import { Table, Order, OrderItem } from '@/data/mockData';
import { LogOut, User, Bell, Clock, Check, ChefHat, Truck, Phone, MapPin, Edit2, CalendarDays, Plus, X, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import useNotificationSound from '@/hooks/useNotificationSound';

interface WaiterPalmaresProps {
  onLogout: () => void;
}

const WaiterPalmares: React.FC<WaiterPalmaresProps> = ({ onLogout }) => {
  const { currentUser, orders, notifications, markNotificationRead, clearNotifications, tables, updateOrder, createReservation } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [view, setView] = useState<'map' | 'orders' | 'delivery' | 'reservations'>('map');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    partySize: '2',
    tableIds: [] as string[],
    notes: '',
  });
  const { toast } = useToast();
  const { playOrderReady, playNewOrder, setEnabled, initAudioContext } = useNotificationSound();
  
  // Track previous notifications count to detect new ones
  const prevNotificationsRef = useRef<number>(0);
  const prevReadyItemsRef = useRef<number>(0);

  const myOrders = orders.filter(o => o.waiterId === currentUser?.id && o.status === 'active');
  const readyItems = myOrders.flatMap(o => 
    o.items.filter(i => i.status === 'ready').map(i => ({ order: o, item: i }))
  );

  // Play sound when new ready items appear
  useEffect(() => {
    if (readyItems.length > prevReadyItemsRef.current && soundEnabled) {
      playOrderReady();
      toast({
        title: '🔔 Preparat gata!',
        description: `${readyItems.length - prevReadyItemsRef.current} preparat(e) gata de servit`,
      });
    }
    prevReadyItemsRef.current = readyItems.length;
  }, [readyItems.length, soundEnabled, playOrderReady, toast]);

  // Play sound for new notifications
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > prevNotificationsRef.current && soundEnabled) {
      const latestNotification = notifications[0];
      if (latestNotification && !latestNotification.read) {
        if (latestNotification.type === 'order_ready') {
          playOrderReady();
        } else if (latestNotification.type === 'new_order') {
          playNewOrder();
        }
      }
    }
    prevNotificationsRef.current = unreadCount;
  }, [notifications, soundEnabled, playOrderReady, playNewOrder]);

  // Toggle sound and initialize audio context
  const toggleSound = () => {
    if (!soundEnabled) {
      initAudioContext(); // Initialize on first enable (requires user interaction)
    }
    setSoundEnabled(!soundEnabled);
    setEnabled(!soundEnabled);
  };

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
              onClick={() => {
                if (readyItems.length > 0) {
                  const firstReady = readyItems[0];
                  setSelectedOrderDetails(firstReady.order);
                }
              }}
            >
              <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{readyItems.length} gata</span>
              <span className="sm:hidden">{readyItems.length}</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-success rounded-full animate-pulse" />
            </Button>
          )}
          {/* Sound toggle button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSound}
            className={cn("h-8 w-8 md:h-10 md:w-10", soundEnabled ? "text-primary" : "text-muted-foreground")}
            title={soundEnabled ? "Dezactivează sunetele" : "Activează sunetele"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>
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
        <button
          onClick={() => setView('reservations')}
          className={cn(
            "flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2",
            view === 'reservations' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Rezervări</span>
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
        ) : view === 'reservations' ? (
          /* Reservations View */
          <div className="h-full overflow-auto p-3 md:p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Rezervări</h2>
              <Button size="sm" onClick={() => setShowAddReservation(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Rezervă masă
              </Button>
            </div>
            
            {/* Available tables for reservation */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Mese libere</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {tables.filter(t => t.status === 'free').map(table => (
                  <button
                    key={table.id}
                    onClick={() => {
                      setReservationForm(prev => ({
                        ...prev,
                        tableIds: prev.tableIds.includes(table.id)
                          ? prev.tableIds.filter(id => id !== table.id)
                          : [...prev.tableIds, table.id]
                      }));
                      setShowAddReservation(true);
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all",
                      reservationForm.tableIds.includes(table.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="font-bold text-lg">{table.number}</span>
                    <p className="text-xs text-muted-foreground">{table.seats} loc.</p>
                  </button>
                ))}
              </div>
              {tables.filter(t => t.status === 'free').length === 0 && (
                <p className="text-muted-foreground text-sm">Nu există mese libere momentan</p>
              )}
            </div>

            {/* Reserved tables */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Mese rezervate</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {tables.filter(t => t.status === 'reserved').map(table => (
                  <div
                    key={table.id}
                    className="p-3 rounded-lg border-2 border-amber-500 bg-amber-500/10 text-center"
                  >
                    <span className="font-bold text-lg">{table.number}</span>
                    <p className="text-xs text-amber-600">Rezervat</p>
                  </div>
                ))}
              </div>
              {tables.filter(t => t.status === 'reserved').length === 0 && (
                <p className="text-muted-foreground text-sm">Nu există rezervări active</p>
              )}
            </div>
          </div>
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
            {selectedOrderDetails?.items.map(item => {
              const canEdit = item.status === 'pending';
              
              return (
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
                    <div className="flex-1">
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
                      
                      {/* Ingredients/Allergens info */}
                      {item.menuItem.ingredients && item.menuItem.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-secondary/50 rounded">
                          <span className="font-medium">Conține:</span> {item.menuItem.ingredients.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-xs text-muted-foreground">{getStatusLabel(item.status)}</span>
                      </div>
                      {canEdit && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Remove item from order
                            if (selectedOrderDetails) {
                              const updatedItems = selectedOrderDetails.items.filter(i => i.id !== item.id);
                              const totalAmount = updatedItems.reduce((sum, i) => sum + (i.menuItem.price * i.quantity), 0);
                              updateOrder({ ...selectedOrderDetails, items: updatedItems, totalAmount });
                              setSelectedOrderDetails({ ...selectedOrderDetails, items: updatedItems, totalAmount });
                              toast({ title: 'Produs eliminat din comandă' });
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Șterge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

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
                <Edit2 className="w-4 h-4 mr-2" />
                Modifică comanda
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reservation Dialog */}
      <Dialog open={showAddReservation} onOpenChange={setShowAddReservation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rezervă masă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nume client</label>
                <Input value={reservationForm.customerName} onChange={e => setReservationForm({...reservationForm, customerName: e.target.value})} placeholder="Ion Popescu" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input value={reservationForm.customerPhone} onChange={e => setReservationForm({...reservationForm, customerPhone: e.target.value})} placeholder="0740..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input type="date" value={reservationForm.date} onChange={e => setReservationForm({...reservationForm, date: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Ora</label>
                <Input type="time" value={reservationForm.time} onChange={e => setReservationForm({...reservationForm, time: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Persoane</label>
                <Input type="number" value={reservationForm.partySize} onChange={e => setReservationForm({...reservationForm, partySize: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mese selectate</label>
              <div className="flex flex-wrap gap-2">
                {reservationForm.tableIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Selectează mese de pe harta de mai sus</p>
                ) : (
                  reservationForm.tableIds.map(id => {
                    const table = tables.find(t => t.id === id);
                    return (
                      <span key={id} className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm flex items-center gap-1">
                        Masa {table?.number}
                        <button onClick={() => setReservationForm({...reservationForm, tableIds: reservationForm.tableIds.filter(t => t !== id)})}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Input value={reservationForm.notes} onChange={e => setReservationForm({...reservationForm, notes: e.target.value})} placeholder="Ex: aniversare, fereastră..." />
            </div>
            <Button 
              className="w-full" 
              disabled={!reservationForm.customerName || !reservationForm.customerPhone || reservationForm.tableIds.length === 0}
              onClick={() => {
                createReservation({
                  customerName: reservationForm.customerName,
                  customerPhone: reservationForm.customerPhone,
                  date: new Date(reservationForm.date),
                  time: reservationForm.time,
                  partySize: parseInt(reservationForm.partySize),
                  tableIds: reservationForm.tableIds,
                  status: 'confirmed',
                  notes: reservationForm.notes,
                  source: 'walk-in',
                });
                toast({ title: 'Rezervare creată cu succes' });
                setShowAddReservation(false);
                setReservationForm({ customerName: '', customerPhone: '', date: new Date().toISOString().split('T')[0], time: '19:00', partySize: '2', tableIds: [], notes: '' });
              }}
            >
              Creează rezervarea
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaiterPalmares;
