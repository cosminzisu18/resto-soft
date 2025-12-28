import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt,
  Users,
  Clock,
  BarChart3,
  PieChart,
  Table2,
  Mail,
  FileSpreadsheet,
  Printer,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Star,
  Award,
  Flame,
  Target,
  Wallet,
  Calculator,
  Package,
  ShoppingCart,
  Utensils,
  ChefHat,
  Truck,
  MoreHorizontal,
  Eye,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for financial dashboard
const salesData = {
  today: { value: 4850, change: 12.5, previous: 4310 },
  week: { value: 32450, change: 8.2, previous: 29980 },
  month: { value: 128750, change: 15.3, previous: 111680 }
};

const profitData = {
  gross: 45600,
  net: 28400,
  margin: 22.1,
  change: 5.8
};

const vatData = {
  collected: 24466,
  deductible: 12340,
  toPay: 12126,
  period: 'Decembrie 2025'
};

// Revenue vs Expenses chart data
const revenueExpensesData = [
  { name: 'Lun', venituri: 4200, cheltuieli: 2800 },
  { name: 'Mar', venituri: 5100, cheltuieli: 3100 },
  { name: 'Mie', venituri: 4800, cheltuieli: 2900 },
  { name: 'Joi', venituri: 6200, cheltuieli: 3400 },
  { name: 'Vin', venituri: 8500, cheltuieli: 4200 },
  { name: 'Sâm', venituri: 9800, cheltuieli: 4800 },
  { name: 'Dum', venituri: 7200, cheltuieli: 3600 },
];

// Category sales data for pie chart
const categorySalesData = [
  { name: 'Pizza', value: 32500, color: '#ef4444' },
  { name: 'Paste', value: 18200, color: '#f97316' },
  { name: 'Ciorbe', value: 12800, color: '#eab308' },
  { name: 'Grătar', value: 24600, color: '#22c55e' },
  { name: 'Salate', value: 8400, color: '#06b6d4' },
  { name: 'Deserturi', value: 9200, color: '#8b5cf6' },
  { name: 'Băuturi', value: 23050, color: '#ec4899' },
];

// Category evolution data for line chart
const categoryEvolutionData = [
  { name: 'Săpt 1', pizza: 7200, paste: 4100, ciorbe: 2800, gratar: 5400, bauturi: 5100 },
  { name: 'Săpt 2', pizza: 7800, paste: 4300, ciorbe: 3100, gratar: 5800, bauturi: 5400 },
  { name: 'Săpt 3', pizza: 8100, paste: 4600, ciorbe: 3200, gratar: 6200, bauturi: 5800 },
  { name: 'Săpt 4', pizza: 9400, paste: 5200, ciorbe: 3700, gratar: 7200, bauturi: 6750 },
];

// Top products data
const topProducts = [
  { id: 1, name: 'Pizza Margherita', category: 'Pizza', quantity: 245, revenue: 6125, cost: 2450, profit: 3675, trend: 15.2 },
  { id: 2, name: 'Burger Classic', category: 'Grătar', quantity: 198, revenue: 4950, cost: 1980, profit: 2970, trend: 8.7 },
  { id: 3, name: 'Ciorbă de burtă', category: 'Ciorbe', quantity: 156, revenue: 3120, cost: 936, profit: 2184, trend: 12.3 },
  { id: 4, name: 'Paste Carbonara', category: 'Paste', quantity: 142, revenue: 4260, cost: 1704, profit: 2556, trend: -2.5 },
  { id: 5, name: 'Salată Caesar', category: 'Salate', quantity: 128, revenue: 2560, cost: 768, profit: 1792, trend: 5.1 },
  { id: 6, name: 'Tiramisu', category: 'Deserturi', quantity: 115, revenue: 1725, cost: 460, profit: 1265, trend: 22.8 },
  { id: 7, name: 'Limonadă', category: 'Băuturi', quantity: 312, revenue: 1560, cost: 312, profit: 1248, trend: 18.4 },
  { id: 8, name: 'Friptură de vită', category: 'Grătar', quantity: 89, revenue: 5340, cost: 2670, profit: 2670, trend: -4.2 },
];

