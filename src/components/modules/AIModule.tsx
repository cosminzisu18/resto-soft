import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Clock,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  BarChart3,
  ShoppingCart,
  Users,
  Calendar,
  Zap,
  Target,
  ArrowRight,
  RefreshCw,
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data pentru predicții vânzări
const salesPredictionData = [
  { day: 'Lun', actual: 4200, predicted: 4100, optimistic: 4500, pessimistic: 3800 },
  { day: 'Mar', actual: 3800, predicted: 3900, optimistic: 4200, pessimistic: 3600 },
  { day: 'Mie', actual: 5100, predicted: 4800, optimistic: 5200, pessimistic: 4400 },
  { day: 'Joi', actual: 4600, predicted: 4700, optimistic: 5000, pessimistic: 4300 },
  { day: 'Vin', actual: 6200, predicted: 6000, optimistic: 6500, pessimistic: 5500 },
  { day: 'Sâm', actual: 7500, predicted: 7200, optimistic: 7800, pessimistic: 6800 },
  { day: 'Dum', actual: null, predicted: 5800, optimistic: 6300, pessimistic: 5300 },
];

const weeklyTrendData = [
  { week: 'S1', revenue: 28500 },
  { week: 'S2', revenue: 32100 },
  { week: 'S3', revenue: 29800 },
  { week: 'S4', revenue: 35200 },
  { week: 'S5', revenue: 38900 },
  { week: 'S6', revenue: 42100 },
];

const categoryDistribution = [
  { name: 'Meniu Principal', value: 45, color: 'hsl(217, 91%, 60%)' },
  { name: 'Băuturi', value: 25, color: 'hsl(142, 76%, 36%)' },
  { name: 'Deserturi', value: 15, color: 'hsl(38, 92%, 50%)' },
  { name: 'Aperitive', value: 15, color: 'hsl(0, 84%, 60%)' },
];

// Mock sugestii stoc
const stockSuggestions = [
  {
    id: 1,
    product: 'Carne Vită Premium',
    currentStock: 12,
    suggestedOrder: 30,
    reason: 'Creștere anticipată 40% weekend',
    priority: 'high',
    confidence: 92,
    savings: 450
  },
  {
    id: 2,
    product: 'Roșii Cherry',
    currentStock: 8,
    suggestedOrder: 25,
    reason: 'Stoc scăzut + sezon vară',
    priority: 'high',
    confidence: 88,
    savings: 120
  },
  {
    id: 3,
    product: 'Vin Alb Casa',
    currentStock: 24,
    suggestedOrder: 0,
    reason: 'Stoc suficient pentru 2 săptămâni',
    priority: 'low',
    confidence: 95,
    savings: 0
  },
  {
    id: 4,
    product: 'Ulei Măsline',
    currentStock: 5,
    suggestedOrder: 15,
    reason: 'Consum crescut rețete noi',
    priority: 'medium',
    confidence: 78,
    savings: 85
  },
];

// Mock alerte pierderi
const lossAlerts = [
  {
    id: 1,
    type: 'waste',
    title: 'Pierderi Legume Proaspete',
    description: 'Rata de pierdere 15% - peste media de 8%',
    impact: 1200,
    trend: 'up',
    suggestion: 'Reduceți comenzile cu 20% sau ajustați meniul',
    severity: 'critical'
  },
  {
    id: 2,
    type: 'theft',
    title: 'Anomalie Băuturi Alcoolice',
    description: 'Diferență inventar vs. vânzări: 12 unități',
    impact: 850,
    trend: 'stable',
    suggestion: 'Verificare CCTV și inventar manual',
    severity: 'warning'
  },
  {
    id: 3,
    type: 'expiry',
    title: 'Produse Aproape de Expirare',
    description: '8 produse expiră în 3 zile',
    impact: 320,
    trend: 'down',
    suggestion: 'Promovare la preț redus sau donare',
    severity: 'info'
  },
];

// Mock recomandări program
const scheduleRecommendations = [
  {
    id: 1,
    day: 'Vineri',
    currentStaff: 4,
    suggestedStaff: 6,
    reason: 'Predicție trafic +35% vs. normal',
    peakHours: '19:00 - 22:00',
    confidence: 91
  },
  {
    id: 2,
    day: 'Sâmbătă',
    currentStaff: 5,
    suggestedStaff: 7,
    reason: 'Eveniment local + weekend',
    peakHours: '12:00 - 15:00, 19:00 - 23:00',
    confidence: 87
  },
  {
    id: 3,
    day: 'Luni',
    currentStaff: 5,
    suggestedStaff: 3,
    reason: 'Istoric trafic redus -40%',
    peakHours: '12:00 - 14:00',
    confidence: 94
  },
];

