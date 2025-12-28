import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Warehouse,
  ChefHat,
  Wine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { ProductCard } from '@/components/ui/product-card';
import { Badge } from '@/components/ui/badge';

const mockProducts = [
  { id: 1, name: 'Ardei Kapia', stock: '17 kg' },
  { id: 2, name: 'Carne de curcan tocata BIO', stock: '3 kg' },
  { id: 3, name: 'Cartofi Dollar Chips', stock: '24.89 kg' },
  { id: 4, name: 'Faina Castellano Albastra', stock: '17 kg' },
  { id: 5, name: 'Gyros puiii', stock: '302.7 kg' },
  { id: 6, name: 'Izvorul Alb 0,5L', stock: '12 L' },
  { id: 7, name: 'Mozzarella', stock: '8.5 kg' },
  { id: 8, name: 'Sos Tzatziki', stock: '15 L' },
  { id: 9, name: 'Pâine Pita', stock: '200 buc' },
];

const stockLocations = [
  { id: 'all', label: 'Toate', icon: Package, count: 156 },
  { id: 'warehouse', label: 'Depozit', icon: Warehouse, count: 89 },
  { id: 'kitchen', label: 'Bucătărie', icon: ChefHat, count: 45 },
  { id: 'bar', label: 'Bar', icon: Wine, count: 22 },
];

export const StocksModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Stocuri & Rețete" 
        description="Gestionare inventar și rețetar"
      >
        <Button variant="outline">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transfer
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Produs Nou
        </Button>
      </PageHeader>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Produse</TabsTrigger>
          <TabsTrigger value="recipes">Rețete</TabsTrigger>
          <TabsTrigger value="inventory">Inventar</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerte
            <Badge variant="destructive" className="ml-2">3</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Location Tabs */}
          <div className="flex flex-wrap gap-2">
            {stockLocations.map((loc) => {
              const Icon = loc.icon;
              return (
                <Button
                  key={loc.id}
                  variant={selectedLocation === loc.id ? "default" : "outline"}
                  onClick={() => setSelectedLocation(loc.id)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {loc.label}
                  <Badge 
                    variant={selectedLocation === loc.id ? "secondary" : "outline"}
                    className="ml-1"
                  >
                    {loc.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Caută produs..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                stock={product.stock}
                onEdit={() => {}}
              />
            ))}
          </div>

          {/* Floating Add Button */}
          <Button 
            size="icon-lg"
            className="fixed bottom-6 right-6 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </TabsContent>

        <TabsContent value="recipes">
          <Card>
            <CardContent className="p-12 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Rețetar</h3>
              <p className="text-muted-foreground">
                Modulul de rețete va fi implementat în etapa 3.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Inventar</h3>
              <p className="text-muted-foreground">
                Modulul de inventar va fi implementat în etapa 4.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            {[
              { product: 'Carne vită', current: '2.5 kg', min: '5 kg', severity: 'critical' },
              { product: 'Ulei măsline', current: '3 L', min: '5 L', severity: 'warning' },
              { product: 'Roșii', current: '4 kg', min: '10 kg', severity: 'warning' },
            ].map((alert, i) => (
              <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/50' : 'border-warning/50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${alert.severity === 'critical' ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                        <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{alert.product}</p>
                        <p className="text-sm text-muted-foreground">
                          Stoc actual: {alert.current} | Minim: {alert.min}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Comandă
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StocksModule;