// Detailed sales transactions
const salesTransactions = [
  { id: 'V001', date: '28.12.2025 19:45', table: 'Masa 5', waiter: 'Maria P.', items: 4, total: 186.50, payment: 'Card', status: 'completed', source: 'restaurant' },
  { id: 'V002', date: '28.12.2025 19:32', table: 'Online', waiter: '-', items: 3, total: 89.00, payment: 'Card', status: 'completed', source: 'glovo' },
  { id: 'V003', date: '28.12.2025 19:28', table: 'Masa 12', waiter: 'Ion I.', items: 6, total: 342.00, payment: 'Cash', status: 'completed', source: 'restaurant' },
  { id: 'V004', date: '28.12.2025 19:15', table: 'Telefon', waiter: 'Ana M.', items: 2, total: 65.00, payment: 'Cash', status: 'completed', source: 'phone' },
  { id: 'V005', date: '28.12.2025 19:02', table: 'Kiosk', waiter: '-', items: 5, total: 124.50, payment: 'Card', status: 'completed', source: 'kiosk' },
  { id: 'V006', date: '28.12.2025 18:55', table: 'Masa 3', waiter: 'Maria P.', items: 3, total: 98.00, payment: 'Card', status: 'completed', source: 'restaurant' },
  { id: 'V007', date: '28.12.2025 18:48', table: 'Online', waiter: '-', items: 4, total: 156.00, payment: 'Card', status: 'completed', source: 'wolt' },
  { id: 'V008', date: '28.12.2025 18:35', table: 'Masa 8', waiter: 'Elena S.', items: 2, total: 78.50, payment: 'Card', status: 'refunded', source: 'restaurant' },
];

// Expenses data
const expensesData = [
  { id: 'C001', date: '28.12.2025', category: 'Materii prime', supplier: 'Meat Pro SRL', description: 'Carne vită, porc', amount: 2450.00, status: 'paid', paymentMethod: 'Transfer' },
  { id: 'C002', date: '28.12.2025', category: 'Materii prime', supplier: 'Legume Fresh', description: 'Legume proaspete', amount: 680.00, status: 'paid', paymentMethod: 'Cash' },
  { id: 'C003', date: '27.12.2025', category: 'Utilități', supplier: 'Electrica', description: 'Factură energie dec', amount: 1850.00, status: 'pending', paymentMethod: '-' },
  { id: 'C004', date: '27.12.2025', category: 'Salarii', supplier: 'Personal', description: 'Avans salarii', amount: 8000.00, status: 'paid', paymentMethod: 'Transfer' },
  { id: 'C005', date: '26.12.2025', category: 'Materii prime', supplier: 'Lactate Bio', description: 'Brânzeturi, smântână', amount: 920.00, status: 'paid', paymentMethod: 'Transfer' },
  { id: 'C006', date: '26.12.2025', category: 'Echipamente', supplier: 'Gastro Equip', description: 'Reparație cuptor', amount: 450.00, status: 'paid', paymentMethod: 'Cash' },
  { id: 'C007', date: '25.12.2025', category: 'Marketing', supplier: 'Social Ads', description: 'Campanie Facebook', amount: 300.00, status: 'paid', paymentMethod: 'Card' },
];

// Inventory entries (Intrări)
const inventoryEntries = [
  { id: 'I001', date: '28.12.2025 08:30', supplier: 'Meat Pro SRL', product: 'Carne vită', quantity: 25, unit: 'kg', unitPrice: 45.00, total: 1125.00, receivedBy: 'George P.', status: 'accepted' },
  { id: 'I002', date: '28.12.2025 08:15', supplier: 'Meat Pro SRL', product: 'Carne porc', quantity: 30, unit: 'kg', unitPrice: 28.00, total: 840.00, receivedBy: 'George P.', status: 'accepted' },
  { id: 'I003', date: '28.12.2025 07:45', supplier: 'Legume Fresh', product: 'Roșii', quantity: 15, unit: 'kg', unitPrice: 8.50, total: 127.50, receivedBy: 'Ana M.', status: 'accepted' },
  { id: 'I004', date: '28.12.2025 07:45', supplier: 'Legume Fresh', product: 'Cartofi', quantity: 50, unit: 'kg', unitPrice: 3.20, total: 160.00, receivedBy: 'Ana M.', status: 'accepted' },
  { id: 'I005', date: '27.12.2025 14:20', supplier: 'Lactate Bio', product: 'Mozzarella', quantity: 10, unit: 'kg', unitPrice: 48.00, total: 480.00, receivedBy: 'Maria P.', status: 'partial', notes: '2kg lipsă' },
  { id: 'I006', date: '27.12.2025 09:00', supplier: 'Băuturi Import', product: 'Coca-Cola 0.5L', quantity: 120, unit: 'buc', unitPrice: 4.50, total: 540.00, receivedBy: 'Ion I.', status: 'accepted' },
  { id: 'I007', date: '26.12.2025 16:30', supplier: 'Panificație', product: 'Chifle burger', quantity: 200, unit: 'buc', unitPrice: 1.20, total: 240.00, receivedBy: 'Elena S.', status: 'rejected', notes: 'Produs expirat' },
];

