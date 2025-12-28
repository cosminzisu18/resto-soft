import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Package, 
  ShoppingCart, 
  Truck, 
  BarChart3,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Check,
  X,
  Clock,
  Calendar,
  FileText,
  Settings,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Box,
  ArrowRight,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// B2B Revenue chart data
const b2bRevenueData = [
  { month: 'Ian', revenue: 45000, orders: 32 },
  { month: 'Feb', revenue: 52000, orders: 38 },
  { month: 'Mar', revenue: 48000, orders: 35 },
  { month: 'Apr', revenue: 61000, orders: 42 },
  { month: 'Mai', revenue: 55000, orders: 40 },
  { month: 'Iun', revenue: 68000, orders: 48 },
];

// Top clients data
const topClientsData = [
  { name: 'Trattoria', value: 78500 },
  { name: 'Piazzetta', value: 45600 },
  { name: 'Bistro', value: 32400 },
  { name: 'Cafe Vienna', value: 8900 },
];

// Mock data for supplier portal
const mockSupplierStats = {
  totalClients: 45,
  activeOrders: 12,
  monthlyRevenue: 156000,
  avgOrderValue: 2800
};

const mockClients = [
  {
    id: '1',
    name: 'Restaurant La Piazzetta',
    logo: null,
    location: 'București, Sector 1',
    contact: 'manager@piazzetta.ro',
    phone: '+40 721 111 222',
    status: 'active',
    modules: ['pos', 'kds', 'stocks', 'delivery'],
    lastOrder: '2024-01-15',
    totalOrders: 89,
    totalValue: 45600
  },
  {
    id: '2',
    name: 'Bistro Central',
    logo: null,
    location: 'Cluj-Napoca',
    contact: 'office@bistrocentral.ro',
    phone: '+40 722 222 333',
    status: 'active',
    modules: ['pos', 'kds'],
    lastOrder: '2024-01-14',
    totalOrders: 56,
    totalValue: 32400
  },
  {
    id: '3',
    name: 'Cafe Vienna',
    logo: null,
    location: 'Timișoara',
    contact: 'contact@cafevienna.ro',
    phone: '+40 723 333 444',
    status: 'pending',
    modules: ['pos'],
    lastOrder: '2024-01-10',
    totalOrders: 12,
    totalValue: 8900
  },
  {
    id: '4',
    name: 'Trattoria Romana',
    logo: null,
    location: 'Iași',
    contact: 'admin@trattoria.ro',
    phone: '+40 724 444 555',
    status: 'active',
    modules: ['pos', 'kds', 'stocks', 'delivery', 'reports'],
    lastOrder: '2024-01-15',
    totalOrders: 124,
    totalValue: 78500
  }
];

const availableModules = [
  { id: 'pos', name: 'RestoPOS', description: 'Sistem point of sale', icon: '💳' },
  { id: 'kds', name: 'KDS', description: 'Kitchen Display System', icon: '👨‍🍳' },
  { id: 'stocks', name: 'Stocuri', description: 'Gestiune stocuri', icon: '📦' },
  { id: 'delivery', name: 'Delivery', description: 'Integrări livrare', icon: '🚚' },
  { id: 'reports', name: 'Rapoarte', description: 'Rapoarte avansate', icon: '📊' },
  { id: 'loyalty', name: 'Fidelizare', description: 'Program fidelitate', icon: '🎁' },
];

// Mock B2B catalog
const mockB2BCatalog = [
  { id: '1', name: 'Făină Tip 000', category: 'Ingrediente', unit: 'kg', price: 4.5, stock: 500, minOrder: 25, image: '🌾' },
  { id: '2', name: 'Ulei de Măsline Extra Virgin', category: 'Ingrediente', unit: 'L', price: 35, stock: 120, minOrder: 5, image: '🫒' },
  { id: '3', name: 'Mozzarella di Bufala', category: 'Lactate', unit: 'kg', price: 85, stock: 50, minOrder: 2, image: '🧀' },
  { id: '4', name: 'Roșii San Marzano', category: 'Conserve', unit: 'buc', price: 8.5, stock: 200, minOrder: 12, image: '🍅' },
  { id: '5', name: 'Prosciutto di Parma', category: 'Mezeluri', unit: 'kg', price: 180, stock: 30, minOrder: 1, image: '🥓' },
  { id: '6', name: 'Vin Roșu Chianti', category: 'Băuturi', unit: 'sticlă', price: 45, stock: 80, minOrder: 6, image: '🍷' },
];

// Mock B2B orders
const mockB2BOrders = [
  {
    id: 'B2B-001',
    date: '2024-01-15',
    client: 'Restaurant La Piazzetta',
    items: 8,
    total: 2450,
    status: 'processing',
    deliveryDate: '2024-01-17'
  },
  {
    id: 'B2B-002',
    date: '2024-01-14',
    client: 'Bistro Central',
    items: 5,
    total: 1890,
    status: 'shipped',
    deliveryDate: '2024-01-16'
  },
  {
    id: 'B2B-003',
    date: '2024-01-13',
    client: 'Trattoria Romana',
    items: 12,
    total: 4200,
    status: 'delivered',
    deliveryDate: '2024-01-15'
  },
  {
    id: 'B2B-004',
    date: '2024-01-12',
    client: 'Cafe Vienna',
    items: 3,
    total: 650,
    status: 'delivered',
    deliveryDate: '2024-01-14'
  }
];

// Mock cart
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  image: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success/10 text-success';
    case 'pending': return 'bg-warning/10 text-warning';
    case 'inactive': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'processing': return 'bg-warning/10 text-warning';
    case 'shipped': return 'bg-info/10 text-info';
    case 'delivered': return 'bg-success/10 text-success';
    case 'cancelled': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getOrderStatusLabel = (status: string) => {
  switch (status) {
    case 'processing': return 'În procesare';
    case 'shipped': return 'Expediat';
    case 'delivered': return 'Livrat';
    case 'cancelled': return 'Anulat';
    default: return status;
  }
};

const SuppliersModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('portal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[0] | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const addToCart = (product: typeof mockB2BCatalog[0]) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + product.minOrder }
          : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        quantity: product.minOrder, 
        price: product.price,
        unit: product.unit,
        image: product.image
      }]);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredCatalog = mockB2BCatalog.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(mockB2BCatalog.map(p => p.category)))];

  // Supplier Portal Dashboard
  const SupplierPortal = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{mockSupplierStats.totalClients}</div>
                <div className="text-sm text-muted-foreground">Clienți Activi</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{mockSupplierStats.activeOrders}</div>
                <div className="text-sm text-muted-foreground">Comenzi Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(mockSupplierStats.monthlyRevenue / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground">Venituri Lunare</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-info" />
              </div>
              <div>
                <div className="text-2xl font-bold">{mockSupplierStats.avgOrderValue}</div>
                <div className="text-sm text-muted-foreground">Valoare Medie</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Venituri B2B</CardTitle>
            <CardDescription>Evoluție lunară</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={b2bRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#colorRevenue)" name="Venituri (Lei)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Clienți</CardTitle>
            <CardDescription>După valoare comenzi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} name="Lei" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clienți (Restaurante)
              </CardTitle>
              <CardDescription>Gestionează clienții și modulele active</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Client Nou
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {mockClients.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(client => (
                <div 
                  key={client.id} 
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedClient(client);
                    setShowModuleDialog(true);
                  }}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {client.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{client.name}</span>
                      <Badge className={getStatusColor(client.status)}>
                        {client.status === 'active' ? 'Activ' : 'În așteptare'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {client.modules.length} module
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-right">
                    <div>
                      <div className="font-semibold">{client.totalOrders}</div>
                      <div className="text-xs text-muted-foreground">Comenzi</div>
                    </div>
                    <div>
                      <div className="font-semibold">{client.totalValue.toLocaleString()} Lei</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Module Activation Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurare Module - {selectedClient?.name}</DialogTitle>
            <DialogDescription>Activează sau dezactivează modulele pentru acest client</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {availableModules.map(module => {
              const isActive = selectedClient?.modules.includes(module.id);
              return (
                <div 
                  key={module.id}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all cursor-pointer",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{module.icon}</span>
                      <div>
                        <div className="font-medium">{module.name}</div>
                        <div className="text-xs text-muted-foreground">{module.description}</div>
                      </div>
                    </div>
                    <Switch checked={isActive} />
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>Închide</Button>
            <Button onClick={() => setShowModuleDialog(false)}>Salvează Modificările</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rapoarte per Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {mockClients.slice(0, 3).map(client => (
              <div key={client.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {client.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm truncate">{client.name}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ultima comandă</span>
                    <span className="font-medium">{client.lastOrder}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total comenzi</span>
                    <span className="font-medium">{client.totalOrders}</span>
                  </div>
                  <Progress value={(client.totalValue / 80000) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {client.totalValue.toLocaleString()} Lei din 80,000 obiectiv
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Eye className="h-4 w-4 mr-2" />
                  Vezi Raport Detaliat
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // B2B Orders Tab
  const B2BOrdersTab = () => (
    <div className="space-y-6">
      {/* Catalog */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Catalog Produse B2B
              </CardTitle>
              <CardDescription>Selectează produsele pentru comandă</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută produs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant={cart.length > 0 ? "default" : "outline"}
                onClick={() => setShowCart(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Coș
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(product => (
              <div key={product.id} className="p-4 rounded-xl border bg-card hover:border-primary transition-colors">
                <div className="flex gap-4">
                  <div className="text-4xl">{product.image}</div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{product.name}</div>
                    <Badge variant="outline" className="mb-2">{product.category}</Badge>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-bold text-primary">{product.price} Lei/{product.unit}</div>
                        <div className="text-xs text-muted-foreground">Min: {product.minOrder} {product.unit}</div>
                      </div>
                      <Button size="sm" onClick={() => addToCart(product)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={(product.stock / 500) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{product.stock} în stoc</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Coș Comandă B2B
            </DialogTitle>
          </DialogHeader>
          
          {cart.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Box className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Coșul este gol</p>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3 pr-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <span className="text-2xl">{item.image}</span>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.price} Lei/{item.unit}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(item.id, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(item.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-20 text-right font-semibold">
                        {(item.price * item.quantity).toFixed(0)} Lei
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">{cartTotal.toFixed(0)} Lei</span>
                </div>
                <Button className="w-full" size="lg">
                  <Truck className="h-5 w-5 mr-2" />
                  Plasează Comanda
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Istoric Comenzi B2B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockB2BOrders.map(order => (
              <div key={order.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  getOrderStatusColor(order.status)
                )}>
                  {order.status === 'processing' && <Clock className="h-6 w-6" />}
                  {order.status === 'shipped' && <Truck className="h-6 w-6" />}
                  {order.status === 'delivered' && <Check className="h-6 w-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{order.id}</span>
                    <Badge className={getOrderStatusColor(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.client} • {order.items} produse
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <div className="text-sm text-muted-foreground">Plasată: {order.date}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                    <Truck className="h-3 w-3" />
                    Livrare: {order.deliveryDate}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold">{order.total.toLocaleString()} Lei</div>
                </div>

                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Status Livrări Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockB2BOrders.filter(o => o.status !== 'delivered').map(order => (
              <div key={order.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.id}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.client}</span>
                  </div>
                  <Badge className={getOrderStatusColor(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </div>
                
                {/* Progress tracker */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                      <Check className="h-4 w-4 text-success-foreground" />
                    </div>
                    <span className="text-xs">Comandă</span>
                  </div>
                  <div className={cn(
                    "flex-1 h-1 rounded",
                    order.status === 'processing' || order.status === 'shipped' ? "bg-success" : "bg-border"
                  )} />
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      order.status === 'shipped' || order.status === 'delivered' 
                        ? "bg-success" 
                        : "bg-warning"
                    )}>
                      {order.status === 'processing' ? (
                        <Clock className="h-4 w-4 text-warning-foreground" />
                      ) : (
                        <Check className="h-4 w-4 text-success-foreground" />
                      )}
                    </div>
                    <span className="text-xs">Procesare</span>
                  </div>
                  <div className={cn(
                    "flex-1 h-1 rounded",
                    order.status === 'shipped' ? "bg-success" : "bg-border"
                  )} />
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      order.status === 'shipped' ? "bg-info" : "bg-muted"
                    )}>
                      <Truck className={cn(
                        "h-4 w-4",
                        order.status === 'shipped' ? "text-info-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className="text-xs">În livrare</span>
                  </div>
                  <div className="flex-1 h-1 rounded bg-border" />
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-xs">Livrat</span>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Estimare livrare: {order.deliveryDate}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-4 sm:p-6 flex-1 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">B2B & Furnizori</h1>
          <p className="text-muted-foreground">Portal furnizori și comenzi B2B</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="portal" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Portal Furnizori</span>
              <span className="sm:hidden">Portal</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Comenzi B2B</span>
              <span className="sm:hidden">Comenzi</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portal" className="mt-4">
            <SupplierPortal />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <B2BOrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuppliersModule;
