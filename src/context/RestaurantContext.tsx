import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  User, Table, MenuItem, Order, OrderItem, KDSStation, Reservation, Notification, OrderSource,
  users as defaultDirectoryUsers,
  initialTables, menuItems, kdsStations, sampleOrders, sampleNotifications, deliveryPlatforms
} from '@/data/mockData';
import { orderItemMatchesKdsStation } from '@/lib/kdsUtils';
import { usersApi, userApiToUser } from '@/lib/api';

interface RestaurantContextType {
  // Auth
  currentUser: User | null;
  /** Conturi pentru login și liste (ospătari/bucătărie); sincronizat cu GET /users când API-ul răspunde. */
  directoryUsers: User[];
  refreshDirectoryUsers: () => Promise<void>;
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
  /** `true` după ce s-a citit sesiunea din storage (pentru guard-uri la rute, fără flash). */
  staffSessionHydrated: boolean;
  
  // Tables
  tables: Table[];
  updateTable: (table: Table) => void;
  addTable: (table: Omit<Table, 'id'>) => void;
  deleteTable: (tableId: number) => void;
  
  // Menu
  menu: MenuItem[];
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (itemId: string) => void;
  
  // Orders
  orders: Order[];
  createOrder: (tableId?: number, source?: OrderSource) => Order;
  updateOrder: (order: Order) => void;
  addItemToOrder: (orderId: string, menuItem: MenuItem, quantity: number, modifications?: OrderItem['modifications']) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  completeOrder: (orderId: string, tip?: number, cui?: string) => void;
  getActiveOrderForTable: (tableId: number) => Order | undefined;
  createDeliveryOrder: (source: OrderSource, customerInfo: { name: string; phone: string; address?: string; platformOrderId?: string }) => Order;
  
  // Reservations
  reservations: Reservation[];
  createReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
  updateReservation: (reservation: Reservation) => void;
  deleteReservation: (id: number) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
// KDS
  kdsStations: KDSStation[];
  addKdsStation: (station: Omit<KDSStation, 'id'>) => void;
  updateKdsStation: (station: KDSStation) => void;
  deleteKdsStation: (stationId: string) => void;
  getOrdersForStation: (station: KDSStation) => { order: Order; items: OrderItem[] }[];
  
  // Delivery
  getDeliveryOrders: () => Order[];
  getPhoneOrders: () => Order[];
}

const STAFF_USER_STORAGE_KEY = 'giurom_staff_user';

const readStoredStaffUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STAFF_USER_STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    return u?.id ? u : null;
  } catch {
    return null;
  }
};

const persistStaffUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STAFF_USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(STAFF_USER_STORAGE_KEY, JSON.stringify(user));
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>(defaultDirectoryUsers);
  const [directoryUsersFetchDone, setDirectoryUsersFetchDone] = useState(false);
  const [staffSessionHydrated, setStaffSessionHydrated] = useState(false);

  useEffect(() => {
    usersApi
      .list()
      .then((list) => {
        setDirectoryUsers(list.map(userApiToUser));
      })
      .catch(() => {
        /* rămân utilizatorii mock din defaultDirectoryUsers dacă API indisponibil */
      })
      .finally(() => setDirectoryUsersFetchDone(true));
  }, []);

  /** Restaurare sesiune după refresh — înainte ca GET /users să termine, chat-ul poate folosi snapshot-ul salvat. */
  useEffect(() => {
    const stored = readStoredStaffUser();
    if (stored) setCurrentUser(stored);
    setStaffSessionHydrated(true);
  }, []);

  /** După ce lista de utilizatori e stabilă (mock sau API), aliniază contul curent la sursa canonică sau deloghează dacă nu mai există. */
  useEffect(() => {
    if (!directoryUsersFetchDone) return;
    setCurrentUser((prev) => {
      if (!prev) return null;
      const canonical = directoryUsers.find((u) => String(u.id) === String(prev.id));
      if (canonical) {
        persistStaffUser(canonical);
        return canonical;
      }
      persistStaffUser(null);
      return null;
    });
  }, [directoryUsers, directoryUsersFetchDone]);

  const refreshDirectoryUsers = useCallback(async () => {
    try {
      const list = await usersApi.list();
      setDirectoryUsers(list.map(userApiToUser));
    } catch {
      /* ignoră */
    }
  }, []);

  const [tables, setTables] = useState<Table[]>(initialTables);
  const [menu, setMenu] = useState<MenuItem[]>(menuItems);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [kdsStationsList, setKdsStationsList] = useState<KDSStation[]>(kdsStations);

  // Auth
  const login = useCallback((userId: string, pin: string): boolean => {
    const user = directoryUsers.find(
      (u) => String(u.id) === String(userId) && u.pin === pin,
    );
    if (user) {
      setCurrentUser(user);
      persistStaffUser(user);
      return true;
    }
    return false;
  }, [directoryUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    persistStaffUser(null);
  }, []);

  // Tables
  const updateTable = useCallback((table: Table) => {
    setTables(prev => prev.map(t => t.id === table.id ? table : t));
  }, []);

  const addTable = useCallback((table: Omit<Table, 'id'>) => {
    setTables((prev) => {
      const nextId = Math.max(0, ...prev.map((t) => t.id)) + 1;
      const newTable: Table = { ...table, id: nextId };
      return [...prev, newTable];
    });
  }, []);

  const deleteTable = useCallback((tableId: number) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
  }, []);

  // Menu
  const updateMenuItem = useCallback((item: MenuItem) => {
    setMenu(prev => prev.map(m => m.id === item.id ? item : m));
  }, []);

  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `m${Date.now()}` };
    setMenu(prev => [...prev, newItem]);
  }, []);

  const deleteMenuItem = useCallback((itemId: string) => {
    setMenu(prev => prev.filter(m => m.id !== itemId));
  }, []);

  // Orders
  const createOrder = useCallback((tableId?: number, source: OrderSource = 'restaurant'): Order => {
    const table = tableId !== undefined ? tables.find(t => t.id === tableId) : undefined;
    const newOrder: Order = {
      id: `o${Date.now()}`,
      tableId,
      tableNumber: table?.number,
      waiterId: currentUser?.id || '',
      waiterName: currentUser?.name || 'Sistem',
      items: [],
      status: 'active',
      createdAt: new Date(),
      syncTiming: source === 'restaurant',
      totalAmount: 0,
      source,
    };
    setOrders(prev => [...prev, newOrder]);
    if (tableId) {
      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, status: 'occupied' as const, currentOrderId: newOrder.id } : t
      ));
    }
    return newOrder;
  }, [currentUser, tables]);

  const createDeliveryOrder = useCallback((
    source: OrderSource, 
    customerInfo: { name: string; phone: string; address?: string; platformOrderId?: string }
  ): Order => {
    const newOrder: Order = {
      id: `o${Date.now()}`,
      waiterId: currentUser?.id || '',
      waiterName: 'Sistem',
      items: [],
      status: 'active',
      createdAt: new Date(),
      syncTiming: false,
      totalAmount: 0,
      source,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      deliveryAddress: customerInfo.address,
      platformOrderId: customerInfo.platformOrderId,
      priority: orders.filter(o => o.source !== 'restaurant' && o.status === 'active').length + 1,
    };
    setOrders(prev => [...prev, newOrder]);
    
    // Add notification
    addNotification({
      type: 'new_order',
      title: `Comandă nouă ${source}`,
      message: `Comandă de la ${customerInfo.name} - ${customerInfo.phone}`,
      targetRole: 'admin',
    });
    
    return newOrder;
  }, [currentUser, orders]);

  const updateOrder = useCallback((order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  }, []);

  const addItemToOrder = useCallback((
    orderId: string, 
    menuItem: MenuItem, 
    quantity: number,
    modifications?: OrderItem['modifications']
  ) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const newItem: OrderItem = {
        id: `oi${Date.now()}`,
        menuItemId: menuItem.id,
        menuItem,
        quantity,
        modifications: modifications || { added: [], removed: [], notes: '' },
        status: 'pending',
      };

      const updatedItems = [...order.items, newItem];
      const totalAmount = updatedItems.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );

      return { ...order, items: updatedItems, totalAmount };
    }));
  }, []);

  const updateOrderItemStatus = useCallback((orderId: string, itemId: string, status: OrderItem['status']) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const updatedItems = order.items.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          status,
          startedAt: status === 'cooking' ? new Date() : item.startedAt,
          readyAt: status === 'ready' ? new Date() : item.readyAt,
        };
      });

      // Add notification when item is ready
      if (status === 'ready') {
        const item = order.items.find(i => i.id === itemId);
        if (item) {
          addNotification({
            type: 'order_ready',
            title: 'Preparat gata',
            message: `${item.menuItem.name} pentru ${order.tableNumber ? `Masa ${order.tableNumber}` : order.customerName || 'Livrare'} este gata`,
            orderId: order.id,
            tableNumber: order.tableNumber,
            targetRole: 'waiter',
            targetUserId: order.waiterId,
          });
        }
      }

      return { ...order, items: updatedItems };
    }));
  }, []);

  const completeOrder = useCallback((orderId: string, tip?: number, cui?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return { ...order, status: 'completed', tip, cui, paidAt: new Date() };
    }));

    const order = orders.find(o => o.id === orderId);
    if (order?.tableId) {
      setTables(prev => prev.map(t =>
        t.id === order.tableId ? { ...t, status: 'free' as const, currentOrderId: undefined } : t
      ));
    }
  }, [orders]);

  const getActiveOrderForTable = useCallback((tableId: number): Order | undefined => {
    return orders.find(o => o.tableId === tableId && o.status === 'active');
  }, [orders]);

  // Reservations
  const createReservation = useCallback((reservation: Omit<Reservation, 'id' | 'createdAt'>) => {
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now(),
      createdAt: new Date(),
    };
    setReservations(prev => [...prev, newReservation]);
    
    // Update tables status
    reservation.tableIds.forEach(tableId => {
      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, status: 'reserved' as const, reservationId: newReservation.id } : t
      ));
    });

    addNotification({
      type: 'reservation',
      title: 'Rezervare nouă',
      message: `${reservation.customerName} - ${reservation.partySize} pers. la ${reservation.time}`,
      targetRole: 'admin',
    });
  }, []);

  const updateReservation = useCallback((reservation: Reservation) => {
    setReservations(prev => prev.map(r => r.id === reservation.id ? reservation : r));
  }, []);

  const deleteReservation = useCallback((id: number) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      reservation.tableIds.forEach(tableId => {
        setTables(prev => prev.map(t =>
          t.id === tableId ? { ...t, status: 'free' as const, reservationId: undefined } : t
        ));
      });
    }
    setReservations(prev => prev.filter(r => r.id !== id));
  }, [reservations]);

  // Notifications
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `n${Date.now()}`,
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