// Production data
const productionData = [
  { id: 'P001', date: '28.12.2025 18:45', product: 'Pizza Margherita', quantity: 2, station: 'Bucătărie Caldă', preparedBy: 'George P.', prepTime: '12:30', status: 'served', orderId: '#1234' },
  { id: 'P002', date: '28.12.2025 18:42', product: 'Burger Classic', quantity: 1, station: 'Grătar', preparedBy: 'Ion I.', prepTime: '08:45', status: 'served', orderId: '#1234' },
  { id: 'P003', date: '28.12.2025 18:38', product: 'Paste Carbonara', quantity: 1, station: 'Bucătărie Caldă', preparedBy: 'George P.', prepTime: '10:20', status: 'served', orderId: '#1235' },
  { id: 'P004', date: '28.12.2025 18:35', product: 'Ciorbă de burtă', quantity: 2, station: 'Supe', preparedBy: 'Ana M.', prepTime: '05:00', status: 'served', orderId: '#1236' },
  { id: 'P005', date: '28.12.2025 18:30', product: 'Salată Caesar', quantity: 3, station: 'Preparate Reci', preparedBy: 'Elena S.', prepTime: '04:15', status: 'served', orderId: '#1237' },
  { id: 'P006', date: '28.12.2025 18:25', product: 'Tiramisu', quantity: 2, station: 'Deserturi', preparedBy: 'Maria P.', prepTime: '02:00', status: 'served', orderId: '#1237' },
  { id: 'P007', date: '28.12.2025 18:20', product: 'Friptură de vită', quantity: 1, station: 'Grătar', preparedBy: 'Ion I.', prepTime: '18:30', status: 'served', orderId: '#1238' },
  { id: 'P008', date: '28.12.2025 19:50', product: 'Pizza Quattro Formaggi', quantity: 1, station: 'Bucătărie Caldă', preparedBy: 'George P.', prepTime: '11:00', status: 'cooking', orderId: '#1245' },
];

// Heatmap data for dead hours
const heatmapData = [
  { hour: '08:00', lun: 12, mar: 8, mie: 15, joi: 10, vin: 18, sam: 25, dum: 20 },
  { hour: '09:00', lun: 18, mar: 15, mie: 20, joi: 16, vin: 22, sam: 35, dum: 28 },
  { hour: '10:00', lun: 25, mar: 22, mie: 28, joi: 24, vin: 30, sam: 45, dum: 38 },
  { hour: '11:00', lun: 35, mar: 32, mie: 38, joi: 34, vin: 42, sam: 58, dum: 48 },
  { hour: '12:00', lun: 65, mar: 62, mie: 68, joi: 64, vin: 75, sam: 85, dum: 78 },
  { hour: '13:00', lun: 78, mar: 75, mie: 80, joi: 76, vin: 88, sam: 95, dum: 88 },
  { hour: '14:00', lun: 55, mar: 52, mie: 58, joi: 54, vin: 65, sam: 75, dum: 68 },
  { hour: '15:00', lun: 32, mar: 28, mie: 35, joi: 30, vin: 40, sam: 52, dum: 45 },
  { hour: '16:00', lun: 25, mar: 22, mie: 28, joi: 24, vin: 35, sam: 48, dum: 40 },
  { hour: '17:00', lun: 35, mar: 32, mie: 38, joi: 34, vin: 48, sam: 62, dum: 52 },
  { hour: '18:00', lun: 58, mar: 55, mie: 62, joi: 58, vin: 72, sam: 85, dum: 75 },
  { hour: '19:00', lun: 82, mar: 78, mie: 85, joi: 80, vin: 95, sam: 100, dum: 92 },
  { hour: '20:00', lun: 88, mar: 85, mie: 90, joi: 86, vin: 98, sam: 100, dum: 95 },
  { hour: '21:00', lun: 65, mar: 62, mie: 68, joi: 64, vin: 82, sam: 92, dum: 78 },
  { hour: '22:00', lun: 35, mar: 32, mie: 38, joi: 34, vin: 55, sam: 68, dum: 52 },
];

