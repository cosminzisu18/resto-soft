import React, { useState } from 'react';
import { 
  Search, 
  UserCircle, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Clock,
  Star,
  Gift,
  Percent,
  TrendingUp,
  ShoppingBag,
  Award,
  Bell,
  Send,
  MessageSquare,
  Smartphone,
  Users,
  Filter,
  Plus,
  ChevronRight,
  Edit,
  Trash2,
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Chart colors
const CHART_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(199, 89%, 48%)'];

// Customer spending chart data
const customerSpendingData = [
  { month: 'Ian', value: 4200 },
  { month: 'Feb', value: 3800 },
  { month: 'Mar', value: 5100 },
  { month: 'Apr', value: 4600 },
  { month: 'Mai', value: 5800 },
  { month: 'Iun', value: 6200 },
];

// Customer acquisition data
const customerAcquisitionData = [
  { month: 'Ian', newCustomers: 45, returning: 120 },
  { month: 'Feb', newCustomers: 52, returning: 135 },
  { month: 'Mar', newCustomers: 38, returning: 142 },
  { month: 'Apr', newCustomers: 65, returning: 158 },
  { month: 'Mai', newCustomers: 48, returning: 165 },
  { month: 'Iun', newCustomers: 72, returning: 180 },
];

// Loyalty level distribution
const loyaltyDistribution = [
  { name: 'Bronze', value: 450, color: '#CD7F32' },
  { name: 'Silver', value: 280, color: '#C0C0C0' },
  { name: 'Gold', value: 150, color: '#FFD700' },
  { name: 'Platinum', value: 45, color: '#E5E4E2' },
];

// Mock data for customers
const mockCustomers = [
  {
    id: '1',
    name: 'Alexandru Popescu',
    email: 'alex.popescu@email.com',
    phone: '+40 721 234 567',
    address: 'Str. Victoriei 45, București',
    avatar: null,
    loyaltyPoints: 2450,
    loyaltyLevel: 'Gold',
    totalOrders: 47,
    totalSpent: 4250,
    averageOrder: 90.43,
    lastVisit: '2024-01-15',
    joinDate: '2023-03-20',
    frequency: 'Săptămânal',
    favoriteItems: ['Pizza Margherita', 'Tiramisu', 'Cappuccino'],
    orders: [
      { id: 'O1', date: '2024-01-15', total: 125, items: 4, status: 'Livrat' },
      { id: 'O2', date: '2024-01-08', total: 89, items: 2, status: 'Livrat' },
      { id: 'O3', date: '2024-01-02', total: 156, items: 5, status: 'Livrat' },
      { id: 'O4', date: '2023-12-25', total: 210, items: 6, status: 'Livrat' },
      { id: 'O5', date: '2023-12-18', total: 78, items: 2, status: 'Livrat' },
    ],
    // Credit card data
    creditCard: {
      balance: 450,
      cardNumber: '**** **** **** 4582',
      transactions: [
        { id: 'T1', date: '2024-01-15', type: 'topup', amount: 200, description: 'Încărcare card' },
        { id: 'T2', date: '2024-01-15', type: 'payment', amount: -125, description: 'Comanda #O1' },
        { id: 'T3', date: '2024-01-10', type: 'topup', amount: 500, description: 'Încărcare card' },
        { id: 'T4', date: '2024-01-08', type: 'payment', amount: -89, description: 'Comanda #O2' },
        { id: 'T5', date: '2024-01-05', type: 'bonus', amount: 50, description: 'Bonus fidelitate' },
      ],
      purchases: [
        { id: 'P1', date: '2024-01-15', items: ['Pizza Margherita', 'Tiramisu'], total: 125 },
        { id: 'P2', date: '2024-01-08', items: ['Paste Carbonara', 'Vin roșu'], total: 89 },
        { id: 'P3', date: '2024-01-02', items: ['Burger Special', 'Cartofi', 'Cola'], total: 65 },
      ]
    }
  },
  {
    id: '2',
    name: 'Maria Ionescu',
    email: 'maria.i@email.com',
    phone: '+40 722 345 678',
    address: 'Bd. Unirii 120, București',
    avatar: null,
    loyaltyPoints: 5200,
    loyaltyLevel: 'Platinum',
    totalOrders: 89,
    totalSpent: 8900,
    averageOrder: 100,
    lastVisit: '2024-01-14',
    joinDate: '2022-08-15',
    frequency: 'De 2-3 ori/săptămână',
    favoriteItems: ['Sushi Set', 'Ramen', 'Sake'],
    orders: [
      { id: 'O1', date: '2024-01-14', total: 180, items: 3, status: 'Livrat' },
      { id: 'O2', date: '2024-01-12', total: 95, items: 2, status: 'Livrat' },
      { id: 'O3', date: '2024-01-10', total: 220, items: 4, status: 'Livrat' },
    ],
    creditCard: {
      balance: 1250,
      cardNumber: '**** **** **** 7891',
      transactions: [
        { id: 'T1', date: '2024-01-14', type: 'payment', amount: -180, description: 'Comanda #O1' },
        { id: 'T2', date: '2024-01-12', type: 'topup', amount: 1000, description: 'Încărcare card' },
        { id: 'T3', date: '2024-01-12', type: 'payment', amount: -95, description: 'Comanda #O2' },
      ],
      purchases: [
        { id: 'P1', date: '2024-01-14', items: ['Sushi Set Deluxe', 'Sake'], total: 180 },
        { id: 'P2', date: '2024-01-12', items: ['Ramen Tonkotsu', 'Gyoza'], total: 95 },
      ]
    }
  },
  {
    id: '3',
    name: 'Andrei Marin',
    email: 'andrei.m@email.com',
    phone: '+40 723 456 789',
    address: 'Str. Nordului 22, București',
    avatar: null,
    loyaltyPoints: 850,
    loyaltyLevel: 'Silver',
    totalOrders: 15,
    totalSpent: 1200,
    averageOrder: 80,
    lastVisit: '2024-01-10',
    joinDate: '2023-11-01',
    frequency: 'Lunar',
    favoriteItems: ['Burger Classic', 'Cartofi Prăjiți'],
    orders: [
      { id: 'O1', date: '2024-01-10', total: 65, items: 2, status: 'Livrat' },
      { id: 'O2', date: '2023-12-15', total: 85, items: 3, status: 'Livrat' },
    ],
    creditCard: {
      balance: 75,
      cardNumber: '**** **** **** 3456',
      transactions: [
        { id: 'T1', date: '2024-01-10', type: 'payment', amount: -65, description: 'Comanda #O1' },
        { id: 'T2', date: '2024-01-05', type: 'topup', amount: 100, description: 'Încărcare card' },
      ],
      purchases: [
        { id: 'P1', date: '2024-01-10', items: ['Burger Classic', 'Cartofi Prăjiți'], total: 65 },
      ]
    }
  },
  {
    id: '4',
    name: 'Elena Dumitrescu',
    email: 'elena.d@email.com',
    phone: '+40 724 567 890',
    address: 'Str. Florilor 8, București',
    avatar: null,
    loyaltyPoints: 3100,
    loyaltyLevel: 'Gold',
    totalOrders: 52,
    totalSpent: 5100,
    averageOrder: 98,
    lastVisit: '2024-01-13',
    joinDate: '2023-01-10',
    frequency: 'Săptămânal',
    favoriteItems: ['Salată Caesar', 'Paste Carbonara', 'Vin roșu'],
    orders: [
      { id: 'O1', date: '2024-01-13', total: 145, items: 4, status: 'Livrat' },
      { id: 'O2', date: '2024-01-06', total: 120, items: 3, status: 'Livrat' },
    ],
    creditCard: {
      balance: 320,
      cardNumber: '**** **** **** 9012',
      transactions: [
        { id: 'T1', date: '2024-01-13', type: 'payment', amount: -145, description: 'Comanda #O1' },
        { id: 'T2', date: '2024-01-10', type: 'topup', amount: 300, description: 'Încărcare card' },
        { id: 'T3', date: '2024-01-06', type: 'payment', amount: -120, description: 'Comanda #O2' },
      ],
      purchases: [
        { id: 'P1', date: '2024-01-13', items: ['Salată Caesar', 'Paste Carbonara', 'Desert', 'Vin'], total: 145 },
        { id: 'P2', date: '2024-01-06', items: ['Pizza Quattro Formaggi', 'Tiramisu'], total: 120 },
      ]
    }
  }
];

// Mock discounts
const mockDiscounts = [
  { id: '1', name: '10% la următoarea comandă', type: 'percent', value: 10, minOrder: 100, validUntil: '2024-02-28', used: false },
  { id: '2', name: 'Desert gratuit', type: 'free_item', value: 0, minOrder: 150, validUntil: '2024-02-15', used: false },
  { id: '3', name: 'Transport gratuit', type: 'free_delivery', value: 0, minOrder: 50, validUntil: '2024-03-01', used: true },
  { id: '4', name: '25 Lei reducere', type: 'fixed', value: 25, minOrder: 200, validUntil: '2024-02-20', used: false },
];

// Mock offers
const mockOffers = [
  { id: '1', title: 'Meniu Prânz -20%', description: 'Reducere la toate meniurile de prânz', image: '🍽️', validUntil: '2024-02-28', targetAudience: 'Gold+' },
  { id: '2', title: 'Desert Gratuit', description: 'La comenzi peste 100 Lei', image: '🍰', validUntil: '2024-02-15', targetAudience: 'Toți' },
  { id: '3', title: 'Happy Hour', description: 'Băuturi 1+1 gratis, 17:00-19:00', image: '🍹', validUntil: '2024-03-01', targetAudience: 'Silver+' },
  { id: '4', title: 'Weekend Special', description: 'Brunch la preț redus', image: '🥐', validUntil: '2024-02-25', targetAudience: 'Platinum' },
];

// Mock notifications history
const mockNotificationHistory = [
  { id: '1', type: 'sms', title: 'Promoție Weekend', message: 'Vino la weekend și primești...', sentAt: '2024-01-14 10:30', audience: 'Toți clienții', sent: 1250, opened: 890 },
  { id: '2', type: 'push', title: 'Puncte Bonus', message: 'Câștigă puncte duble azi!', sentAt: '2024-01-12 14:00', audience: 'Gold+', sent: 450, opened: 320 },
  { id: '3', type: 'sms', title: 'Reducere Fidelitate', message: 'Ai acumulat 1000 puncte...', sentAt: '2024-01-10 09:00', audience: 'Platinum', sent: 120, opened: 98 },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Platinum': return 'bg-gradient-to-r from-slate-400 to-slate-600 text-white';
    case 'Gold': return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    case 'Silver': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getLevelProgress = (level: string) => {
  switch (level) {
    case 'Platinum': return { current: 100, next: null, pointsNeeded: 0 };
    case 'Gold': return { current: 66, next: 'Platinum', pointsNeeded: 5000 };
    case 'Silver': return { current: 33, next: 'Gold', pointsNeeded: 2000 };
    default: return { current: 0, next: 'Silver', pointsNeeded: 500 };
  }
};

const CustomersModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);
  const [notificationType, setNotificationType] = useState<'sms' | 'push'>('sms');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationAudience, setNotificationAudience] = useState('all');
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  // Customer Dashboard View
  const CustomerDashboard = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută client după nume, email sau telefon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Client Nou
        </Button>
      </div>

      {/* Customer List */}
      <div className="grid gap-3">
        {filteredCustomers.map(customer => (
          <Card 
            key={customer.id} 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedCustomer(customer)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-14 w-14">
                  <AvatarImage src={customer.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                    <Badge className={cn("text-xs", getLevelColor(customer.loyaltyLevel))}>
                      {customer.loyaltyLevel}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{customer.totalOrders}</div>
                    <div className="text-xs text-muted-foreground">Comenzi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{customer.totalSpent} Lei</div>
                    <div className="text-xs text-muted-foreground">Total Cheltuit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{customer.loyaltyPoints}</div>
                    <div className="text-xs text-muted-foreground">Puncte</div>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Customer Detail View
  const CustomerDetail = () => {
    if (!selectedCustomer) return null;
    const levelProgress = getLevelProgress(selectedCustomer.loyaltyLevel);

    return (
      <div className="space-y-4">
        {/* Back button */}
        <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="mb-2">
          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
          Înapoi la listă
        </Button>

        {/* Customer Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedCustomer.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                    <Badge className={cn("text-sm", getLevelColor(selectedCustomer.loyaltyLevel))}>
                      <Award className="h-3 w-3 mr-1" />
                      {selectedCustomer.loyaltyLevel}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedCustomer.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedCustomer.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedCustomer.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">{selectedCustomer.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Comenzi</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
                  <div className="text-2xl font-bold">{selectedCustomer.totalSpent} Lei</div>
                  <div className="text-xs text-muted-foreground">Total Cheltuit</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <div className="text-2xl font-bold">{selectedCustomer.averageOrder.toFixed(0)} Lei</div>
                  <div className="text-xs text-muted-foreground">Medie Comandă</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-info" />
                  <div className="text-2xl font-bold">{selectedCustomer.frequency}</div>
                  <div className="text-xs text-muted-foreground">Frecvență</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Order History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Istoric Comenzi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="relative pl-6 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
                  
                  {selectedCustomer.orders.map((order, idx) => (
                    <div key={order.id} className="relative">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-card",
                        idx === 0 ? "bg-primary" : "bg-muted-foreground"
                      )} />
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">Comanda #{order.id}</span>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between">
                          <span>{order.date}</span>
                          <span className="font-semibold text-foreground">{order.total} Lei ({order.items} produse)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Loyalty Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Fidelizare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Points Card */}
              <div className={cn(
                "rounded-xl p-6 text-white",
                getLevelColor(selectedCustomer.loyaltyLevel)
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm opacity-80">Puncte Acumulate</div>
                    <div className="text-4xl font-bold">{selectedCustomer.loyaltyPoints.toLocaleString()}</div>
                  </div>
                  <Award className="h-10 w-10 opacity-80" />
                </div>
                <div className="text-sm opacity-80">
                  Membru din {selectedCustomer.joinDate}
                </div>
              </div>

              {/* Level Progress */}
              {levelProgress.next && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progres spre {levelProgress.next}</span>
                    <span className="font-medium">{selectedCustomer.loyaltyPoints} / {levelProgress.pointsNeeded}</span>
                  </div>
                  <Progress value={(selectedCustomer.loyaltyPoints / levelProgress.pointsNeeded) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    Mai ai nevoie de {levelProgress.pointsNeeded - selectedCustomer.loyaltyPoints} puncte
                  </div>
                </div>
              )}

              {/* Favorite Items */}
              <div>
                <div className="text-sm font-medium mb-2">Produse Favorite</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.favoriteItems.map((item, idx) => (
                    <Badge key={idx} variant="secondary">{item}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Card Section */}
        {selectedCustomer.creditCard && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Card de Credit Restaurant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Card Balance */}
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <Wallet className="h-8 w-8 mb-4 opacity-80" />
                    <div className="text-sm opacity-80">Sold Disponibil</div>
                    <div className="text-4xl font-bold mb-2">{selectedCustomer.creditCard.balance} Lei</div>
                    <div className="text-sm opacity-80">{selectedCustomer.creditCard.cardNumber}</div>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Încarcă Card
                  </Button>
                </div>

                {/* Transactions */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Mișcări Recente
                  </h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-2">
                      {selectedCustomer.creditCard.transactions.map(tx => (
                        <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            tx.type === 'topup' && "bg-success/10 text-success",
                            tx.type === 'payment' && "bg-destructive/10 text-destructive",
                            tx.type === 'bonus' && "bg-warning/10 text-warning"
                          )}>
                            {tx.type === 'topup' && <ArrowDownLeft className="h-4 w-4" />}
                            {tx.type === 'payment' && <ArrowUpRight className="h-4 w-4" />}
                            {tx.type === 'bonus' && <Gift className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{tx.description}</div>
                            <div className="text-xs text-muted-foreground">{tx.date}</div>
                          </div>
                          <div className={cn(
                            "font-semibold",
                            tx.amount > 0 ? "text-success" : "text-destructive"
                          )}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} Lei
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Purchases */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Cumpărături pe Card
                  </h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-2">
                      {selectedCustomer.creditCard.purchases.map(purchase => (
                        <div key={purchase.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-muted-foreground">{purchase.date}</span>
                            <span className="font-semibold text-primary">{purchase.total} Lei</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {purchase.items.map((item, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Loyalty Tab
  const LoyaltyTab = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{mockCustomers.length}</div>
            <div className="text-sm text-muted-foreground">Clienți Înrolați</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">24</div>
            <div className="text-sm text-muted-foreground">Membri Gold+</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm text-muted-foreground">Reduceri Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-info" />
            <div className="text-2xl font-bold">+18%</div>
            <div className="text-sm text-muted-foreground">Retenție Lună</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Available Discounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Reduceri Disponibile
            </CardTitle>
            <CardDescription>Reduceri ce pot fi revendicate de clienți</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3 pr-4">
                {mockDiscounts.map(discount => (
                  <div 
                    key={discount.id} 
                    className={cn(
                      "p-4 rounded-lg border",
                      discount.used ? "bg-muted/30 opacity-60" : "bg-card"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          discount.type === 'percent' && "bg-primary/10 text-primary",
                          discount.type === 'fixed' && "bg-success/10 text-success",
                          discount.type === 'free_item' && "bg-warning/10 text-warning",
                          discount.type === 'free_delivery' && "bg-info/10 text-info"
                        )}>
                          {discount.type === 'percent' && <Percent className="h-5 w-5" />}
                          {discount.type === 'fixed' && <span className="font-bold text-sm">{discount.value}</span>}
                          {discount.type === 'free_item' && <Gift className="h-5 w-5" />}
                          {discount.type === 'free_delivery' && <span className="text-lg">🚚</span>}
                        </div>
                        <div>
                          <div className="font-medium">{discount.name}</div>
                          <div className="text-xs text-muted-foreground">Min. comandă: {discount.minOrder} Lei</div>
                        </div>
                      </div>
                      {discount.used && <Badge variant="secondary">Folosită</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Valid până la {discount.validUntil}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Personalized Offers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Oferte Personalizate
              </CardTitle>
              <CardDescription>Oferte speciale pentru clienți fideli</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowOfferDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adaugă
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="grid gap-3 pr-4">
                {mockOffers.map(offer => (
                  <div key={offer.id} className="p-4 rounded-lg border bg-gradient-to-r from-card to-muted/20">
                    <div className="flex gap-3">
                      <div className="text-3xl">{offer.image}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{offer.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">{offer.description}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{offer.targetAudience}</Badge>
                          <span className="text-muted-foreground">până la {offer.validUntil}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă Ofertă Nouă</DialogTitle>
            <DialogDescription>Creează o ofertă personalizată pentru clienți</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titlu Ofertă</Label>
              <Input placeholder="ex: 20% reducere la pizza" />
            </div>
            <div>
              <Label>Descriere</Label>
              <Textarea placeholder="Descriere detaliată a ofertei..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tip Reducere</Label>
                <Select defaultValue="percent">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Procent (%)</SelectItem>
                    <SelectItem value="fixed">Sumă fixă (Lei)</SelectItem>
                    <SelectItem value="free_item">Produs gratuit</SelectItem>
                    <SelectItem value="free_delivery">Transport gratuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valoare</Label>
                <Input type="number" placeholder="ex: 20" />
              </div>
            </div>
            <div>
              <Label>Audiență Țintă</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți Clienții</SelectItem>
                  <SelectItem value="silver">Silver+</SelectItem>
                  <SelectItem value="gold">Gold+</SelectItem>
                  <SelectItem value="platinum">Doar Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valid până la</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>Anulează</Button>
            <Button onClick={() => setShowOfferDialog(false)}>Salvează Ofertă</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Notifications Tab
  const NotificationsTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Notification Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Composer Notificare
            </CardTitle>
            <CardDescription>Trimite notificări SMS sau Push către clienți</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type Selection */}
            <div className="flex gap-2">
              <Button
                variant={notificationType === 'sms' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNotificationType('sms')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS
              </Button>
              <Button
                variant={notificationType === 'push' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setNotificationType('push')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Push
              </Button>
            </div>

            {/* Audience Selector */}
            <div>
              <Label>Audiență</Label>
              <Select value={notificationAudience} onValueChange={setNotificationAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți Clienții (1,250)</SelectItem>
                  <SelectItem value="silver">Silver+ (890)</SelectItem>
                  <SelectItem value="gold">Gold+ (450)</SelectItem>
                  <SelectItem value="platinum">Doar Platinum (120)</SelectItem>
                  <SelectItem value="inactive">Inactivi 30+ zile (230)</SelectItem>
                  <SelectItem value="birthday">Zilele de naștere luna aceasta (45)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title (for push) */}
            {notificationType === 'push' && (
              <div>
                <Label>Titlu Notificare</Label>
                <Input placeholder="ex: Ofertă specială!" />
              </div>
            )}

            {/* Message */}
            <div>
              <Label>Mesaj</Label>
              <Textarea
                placeholder={notificationType === 'sms' 
                  ? "Scrie mesajul SMS (max 160 caractere)..." 
                  : "Scrie mesajul notificării push..."
                }
                rows={4}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                maxLength={notificationType === 'sms' ? 160 : 500}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {notificationMessage.length}/{notificationType === 'sms' ? 160 : 500}
              </div>
            </div>

            {/* Schedule */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="schedule" />
                <Label htmlFor="schedule">Programează trimiterea</Label>
              </div>
            </div>

            <Button className="w-full" size="lg">
              <Send className="h-4 w-4 mr-2" />
              Trimite Notificare
            </Button>
          </CardContent>
        </Card>

        {/* Message Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Preview Mesaj
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-64 bg-slate-900 rounded-[2rem] p-3">
                <div className="bg-slate-800 rounded-[1.5rem] overflow-hidden">
                  {/* Phone header */}
                  <div className="h-6 bg-slate-900 flex justify-center items-center">
                    <div className="w-16 h-4 bg-slate-800 rounded-full" />
                  </div>
                  
                  {/* Screen content */}
                  <div className="bg-slate-100 p-4 min-h-[400px]">
                    {notificationType === 'push' ? (
                      <div className="bg-white rounded-xl p-3 shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">🍕</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold">Restaurant Demo</div>
                            <div className="text-[10px] text-slate-400">acum</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-800">
                          {notificationMessage || 'Mesajul tău va apărea aici...'}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-500 text-white rounded-xl p-3 ml-auto max-w-[90%]">
                        <div className="text-sm">
                          {notificationMessage || 'Mesajul SMS va apărea aici...'}
                        </div>
                        <div className="text-[10px] text-green-200 text-right mt-1">12:34</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Istoric Notificări Trimise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockNotificationHistory.map(notif => (
              <div key={notif.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  notif.type === 'sms' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                )}>
                  {notif.type === 'sms' ? <MessageSquare className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{notif.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{notif.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {notif.sentAt} • {notif.audience}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{notif.sent} trimise</div>
                  <div className="text-xs text-muted-foreground">{notif.opened} deschise ({Math.round(notif.opened / notif.sent * 100)}%)</div>
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
          <h1 className="text-2xl font-bold">Clienți & Fidelizare</h1>
          <p className="text-muted-foreground">Gestionează clienții și programul de fidelizare</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Clienți</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Fidelizare</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificări</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            {selectedCustomer ? <CustomerDetail /> : <CustomerDashboard />}
          </TabsContent>

          <TabsContent value="loyalty" className="mt-4">
            <LoyaltyTab />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomersModule;