// KDS
  const addKdsStation = useCallback((station: Omit<KDSStation, 'id'>) => {
    const newStation: KDSStation = { ...station, id: `kds${Date.now()}` };
    setKdsStationsList(prev => [...prev, newStation]);
  }, []);

  const updateKdsStation = useCallback((station: KDSStation) => {
    setKdsStationsList(prev => prev.map(s => s.id === station.id ? station : s));
  }, []);

  const deleteKdsStation = useCallback((stationId: string) => {
    setKdsStationsList(prev => prev.filter(s => s.id !== stationId));
  }, []);

  const getOrdersForStation = useCallback(
    (station: KDSStation): { order: Order; items: OrderItem[] }[] => {
      const result: { order: Order; items: OrderItem[] }[] = [];

      const activeOrders = orders.filter((o) => o.status === 'active');
      const restaurantOrders = activeOrders.filter((o) => o.source === 'restaurant');
      const deliveryOrders = activeOrders.filter((o) => o.source !== 'restaurant');

      const interleavedOrders: Order[] = [];
      const maxLen = Math.max(restaurantOrders.length, deliveryOrders.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < restaurantOrders.length) interleavedOrders.push(restaurantOrders[i]);
        if (i < deliveryOrders.length) interleavedOrders.push(deliveryOrders[i]);
      }

      interleavedOrders.forEach((order) => {
        const stationItems = order.items.filter(
          (item) =>
            orderItemMatchesKdsStation(item, station) &&
            (item.status === 'pending' || item.status === 'cooking'),
        );

        if (stationItems.length > 0) {
          result.push({ order, items: stationItems });
        }
      });

      return result;
    },
    [orders],
  );

  // Delivery
  const getDeliveryOrders = useCallback((): Order[] => {
    return orders.filter(o => 
      ['glovo', 'wolt', 'bolt', 'own_website'].includes(o.source) && 
      o.status === 'active'
    );
  }, [orders]);

  const getPhoneOrders = useCallback((): Order[] => {
    return orders.filter(o => o.source === 'phone' && o.status === 'active');
  }, [orders]);

  return (
    <RestaurantContext.Provider value={{
      currentUser,
      directoryUsers,
      refreshDirectoryUsers,
      login,
      logout,
      staffSessionHydrated,
      tables,
      updateTable,
      addTable,
      deleteTable,
      menu,
      updateMenuItem,
      addMenuItem,
      deleteMenuItem,
      orders,
      createOrder,
      updateOrder,
      addItemToOrder,
      updateOrderItemStatus,
      completeOrder,
      getActiveOrderForTable,
      createDeliveryOrder,
      reservations,
      createReservation,
      updateReservation,
      deleteReservation,
      notifications,
      addNotification,
      markNotificationRead,
      clearNotifications,
      kdsStations: kdsStationsList,
      addKdsStation,
      updateKdsStation,
      deleteKdsStation,
      getOrdersForStation,
      getDeliveryOrders,
      getPhoneOrders,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};
