import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  User, Table, MenuItem, Order, OrderItem, KDSStation,
  users, initialTables, menuItems, kdsStations, sampleOrders 
} from '@/data/mockData';

interface RestaurantContextType {
  // Auth
  currentUser: User | null;
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
  
  // Tables
  tables: Table[];
  updateTable: (table: Table) => void;
  addTable: (table: Omit<Table, 'id'>) => void;
  deleteTable: (tableId: string) => void;
  
  // Menu
  menu: MenuItem[];
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (itemId: string) => void;
  
  // Orders
  orders: Order[];
  createOrder: (tableId: string) => Order;
  updateOrder: (order: Order) => void;
  addItemToOrder: (orderId: string, menuItem: MenuItem, quantity: number, modifications?: OrderItem['modifications']) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  completeOrder: (orderId: string, tip?: number, cui?: string) => void;
  getActiveOrderForTable: (tableId: string) => Order | undefined;
  
  // KDS
  kdsStations: KDSStation[];
  getOrdersForStation: (stationId: string) => { order: Order; items: OrderItem[] }[];
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [menu, setMenu] = useState<MenuItem[]>(menuItems);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  // Auth
  const login = useCallback((userId: string, pin: string): boolean => {
    const user = users.find(u => u.id === userId && u.pin === pin);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Tables
  const updateTable = useCallback((table: Table) => {
    setTables(prev => prev.map(t => t.id === table.id ? table : t));
  }, []);

  const addTable = useCallback((table: Omit<Table, 'id'>) => {
    const newTable: Table = { ...table, id: `t${Date.now()}` };
    setTables(prev => [...prev, newTable]);
  }, []);

  const deleteTable = useCallback((tableId: string) => {
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
  const createOrder = useCallback((tableId: string): Order => {
    const table = tables.find(t => t.id === tableId);
    const newOrder: Order = {
      id: `o${Date.now()}`,
      tableId,
      tableNumber: table?.number || 0,
      waiterId: currentUser?.id || '',
      waiterName: currentUser?.name || '',
      items: [],
      status: 'active',
      createdAt: new Date(),
      syncTiming: true,
      totalAmount: 0,
    };
    setOrders(prev => [...prev, newOrder]);
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, status: 'occupied' as const, currentOrderId: newOrder.id } : t
    ));
    return newOrder;
  }, [currentUser, tables]);

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

      return { ...order, items: updatedItems };
    }));
  }, []);

  const completeOrder = useCallback((orderId: string, tip?: number, cui?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return { ...order, status: 'completed', tip, cui, paidAt: new Date() };
    }));

    const order = orders.find(o => o.id === orderId);
    if (order) {
      setTables(prev => prev.map(t =>
        t.id === order.tableId ? { ...t, status: 'free' as const, currentOrderId: undefined } : t
      ));
    }
  }, [orders]);

  const getActiveOrderForTable = useCallback((tableId: string): Order | undefined => {
    return orders.find(o => o.tableId === tableId && o.status === 'active');
  }, [orders]);

  // KDS
  const getOrdersForStation = useCallback((stationId: string): { order: Order; items: OrderItem[] }[] => {
    const result: { order: Order; items: OrderItem[] }[] = [];
    
    orders.filter(o => o.status === 'active').forEach(order => {
      const stationItems = order.items.filter(
        item => item.menuItem.kdsStation === stationId && 
                (item.status === 'pending' || item.status === 'cooking')
      );
      
      if (stationItems.length > 0) {
        result.push({ order, items: stationItems });
      }
    });

    return result;
  }, [orders]);

  return (
    <RestaurantContext.Provider value={{
      currentUser,
      login,
      logout,
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
      kdsStations,
      getOrdersForStation,
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