// Mock insights
const aiInsights = [
  {
    id: 1,
    category: 'revenue',
    title: 'Oportunitate Creștere Venituri',
    description: 'Analiza arată că adăugarea unui meniu de prânz la 35 RON ar putea crește veniturile cu 18% în zilele lucrătoare.',
    impact: '+2,400 RON/săptămână',
    confidence: 85,
    status: 'pending',
    icon: TrendingUp,
    color: 'text-success'
  },
  {
    id: 2,
    category: 'efficiency',
    title: 'Optimizare Timp Preparare',
    description: 'Rețeta "Paste Carbonara" durează în medie 22 min vs. standard 15 min. Sugerăm pre-preparare sosuri.',
    impact: '-30% timp producție',
    confidence: 92,
    status: 'pending',
    icon: Clock,
    color: 'text-primary'
  },
  {
    id: 3,
    category: 'menu',
    title: 'Produs Subperformant',
    description: '"Salată Caesar" are doar 2% din comenzi dar ocupă ingrediente premium. Considerați înlocuirea.',
    impact: '+150 RON profit/săpt.',
    confidence: 78,
    status: 'pending',
    icon: Target,
    color: 'text-warning'
  },
  {
    id: 4,
    category: 'staff',
    title: 'Pattern Ore de Vârf',
    description: 'Marți și Joi, orele 13:00-14:00 au 45% mai puține comenzi. Oportunitate pentru promții.',
    impact: '+12% ocupare',
    confidence: 88,
    status: 'applied',
    icon: Users,
    color: 'text-info'
  },
  {
    id: 5,
    category: 'costs',
    title: 'Reducere Costuri Energie',
    description: 'Echipamentele de bucătărie consumă 30% mai mult în afara orelor de vârf. Programare automată sugerată.',
    impact: '-800 RON/lună',
    confidence: 81,
    status: 'ignored',
    icon: Zap,
    color: 'text-destructive'
  },
];

