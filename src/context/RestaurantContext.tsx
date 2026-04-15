import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  User,
  Table,
  MenuItem,
  Order,
  OrderItem,
  KDSStation,
  Reservation,
  Notification,
  OrderSource,
  users as defaultDirectoryUsers,
  initialTables,
  menuItems,
  kdsStations,
} from '@/data/mockData';
import { orderItemMatchesKdsStation, kdsStationApiToKdsStation } from '@/lib/kdsUtils';
import {
  authApi,
  usersApi,
  userApiToUser,
  tablesApi,
  menuApi,
  ordersApi,
  reservationsApi,
  notificationsApi,
  type CreateMenuItemBody,
  type CreateNotificationBody,
  type CreateOrderBody,
  type CreateOrderItemBody,
} from '@/lib/api';
import { orderApiToPosOrder } from '@/lib/posOrderMapper';
import {
  menuItemApiToMenuItem,
  tableApiToTable,
  reservationApiToReservation,
  notificationApiToNotification,
} from '@/lib/restaurantMappers';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/lib/authSession';

interface RestaurantContextType {
  currentUser: User | null;
  directoryUsers: User[];
  refreshDirectoryUsers: () => Promise<void>;
  login: (userId: string, pin: string) => Promise<boolean>;
  logout: () => void;
  staffSessionHydrated: boolean;

  tables: Table[];
  updateTable: (table: Table) => Promise<void>;
  addTable: (table: Omit<Table, 'id'>) => Promise<void>;
  deleteTable: (tableId: number) => Promise<void>;

  menu: MenuItem[];
  updateMenuItem: (item: MenuItem) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;

  orders: Order[];
  createOrder: (tableId?: number, source?: OrderSource) => Promise<Order>;
  updateOrder: (order: Order) => void;
  addItemToOrder: (
    orderId: string,
    menuItem: MenuItem,
    quantity: number,
    modifications?: OrderItem['modifications'],
  ) => Promise<void>;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => Promise<void>;
  completeOrder: (orderId: string, tip?: number, cui?: string) => Promise<void>;
  getActiveOrderForTable: (tableId: number) => Order | undefined;
  createDeliveryOrder: (
    source: OrderSource,
    customerInfo: { name: string; phone: string; address?: string; platformOrderId?: string },
  ) => Promise<Order>;

  reservations: Reservation[];
  createReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => Promise<void>;
  updateReservation: (reservation: Reservation) => Promise<void>;
  deleteReservation: (id: number) => Promise<void>;

  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => void;

  kdsStations: KDSStation[];
  addKdsStation: (station: Omit<KDSStation, 'id'>) => Promise<void>;
  updateKdsStation: (station: KDSStation) => Promise<void>;
  deleteKdsStation: (stationId: string) => Promise<void>;
  getOrdersForStation: (station: KDSStation) => { order: Order; items: OrderItem[] }[];

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
  const { pin: _p, ...rest } = user;
  localStorage.setItem(STAFF_USER_STORAGE_KEY, JSON.stringify(rest));
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>(defaultDirectoryUsers);
  const [directoryUsersFetchDone, setDirectoryUsersFetchDone] = useState(false);
  const [staffSessionHydrated, setStaffSessionHydrated] = useState(false);