// Profitable tables data
const profitableTables = [
  { id: 'T1', name: 'Masa 1', orders: 45, revenue: 2850, avgTicket: 63.3, occupancyRate: 78 },
  { id: 'T5', name: 'Masa 5', orders: 42, revenue: 2680, avgTicket: 63.8, occupancyRate: 82 },
  { id: 'T8', name: 'Masa 8 (Terasă)', orders: 38, revenue: 2420, avgTicket: 63.7, occupancyRate: 65 },
  { id: 'T3', name: 'Masa 3', orders: 35, revenue: 2100, avgTicket: 60.0, occupancyRate: 71 },
  { id: 'T12', name: 'Masa 12 (VIP)', orders: 28, revenue: 3640, avgTicket: 130.0, occupancyRate: 45 },
];

// Top employees data
const topEmployees = [
  { id: 1, name: 'Maria Popescu', role: 'Ospătar', sales: 12450, orders: 156, rating: 4.9, tips: 620 },
  { id: 2, name: 'Ion Ionescu', role: 'Ospătar', sales: 10280, orders: 142, rating: 4.7, tips: 485 },
  { id: 3, name: 'Ana Marinescu', role: 'Ospătar', sales: 9850, orders: 128, rating: 4.8, tips: 520 },
  { id: 4, name: 'George Popa', role: 'Bucătar', sales: 0, orders: 245, rating: 4.6, tips: 0 },
  { id: 5, name: 'Elena Stoica', role: 'Barman', sales: 5420, orders: 312, rating: 4.9, tips: 380 },
];

// Accounting mock data
const accountingReport = {
  period: 'Decembrie 2025',
  totalIncome: 128750,
  totalExpenses: 83200,
  grossProfit: 45550,
  taxes: {
    vat: 12126,
    income: 4555,
    contributions: 8240
  },
  netProfit: 20629,
  breakdown: [
    { category: 'Vânzări produse', amount: 98500, type: 'income' },
    { category: 'Vânzări băuturi', amount: 24800, type: 'income' },
    { category: 'Tips & serviciu', amount: 5450, type: 'income' },
    { category: 'Materii prime', amount: 38500, type: 'expense' },
    { category: 'Salarii', amount: 28000, type: 'expense' },
    { category: 'Utilități', amount: 4200, type: 'expense' },
    { category: 'Chirie', amount: 8500, type: 'expense' },
    { category: 'Alte cheltuieli', amount: 4000, type: 'expense' },
  ]
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];