export const AIModule: React.FC = () => {
  const [insights, setInsights] = useState(aiInsights);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleApplyInsight = (id: number) => {
    setInsights(prev => prev.map(insight => 
      insight.id === id ? { ...insight, status: 'applied' } : insight
    ));
  };

  const handleIgnoreInsight = (id: number) => {
    setInsights(prev => prev.map(insight => 
      insight.id === id ? { ...insight, status: 'ignored' } : insight
    ));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const pendingInsights = insights.filter(i => i.status === 'pending');
  const appliedInsights = insights.filter(i => i.status === 'applied');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI & Automatizări</h1>
              <p className="text-muted-foreground">Predicții, sugestii și optimizări inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{pendingInsights.length} sugestii noi</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizează
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Setări AI
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard AI
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights ({pendingInsights.length})
              </TabsTrigger>
            </TabsList>

            {/* Dashboard AI */}
            <TabsContent value="dashboard" className="mt-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Acuratețe Predicții</p>
                        <p className="text-2xl font-bold text-foreground">94.2%</p>
                      </div>
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <Progress value={94.2} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Economii Generate</p>
                        <p className="text-2xl font-bold text-foreground">12,450 RON</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-success" />
                    </div>
                    <p className="text-xs text-success mt-2">+23% vs. luna trecută</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Sugestii Aplicate</p>
                        <p className="text-2xl font-bold text-foreground">{appliedInsights.length}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-warning" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">din {insights.length} totale</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ore Optimizate</p>
                        <p className="text-2xl font-bold text-foreground">156h</p>
                      </div>
                      <Clock className="h-8 w-8 text-info" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">în ultima lună</p>
                  </CardContent>
                </Card>
              </div>

              {/* Predicții Vânzări */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Predicții Vânzări - Săptămâna Curentă
                      </CardTitle>
                      <CardDescription>Comparație actual vs. predicție cu intervale de încredere</CardDescription>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Acuratețe 94%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesPredictionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value?.toLocaleString()} RON`, '']}
                        />
                        <Area
                          type="monotone"
                          dataKey="optimistic"
                          stroke="transparent"
                          fill="hsl(142, 76%, 36%)"
                          fillOpacity={0.1}
                          name="Optimist"
                        />
                        <Area
                          type="monotone"
                          dataKey="pessimistic"
                          stroke="transparent"
                          fill="hsl(0, 84%, 60%)"
                          fillOpacity={0.1}
                          name="Pesimist"
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="hsl(217, 91%, 60%)"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2 }}
                          name="Predicție"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2 }}
                          name="Actual"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-sm text-muted-foreground">Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-primary" style={{ borderStyle: 'dashed' }} />
                      <span className="text-sm text-muted-foreground">Predicție</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-success/20" />
                      <span className="text-sm text-muted-foreground">Interval optimist</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sugestii Stoc */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-warning" />
                      Sugestii Stoc Inteligente
                    </CardTitle>
                    <CardDescription>Recomandări bazate pe predicții și pattern-uri</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stockSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-lg border ${
                          suggestion.priority === 'high' 
                            ? 'border-destructive/30 bg-destructive/5' 
                            : suggestion.priority === 'medium'
                            ? 'border-warning/30 bg-warning/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{suggestion.product}</span>
                              <Badge 
                                variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {suggestion.priority === 'high' ? 'Urgent' : suggestion.priority === 'medium' ? 'Mediu' : 'Ok'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-muted-foreground">
                                Stoc actual: <span className="font-medium text-foreground">{suggestion.currentStock}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Comandă sugerată: <span className="font-medium text-primary">{suggestion.suggestedOrder}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Încredere: <span className="font-medium text-success">{suggestion.confidence}%</span>
                              </span>
                            </div>
                          </div>
                          {suggestion.suggestedOrder > 0 && (
                            <Button size="sm" variant="outline">
                              Comandă
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Detectare Pierderi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Detectare Pierderi & Anomalii
                    </CardTitle>
                    <CardDescription>Alerte automate pentru reducerea pierderilor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lossAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.severity === 'critical'
                            ? 'border-destructive bg-destructive/10'
                            : alert.severity === 'warning'
                            ? 'border-warning bg-warning/10'
                            : 'border-info bg-info/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            alert.severity === 'critical' ? 'text-destructive' :
                            alert.severity === 'warning' ? 'text-warning' : 'text-info'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{alert.title}</span>
                              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                                -{alert.impact.toLocaleString()} RON
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Lightbulb className="h-4 w-4 text-primary" />
                              <span className="text-sm text-primary">{alert.suggestion}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recomandări Program */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-info" />
                    Recomandări Program Personal
                  </CardTitle>
                  <CardDescription>Optimizare automată bazată pe predicții de trafic</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {scheduleRecommendations.map((rec) => (
                      <Card key={rec.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-foreground">{rec.day}</span>
                            <Badge variant="outline" className="text-xs">
                              {rec.confidence}% încredere
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-muted-foreground">{rec.currentStaff}</p>
                              <p className="text-xs text-muted-foreground">Actual</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            <div className="text-center">
                              <p className={`text-2xl font-bold ${
                                rec.suggestedStaff > rec.currentStaff ? 'text-warning' :
                                rec.suggestedStaff < rec.currentStaff ? 'text-success' : 'text-foreground'
                              }`}>
                                {rec.suggestedStaff}
                              </p>
                              <p className="text-xs text-muted-foreground">Sugerat</p>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Clock className="h-3 w-3" />
                            <span>Ore de vârf: {rec.peakHours}</span>
                          </div>

                          <Button size="sm" variant="outline" className="w-full mt-3">
                            Aplică Sugestie
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grafice Suplimentare */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Trend Venituri Săptămânal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} RON`, 'Venituri']}
                          />
                          <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-success" />
                      Distribuție Categorii
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center">
                      <ResponsiveContainer width="50%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`${value}%`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {categoryDistribution.map((cat, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm text-muted-foreground">{cat.name}</span>
                            <span className="text-sm font-medium text-foreground ml-auto">{cat.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Panel */}
            <TabsContent value="insights" className="mt-6 space-y-6">
              {/* Insights Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Lightbulb className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sugestii Active</p>
                      <p className="text-2xl font-bold text-foreground">{pendingInsights.length}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-success/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aplicate</p>
                      <p className="text-2xl font-bold text-foreground">{appliedInsights.length}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-warning/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Impact Estimat</p>
                      <p className="text-2xl font-bold text-foreground">+4,850 RON</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Sugestii Acționabile
                  </CardTitle>
                  <CardDescription>Insights generate automat de AI pentru optimizarea afacerii</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.map((insight) => {
                    const Icon = insight.icon;
                    return (
                      <div
                        key={insight.id}
                        className={`p-5 rounded-xl border transition-all ${
                          insight.status === 'applied' 
                            ? 'border-success/30 bg-success/5 opacity-75' 
                            : insight.status === 'ignored'
                            ? 'border-border bg-muted/30 opacity-50'
                            : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            insight.status === 'applied' ? 'bg-success/20' :
                            insight.status === 'ignored' ? 'bg-muted' : 'bg-primary/10'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              insight.status === 'applied' ? 'text-success' :
                              insight.status === 'ignored' ? 'text-muted-foreground' : insight.color
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{insight.title}</h3>
                              <Badge variant="outline" className="text-xs capitalize">
                                {insight.category}
                              </Badge>
                              {insight.status === 'applied' && (
                                <Badge variant="secondary" className="gap-1 text-xs bg-success/20 text-success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Aplicat
                                </Badge>
                              )}
                              {insight.status === 'ignored' && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <XCircle className="h-3 w-3" />
                                  Ignorat
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-success" />
                                <span className="font-medium text-success">{insight.impact}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{insight.confidence}% încredere</span>
                              </div>
                            </div>
                          </div>

                          {insight.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleIgnoreInsight(insight.id)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                Ignoră
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleApplyInsight(insight.id)}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                Aplică
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AIModule;
