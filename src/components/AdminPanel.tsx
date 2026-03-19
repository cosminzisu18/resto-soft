import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  LogOut, Settings, UtensilsCrossed, LayoutGrid, 
  Monitor, Plus, Trash2, Edit2, Save, Users, CalendarDays,
  Truck, BarChart3, Map, ShoppingCart, Phone, Wifi, WifiOff, Salad,
  Image, Smartphone, Store, Globe, Package, GripVertical, Check, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, MenuItem, menuCategories, users, deliveryPlatforms, User, mockCustomers, extraIngredients, ExtraIngredient, extraIngredientCategories, kioskSteps, allergens, KDSStation, upsellQuestions, UpsellQuestion, expiringProducts, ExpiringProduct, menuItems } from '@/data/mockData';
import { tablesApi, type TableApi } from '@/lib/api';
import AdminTableMap from '@/components/AdminTableMap';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LanguageSelector from '@/components/LanguageSelector';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'tables' | 'tableMap' | 'orders' | 'menu' | 'extraIngredients' | 'kioskConfig' | 'kds' | 'reservations' | 'delivery' | 'waiters' | 'customers' | 'upsellQuestions';

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const isMobile = useIsMobile();
  const { 
    tables,
    menu, addMenuItem, updateMenuItem, deleteMenuItem,
    kdsStations, addKdsStation, updateKdsStation, deleteKdsStation,
    orders, reservations, deleteReservation, updateReservation
  } = useRestaurant();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  
  // Extra ingredients state
  const [localExtraIngredients, setLocalExtraIngredients] = useState<ExtraIngredient[]>(extraIngredients);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<ExtraIngredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({ name: '', price: '', category: extraIngredientCategories[0] });
  
  // Kiosk config state
  const [localKioskSteps, setLocalKioskSteps] = useState(kioskSteps);
  
  // KDS stations state
  const [showAddKdsStation, setShowAddKdsStation] = useState(false);
  const [editingKdsStation, setEditingKdsStation] = useState<KDSStation | null>(null);
  const [kdsForm, setKdsForm] = useState({ name: '', type: 'grill' as KDSStation['type'], color: 'bg-orange-500', icon: '🔥' });

  // Upsell Questions state
  const [localUpsellQuestions, setLocalUpsellQuestions] = useState<UpsellQuestion[]>(upsellQuestions);
  const [localExpiringProducts, setLocalExpiringProducts] = useState<ExpiringProduct[]>(expiringProducts);
  const [showAddUpsellQuestion, setShowAddUpsellQuestion] = useState(false);
  const [editingUpsellQuestion, setEditingUpsellQuestion] = useState<UpsellQuestion | null>(null);
  const [upsellForm, setUpsellForm] = useState({ question: '', type: 'simple' as UpsellQuestion['type'], category: '' });
  const [showAddExpiringProduct, setShowAddExpiringProduct] = useState(false);
  const [expiringForm, setExpiringForm] = useState({ productId: '', expiresIn: '2', quantity: '1' });

  /** Mese din baza de date (API) – folosite la „Mese”, „Hartă mese” și rezolvare număr masă la rezervări. */
  const [schemaTables, setSchemaTables] = useState<Table[]>([]);
  const [schemaTablesLoading, setSchemaTablesLoading] = useState(false);

  /** Mapează răspuns API la tipul Table (mockData) folosit de AdminTableMap. */
  const mapApiTableToTable = (api: TableApi): Table => ({
    id: api.id,
    number: api.number,
    seats: api.seats,
    status: api.status,
    position: api.position ?? { x: 50, y: 50 },
    shape: api.shape,
    currentOrderId: api.currentOrderId ?? undefined,
    reservationId: api.reservationId ?? undefined,
    currentGuests: api.currentGuests,
    mergedWith: api.mergedWith ?? undefined,
    qrCode: api.qrCode ?? undefined,
  });

  const fetchSchemaTables = useCallback(async () => {
    setSchemaTablesLoading(true);
    try {
      const list = await tablesApi.getTables();
      setSchemaTables(list.map(mapApiTableToTable));
    } catch (e) {
      toast({ title: 'Eroare la încărcarea meselor', description: String(e), variant: 'destructive' });
      setSchemaTables([]);
    } finally {
      setSchemaTablesLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (['tables', 'tableMap', 'reservations'].includes(activeView)) fetchSchemaTables();
  }, [activeView, fetchSchemaTables]);

  const handleSaveSchema = useCallback(async () => {
    try {
      for (const table of schemaTables) {
        await tablesApi.updateTable(table.id, { position: table.position });
      }
      toast({ title: 'Schema salvată', description: 'Pozițiile meselor au fost actualizate.' });
    } catch (e) {
      toast({ title: 'Eroare la salvare', description: String(e), variant: 'destructive' });
    }
  }, [schemaTables, toast]);

  const handleConfirmMerge = useCallback(async (selectedIds: number[]) => {
    if (selectedIds.length < 2) return;
    const [mainId, ...otherIds] = selectedIds;
    try {
      await tablesApi.updateTable(mainId, { mergedWith: otherIds });
      for (const oid of otherIds) {
        await tablesApi.updateTable(oid, { mergedWith: [mainId] });
      }
      toast({ title: 'Mese unite', description: `${selectedIds.length} mese au fost unite.` });
      await fetchSchemaTables();
    } catch (e) {
      toast({ title: 'Eroare la unire', description: String(e), variant: 'destructive' });
    }
  }, [fetchSchemaTables, toast]);

  const kdsTypeOptions = [
    { value: 'soups', label: 'Supe', icon: '🍲', color: 'bg-amber-500' },
    { value: 'pizza', label: 'Pizza', icon: '🍕', color: 'bg-red-500' },
    { value: 'grill', label: 'Grill', icon: '🔥', color: 'bg-orange-500' },
    { value: 'giros', label: 'Giros', icon: '🥙', color: 'bg-yellow-500' },
  ];

  // Table form (listă mese mock + hartă mese API)
  const [tableForm, setTableForm] = useState({
    number: '',
    seats: '4',
    shape: 'square' as Table['shape'],
    x: '50',
    y: '50',
    zone: '',
  });

  // Menu form - extended with all fields
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: menuCategories[0],
    kdsStation: 'grill',
    prepTime: '10',
    ingredients: '',
    allergenIds: [] as string[],
    availableExtras: [] as string[],
    image: '',
    availRestaurant: true,
    availKiosk: true,
    availApp: true,
    availDelivery: true,
    glovoPrice: '',
    woltPrice: '',
    boltPrice: '',
    ownPrice: '',
  });

  const resetTableForm = () =>
    setTableForm({ number: '', seats: '4', shape: 'square', x: '50', y: '50', zone: '' });

  const handleAddTable = async () => {
    const num = parseInt(tableForm.number, 10);
    const seats = parseInt(tableForm.seats, 10);
    const x = parseInt(tableForm.x, 10);
    const y = parseInt(tableForm.y, 10);
    if (Number.isNaN(num) || num < 1) {
      toast({ title: 'Introdu un număr masă valid', variant: 'destructive' });
      return;
    }
    if (Number.isNaN(seats) || seats < 1) {
      toast({ title: 'Introdu numărul de locuri', variant: 'destructive' });
      return;
    }
    try {
      await tablesApi.createTable({
        number: num,
        seats,
        shape: tableForm.shape,
        position: {
          x: Number.isNaN(x) ? 50 : Math.min(95, Math.max(5, x)),
          y: Number.isNaN(y) ? 50 : Math.min(95, Math.max(5, y)),
        },
        status: 'free',
        ...(tableForm.zone.trim() ? { zone: tableForm.zone.trim() } : {}),
      });
      await fetchSchemaTables();
      toast({
        title: 'Masă salvată în baza de date',
        description: activeView === 'tableMap' ? 'Poți muta poziția pe hartă și apoi Salvează schema.' : undefined,
      });
    } catch (e) {
      toast({ title: 'Eroare la adăugarea mesei', description: String(e), variant: 'destructive' });
      return;
    }
    setShowAddTable(false);
    resetTableForm();
  };

  const openAddTableDialog = () => {
    const nextNum = schemaTables.length ? Math.max(...schemaTables.map((t) => t.number), 0) + 1 : 1;
    setTableForm((f) => ({ ...f, number: String(nextNum), seats: '4', shape: 'square', x: '50', y: '50', zone: '' }));
    setShowAddTable(true);
  };

  const handleDeleteDbTable = async (id: number) => {
    try {
      await tablesApi.deleteTable(id);
      await fetchSchemaTables();
      toast({ title: t('app.delete') });
    } catch (e) {
      toast({ title: 'Eroare la ștergere', description: String(e), variant: 'destructive' });
    }
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
      allergenIds: menuForm.allergenIds,
      availableExtras: menuForm.availableExtras,
      image: menuForm.image || undefined,
      availability: {
        restaurant: menuForm.availRestaurant,
        kiosk: menuForm.availKiosk,
        app: menuForm.availApp,
        delivery: menuForm.availDelivery,
      },
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
    setMenuForm({ 
      name: '', description: '', price: '', category: menuCategories[0], kdsStation: 'grill', prepTime: '10', ingredients: '',
      allergenIds: [], availableExtras: [], image: '', availRestaurant: true, availKiosk: true, availApp: true, availDelivery: true,
      glovoPrice: '', woltPrice: '', boltPrice: '', ownPrice: '' 
    });
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
      allergenIds: menuForm.allergenIds,
      availableExtras: menuForm.availableExtras,
      image: menuForm.image || undefined,
      availability: {
        restaurant: menuForm.availRestaurant,
        kiosk: menuForm.availKiosk,
        app: menuForm.availApp,
        delivery: menuForm.availDelivery,
      },
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
      allergenIds: item.allergenIds || [],
      availableExtras: item.availableExtras || [],
      image: item.image || '',
      availRestaurant: item.availability?.restaurant ?? true,
      availKiosk: item.availability?.kiosk ?? true,
      availApp: item.availability?.app ?? true,
      availDelivery: item.availability?.delivery ?? true,
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

  // Extra ingredient handlers
  const handleAddIngredient = () => {
    const newIngredient: ExtraIngredient = {
      id: `ei${Date.now()}`,
      name: ingredientForm.name,
      price: parseFloat(ingredientForm.price),
      category: ingredientForm.category
    };
    setLocalExtraIngredients([...localExtraIngredients, newIngredient]);
    toast({ title: 'Ingredient adăugat' });
    setShowAddIngredient(false);
    setIngredientForm({ name: '', price: '', category: extraIngredientCategories[0] });
  };

  const handleUpdateIngredient = () => {
    if (!editingIngredient) return;
    setLocalExtraIngredients(localExtraIngredients.map(ing => 
      ing.id === editingIngredient.id 
        ? { ...ing, name: ingredientForm.name, price: parseFloat(ingredientForm.price), category: ingredientForm.category }
        : ing
    ));
    toast({ title: 'Ingredient actualizat' });
    setEditingIngredient(null);
    setIngredientForm({ name: '', price: '', category: extraIngredientCategories[0] });
  };

  const handleDeleteIngredient = (id: string) => {
    setLocalExtraIngredients(localExtraIngredients.filter(ing => ing.id !== id));
    toast({ title: 'Ingredient șters' });
  };

  const startEditIngredient = (ing: ExtraIngredient) => {
    setEditingIngredient(ing);
    setIngredientForm({ name: ing.name, price: ing.price.toString(), category: ing.category });
  };

  // KDS handlers
  const handleAddKdsStation = () => {
    addKdsStation({
      name: kdsForm.name,
      type: kdsForm.type,
      color: kdsForm.color,
      icon: kdsForm.icon,
    });
    toast({ title: 'Stație KDS adăugată' });
    setShowAddKdsStation(false);
    resetKdsForm();
  };

  const handleUpdateKdsStation = () => {
    if (!editingKdsStation) return;
    updateKdsStation({
      ...editingKdsStation,
      name: kdsForm.name,
      type: kdsForm.type,
      color: kdsForm.color,
      icon: kdsForm.icon,
    });
    toast({ title: 'Stație KDS actualizată' });
    setEditingKdsStation(null);
    resetKdsForm();
  };

  const handleDeleteKdsStation = (id: string) => {
    deleteKdsStation(id);
    toast({ title: 'Stație KDS ștearsă' });
  };

  const startEditKdsStation = (station: KDSStation) => {
    setEditingKdsStation(station);
    setKdsForm({ name: station.name, type: station.type, color: station.color, icon: station.icon });
  };

  const resetKdsForm = () => {
    setKdsForm({ name: '', type: 'grill', color: 'bg-orange-500', icon: '🔥' });
  };

  const navItems = [
    { id: 'dashboard' as AdminView, label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'tables' as AdminView, label: t('nav.tables'), icon: LayoutGrid },
    { id: 'tableMap' as AdminView, label: t('nav.tableMap'), icon: Map },
    { id: 'orders' as AdminView, label: t('nav.orders'), icon: ShoppingCart },
    { id: 'menu' as AdminView, label: t('nav.menu'), icon: UtensilsCrossed },
    { id: 'extraIngredients' as AdminView, label: 'Ingrediente Extra', icon: Salad },
    { id: 'upsellQuestions' as AdminView, label: 'Întrebări Upsell', icon: ShoppingCart },
    { id: 'kioskConfig' as AdminView, label: 'Kiosk/App Config', icon: Smartphone },
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
              <Button onClick={openAddTableDialog}>
                <Plus className="w-4 h-4 mr-2" />
                {t('tables.add')}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Mese din baza de date (nu mai folosim lista demo). Adaugă mese aici sau din Hartă mese.
            </p>
            {schemaTablesLoading ? (
              <p className="text-muted-foreground">Se încarcă mesele...</p>
            ) : schemaTables.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Nu există mese în DB</p>
                <p className="text-sm mb-4">Apasă „Adaugă masă” pentru a crea prima masă.</p>
                <Button onClick={openAddTableDialog}>{t('tables.add')}</Button>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {schemaTables.map((table) => (
                <div key={table.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">{t('orders.table')} {table.number}</span>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => void handleDeleteDbTable(table.id)}
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
            )}
          </div>
        )}

        {/* Table Map - schema mese din DB, drag + Salvează schema + Unire mese */}
        {activeView === 'tableMap' && (
          <div className="p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">{t('nav.tableMap')}</h2>
              <Button onClick={openAddTableDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('tables.add')}
              </Button>
            </div>
            {schemaTablesLoading ? (
              <p className="text-muted-foreground">Se încarcă mesele...</p>
            ) : schemaTables.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Nu există mese pe hartă</p>
                <p className="text-sm mb-4">Adaugă mese din baza de date, apoi le poți aranja aici.</p>
                <Button onClick={openAddTableDialog}>{t('tables.add')}</Button>
              </div>
            ) : (
              <AdminTableMap
                tables={schemaTables}
                onUpdateTable={(table) => setSchemaTables((prev) => prev.map((t) => (t.id === table.id ? table : t)))}
                onSaveSchema={handleSaveSchema}
                onConfirmMerge={handleConfirmMerge}
              />
            )}
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
                        {item.image && (
                          <div className="mb-3 aspect-video rounded-lg overflow-hidden bg-secondary">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                          <span className="font-bold text-primary ml-2">{item.price} RON</span>
                        </div>
                        
                        {/* Availability badges */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.availability?.restaurant && <Badge variant="outline" className="text-xs"><Store className="w-3 h-3 mr-1" />Restaurant</Badge>}
                          {item.availability?.kiosk && <Badge variant="outline" className="text-xs"><Package className="w-3 h-3 mr-1" />Kiosk</Badge>}
                          {item.availability?.app && <Badge variant="outline" className="text-xs"><Smartphone className="w-3 h-3 mr-1" />App</Badge>}
                          {item.availability?.delivery && <Badge variant="outline" className="text-xs"><Truck className="w-3 h-3 mr-1" />Delivery</Badge>}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t('kds.title')}</h2>
              <Button onClick={() => setShowAddKdsStation(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă stație KDS
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Stațiile KDS sunt ecranele din bucătărie unde se afișează comenzile pentru fiecare secție de preparare.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kdsStations.map(station => {
                const stationItems = menu.filter(m => m.kdsStation === station.id);
                
                return (
                  <div key={station.id} className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className={cn("px-4 py-3 text-white flex items-center justify-between", station.color)}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{station.icon}</span>
                        <div>
                          <h3 className="font-bold">{station.name}</h3>
                          <p className="text-sm opacity-80">{stationItems.length} {t('kds.products')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20" onClick={() => startEditKdsStation(station)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20" onClick={() => handleDeleteKdsStation(station.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
              
              {kdsStations.length === 0 && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nu există stații KDS definite.</p>
                  <Button className="mt-4" onClick={() => setShowAddKdsStation(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă prima stație
                  </Button>
                </div>
              )}
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
                    <p>{t('reservations.tables')}: {res.tableIds.map((id) => schemaTables.find((t) => t.id === id)?.number ?? tables.find((t) => t.id === id)?.number ?? '?').join(', ')}</p>
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
              <Button onClick={() => setShowAddIngredient(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă ingredient
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Ingredientele extra pot fi adăugate de clienți la produse contra cost. Acestea apar în kiosk, aplicație și comenzi telefonice.
            </p>

            {/* Group by category */}
            {extraIngredientCategories.map(category => {
              const items = localExtraIngredients.filter(ing => ing.category === category);
              if (items.length === 0) return null;
              
              return (
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
                          <Button variant="ghost" size="icon" onClick={() => startEditIngredient(ing)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteIngredient(ing.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {localExtraIngredients.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Salad className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nu există ingrediente extra definite.</p>
                <Button className="mt-4" onClick={() => setShowAddIngredient(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adaugă primul ingredient
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Kiosk/App Configuration */}
        {activeView === 'kioskConfig' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">Configurare Kiosk & Aplicație Client</h2>
            
            <Tabs defaultValue="menu">
              <TabsList className="mb-6">
                <TabsTrigger value="menu">Disponibilitate Meniu</TabsTrigger>
                <TabsTrigger value="steps">Pași Kiosk</TabsTrigger>
                <TabsTrigger value="appearance">Aspect</TabsTrigger>
              </TabsList>
              
              <TabsContent value="menu">
                <p className="text-muted-foreground mb-6">
                  Setează care preparate sunt disponibile pe fiecare canal de vânzare.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold">Preparat</th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <Store className="w-4 h-4" />
                            Restaurant
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <Package className="w-4 h-4" />
                            Kiosk
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <Smartphone className="w-4 h-4" />
                            App
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <Truck className="w-4 h-4" />
                            Delivery
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <Image className="w-4 h-4 mx-auto" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {menu.map(item => (
                        <tr key={item.id} className="border-b border-border hover:bg-secondary/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center">
                              <Switch checked={item.availability?.restaurant ?? true} />
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center">
                              <Switch checked={item.availability?.kiosk ?? true} />
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center">
                              <Switch checked={item.availability?.app ?? true} />
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center">
                              <Switch checked={item.availability?.delivery ?? true} />
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {item.image ? (
                              <Check className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="steps">
                <p className="text-muted-foreground mb-6">
                  Configurează pașii care apar în fluxul de comandă kiosk/aplicație.
                </p>
                
                <div className="space-y-3 max-w-xl">
                  {localKioskSteps.sort((a, b) => a.order - b.order).map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-xs text-muted-foreground">Pas {step.order}</p>
                      </div>
                      <Switch 
                        checked={step.enabled}
                        onCheckedChange={(checked) => {
                          setLocalKioskSteps(localKioskSteps.map(s => 
                            s.id === step.id ? { ...s, enabled: checked } : s
                          ));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="appearance">
                <p className="text-muted-foreground mb-6">
                  Personalizează aspectul kiosk-ului și aplicației client.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <Label>Logo Restaurant</Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center">
                        <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Încarcă logo (PNG, JPG)</p>
                        <Button variant="outline" size="sm" className="mt-2">Selectează fișier</Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Imagine de fundal</Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center">
                        <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Încarcă imagine fundal</p>
                        <Button variant="outline" size="sm" className="mt-2">Selectează fișier</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Culoare principală</Label>
                      <div className="mt-2 flex gap-2">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map(color => (
                          <button 
                            key={color}
                            className="w-10 h-10 rounded-lg border-2 border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Mesaj de bun venit</Label>
                      <Input className="mt-2" defaultValue="Bine ați venit!" />
                    </div>
                    
                    <div>
                      <Label>Limbă implicită</Label>
                      <Select defaultValue="ro">
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ro">Română</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Upsell Questions Configuration */}
        {activeView === 'upsellQuestions' && (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6">Întrebări Upsell pentru Ospătari</h2>
            <p className="text-muted-foreground mb-6">
              Configurați întrebările care vor apărea ospătarilor înainte de a trimite comanda la bucătărie.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Întrebări Active</h3>
                  <Button size="sm" onClick={() => setShowAddUpsellQuestion(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă întrebare
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {localUpsellQuestions.sort((a, b) => a.order - b.order).map(question => (
                    <div 
                      key={question.id} 
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        question.enabled ? "border-primary/50 bg-card" : "border-border bg-secondary/30 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {question.order}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{question.question}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {question.type === 'simple' ? 'Întrebare simplă' : 'Produse aproape de expirare'}
                              </Badge>
                              {question.category && (
                                <Badge variant="outline" className="text-xs">{question.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={question.enabled}
                            onCheckedChange={(enabled) => {
                              setLocalUpsellQuestions(localUpsellQuestions.map(q => 
                                q.id === question.id ? { ...q, enabled } : q
                              ));
                              toast({ title: enabled ? 'Întrebare activată' : 'Întrebare dezactivată' });
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingUpsellQuestion(question);
                              setUpsellForm({ 
                                question: question.question, 
                                type: question.type, 
                                category: question.category || '' 
                              });
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setLocalUpsellQuestions(localUpsellQuestions.filter(q => q.id !== question.id));
                              toast({ title: 'Întrebare ștearsă' });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Expiring Products */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Produse Aproape de Expirare</h3>
                  <Button size="sm" onClick={() => setShowAddExpiringProduct(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă produs
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aceste produse vor fi sugerate cu reducere ospătarilor.
                </p>
                
                <div className="space-y-3">
                  {localExpiringProducts.map(ep => {
                    const product = menuItems.find(m => m.id === ep.productId);
                    const hoursRemaining = Math.max(0, Math.floor((ep.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
                    const minutesRemaining = Math.max(0, Math.floor(((ep.expiresAt.getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)));
                    
                    return (
                      <div 
                        key={ep.productId} 
                        className="p-4 rounded-xl border border-warning/50 bg-warning/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {product?.image && (
                              <img src={product.image} alt={ep.productName} className="w-12 h-12 rounded-lg object-cover" />
                            )}
                            <div>
                              <p className="font-medium">{ep.productName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Cantitate: {ep.quantity}</span>
                                <span>•</span>
                                <span className="text-warning font-medium">
                                  Expiră în {hoursRemaining}h {minutesRemaining}m
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setLocalExpiringProducts(localExpiringProducts.filter(p => p.productId !== ep.productId));
                              toast({ title: 'Produs eliminat din listă' });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {localExpiringProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nu sunt produse aproape de expirare.</p>
                      <p className="text-sm">Adăugați produse pentru a le sugera ospătarilor.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
            <div>
              <Label className="text-sm font-medium">Zonă (opțional)</Label>
              <Input
                placeholder="ex: terasă, interior"
                value={tableForm.zone}
                onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={() => void handleAddTable()}>{t('tables.add')}</Button>
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
            
            {/* Photo URL */}
            <div>
              <label className="text-sm font-medium">Imagine URL</label>
              <Input value={menuForm.image} onChange={e => setMenuForm({...menuForm, image: e.target.value})} placeholder="https://..." />
            </div>
            
            {/* Allergens */}
            <div>
              <label className="text-sm font-medium mb-2 block">Alergeni</label>
              <div className="flex flex-wrap gap-2">
                {allergens.map(allergen => (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => {
                      const newAllergens = menuForm.allergenIds.includes(allergen.id)
                        ? menuForm.allergenIds.filter(a => a !== allergen.id)
                        : [...menuForm.allergenIds, allergen.id];
                      setMenuForm({...menuForm, allergenIds: newAllergens});
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm flex items-center gap-1 border transition-all",
                      menuForm.allergenIds.includes(allergen.id) 
                        ? `${allergen.color} text-white border-transparent` 
                        : "border-border hover:border-primary"
                    )}
                  >
                    <span>{allergen.icon}</span>
                    <span>{allergen.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Availability */}
            <div>
              <label className="text-sm font-medium mb-2 block">Disponibilitate</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 p-2 rounded border border-border">
                  <Switch checked={menuForm.availRestaurant} onCheckedChange={c => setMenuForm({...menuForm, availRestaurant: c})} />
                  <span className="text-sm">Restaurant</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-border">
                  <Switch checked={menuForm.availKiosk} onCheckedChange={c => setMenuForm({...menuForm, availKiosk: c})} />
                  <span className="text-sm">Kiosk</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-border">
                  <Switch checked={menuForm.availApp} onCheckedChange={c => setMenuForm({...menuForm, availApp: c})} />
                  <span className="text-sm">App</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-border">
                  <Switch checked={menuForm.availDelivery} onCheckedChange={c => setMenuForm({...menuForm, availDelivery: c})} />
                  <span className="text-sm">Delivery</span>
                </label>
              </div>
            </div>
            
            {/* Available Extra Ingredients */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ingrediente Extra Disponibile</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto p-2 border border-border rounded">
                {localExtraIngredients.map(extra => (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => {
                      const newExtras = menuForm.availableExtras.includes(extra.id)
                        ? menuForm.availableExtras.filter(e => e !== extra.id)
                        : [...menuForm.availableExtras, extra.id];
                      setMenuForm({...menuForm, availableExtras: newExtras});
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-xs border transition-all",
                      menuForm.availableExtras.includes(extra.id) 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-border hover:border-primary"
                    )}
                  >
                    {extra.name} (+{extra.price} RON)
                  </button>
                ))}
              </div>
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

      {/* Add/Edit Ingredient Dialog */}
      <Dialog open={showAddIngredient || !!editingIngredient} onOpenChange={(open) => {
        if (!open) { setShowAddIngredient(false); setEditingIngredient(null); setIngredientForm({ name: '', price: '', category: extraIngredientCategories[0] }); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIngredient ? 'Editează ingredient' : 'Adaugă ingredient extra'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nume</label>
              <Input value={ingredientForm.name} onChange={e => setIngredientForm({...ingredientForm, name: e.target.value})} placeholder="ex: Mozzarella extra" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Preț (RON)</label>
                <Input type="number" value={ingredientForm.price} onChange={e => setIngredientForm({...ingredientForm, price: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Categorie</label>
                <Select value={ingredientForm.category} onValueChange={v => setIngredientForm({...ingredientForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {extraIngredientCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={editingIngredient ? handleUpdateIngredient : handleAddIngredient}>
              <Save className="w-4 h-4 mr-2" />
              {editingIngredient ? 'Salvează' : 'Adaugă'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit KDS Station Dialog */}
      <Dialog open={showAddKdsStation || !!editingKdsStation} onOpenChange={(open) => {
        if (!open) { setShowAddKdsStation(false); setEditingKdsStation(null); resetKdsForm(); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingKdsStation ? 'Editează stație KDS' : 'Adaugă stație KDS'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nume stație</label>
              <Input value={kdsForm.name} onChange={e => setKdsForm({...kdsForm, name: e.target.value})} placeholder="ex: Grill & Mâncare Gătită" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tip stație</label>
              <div className="grid grid-cols-2 gap-2">
                {kdsTypeOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setKdsForm({...kdsForm, type: option.value as KDSStation['type'], color: option.color, icon: option.icon})}
                    className={cn(
                      "p-3 rounded-lg border-2 flex items-center gap-2 transition-all",
                      kdsForm.type === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Culoare</label>
              <div className="flex gap-2">
                {['bg-amber-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setKdsForm({...kdsForm, color})}
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 transition-all",
                      color,
                      kdsForm.color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {['🔥', '🍕', '🍲', '🥙', '🍝', '🥗', '🍳', '🍖', '🧁', '🍨'].map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setKdsForm({...kdsForm, icon})}
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all",
                      kdsForm.icon === icon ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={editingKdsStation ? handleUpdateKdsStation : handleAddKdsStation}>
              <Save className="w-4 h-4 mr-2" />
              {editingKdsStation ? 'Salvează' : 'Adaugă'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Upsell Question Dialog */}
      <Dialog open={showAddUpsellQuestion || !!editingUpsellQuestion} onOpenChange={(open) => {
        if (!open) { 
          setShowAddUpsellQuestion(false); 
          setEditingUpsellQuestion(null); 
          setUpsellForm({ question: '', type: 'simple', category: '' }); 
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUpsellQuestion ? 'Editează întrebare' : 'Adaugă întrebare upsell'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Întrebare</label>
              <Input 
                value={upsellForm.question} 
                onChange={e => setUpsellForm({...upsellForm, question: e.target.value})} 
                placeholder="ex: Doriți un desert?" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tip</label>
              <Select 
                value={upsellForm.type} 
                onValueChange={(v: 'simple' | 'products') => setUpsellForm({...upsellForm, type: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Întrebare simplă (cu produse din categorie)</SelectItem>
                  <SelectItem value="products">Produse aproape de expirare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {upsellForm.type === 'simple' && (
              <div>
                <label className="text-sm font-medium">Categorie produse sugerate</label>
                <Select 
                  value={upsellForm.category} 
                  onValueChange={v => setUpsellForm({...upsellForm, category: v})}
                >
                  <SelectTrigger><SelectValue placeholder="Selectează categoria" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(menuItems.map(m => m.category))).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button 
              className="w-full" 
              onClick={() => {
                if (editingUpsellQuestion) {
                  setLocalUpsellQuestions(localUpsellQuestions.map(q => 
                    q.id === editingUpsellQuestion.id 
                      ? { ...q, question: upsellForm.question, type: upsellForm.type, category: upsellForm.category || undefined }
                      : q
                  ));
                  toast({ title: 'Întrebare actualizată' });
                } else {
                  const newQuestion: UpsellQuestion = {
                    id: `uq${Date.now()}`,
                    question: upsellForm.question,
                    type: upsellForm.type,
                    enabled: true,
                    order: localUpsellQuestions.length + 1,
                    category: upsellForm.category || undefined,
                  };
                  setLocalUpsellQuestions([...localUpsellQuestions, newQuestion]);
                  toast({ title: 'Întrebare adăugată' });
                }
                setShowAddUpsellQuestion(false);
                setEditingUpsellQuestion(null);
                setUpsellForm({ question: '', type: 'simple', category: '' });
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingUpsellQuestion ? 'Salvează' : 'Adaugă'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expiring Product Dialog */}
      <Dialog open={showAddExpiringProduct} onOpenChange={setShowAddExpiringProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă produs aproape de expirare</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Produs</label>
              <Select 
                value={expiringForm.productId} 
                onValueChange={v => setExpiringForm({...expiringForm, productId: v})}
              >
                <SelectTrigger><SelectValue placeholder="Selectează produsul" /></SelectTrigger>
                <SelectContent>
                  {menuItems.filter(m => !localExpiringProducts.find(ep => ep.productId === m.id)).map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">({item.category})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Expiră în (ore)</label>
                <Input 
                  type="number" 
                  value={expiringForm.expiresIn} 
                  onChange={e => setExpiringForm({...expiringForm, expiresIn: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cantitate</label>
                <Input 
                  type="number" 
                  value={expiringForm.quantity} 
                  onChange={e => setExpiringForm({...expiringForm, quantity: e.target.value})} 
                />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                const product = menuItems.find(m => m.id === expiringForm.productId);
                if (!product) {
                  toast({ title: 'Selectați un produs', variant: 'destructive' });
                  return;
                }
                const newExpiring: ExpiringProduct = {
                  productId: expiringForm.productId,
                  productName: product.name,
                  expiresAt: new Date(Date.now() + parseInt(expiringForm.expiresIn) * 60 * 60 * 1000),
                  quantity: parseInt(expiringForm.quantity),
                };
                setLocalExpiringProducts([...localExpiringProducts, newExpiring]);
                toast({ title: 'Produs adăugat' });
                setShowAddExpiringProduct(false);
                setExpiringForm({ productId: '', expiresIn: '2', quantity: '1' });
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Adaugă
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
