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
  Calculator
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
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
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

// Top products data
const topProducts = [
  { id: 1, name: 'Pizza Margherita', quantity: 245, revenue: 6125, trend: 15.2 },
  { id: 2, name: 'Burger Classic', quantity: 198, revenue: 4950, trend: 8.7 },
  { id: 3, name: 'Ciorbă de burtă', quantity: 156, revenue: 3120, trend: 12.3 },
  { id: 4, name: 'Paste Carbonara', quantity: 142, revenue: 4260, trend: -2.5 },
  { id: 5, name: 'Salată Caesar', quantity: 128, revenue: 2560, trend: 5.1 },
  { id: 6, name: 'Tiramisu', quantity: 115, revenue: 1725, trend: 22.8 },
  { id: 7, name: 'Limonadă', quantity: 312, revenue: 1560, trend: 18.4 },
  { id: 8, name: 'Friptură de vită', quantity: 89, revenue: 5340, trend: -4.2 },
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

export const ReportsModule: React.FC = () => {
  const [mainTab, setMainTab] = useState('financial');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [fiscalPeriod, setFiscalPeriod] = useState('2025-12');

  const getHeatmapColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 40) return 'bg-yellow-400';
    if (value >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const renderFinancialDashboard = () => (
    <div className="space-y-6">
      {/* Sales Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today Sales */}
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

        {/* Week Sales */}
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

        {/* Month Sales */}
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
        {/* Real Profit Card */}
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

        {/* VAT Card */}
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

      {/* Revenue vs Expenses Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Venituri vs Cheltuieli
          </CardTitle>
          <CardDescription>Ultimele 7 zile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
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
                <Area 
                  type="monotone" 
                  dataKey="venituri" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorVenituri)"
                  strokeWidth={2}
                  name="Venituri"
                />
                <Area 
                  type="monotone" 
                  dataKey="cheltuieli" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorCheltuieli)"
                  strokeWidth={2}
                  name="Cheltuieli"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Period Selector & Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date Picker */}
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

          {/* Period Tabs */}
          <Tabs value={reportPeriod} onValueChange={(v) => setReportPeriod(v as typeof reportPeriod)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="daily">Zilnic</TabsTrigger>
              <TabsTrigger value="weekly">Săptămânal</TabsTrigger>
              <TabsTrigger value="monthly">Lunar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </div>

      {/* Top Products Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Top Produse Vândute
          </CardTitle>
          <CardDescription>Cele mai populare produse în perioada selectată</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Produs</TableHead>
                <TableHead className="text-right">Cantitate</TableHead>
                <TableHead className="text-right">Venituri</TableHead>
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
                  <TableCell className="text-right font-semibold">{product.quantity}</TableCell>
                  <TableCell className="text-right font-semibold">{product.revenue.toLocaleString()} lei</TableCell>
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

      {/* Dead Hours Heatmap */}
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
              {/* Header */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="text-xs font-medium text-muted-foreground p-2">Ora</div>
                {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
                  <div key={day} className="text-xs font-medium text-center p-2">{day}</div>
                ))}
              </div>
              {/* Heatmap Grid */}
              <div className="space-y-1">
                {heatmapData.map((row) => (
                  <div key={row.hour} className="grid grid-cols-8 gap-1">
                    <div className="text-xs text-muted-foreground p-2 flex items-center">{row.hour}</div>
                    {['lun', 'mar', 'mie', 'joi', 'vin', 'sam', 'dum'].map((day) => {
                      const value = row[day as keyof typeof row] as number;
                      return (
                        <div
                          key={day}
                          className={cn(
                            "rounded p-2 text-center text-xs font-medium text-white transition-all hover:scale-105 cursor-pointer",
                            getHeatmapColor(value)
                          )}
                          title={`${value}% ocupare`}
                        >
                          {value}%
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground">Legendă:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-400" />
                  <span className="text-xs">0-20%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-orange-400" />
                  <span className="text-xs">20-40%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span className="text-xs">40-60%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-400" />
                  <span className="text-xs">60-80%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-xs">80-100%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Profitable Tables & Top Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitable Tables */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Mese Profitabile
            </CardTitle>
            <CardDescription>Performanța meselor după venituri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profitableTables.map((table, index) => (
                <div key={table.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                    index === 0 && "bg-green-100 text-green-700",
                    index === 1 && "bg-green-50 text-green-600",
                    index > 1 && "bg-muted text-muted-foreground"
                  )}>
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

        {/* Top Employees */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Ranking Angajați
            </CardTitle>
            <CardDescription>Performanța angajaților după vânzări</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEmployees.map((employee, index) => (
                <div key={employee.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                    index === 0 && "bg-yellow-100 text-yellow-700",
                    index === 1 && "bg-slate-100 text-slate-600",
                    index === 2 && "bg-amber-100 text-amber-700",
                    index > 2 && "bg-muted text-muted-foreground"
                  )}>
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
    </div>
  );

  const renderAccounting = () => (
    <div className="space-y-6">
      {/* Period Selector & Export */}
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
            <Building2 className="h-4 w-4 mr-2" />
            Export SAGA
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Printează
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm text-green-100">Venituri Totale</span>
            </div>
            <p className="text-2xl font-black">{accountingReport.totalIncome.toLocaleString()} lei</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm text-red-100">Cheltuieli Totale</span>
            </div>
            <p className="text-2xl font-black">{accountingReport.totalExpenses.toLocaleString()} lei</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4" />
              <span className="text-sm text-amber-100">Taxe & Impozite</span>
            </div>
            <p className="text-2xl font-black">
              {(accountingReport.taxes.vat + accountingReport.taxes.income + accountingReport.taxes.contributions).toLocaleString()} lei
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm text-blue-100">Profit Net</span>
            </div>
            <p className="text-2xl font-black">{accountingReport.netProfit.toLocaleString()} lei</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Report Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Raport Contabil - {accountingReport.period}
          </CardTitle>
          <CardDescription>Preview raport pentru export contabilitate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Income Section */}
            <div>
              <h4 className="font-bold text-sm text-green-600 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                VENITURI
              </h4>
              <div className="space-y-2">
                {accountingReport.breakdown
                  .filter(item => item.type === 'income')
                  .map((item, idx) => (
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

            {/* Expenses Section */}
            <div>
              <h4 className="font-bold text-sm text-red-600 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                CHELTUIELI
              </h4>
              <div className="space-y-2">
                {accountingReport.breakdown
                  .filter(item => item.type === 'expense')
                  .map((item, idx) => (
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

            {/* Taxes Section */}
            <div>
              <h4 className="font-bold text-sm text-amber-600 mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                TAXE ȘI IMPOZITE
              </h4>
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

            {/* Final Result */}
            <div className="border-t-2 border-dashed pt-4">
              <div className="flex items-center justify-between p-4 bg-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
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
      <PageHeader 
        title="Rapoarte & Financiar" 
        description="Dashboard financiar, rapoarte și contabilitate"
      >
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Tot
        </Button>
      </PageHeader>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financiar</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Rapoarte</span>
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Contabilitate</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          {renderFinancialDashboard()}
        </TabsContent>

        <TabsContent value="reports">
          {renderReports()}
        </TabsContent>

        <TabsContent value="accounting">
          {renderAccounting()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsModule;
