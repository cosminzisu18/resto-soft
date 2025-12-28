import React from 'react';
import { 
  ShoppingCart, 
  UtensilsCrossed, 
  Package, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Truck,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

export const DashboardModule: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Rezumat activitate restaurant"
      >
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Astăzi
        </Button>
        <Button>
          Raport Complet
        </Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vânzări Azi"
          value="12,450 RON"
          icon={CreditCard}
          trend={{ value: 12, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Comenzi Active"
          value="23"
          icon={ShoppingCart}
          subtitle="8 în așteptare"
          color="blue"
        />
        <StatCard
          title="Timp Mediu Servire"
          value="18 min"
          icon={Clock}
          trend={{ value: 5, isPositive: false }}
          color="orange"
        />
        <StatCard
          title="Livrări în Curs"
          value="7"
          icon={Truck}
          subtitle="2 Glovo, 3 Bolt, 2 Wolt"
          color="blue"
        />
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Comenzi Recente</CardTitle>
            <Button variant="ghost" size="sm">Vezi toate</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: '#1234', table: 'Masa 5', status: 'preparing', items: 4, time: '5 min' },
                { id: '#1233', table: 'Masa 12', status: 'ready', items: 2, time: '12 min' },
                { id: '#1232', table: 'Delivery', status: 'pending', items: 6, time: '2 min' },
                { id: '#1231', table: 'Masa 3', status: 'completed', items: 3, time: '25 min' },
              ].map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-medium text-primary">{order.id}</span>
                    <span className="text-foreground">{order.table}</span>
                    <span className="text-muted-foreground text-sm">{order.items} produse</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{order.time}</span>
                    <Badge 
                      variant={
                        order.status === 'ready' ? 'success' :
                        order.status === 'preparing' ? 'warning' :
                        order.status === 'completed' ? 'secondary' :
                        'info'
                      }
                    >
                      {order.status === 'ready' ? 'Gata' :
                       order.status === 'preparing' ? 'Se prepară' :
                       order.status === 'completed' ? 'Finalizat' :
                       'În așteptare'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Stoc Minim</p>
                    <p className="text-sm text-muted-foreground">Carne vită - 2.5 kg</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Comandă Întârziată</p>
                    <p className="text-sm text-muted-foreground">Masa 8 - 25 min</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-success">Inventar Complet</p>
                    <p className="text-sm text-muted-foreground">Bar verificat</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <UtensilsCrossed className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">156</p>
          <p className="text-sm text-muted-foreground">Preparate Azi</p>
        </Card>
        <Card className="p-4 text-center">
          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">8</p>
          <p className="text-sm text-muted-foreground">Angajați Activi</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">87%</p>
          <p className="text-sm text-muted-foreground">Ocupare Mese</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-2xl font-bold text-success">98%</p>
          <p className="text-sm text-muted-foreground">Comenzi la Timp</p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardModule;