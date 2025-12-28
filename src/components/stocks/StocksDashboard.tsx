import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, Warehouse, ChefHat, Wine, TrendingUp, TrendingDown, 
  AlertTriangle, Clock, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

interface StocksDashboardProps {
  onNavigateToAlerts: () => void;
}

const consumptionData = [
  { name: 'Lun', stoc: 4500, consum: 1200 },
  { name: 'Mar', stoc: 4200, consum: 1400 },
  { name: 'Mie', stoc: 3800, consum: 1800 },
  { name: 'Joi', stoc: 4100, consum: 1500 },
  { name: 'Vin', stoc: 3600, consum: 2200 },
  { name: 'Sâm', stoc: 3200, consum: 2800 },
  { name: 'Dum', stoc: 4800, consum: 2000 },
];

const depotData = [
  { 
    id: 'warehouse', 
    name: 'Depozit Principal', 
    icon: Warehouse, 
    products: 89, 
    value: 28500, 
    capacity: 75,
    trend: 5.2,
    color: 'bg-blue-500'
  },
  { 
    id: 'kitchen', 
    name: 'Bucătărie', 
    icon: ChefHat, 
    products: 45, 
    value: 12300, 
    capacity: 62,
    trend: -2.1,
    color: 'bg-orange-500'
  },
  { 
    id: 'bar', 
    name: 'Bar', 
    icon: Wine, 
    products: 22, 
    value: 4430, 
    capacity: 45,
    trend: 8.4,
    color: 'bg-purple-500'
  },
];

const activeAlerts = [
  { product: 'Carne vită', current: 2.5, min: 5, unit: 'kg', severity: 'critical', prediction: '~3 ore' },
  { product: 'Ulei măsline', current: 3, min: 5, unit: 'L', severity: 'warning', prediction: '~8 ore' },
  { product: 'Roșii', current: 4, min: 10, unit: 'kg', severity: 'warning', prediction: '~12 ore' },
  { product: 'Mozzarella', current: 1.2, min: 3, unit: 'kg', severity: 'critical', prediction: '~2 ore' },
];

export const StocksDashboard: React.FC<StocksDashboardProps> = ({ onNavigateToAlerts }) => {
  const totalValue = depotData.reduce((acc, d) => acc + d.value, 0);
  const totalProducts = depotData.reduce((acc, d) => acc + d.products, 0);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valoare Totală Stoc</p>
                <p className="text-3xl font-bold mt-1">{totalValue.toLocaleString()} RON</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+3.2% vs. săpt. trecută</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produse</p>
                <p className="text-3xl font-bold mt-1">{totalProducts}</p>
                <p className="text-sm text-muted-foreground mt-2">în 7 categorii</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/10">
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consum Azi</p>
                <p className="text-3xl font-bold mt-1">1,245 RON</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                  <TrendingDown className="h-4 w-4" />
                  <span>-8% vs. ieri</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-orange-500/10">
                <ArrowDownRight className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-destructive/30"
          onClick={onNavigateToAlerts}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerte Active</p>
                <p className="text-3xl font-bold mt-1">{activeAlerts.length}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="destructive" className="text-xs">{criticalAlerts} critice</Badge>
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">{warningAlerts} atenție</Badge>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Depot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {depotData.map((depot) => {
          const Icon = depot.icon;
          return (
            <Card key={depot.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${depot.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{depot.name}</h3>
                      <p className="text-sm text-muted-foreground">{depot.products} produse</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${depot.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {depot.trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{Math.abs(depot.trend)}%</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valoare stoc</span>
                    <span className="font-semibold">{depot.value.toLocaleString()} RON</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacitate utilizată</span>
                      <span className="font-medium">{depot.capacity}%</span>
                    </div>
                    <Progress 
                      value={depot.capacity} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock vs Consumption Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stoc vs Consum (Ultima săptămână)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionData}>
                  <defs>
                    <linearGradient id="colorStoc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConsum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stoc" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorStoc)" 
                    name="Stoc (RON)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="consum" 
                    stroke="hsl(var(--destructive))" 
                    fillOpacity={1} 
                    fill="url(#colorConsum)" 
                    name="Consum (RON)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Consumption by Depot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consum per Depozit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Bucătărie', value: 8500, fill: 'hsl(var(--primary))' },
                  { name: 'Bar', value: 3200, fill: 'hsl(142.1 76.2% 36.3%)' },
                  { name: 'Depozit', value: 1800, fill: 'hsl(217.2 91.2% 59.8%)' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                    formatter={(value: number) => [`${value.toLocaleString()} RON`, 'Consum']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alerte Active
          </CardTitle>
          <Badge variant="destructive">{activeAlerts.length} alerte</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border ${
                  alert.severity === 'critical' 
                    ? 'bg-destructive/5 border-destructive/30' 
                    : 'bg-yellow-500/5 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{alert.product}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.current} / {alert.min} {alert.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Se termină în</span>
                    </div>
                    <p className={`font-semibold ${
                      alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-600'
                    }`}>
                      {alert.prediction}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={(alert.current / alert.min) * 100} 
                  className={`mt-3 h-2 ${alert.severity === 'critical' ? '[&>div]:bg-destructive' : '[&>div]:bg-yellow-500'}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StocksDashboard;