  const [tables, setTables] = useState<Table[]>(initialTables);
  const [menu, setMenu] = useState<MenuItem[]>(menuItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [kdsStationsList, setKdsStationsList] = useState<KDSStation[]>(kdsStations);

  const loadPublicLayout = useCallback(async () => {
    try {
      const [tb, items, stations] = await Promise.all([
        tablesApi.getTables(),
        menuApi.getItems(),
        menuApi.getKdsStations(),
      ]);
      setTables(tb.map(tableApiToTable));
      setMenu(items.map(menuItemApiToMenuItem));
      setKdsStationsList(stations.map(kdsStationApiToKdsStation));
    } catch {
      setTables(initialTables);
      setMenu(menuItems);
      setKdsStationsList(kdsStations);
    }
  }, []);

  const loadStaffData = useCallback(async () => {
    if (!getAccessToken()) {
      setOrders([]);
      setReservations([]);
      setNotifications([]);
      return;
    }
    try {
      const [ordersData, reservationsData, notificationsData] = await Promise.all([
        ordersApi.getAll(),
        reservationsApi.getAll(),
        notificationsApi.getAll(),
      ]);
      setOrders(ordersData.map(orderApiToPosOrder));
      setReservations(reservationsData.map(reservationApiToReservation));
      setNotifications(notificationsData.map(notificationApiToNotification));
    } catch {
      setOrders([]);
      setReservations([]);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void loadPublicLayout();
  }, [loadPublicLayout]);

  useEffect(() => {
    usersApi
      .listDirectory()
      .then((list) => {
        setDirectoryUsers(list.map(userApiToUser));
      })
      .catch(() => {
        setDirectoryUsers(defaultDirectoryUsers);
      })
      .finally(() => setDirectoryUsersFetchDone(true));
  }, []);

  useEffect(() => {
    const stored = readStoredStaffUser();
    if (stored) setCurrentUser(stored);
    setStaffSessionHydrated(true);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setCurrentUser(null);
      persistStaffUser(null);
      void loadStaffData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('giurom-auth-expired', onExpired);
      return () => window.removeEventListener('giurom-auth-expired', onExpired);
    }
    return undefined;
  }, [loadStaffData]);

  useEffect(() => {
    if (!staffSessionHydrated) return;
    const token = getAccessToken();
    if (!token) {
      void loadStaffData();
      return;
    }
    authApi
      .me()
      .then((u) => {
        if (u) {
          const mapped = userApiToUser(u);
          setCurrentUser(mapped);
          persistStaffUser(mapped);
        }
      })
      .catch(() => {
        clearAccessToken();
        setCurrentUser(null);
        persistStaffUser(null);
      })
      .finally(() => {
        void loadStaffData();
      });
  }, [staffSessionHydrated, loadStaffData]);

  useEffect(() => {
    if (!directoryUsersFetchDone) return;
    setCurrentUser((prev) => {
      if (!prev) return null;
      const canonical = directoryUsers.find((u) => String(u.id) === String(prev.id));
      if (canonical) {
        const merged = {
          ...canonical,
          ...prev,
          // În demo păstrăm PIN-ul pentru guard-urile existente; dacă lipsește în sesiune, luăm din directory.
          pin: (prev.pin && prev.pin.trim()) || canonical.pin,
        };
        persistStaffUser(merged);
        return merged;
      }
      persistStaffUser(null);
      return null;
    });
  }, [directoryUsers, directoryUsersFetchDone]);

  const refreshDirectoryUsers = useCallback(async () => {
    try {
      const list = await usersApi.listDirectory();
      setDirectoryUsers(list.map(userApiToUser));
    } catch {
      /* ignoră */
    }
  }, []);

  const resolveKdsStationId = useCallback(
    (kdsStation?: string): number => {
      const slug = kdsStation ?? 'grill';
      const hit =
        kdsStationsList.find((s) => s.type === slug) ??
        kdsStationsList.find((s) => String(s.id) === slug) ??
        kdsStationsList[0];
      const n = parseInt(String(hit?.id), 10);
      return Number.isFinite(n) ? n : 1;
    },
    [kdsStationsList],
  );

  const login = useCallback(async (userId: string, pin: string): Promise<boolean> => {
    try {
      const { access_token, user } = await authApi.login({ userId, pin });
      setAccessToken(access_token);
      const mapped = { ...userApiToUser(user), pin };
      setCurrentUser(mapped);
      persistStaffUser(mapped);
      await loadPublicLayout();
      await loadStaffData();
      return true;
    } catch {
      return false;
    }
  }, [loadPublicLayout, loadStaffData]);

  const logout = useCallback(() => {
    clearAccessToken();
    setCurrentUser(null);
    persistStaffUser(null);
    void loadStaffData();
  }, [loadStaffData]);

  const updateTable = useCallback(async (table: Table) => {
    try {
      await tablesApi.updateTable(table.id, {
        position: table.position,
        mergedWith: table.mergedWith,
        status: table.status,
        number: table.number,
        seats: table.seats,
        shape: table.shape,
        zone: table.zone,
        currentOrderId:
          table.currentOrderId === undefined
            ? undefined
            : typeof table.currentOrderId === 'number'
              ? table.currentOrderId
              : parseInt(String(table.currentOrderId), 10) || null,
        reservationId: table.reservationId ?? null,
        currentGuests: table.currentGuests,
      });
      const tb = await tablesApi.getTable(table.id);
      if (tb) {
        setTables((prev) => prev.map((t) => (t.id === table.id ? tableApiToTable(tb) : t)));
      }
    } catch {
      setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
    }
  }, []);

  const addTable = useCallback(async (table: Omit<Table, 'id'>) => {
    try {
      const created = await tablesApi.createTable({
        number: table.number,
        seats: table.seats,
        shape: table.shape,
        zone: table.zone,
        status: table.status ?? 'free',
        position: table.position,
      });
      setTables((prev) => [...prev, tableApiToTable(created)]);
    } catch {
      setTables((prev) => {
        const nextId = Math.max(0, ...prev.map((t) => t.id)) + 1;
        return [...prev, { ...table, id: nextId }];
      });
    }
  }, []);

  const deleteTable = useCallback(async (tableId: number) => {
    try {
      await tablesApi.deleteTable(tableId);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    } catch {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    }
  }, []);

  const updateMenuItem = useCallback(async (item: MenuItem) => {
    const id = parseInt(String(item.id), 10);
    if (Number.isNaN(id)) return;
    try {
      const body: Partial<CreateMenuItemBody> = {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        kdsStationId: item.kdsStationId ?? resolveKdsStationId(item.kdsStation),
        prepTime: item.prepTime,
        availability: item.availability,
        platformPricing: item.platformPricing,
        allergenIds: (item.allergenIds ?? []).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n)),
        availableExtrasIds: (item.availableExtras ?? [])
          .map((x) => parseInt(x, 10))
          .filter((n) => Number.isFinite(n)),
        image: item.image,
      };
      const updated = await menuApi.updateItem(id, body);
      const mapped = menuItemApiToMenuItem(updated);
      setMenu((prev) => prev.map((m) => (m.id === item.id ? mapped : m)));
    } catch {
      setMenu((prev) => prev.map((m) => (m.id === item.id ? item : m)));
    }
  }, [resolveKdsStationId]);

  const addMenuItem = useCallback(
    async (item: Omit<MenuItem, 'id'>) => {
      const kdsStationId = resolveKdsStationId(item.kdsStation);
      try {
        const body: CreateMenuItemBody = {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          kdsStationId,
          prepTime: item.prepTime,
          availability: item.availability,
          platformPricing: item.platformPricing,
          allergenIds: (item.allergenIds ?? []).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n)),
          availableExtrasIds: (item.availableExtras ?? [])
            .map((x) => parseInt(x, 10))
            .filter((n) => Number.isFinite(n)),
          image: item.image,
        };
        const created = await menuApi.createItem(body);
        setMenu((prev) => [...prev, menuItemApiToMenuItem(created)]);
      } catch {
        const newItem: MenuItem = { ...item, id: `m${Date.now()}` };
        setMenu((prev) => [...prev, newItem]);
      }
    },
    [resolveKdsStationId],
  );

  const deleteMenuItem = useCallback(async (itemId: string) => {
    setMenu((prev) => prev.filter((m) => m.id !== itemId));
  }, []);

  const createOrder = useCallback(
    async (tableId?: number, source: OrderSource = 'restaurant'): Promise<Order> => {
      const table = tableId !== undefined ? tables.find((t) => t.id === tableId) : undefined;
      const body: CreateOrderBody = {
        tableId,
        tableNumber: table?.number,
        waiterId: currentUser?.id,
        waiterName: currentUser?.name,
        source,
        orderType:
          source === 'kiosk'
            ? 'kiosk'
            : source === 'phone'
              ? 'phone'
              : source === 'restaurant'
                ? 'restaurant'
                : source,
        fulfillmentType: source === 'restaurant' ? 'dine_in' : 'takeaway',
        items: [],
      };
      const created = await ordersApi.create(body);
      if (tableId != null) {
        await tablesApi.updateTable(tableId, {
          status: 'occupied',
          currentOrderId: created.id,
        });
        const tb = await tablesApi.getTable(tableId);
        if (tb) {
          setTables((prev) => prev.map((t) => (t.id === tableId ? tableApiToTable(tb) : t)));
        }
      }
      const pos = orderApiToPosOrder(created);
      setOrders((prev) => [...prev.filter((o) => String(o.id) !== String(pos.id)), pos]);
      return { ...pos, syncTiming: source === 'restaurant' };
    },
    [currentUser, tables],
  );

  const createDeliveryOrder = useCallback(
    async (
      source: OrderSource,
      customerInfo: { name: string; phone: string; address?: string; platformOrderId?: string },
    ): Promise<Order> => {
      const activeNonRestaurant = orders.filter((o) => o.source !== 'restaurant' && o.status === 'active').length;
      const body: CreateOrderBody = {
        waiterId: currentUser?.id,
        waiterName: currentUser?.name ?? 'Sistem',
        source,
        orderType: source as CreateOrderBody['orderType'],
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        deliveryAddress: customerInfo.address ?? undefined,
        platformOrderId: customerInfo.platformOrderId,
        items: [],
        priority: activeNonRestaurant + 1,
      };
      const created = await ordersApi.create(body);
      const pos = orderApiToPosOrder(created);
      setOrders((prev) => [...prev, pos]);
      try {
        const dto: CreateNotificationBody = {
          type: 'new_order',
          title: `Comandă nouă ${source}`,
          message: `Comandă de la ${customerInfo.name} - ${customerInfo.phone}`,
          targetRole: 'admin',
        };
        const n = await notificationsApi.create(dto);
        setNotifications((p) => [notificationApiToNotification(n), ...p]);
      } catch {
        const local: Notification = {
          id: `n${Date.now()}`,
          type: 'new_order',
          title: `Comandă nouă ${source}`,
          message: `Comandă de la ${customerInfo.name} - ${customerInfo.phone}`,
          read: false,
          createdAt: new Date(),
          targetRole: 'admin',
        };
        setNotifications((p) => [local, ...p]);
      }
      return pos;
    },
    [currentUser, orders],
  );

  const updateOrder = useCallback((order: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  }, []);

  const addItemToOrder = useCallback(
    async (
      orderId: string,
      menuItem: MenuItem,
      quantity: number,
      modifications?: OrderItem['modifications'],
    ) => {
      const oid = parseInt(orderId, 10);
      const menuItemId = parseInt(String(menuItem.id), 10);
      if (Number.isNaN(oid) || Number.isNaN(menuItemId)) {
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== orderId) return order;
            const newItem: OrderItem = {
              id: `oi${Date.now()}`,
              menuItemId: String(menuItem.id),
              menuItem,
              quantity,
              modifications: modifications || { added: [], removed: [], notes: '' },
              status: 'pending',
            };
            const updatedItems = [...order.items, newItem];
            const totalAmount = updatedItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
            return { ...order, items: updatedItems, totalAmount };
          }),
        );
        return;
      }
      const line: CreateOrderItemBody = {
        menuItemId,
        quantity,
        modifications: modifications ?? { added: [], removed: [], notes: '' },
      };
      const updated = await ordersApi.addItems(oid, [line]);
      setOrders((prev) => prev.map((o) => (String(o.id) === String(updated.id) ? orderApiToPosOrder(updated) : o)));
    },
    [],
  );

  const persistReadyNotification = useCallback(async (order: Order, item: OrderItem) => {
    try {
      const dto: CreateNotificationBody = {
        type: 'order_ready',
        title: 'Preparat gata',
        message: `${item.menuItem.name} pentru ${order.tableNumber ? `Masa ${order.tableNumber}` : order.customerName || 'Livrare'} este gata`,
        orderId: parseInt(String(order.id), 10),
        tableNumber: order.tableNumber,
        targetRole: 'waiter',
        targetUserId: order.waiterId,
      };
      const n = await notificationsApi.create(dto);
      setNotifications((p) => [notificationApiToNotification(n), ...p]);
    } catch {
      const local: Notification = {
        id: `n${Date.now()}`,
        type: 'order_ready',
        title: 'Preparat gata',
        message: `${item.menuItem.name} pentru ${order.tableNumber ? `Masa ${order.tableNumber}` : order.customerName || 'Livrare'} este gata`,
        read: false,
        createdAt: new Date(),
        orderId: order.id,
        tableNumber: order.tableNumber,
        targetRole: 'waiter',
        targetUserId: order.waiterId,
      };
      setNotifications((p) => [local, ...p]);
    }
  }, []);

  const updateOrderItemStatus = useCallback(
    async (orderId: string, itemId: string, status: OrderItem['status']) => {
      const oid = parseInt(orderId, 10);
      const iid = parseInt(itemId, 10);
      if (!Number.isNaN(oid) && !Number.isNaN(iid)) {
        const updated = await ordersApi.updateItemStatus(oid, iid, status, {
          employeeId: currentUser?.id,
          employeeName: currentUser?.name,
        });
        const mappedOrder = orderApiToPosOrder(updated);
        setOrders((prev) => prev.map((o) => (String(o.id) === String(mappedOrder.id) ? mappedOrder : o)));
        if (status === 'ready') {
          const oi = mappedOrder.items.find((it) => String(it.id) === String(iid));
          if (oi) void persistReadyNotification(mappedOrder, oi);
        }
        return;
      }
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const updatedItems = order.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              status,
              startedAt: status === 'cooking' ? new Date() : item.startedAt,
              readyAt: status === 'ready' ? new Date() : item.readyAt,
            };
          });
          if (status === 'ready') {
            const item = order.items.find((i) => i.id === itemId);
            if (item) {
              void persistReadyNotification(order, item);
            }
          }
          return { ...order, items: updatedItems };
        }),
      );
    },
    [currentUser, persistReadyNotification],
  );

  const completeOrder = useCallback(async (orderId: string, tip?: number, cui?: string) => {
    const id = parseInt(orderId, 10);
    if (!Number.isNaN(id)) {
      await ordersApi.update(id, {
        status: 'completed',
        tip,
        cui,
        paidAt: new Date().toISOString(),
      });
      const updated = await ordersApi.getOne(id);
      if (updated) {
        const pos = orderApiToPosOrder(updated);
        setOrders((prev) => prev.map((o) => (String(o.id) === orderId ? pos : o)));
        if (pos.tableId) {
          await tablesApi.updateTable(pos.tableId, { status: 'free', currentOrderId: null });
          const tb = await tablesApi.getTable(pos.tableId);
          if (tb) {
            setTables((prev) => prev.map((t) => (t.id === pos.tableId ? tableApiToTable(tb) : t)));
          }
        }
      }
      return;
    }
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: 'completed', tip, cui, paidAt: new Date() } : order)),
    );
  }, []);

  const getActiveOrderForTable = useCallback(
    (tableId: number): Order | undefined => orders.find((o) => o.tableId === tableId && o.status === 'active'),
    [orders],
  );

  const createReservation = useCallback(async (reservation: Omit<Reservation, 'id' | 'createdAt'>) => {
    const body = {
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      date: reservation.date.toISOString().slice(0, 10),
      time: reservation.time,
      partySize: reservation.partySize,
      status: reservation.status,
      notes: reservation.notes,
      source: reservation.source,
      tableIds: reservation.tableIds,
    };
    const r = await reservationsApi.create(body);
    const mapped = reservationApiToReservation(r);
    setReservations((prev) => [...prev, mapped]);
    for (const tableId of mapped.tableIds) {
      await tablesApi.updateTable(tableId, {
        status: 'reserved',
        reservationId: String(mapped.id),
      });
      const tb = await tablesApi.getTable(tableId);
      if (tb) {
        setTables((prev) => prev.map((t) => (t.id === tableId ? tableApiToTable(tb) : t)));
      }
    }
    try {
      const n = await notificationsApi.create({
        type: 'reservation',
        title: 'Rezervare nouă',
        message: `${reservation.customerName} - ${reservation.partySize} pers. la ${reservation.time}`,
        targetRole: 'admin',
      });
      setNotifications((p) => [notificationApiToNotification(n), ...p]);
    } catch {
      setNotifications((p) => [
        {
          id: `n${Date.now()}`,
          type: 'reservation',
          title: 'Rezervare nouă',
          message: `${reservation.customerName} - ${reservation.partySize} pers. la ${reservation.time}`,
          read: false,
          createdAt: new Date(),
          targetRole: 'admin',
        },
        ...p,
      ]);
    }
  }, []);

  const updateReservation = useCallback(async (reservation: Reservation) => {
    const body = {
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      date: reservation.date.toISOString().slice(0, 10),
      time: reservation.time,
      partySize: reservation.partySize,
      status: reservation.status,
      notes: reservation.notes,
      source: reservation.source,
      tableIds: reservation.tableIds,
    };
    const r = await reservationsApi.update(reservation.id, body);
    if (r) {
      setReservations((prev) => prev.map((x) => (x.id === reservation.id ? reservationApiToReservation(r) : x)));
    }
  }, []);

  const deleteReservation = useCallback(async (id: number) => {
    const reservation = reservations.find((r) => r.id === id);
    await reservationsApi.delete(id);
    setReservations((prev) => prev.filter((r) => r.id !== id));
    if (reservation) {
      for (const tableId of reservation.tableIds) {
        await tablesApi.updateTable(tableId, { status: 'free', reservationId: null });
        const tb = await tablesApi.getTable(tableId);
        if (tb) {
          setTables((prev) => prev.map((t) => (t.id === tableId ? tableApiToTable(tb) : t)));
        }
      }
    }
  }, [reservations]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    void (async () => {
      try {
        const dto: CreateNotificationBody = {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          orderId: notification.orderId ? parseInt(notification.orderId, 10) : undefined,
          tableNumber: notification.tableNumber,
          targetRole: notification.targetRole,
          targetUserId: notification.targetUserId,
        };
        const n = await notificationsApi.create(dto);
        setNotifications((p) => [notificationApiToNotification(n), ...p]);
      } catch {
        const local: Notification = {
          ...notification,
          id: `n${Date.now()}`,
          createdAt: new Date(),
          read: false,
        };
        setNotifications((p) => [local, ...p]);
      }
    })();
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addKdsStation = useCallback(async (station: Omit<KDSStation, 'id'>) => {
    try {
      const created = await menuApi.createKdsStation({
        name: station.name,
        type: station.type,
        color: station.color,
        icon: station.icon,
      });
      setKdsStationsList((prev) => [...prev, kdsStationApiToKdsStation(created)]);
    } catch {
      setKdsStationsList((prev) => [...prev, { ...station, id: `kds${Date.now()}` }]);
    }
  }, []);

  const updateKdsStation = useCallback(async (station: KDSStation) => {
    const id = parseInt(String(station.id), 10);
    if (Number.isNaN(id)) {
      setKdsStationsList((prev) => prev.map((s) => (s.id === station.id ? station : s)));
      return;
    }
    try {
      const updated = await menuApi.updateKdsStation(id, {
        name: station.name,
        type: station.type,
        color: station.color,
        icon: station.icon,
      });
      setKdsStationsList((prev) => prev.map((s) => (String(s.id) === String(station.id) ? kdsStationApiToKdsStation(updated) : s)));
    } catch {
      setKdsStationsList((prev) => prev.map((s) => (s.id === station.id ? station : s)));
    }
  }, []);

  const deleteKdsStation = useCallback(async (stationId: string) => {
    const id = parseInt(stationId, 10);
    if (!Number.isNaN(id)) {
      try {
        await menuApi.deleteKdsStation(id);
      } catch {
        /* */
      }
    }
    setKdsStationsList((prev) => prev.filter((s) => s.id !== stationId));
  }, []);

  const getOrdersForStation = useCallback(
    (station: KDSStation): { order: Order; items: OrderItem[] }[] => {
      const result: { order: Order; items: OrderItem[] }[] = [];
      const activeOrders = orders.filter((o) => o.status === 'active');
      const restaurantOrders = activeOrders.filter((o) => o.source === 'restaurant');
      const deliveryOrders = activeOrders.filter((o) => o.source !== 'restaurant');
      const interleavedOrders: Order[] = [];
      const maxLen = Math.max(restaurantOrders.length, deliveryOrders.length);
      for (let i = 0; i < maxLen; i += 1) {
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

  const getDeliveryOrders = useCallback(
    (): Order[] =>
      orders.filter((o) => ['glovo', 'wolt', 'bolt', 'own_website'].includes(o.source) && o.status === 'active'),
    [orders],
  );

  const getPhoneOrders = useCallback(
    (): Order[] => orders.filter((o) => o.source === 'phone' && o.status === 'active'),
    [orders],
  );

  return (
    <RestaurantContext.Provider
      value={{
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
      }}
    >
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
