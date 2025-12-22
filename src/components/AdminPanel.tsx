import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  LogOut, Settings, UtensilsCrossed, LayoutGrid, 
  Monitor, Plus, Trash2, Edit2, Save, Users, CalendarDays,
  Truck, BarChart3, Map, ShoppingCart, Phone, Wifi, WifiOff, Salad
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, MenuItem, menuCategories, users, deliveryPlatforms, User, mockCustomers, extraIngredients } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LanguageSelector from '@/components/LanguageSelector';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'tables' | 'tableMap' | 'orders' | 'menu' | 'extraIngredients' | 'kds' | 'reservations' | 'delivery' | 'waiters' | 'customers';

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const isMobile = useIsMobile();
  const { 
    tables, addTable, updateTable, deleteTable,
    menu, addMenuItem, updateMenuItem, deleteMenuItem,
    kdsStations, orders, reservations, deleteReservation, updateReservation
  } = useRestaurant();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Table form
  const [tableForm, setTableForm] = useState({
    number: '',
    seats: '4',
    shape: 'square' as Table['shape'],
    x: '50',
    y: '50'
  });

  // Menu form
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: menuCategories[0],
    kdsStation: 'grill',
    prepTime: '10',
    ingredients: '',
    glovoPrice: '',
    woltPrice: '',
    boltPrice: '',
    ownPrice: '',
  });

  const handleAddTable = () => {
    addTable({
      number: parseInt(tableForm.number),
      seats: parseInt(tableForm.seats),
      shape: tableForm.shape,
      position: { x: parseInt(tableForm.x), y: parseInt(tableForm.y) },
      status: 'free'
    });
    toast({ title: t('app.save') });
    setShowAddTable(false);
    setTableForm({ number: '', seats: '4', shape: 'square', x: '50', y: '50' });
  };

  const handleAddMenuItem = () => {
    addMenuItem({
      name: menuForm.name,
      description: menuForm.description,
      price: parseFloat(menuForm.price),
      category: menuForm.category,
      kdsStation: menuForm.kdsStation,
      prepTime: parseInt(menuForm.prepTime),
      ingredients: menuForm.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      platformPricing: {
        glovo: { name: menuForm.name, price: parseFloat(menuForm.glovoPrice) || parseFloat(menuForm.price) * 1.2, enabled: true },
        wolt: { name: menuForm.name, price: parseFloat(menuForm.woltPrice) || parseFloat(menuForm.price) * 1.2, enabled: true },
        bolt: { name: menuForm.name, price: parseFloat(menuForm.boltPrice) || parseFloat(menuForm.price) * 1.2, enabled: true },
        own: { name: menuForm.name, price: parseFloat(menuForm.ownPrice) || parseFloat(menuForm.price) * 1.1, enabled: true },
      }
    });
    toast({ title: t('app.save') });
    setShowAddMenu(false);
    resetMenuForm();
  };

  const resetMenuForm = () => {
    setMenuForm({ name: '', description: '', price: '', category: menuCategories[0], kdsStation: 'grill', prepTime: '10', ingredients: '', glovoPrice: '', woltPrice: '', boltPrice: '', ownPrice: '' });
  };

  const handleUpdateMenuItem = () => {
    if (!editingItem) return;
    updateMenuItem({
      ...editingItem,
      name: menuForm.name,
      description: menuForm.description,
      price: parseFloat(menuForm.price),
      category: menuForm.category,
      kdsStation: menuForm.kdsStation,
      prepTime: parseInt(menuForm.prepTime),
      ingredients: menuForm.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      platformPricing: {
        glovo: { name: menuForm.name, price: parseFloat(menuForm.glovoPrice) || parseFloat(menuForm.price) * 1.2, enabled: true },
        wolt: { name: menuForm.name, price: parseFloat(menuForm.woltPrice) || parseFloat(menuForm.price) * 1.2, enabled: true },
        bolt: { name: menuForm.name, price: parseFloat(menuForm.boltPrice) || parseFloat(menuForm.price) * 1.2, enabled: true },
        own: { name: menuForm.name, price: parseFloat(menuForm.ownPrice) || parseFloat(menuForm.price) * 1.1, enabled: true },
      }
    });
    toast({ title: t('app.save') });
    setEditingItem(null);
  };

  const startEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      kdsStation: item.kdsStation,
      prepTime: item.prepTime.toString(),
      ingredients: item.ingredients.join(', '),
      glovoPrice: item.platformPricing?.glovo?.price.toString() || '',
      woltPrice: item.platformPricing?.wolt?.price.toString() || '',
      boltPrice: item.platformPricing?.bolt?.price.toString() || '',
      ownPrice: item.platformPricing?.own?.price.toString() || '',
    });
  };

  // Calculate dashboard stats
  const todayOrders = orders.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });
  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount + (o.tip || 0), 0);
  const avgOrder = todayOrders.length > 0 ? todaySales / todayOrders.length : 0;

  // Waiter stats
  const waiterStats = users.filter(u => u.role === 'waiter').map(waiter => {
    const waiterOrders = orders.filter(o => o.waiterId === waiter.id && o.status === 'completed');
    return {
      ...waiter,
      ordersCount: waiterOrders.length,
      totalSales: waiterOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  });

  const navItems = [
    { id: 'dashboard' as AdminView, label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'tables' as AdminView, label: t('nav.tables'), icon: LayoutGrid },
    { id: 'tableMap' as AdminView, label: t('nav.tableMap'), icon: Map },
    { id: 'orders' as AdminView, label: t('nav.orders'), icon: ShoppingCart },
    { id: 'menu' as AdminView, label: t('nav.menu'), icon: UtensilsCrossed },
    { id: 'extraIngredients' as AdminView, label: 'Ingrediente Extra', icon: Salad },
    { id: 'kds' as AdminView, label: t('nav.kds'), icon: Monitor },
    { id: 'reservations' as AdminView, label: t('nav.reservations'), icon: CalendarDays },
    { id: 'delivery' as AdminView, label: t('nav.delivery'), icon: Truck },
    { id: 'waiters' as AdminView, label: t('nav.waiters'), icon: Users },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Admin
            </h1>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                activeView === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          {!sidebarCollapsed && <LanguageSelector />}
          <Button 
            variant="ghost" 
            className={cn("w-full", sidebarCollapsed ? "justify-center" : "justify-start")} 
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span className="ml-2">{t('app.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Dashboard */}
        {activeView === 'dashboard' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">{t('dashboard.todaySales')}</p>
                <p className="text-2xl font-bold">{todaySales.toFixed(0)} RON</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
                <p className="text-sm text-muted-foreground">{t('dashboard.ordersToday')}</p>
                <p className="text-2xl font-bold">{todayOrders.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                <p className="text-sm text-muted-foreground">{t('dashboard.avgOrder')}</p>
                <p className="text-2xl font-bold">{avgOrder.toFixed(0)} RON</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
                <p className="text-sm text-muted-foreground">{t('nav.reservations')}</p>
                <p className="text-2xl font-bold">{reservations.filter(r => r.status !== 'cancelled').length}</p>
              </div>
            </div>

            {/* Top Waiters & Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-semibold mb-4">{t('dashboard.topWaiters')}</h3>
                <div className="space-y-3">
                  {waiterStats.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5).map((waiter, i) => (
                    <div key={waiter.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span>{waiter.name}</span>
                      </div>
                      <span className="font-semibold">{waiter.totalSales} RON</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-semibold mb-4">{t('dashboard.topProducts')}</h3>
                <div className="space-y-3">
                  {menu.slice(0, 5).map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.price} RON</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Management */}
        {activeView === 'tables' && (
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t('tables.title')}</h2>
              <Button onClick={() => setShowAddTable(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('tables.add')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map(table => (
                <div key={table.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">{t('orders.table')} {table.number}</span>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        deleteTable(table.id);
                        toast({ title: t('app.delete') });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{t('tables.seats')}: {table.seats}</p>
                    <p>{t('tables.shape')}: {t(`tables.${table.shape}` as any)}</p>
                    <p>{t('tables.position')}: X:{table.position.x}% Y:{table.position.y}%</p>
                    <Badge variant={table.status === 'free' ? 'secondary' : table.status === 'occupied' ? 'destructive' : 'default'}>
                      {t(`tables.${table.status}` as any)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Map */}
        {activeView === 'tableMap' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('nav.tableMap')}</h2>
            <div className="relative w-full aspect-[16/9] bg-secondary/30 rounded-xl border-2 border-dashed border-border">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer transition-all",
                    table.shape === 'round' ? 'rounded-full' : table.shape === 'rectangle' ? 'rounded-lg' : 'rounded-md',
                    table.status === 'free' && 'bg-table-free',
                    table.status === 'occupied' && 'bg-table-occupied',
                    table.status === 'reserved' && 'bg-table-reserved',
                    table.seats <= 2 ? 'w-12 h-12 md:w-16 md:h-16' :
                    table.seats <= 4 ? 'w-16 h-16 md:w-20 md:h-20' :
                    table.shape === 'rectangle' ? 'w-24 h-14 md:w-32 md:h-18' : 'w-20 h-20 md:w-24 md:h-24'
                  )}
                  style={{ left: `${table.position.x}%`, top: `${table.position.y}%` }}
                >
                  <span className="text-white font-bold text-lg">{table.number}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Tip: Use the Tables view to edit table positions (X%, Y%)
            </p>
          </div>
        )}

        {/* Orders Management */}
        {activeView === 'orders' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('orders.title')}</h2>
            
            <Tabs defaultValue="active">
              <TabsList className="mb-4">
                <TabsTrigger value="active">{t('orders.active')}</TabsTrigger>
                <TabsTrigger value="completed">{t('orders.completed')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {orders.filter(o => o.status === 'active').map(order => (
                    <div key={order.id} className="p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {order.source !== 'restaurant' && <Truck className="w-4 h-4 text-primary" />}
                          <span className="font-bold">
                            {order.tableNumber ? `${t('orders.table')} ${order.tableNumber}` : order.customerName}
                          </span>
                        </div>
                        <Badge>{order.source}</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">{t('orders.waiter')}: {order.waiterName}</p>
                        <div className="space-y-1">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.menuItem.name}</span>
                              <Badge variant={item.status === 'ready' ? 'default' : item.status === 'cooking' ? 'secondary' : 'outline'} className="text-xs">
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-border flex justify-between font-bold">
                          <span>{t('orders.total')}</span>
                          <span>{order.totalAmount} RON</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {orders.filter(o => o.status === 'completed').map(order => (
                    <div key={order.id} className="p-4 rounded-xl bg-card border border-border opacity-75">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold">
                          {order.tableNumber ? `${t('orders.table')} ${order.tableNumber}` : order.customerName}
                        </span>
                        <Badge variant="secondary">{order.source}</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>{order.items.length} {t('orders.items')}</p>
                        <p className="font-bold">{order.totalAmount + (order.tip || 0)} RON</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Menu Management */}
        {activeView === 'menu' && (
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t('menu.title')}</h2>
              <Button onClick={() => setShowAddMenu(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('menu.add')}
              </Button>
            </div>

            {menuCategories.map(category => {
              const categoryItems = menu.filter(m => m.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryItems.map(item => (
                      <div key={item.id} className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                          <span className="font-bold text-primary ml-2">{item.price} RON</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                          <span>KDS: {kdsStations.find(k => k.id === item.kdsStation)?.name}</span>
                          <span>{item.prepTime} min</span>
                        </div>
                        {item.platformPricing && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.platformPricing.glovo?.enabled && (
                              <Badge variant="outline" className="text-xs">G: {item.platformPricing.glovo.price}</Badge>
                            )}
                            {item.platformPricing.wolt?.enabled && (
                              <Badge variant="outline" className="text-xs">W: {item.platformPricing.wolt.price}</Badge>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => startEditMenuItem(item)}>
                            <Edit2 className="w-3 h-3 mr-1" />
                            {t('app.edit')}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => {
                            deleteMenuItem(item.id);
                            toast({ title: t('app.delete') });
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* KDS Configuration */}
        {activeView === 'kds' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('kds.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kdsStations.map(station => {
                const stationItems = menu.filter(m => m.kdsStation === station.id);
                
                return (
                  <div key={station.id} className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className={cn("px-4 py-3 text-white", station.color)}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{station.icon}</span>
                        <div>
                          <h3 className="font-bold">{station.name}</h3>
                          <p className="text-sm opacity-80">{stationItems.length} {t('kds.products')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 max-h-64 overflow-auto">
                      {stationItems.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('app.noData')}</p>
                      ) : (
                        <ul className="space-y-2">
                          {stationItems.map(item => (
                            <li key={item.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">{item.prepTime} min</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reservations Management */}
        {activeView === 'reservations' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('reservations.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {reservations.map(res => (
                <div key={res.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold">{res.customerName}</span>
                    <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'pending' ? 'secondary' : 'outline'}>
                      {t(`reservations.${res.status}` as any)}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><Phone className="w-3 h-3 inline mr-1" /> {res.customerPhone}</p>
                    <p>{new Date(res.date).toLocaleDateString()} • {res.time}</p>
                    <p>{res.partySize} {t('reservations.partySize')}</p>
                    <p>{t('reservations.tables')}: {res.tableIds.map(id => tables.find(t => t.id === id)?.number).join(', ')}</p>
                    {res.notes && <p className="italic">"{res.notes}"</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {res.status === 'pending' && (
                      <Button size="sm" className="flex-1" onClick={() => updateReservation({ ...res, status: 'confirmed' })}>
                        {t('app.confirm')}
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => deleteReservation(res.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extra Ingredients Management */}
        {activeView === 'extraIngredients' && (
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Ingrediente Extra</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adauga ingredient
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Ingredientele extra pot fi adaugate de clienti la produse contra cost.
            </p>

            {/* Group by category */}
            {Object.entries(
              extraIngredients.reduce((acc, ing) => {
                if (!acc[ing.category]) acc[ing.category] = [];
                acc[ing.category].push(ing);
                return acc;
              }, {} as Record<string, typeof extraIngredients>)
            ).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Salad className="w-5 h-5 text-primary" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map(ing => (
                    <div key={ing.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                      <div>
                        <p className="font-medium">{ing.name}</p>
                        <p className="text-primary font-bold">+{ing.price} RON</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Platforms */}
        {activeView === 'delivery' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('delivery.title')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {deliveryPlatforms.map(platform => (
                <div key={platform.id} className={cn("p-4 rounded-xl border-2", platform.enabled ? "border-primary bg-card" : "border-border bg-secondary/30")}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <h3 className="font-bold">{platform.name}</h3>
                      <div className="flex items-center gap-1 text-xs">
                        {platform.apiConnected ? (
                          <><Wifi className="w-3 h-3 text-green-500" /> <span className="text-green-500">{t('delivery.connected')}</span></>
                        ) : (
                          <><WifiOff className="w-3 h-3 text-red-500" /> <span className="text-red-500">{t('delivery.disconnected')}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant={platform.enabled ? "outline" : "default"} size="sm" className="w-full">
                    {platform.enabled ? t('app.edit') : t('app.add')}
                  </Button>
                </div>
              ))}
            </div>

            {/* Active Delivery Orders */}
            <h3 className="font-semibold mb-4">{t('orders.active')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.filter(o => o.source !== 'restaurant' && o.source !== 'phone' && o.status === 'active').map(order => (
                <div key={order.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>{order.source.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">#{order.platformOrderId}</span>
                  </div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                  <p className="text-sm">{order.customerPhone}</p>
                  <div className="mt-2 pt-2 border-t border-border">
                    {order.items.map(item => (
                      <p key={item.id} className="text-sm">{item.quantity}x {item.menuItem.name}</p>
                    ))}
                  </div>
                  <p className="font-bold mt-2">{order.totalAmount} RON</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiters Management */}
        {activeView === 'waiters' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">{t('waiters.title')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.filter(u => u.role === 'waiter').map(waiter => {
                const stats = waiterStats.find(w => w.id === waiter.id);
                return (
                  <div key={waiter.id} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                        {waiter.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold">{waiter.name}</h3>
                        <p className="text-sm text-muted-foreground">PIN: {waiter.pin}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">{t('waiters.ordersToday')}</p>
                        <p className="font-bold">{stats?.ordersCount || 0}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground">{t('waiters.totalSales')}</p>
                        <p className="font-bold">{stats?.totalSales || 0}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Table Dialog */}
      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tables.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('tables.number')}</label>
                <Input type="number" value={tableForm.number} onChange={e => setTableForm({...tableForm, number: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('tables.seats')}</label>
                <Input type="number" value={tableForm.seats} onChange={e => setTableForm({...tableForm, seats: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('tables.shape')}</label>
              <Select value={tableForm.shape} onValueChange={(v: Table['shape']) => setTableForm({...tableForm, shape: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">{t('tables.round')}</SelectItem>
                  <SelectItem value="square">{t('tables.square')}</SelectItem>
                  <SelectItem value="rectangle">{t('tables.rectangle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('tables.position')} X (%)</label>
                <Input type="number" value={tableForm.x} onChange={e => setTableForm({...tableForm, x: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('tables.position')} Y (%)</label>
                <Input type="number" value={tableForm.y} onChange={e => setTableForm({...tableForm, y: e.target.value})} />
              </div>
            </div>
            <Button className="w-full" onClick={handleAddTable}>{t('tables.add')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Menu Item Dialog */}
      <Dialog open={showAddMenu || !!editingItem} onOpenChange={(open) => {
        if (!open) { setShowAddMenu(false); setEditingItem(null); resetMenuForm(); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('app.edit') : t('menu.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('menu.name')}</label>
                <Input value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('menu.price')}</label>
                <Input type="number" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('menu.description')}</label>
              <Input value={menuForm.description} onChange={e => setMenuForm({...menuForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">{t('menu.category')}</label>
                <Select value={menuForm.category} onValueChange={v => setMenuForm({...menuForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {menuCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('menu.kdsStation')}</label>
                <Select value={menuForm.kdsStation} onValueChange={v => setMenuForm({...menuForm, kdsStation: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kdsStations.map(station => (<SelectItem key={station.id} value={station.id}>{station.icon} {station.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('menu.prepTime')}</label>
                <Input type="number" value={menuForm.prepTime} onChange={e => setMenuForm({...menuForm, prepTime: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('menu.ingredients')}</label>
              <Input value={menuForm.ingredients} onChange={e => setMenuForm({...menuForm, ingredients: e.target.value})} placeholder="Ingredient 1, Ingredient 2..." />
            </div>
            
            {/* Platform Pricing */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('menu.platformPricing')}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Glovo</label>
                  <Input type="number" value={menuForm.glovoPrice} onChange={e => setMenuForm({...menuForm, glovoPrice: e.target.value})} placeholder="Auto +20%" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Wolt</label>
                  <Input type="number" value={menuForm.woltPrice} onChange={e => setMenuForm({...menuForm, woltPrice: e.target.value})} placeholder="Auto +20%" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bolt</label>
                  <Input type="number" value={menuForm.boltPrice} onChange={e => setMenuForm({...menuForm, boltPrice: e.target.value})} placeholder="Auto +20%" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Website</label>
                  <Input type="number" value={menuForm.ownPrice} onChange={e => setMenuForm({...menuForm, ownPrice: e.target.value})} placeholder="Auto +10%" />
                </div>
              </div>
            </div>
            
            <Button className="w-full" onClick={editingItem ? handleUpdateMenuItem : handleAddMenuItem}>
              <Save className="w-4 h-4 mr-2" />
              {editingItem ? t('app.save') : t('menu.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