export const ReportsModule: React.FC = () => {
  const [mainTab, setMainTab] = useState('financial');
  const [reportTab, setReportTab] = useState('sales');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [fiscalPeriod, setFiscalPeriod] = useState('2025-12');
  const [searchQuery, setSearchQuery] = useState('');

  const getHeatmapColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 40) return 'bg-yellow-400';
    if (value >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getSourceBadge = (source: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      restaurant: { color: 'bg-blue-100 text-blue-700', label: 'Restaurant' },
      glovo: { color: 'bg-orange-100 text-orange-700', label: 'Glovo' },
      wolt: { color: 'bg-cyan-100 text-cyan-700', label: 'Wolt' },
      phone: { color: 'bg-purple-100 text-purple-700', label: 'Telefon' },
      kiosk: { color: 'bg-green-100 text-green-700', label: 'Kiosk' },
    };
    const config = configs[source] || configs.restaurant;
    return <Badge className={cn("text-xs", config.color)}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      completed: { color: 'bg-green-100 text-green-700', label: 'Finalizat', icon: <Check className="w-3 h-3" /> },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'În așteptare', icon: <Clock className="w-3 h-3" /> },
      refunded: { color: 'bg-red-100 text-red-700', label: 'Returnat', icon: <X className="w-3 h-3" /> },
      paid: { color: 'bg-green-100 text-green-700', label: 'Plătit', icon: <Check className="w-3 h-3" /> },
      accepted: { color: 'bg-green-100 text-green-700', label: 'Acceptat', icon: <Check className="w-3 h-3" /> },
      partial: { color: 'bg-yellow-100 text-yellow-700', label: 'Parțial', icon: <AlertCircle className="w-3 h-3" /> },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Respins', icon: <X className="w-3 h-3" /> },
      served: { color: 'bg-green-100 text-green-700', label: 'Servit', icon: <Check className="w-3 h-3" /> },
      cooking: { color: 'bg-yellow-100 text-yellow-700', label: 'În preparare', icon: <ChefHat className="w-3 h-3" /> },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge className={cn("text-xs flex items-center gap-1", config.color)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const renderFinancialDashboard = () => (
    <div className="space-y-6">
      {/* Sales Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <Badge className={cn(
                "text-xs font-bold",
                salesData.today.change >= 0 ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              )}>
                {salesData.today.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(salesData.today.change)}%
              </Badge>
            </div>
            <p className="text-blue-100 text-sm mb-1">Vânzări Azi</p>
            <p className="text-3xl font-black">{salesData.today.value.toLocaleString()} lei</p>
            <p className="text-blue-200 text-xs mt-2">vs ieri: {salesData.today.previous.toLocaleString()} lei</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <Badge className={cn(
                "text-xs font-bold",
                salesData.week.change >= 0 ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              )}>
                {salesData.week.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(salesData.week.change)}%
              </Badge>
            </div>
            <p className="text-indigo-100 text-sm mb-1">Vânzări Săptămână</p>
            <p className="text-3xl font-black">{salesData.week.value.toLocaleString()} lei</p>
            <p className="text-indigo-200 text-xs mt-2">vs săpt. trecută: {salesData.week.previous.toLocaleString()} lei</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Badge className={cn(
                "text-xs font-bold",
                salesData.month.change >= 0 ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              )}>
                {salesData.month.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(salesData.month.change)}%
              </Badge>
            </div>
            <p className="text-purple-100 text-sm mb-1">Vânzări Lună</p>
            <p className="text-3xl font-black">{salesData.month.value.toLocaleString()} lei</p>
            <p className="text-purple-200 text-xs mt-2">vs luna trecută: {salesData.month.previous.toLocaleString()} lei</p>
          </CardContent>
        </Card>
      </div>

      {/* Profit & VAT Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Real</p>
                  <p className="text-2xl font-black text-foreground">{profitData.net.toLocaleString()} lei</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 text-sm font-bold">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {profitData.change}%
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Profit brut</span>
                <span className="font-semibold">{profitData.gross.toLocaleString()} lei</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Marjă profit</span>
                <span className="font-semibold text-green-600">{profitData.margin}%</span>
              </div>
              <Progress value={profitData.margin} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Receipt className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVA de plată - {vatData.period}</p>
                  <p className="text-2xl font-black text-foreground">{vatData.toPay.toLocaleString()} lei</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">TVA colectat</span>
                <span className="font-semibold text-amber-600">+{vatData.collected.toLocaleString()} lei</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">TVA deductibil</span>
                <span className="font-semibold text-green-600">-{vatData.deductible.toLocaleString()} lei</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div className="bg-amber-500 h-full" style={{ width: `${(vatData.toPay / vatData.collected) * 100}%` }} />
                <div className="bg-green-500 h-full" style={{ width: `${(vatData.deductible / vatData.collected) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Revenue vs Expenses + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Venituri vs Cheltuieli
            </CardTitle>
            <CardDescription>Ultimele 7 zile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueExpensesData}>
                  <defs>
                    <linearGradient id="colorVenituri" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCheltuieli" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} lei`]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="venituri" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVenituri)" strokeWidth={2} name="Venituri" />
                  <Area type="monotone" dataKey="cheltuieli" stroke="#ef4444" fillOpacity={1} fill="url(#colorCheltuieli)" strokeWidth={2} name="Cheltuieli" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Vânzări pe Categorii
            </CardTitle>
            <CardDescription>Distribuție luna curentă</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} lei`]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categorySalesData.slice(0, 6).map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Evolution Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evoluție Vânzări pe Categorii
          </CardTitle>
          <CardDescription>Trend săptămânal pe categorii principale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} lei`]}
                />
                <Legend />
                <Line type="monotone" dataKey="pizza" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Pizza" />
                <Line type="monotone" dataKey="paste" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="Paste" />
                <Line type="monotone" dataKey="ciorbe" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} name="Ciorbe" />
                <Line type="monotone" dataKey="gratar" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Grătar" />
                <Line type="monotone" dataKey="bauturi" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} name="Băuturi" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'dd MMM', { locale: ro })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ro })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Tabs value={reportPeriod} onValueChange={(v) => setReportPeriod(v as typeof reportPeriod)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="daily">Zilnic</TabsTrigger>
              <TabsTrigger value="weekly">Săptămânal</TabsTrigger>
              <TabsTrigger value="monthly">Lunar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />PDF</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-2" />Email</Button>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportTab} onValueChange={setReportTab}>
        <TabsList className="bg-muted p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vânzări
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Cheltuieli
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Intrări
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Producție
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Produse
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analiză
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută tranzacție..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sursă" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="glovo">Glovo</SelectItem>
                <SelectItem value="wolt">Wolt</SelectItem>
                <SelectItem value="phone">Telefon</SelectItem>
                <SelectItem value="kiosk">Kiosk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                Toate Vânzările
              </CardTitle>
              <CardDescription>Tranzacții detaliate pe perioada selectată</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data & Ora</TableHead>
                      <TableHead>Locație</TableHead>
                      <TableHead>Sursă</TableHead>
                      <TableHead>Ospătar</TableHead>
                      <TableHead className="text-center">Produse</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Plată</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesTransactions.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-bold">{sale.id}</TableCell>
                        <TableCell className="text-sm">{sale.date}</TableCell>
                        <TableCell>{sale.table}</TableCell>
                        <TableCell>{getSourceBadge(sale.source)}</TableCell>
                        <TableCell>{sale.waiter}</TableCell>
                        <TableCell className="text-center">{sale.items}</TableCell>
                        <TableCell className="text-right font-bold">{sale.total.toFixed(2)} lei</TableCell>
                        <TableCell><Badge variant="outline">{sale.payment}</Badge></TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Total Cheltuieli</p>
                <p className="text-2xl font-black text-red-700">14,650.00 lei</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Plătite</p>
                <p className="text-2xl font-black text-green-700">12,800.00 lei</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">În Așteptare</p>
                <p className="text-2xl font-black text-yellow-700">1,850.00 lei</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600">Materii Prime</p>
                <p className="text-2xl font-black text-blue-700">4,050.00 lei</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" />
                Registru Cheltuieli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Furnizor</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead className="text-right">Sumă</TableHead>
                      <TableHead>Plată</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesData.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono font-bold">{expense.id}</TableCell>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                        <TableCell className="font-medium">{expense.supplier}</TableCell>
                        <TableCell className="text-muted-foreground">{expense.description}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{expense.amount.toFixed(2)} lei</TableCell>
                        <TableCell>{expense.paymentMethod}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600">Total Intrări</p>
                <p className="text-2xl font-black text-blue-700">3,512.50 lei</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Acceptate</p>
                <p className="text-2xl font-black text-green-700">3,032.50 lei</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">Parțiale</p>
                <p className="text-2xl font-black text-yellow-700">480.00 lei</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Respinse</p>
                <p className="text-2xl font-black text-red-700">240.00 lei</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                Intrări Stoc
              </CardTitle>
              <CardDescription>Recepții materii prime și produse</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data & Ora</TableHead>
                      <TableHead>Furnizor</TableHead>
                      <TableHead>Produs</TableHead>
                      <TableHead className="text-right">Cantitate</TableHead>
                      <TableHead className="text-right">Preț/u</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Recepționat</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryEntries.map((entry) => (
                      <TableRow key={entry.id} className={entry.status === 'rejected' ? 'bg-red-50' : ''}>
                        <TableCell className="font-mono font-bold">{entry.id}</TableCell>
                        <TableCell className="text-sm">{entry.date}</TableCell>
                        <TableCell className="font-medium">{entry.supplier}</TableCell>
                        <TableCell>{entry.product}</TableCell>
                        <TableCell className="text-right">{entry.quantity} {entry.unit}</TableCell>
                        <TableCell className="text-right">{entry.unitPrice.toFixed(2)} lei</TableCell>
                        <TableCell className="text-right font-bold">{entry.total.toFixed(2)} lei</TableCell>
                        <TableCell>{entry.receivedBy}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(entry.status)}
                            {entry.notes && <span className="text-xs text-muted-foreground">{entry.notes}</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Produse Azi</p>
                <p className="text-2xl font-black text-green-700">156</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600">Timp Mediu Prep.</p>
                <p className="text-2xl font-black text-blue-700">9:12 min</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">În Preparare</p>
                <p className="text-2xl font-black text-yellow-700">3</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm text-purple-600">Stații Active</p>
                <p className="text-2xl font-black text-purple-700">5</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" />
                Raport Producție
              </CardTitle>
              <CardDescription>Toate preparatele produse</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data & Ora</TableHead>
                      <TableHead>Produs</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead>Stație</TableHead>
                      <TableHead>Bucătar</TableHead>
                      <TableHead>Timp Prep.</TableHead>
                      <TableHead>Comandă</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionData.map((prod) => (
                      <TableRow key={prod.id} className={prod.status === 'cooking' ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-mono font-bold">{prod.id}</TableCell>
                        <TableCell className="text-sm">{prod.date}</TableCell>
                        <TableCell className="font-medium">{prod.product}</TableCell>
                        <TableCell className="text-center font-bold">{prod.quantity}x</TableCell>
                        <TableCell><Badge variant="outline">{prod.station}</Badge></TableCell>
                        <TableCell>{prod.preparedBy}</TableCell>
                        <TableCell className="font-mono">{prod.prepTime}</TableCell>
                        <TableCell className="font-mono text-primary">{prod.orderId}</TableCell>
                        <TableCell>{getStatusBadge(prod.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4 mt-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Top Produse Detaliat
              </CardTitle>
              <CardDescription>Analiză completă produse cu cost și profit</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Produs</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">Cantitate</TableHead>
                    <TableHead className="text-right">Venituri</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Marjă</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 && "bg-yellow-100 text-yellow-700",
                          index === 1 && "bg-slate-100 text-slate-700",
                          index === 2 && "bg-amber-100 text-amber-700",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{product.quantity}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{product.revenue.toLocaleString()} lei</TableCell>
                      <TableCell className="text-right text-red-600">{product.cost.toLocaleString()} lei</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{product.profit.toLocaleString()} lei</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-100 text-blue-700">{((product.profit / product.revenue) * 100).toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn(
                          "text-xs",
                          product.trend >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {product.trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                          {Math.abs(product.trend)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* Heatmap */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Heatmap Ore de Vârf
              </CardTitle>
              <CardDescription>Activitate pe ore și zile (% ocupare)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="text-xs font-medium text-muted-foreground p-2">Ora</div>
                    {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
                      <div key={day} className="text-xs font-medium text-center p-2">{day}</div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {heatmapData.map((row) => (
                      <div key={row.hour} className="grid grid-cols-8 gap-1">
                        <div className="text-xs text-muted-foreground p-2 flex items-center">{row.hour}</div>
                        {['lun', 'mar', 'mie', 'joi', 'vin', 'sam', 'dum'].map((day) => {
                          const value = row[day as keyof typeof row] as number;
                          return (
                            <div key={day} className={cn("rounded p-2 text-center text-xs font-medium text-white transition-all hover:scale-105 cursor-pointer", getHeatmapColor(value))} title={`${value}% ocupare`}>
                              {value}%
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <span className="text-xs text-muted-foreground">Legendă:</span>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-400" /><span className="text-xs">0-20%</span></div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-400" /><span className="text-xs">20-40%</span></div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-yellow-400" /><span className="text-xs">40-60%</span></div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-400" /><span className="text-xs">60-80%</span></div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-500" /><span className="text-xs">80-100%</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tables & Employees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Mese Profitabile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profitableTables.map((table, index) => (
                    <div key={table.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold", index === 0 && "bg-green-100 text-green-700", index === 1 && "bg-green-50 text-green-600", index > 1 && "bg-muted text-muted-foreground")}>
                        {table.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{table.name}</p>
                        <p className="text-xs text-muted-foreground">{table.orders} comenzi · {table.occupancyRate}% ocupare</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{table.revenue.toLocaleString()} lei</p>
                        <p className="text-xs text-muted-foreground">Ø {table.avgTicket} lei/bon</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Ranking Angajați
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topEmployees.map((employee, index) => (
                    <div key={employee.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", index === 0 && "bg-yellow-100 text-yellow-700", index === 1 && "bg-slate-100 text-slate-600", index === 2 && "bg-amber-100 text-amber-700", index > 2 && "bg-muted text-muted-foreground")}>
                        {index < 3 ? <Star className="w-5 h-5" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{employee.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{employee.role}</Badge>
                          <span className="text-xs text-muted-foreground">{employee.orders} comenzi</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{employee.sales > 0 ? `${employee.sales.toLocaleString()} lei` : `${employee.orders} prep.`}</p>
                        <div className="flex items-center justify-end gap-1 text-xs text-amber-600">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{employee.rating}</span>
                          {employee.tips > 0 && <span className="text-muted-foreground ml-1">+{employee.tips} tips</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderAccounting = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select value={fiscalPeriod} onValueChange={setFiscalPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Selectează perioada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-12">Decembrie 2025</SelectItem>
              <SelectItem value="2025-11">Noiembrie 2025</SelectItem>
              <SelectItem value="2025-10">Octombrie 2025</SelectItem>
              <SelectItem value="2025-Q4">Q4 2025</SelectItem>
              <SelectItem value="2025">An 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            <Building2 className="h-4 w-4 mr-2" />Export SAGA
          </Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Printează</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4" /><span className="text-sm text-green-100">Venituri Totale</span></div>
            <p className="text-2xl font-black">{accountingReport.totalIncome.toLocaleString()} lei</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-4 w-4" /><span className="text-sm text-red-100">Cheltuieli Totale</span></div>
            <p className="text-2xl font-black">{accountingReport.totalExpenses.toLocaleString()} lei</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Calculator className="h-4 w-4" /><span className="text-sm text-amber-100">Taxe & Impozite</span></div>
            <p className="text-2xl font-black">{(accountingReport.taxes.vat + accountingReport.taxes.income + accountingReport.taxes.contributions).toLocaleString()} lei</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Wallet className="h-4 w-4" /><span className="text-sm text-blue-100">Profit Net</span></div>
            <p className="text-2xl font-black">{accountingReport.netProfit.toLocaleString()} lei</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Raport Contabil - {accountingReport.period}</CardTitle>
          <CardDescription>Preview raport pentru export contabilitate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-sm text-green-600 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />VENITURI</h4>
              <div className="space-y-2">
                {accountingReport.breakdown.filter(item => item.type === 'income').map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">{item.category}</span>
                    <span className="font-semibold text-green-700">{item.amount.toLocaleString()} lei</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg font-bold">
                  <span>Total Venituri</span>
                  <span className="text-green-700">{accountingReport.totalIncome.toLocaleString()} lei</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-red-600 mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4" />CHELTUIELI</h4>
              <div className="space-y-2">
                {accountingReport.breakdown.filter(item => item.type === 'expense').map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">{item.category}</span>
                    <span className="font-semibold text-red-700">{item.amount.toLocaleString()} lei</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg font-bold">
                  <span>Total Cheltuieli</span>
                  <span className="text-red-700">{accountingReport.totalExpenses.toLocaleString()} lei</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-amber-600 mb-3 flex items-center gap-2"><Receipt className="h-4 w-4" />TAXE ȘI IMPOZITE</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm">TVA de plată</span>
                  <span className="font-semibold text-amber-700">{accountingReport.taxes.vat.toLocaleString()} lei</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm">Impozit pe profit</span>
                  <span className="font-semibold text-amber-700">{accountingReport.taxes.income.toLocaleString()} lei</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm">Contribuții sociale</span>
                  <span className="font-semibold text-amber-700">{accountingReport.taxes.contributions.toLocaleString()} lei</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed pt-4">
              <div className="flex items-center justify-between p-4 bg-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg"><Wallet className="h-5 w-5 text-white" /></div>
                  <span className="font-bold text-lg">PROFIT NET</span>
                </div>
                <span className="text-2xl font-black text-blue-700">{accountingReport.netProfit.toLocaleString()} lei</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Rapoarte & Financiar" description="Dashboard financiar, rapoarte și contabilitate">
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export Tot</Button>
      </PageHeader>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /><span className="hidden sm:inline">Financiar</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Rapoarte</span>
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" /><span className="hidden sm:inline">Contabilitate</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial">{renderFinancialDashboard()}</TabsContent>
        <TabsContent value="reports">{renderReports()}</TabsContent>
        <TabsContent value="accounting">{renderAccounting()}</TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsModule;
