import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, Clock, ShoppingCart, TrendingDown, Package,
  Bell, BellOff, HelpCircle, ArrowRight, User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Alert {
  id: number;
  product: string;
  current: number;
  min: number;
  unit: string;
  severity: 'critical' | 'warning';
  prediction: string;
  category: string;
  consumptionRate: number;
  lastOrder?: string;
}

interface LossAlert {
  id: number;
  product: string;
  expectedStock: number;
  actualStock: number;
  unit: string;
  difference: number;
  value: number;
  date: string;
  possibleCause?: string;
}

const stockAlerts: Alert[] = [
  { id: 1, product: 'Carne vită', current: 2.5, min: 5, unit: 'kg', severity: 'critical', prediction: '~3 ore', category: 'Carne', consumptionRate: 0.8, lastOrder: '20.12.2024' },
  { id: 2, product: 'Mozzarella', current: 1.2, min: 3, unit: 'kg', severity: 'critical', prediction: '~2 ore', category: 'Lactate', consumptionRate: 0.6 },
  { id: 3, product: 'Ulei măsline', current: 3, min: 5, unit: 'L', severity: 'warning', prediction: '~8 ore', category: 'Ingrediente', consumptionRate: 0.25 },
  { id: 4, product: 'Roșii', current: 4, min: 10, unit: 'kg', severity: 'warning', prediction: '~12 ore', category: 'Legume', consumptionRate: 0.5 },
  { id: 5, product: 'Izvorul Alb 0,5L', current: 8, min: 20, unit: 'buc', severity: 'warning', prediction: '~6 ore', category: 'Băuturi', consumptionRate: 2 },
];

const lossAlerts: LossAlert[] = [
  { id: 1, product: 'Pui dezosat', expectedStock: 15, actualStock: 12.5, unit: 'kg', difference: -2.5, value: 87.5, date: '28.12.2024', possibleCause: 'Porții mai mari decât standard' },
  { id: 2, product: 'Sos BBQ', expectedStock: 8, actualStock: 6.8, unit: 'L', difference: -1.2, value: 36, date: '27.12.2024' },
  { id: 3, product: 'Cartofi prăjiți', expectedStock: 20, actualStock: 17, unit: 'kg', difference: -3, value: 25.5, date: '28.12.2024', possibleCause: 'Pierdere la preparare' },
];

const roleNotifications = [
  { role: 'Manager', alerts: ['critical', 'warning', 'loss'], icon: '👔' },
  { role: 'Bucătar Șef', alerts: ['critical', 'warning'], icon: '👨‍🍳' },
  { role: 'Barman', alerts: ['critical'], icon: '🍸' },
  { role: 'Ospătar', alerts: [], icon: '🍽️' },
];

export const StockAlerts: React.FC = () => {
  const [mutedAlerts, setMutedAlerts] = useState<number[]>([]);

  const criticalCount = stockAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = stockAlerts.filter(a => a.severity === 'warning').length;
  const totalLossValue = lossAlerts.reduce((sum, a) => sum + a.value, 0);

  const handleOrder = (product: string) => {
    toast({ title: "Comandă trimisă", description: `Comanda pentru ${product} a fost trimisă la furnizor` });
  };

  const toggleMute = (alertId: number) => {
    setMutedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-destructive/5 border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alerte Critice</p>
                <p className="text-3xl font-bold text-destructive">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/5 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alerte Atenție</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <TrendingDown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diferențe Stoc</p>
                <p className="text-3xl font-bold text-purple-600">{lossAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pierderi Estimate</p>
                <p className="text-3xl font-bold">{totalLossValue.toFixed(0)} RON</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stock" className="gap-2">
            Stoc Minim
            <Badge variant="destructive">{stockAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="losses" className="gap-2">
            Pierderi & Diferențe
            <Badge variant="outline">{lossAlerts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notificări per Rol
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Critical Alerts */}
          {stockAlerts.filter(a => a.severity === 'critical').length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alerte Critice
              </h3>
              {stockAlerts.filter(a => a.severity === 'critical').map((alert) => (
                <Card key={alert.id} className="border-destructive/50 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{alert.product}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{alert.category}</Badge>
                              {alert.lastOrder && <span>Ultima comandă: {alert.lastOrder}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Stoc actual</p>
                            <p className="font-bold text-lg text-destructive">{alert.current} {alert.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Stoc minim</p>
                            <p className="font-medium text-lg">{alert.min} {alert.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Consum/oră</p>
                            <p className="font-medium text-lg">{alert.consumptionRate} {alert.unit}</p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 flex items-center gap-3">
                          <Clock className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="text-sm font-medium">Predicție epuizare</p>
                            <p className="text-lg font-bold text-destructive">{alert.prediction}</p>
                          </div>
                        </div>

                        <Progress 
                          value={(alert.current / alert.min) * 100} 
                          className="mt-4 h-3 [&>div]:bg-destructive"
                        />
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button onClick={() => handleOrder(alert.product)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Comandă
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleMute(alert.id)}
                        >
                          {mutedAlerts.includes(alert.id) ? (
                            <><BellOff className="h-4 w-4 mr-1" /> Unmute</>
                          ) : (
                            <><Bell className="h-4 w-4 mr-1" /> Mute</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Warning Alerts */}
          {stockAlerts.filter(a => a.severity === 'warning').length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Atenție - Stoc Scăzut
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stockAlerts.filter(a => a.severity === 'warning').map((alert) => (
                  <Card key={alert.id} className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Package className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{alert.product}</h4>
                            <Badge variant="outline" className="text-xs">{alert.category}</Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleOrder(alert.product)}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {alert.current} / {alert.min} {alert.unit}
                        </span>
                        <span className="font-medium text-yellow-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.prediction}
                        </span>
                      </div>

                      <Progress 
                        value={(alert.current / alert.min) * 100} 
                        className="h-2 [&>div]:bg-yellow-500"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="losses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                Diferențe Inexplicabile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lossAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="p-4 rounded-xl border bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{alert.product}</h4>
                        <Badge variant="destructive">-{alert.difference} {alert.unit}</Badge>
                        <span className="text-sm text-muted-foreground">{alert.date}</span>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Scriptic: </span>
                          <span className="font-medium">{alert.expectedStock} {alert.unit}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Real: </span>
                          <span className="font-medium text-destructive">{alert.actualStock} {alert.unit}</span>
                        </div>
                      </div>

                      {alert.possibleCause && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Cauză posibilă: {alert.possibleCause}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valoare pierdere</p>
                      <p className="text-xl font-bold text-destructive">{alert.value.toFixed(0)} RON</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurare Notificări per Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleNotifications.map((role, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{role.icon}</div>
                      <div>
                        <p className="font-medium">{role.role}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.alerts.length === 0 ? 'Fără notificări' : `Primește: ${role.alerts.join(', ')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['critical', 'warning', 'loss'].map((type) => (
                        <Badge 
                          key={type}
                          variant={role.alerts.includes(type) ? 'default' : 'outline'}
                          className={`cursor-pointer ${
                            type === 'critical' ? 'bg-destructive hover:bg-destructive/80' : 
                            type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-500/80 text-white' : 
                            'bg-purple-500 hover:bg-purple-500/80'
                          } ${!role.alerts.includes(type) ? 'opacity-30' : ''}`}
                        >
                          {type === 'critical' ? 'Critice' : type === 'warning' ? 'Atenție' : 'Pierderi'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockAlerts;
