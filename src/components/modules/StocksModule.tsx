import React, { useState } from 'react';
import { 
  Search, Plus, Package, AlertTriangle, ArrowRightLeft, Warehouse, ChefHat, Wine,
  Edit, Trash2, X, Save, FolderOpen, Filter, BarChart3, FileText, ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { ProductCard } from '@/components/ui/product-card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

const mockProducts = [
  { id: 1, name: 'Ardei Kapia', stock: '17 kg', category: 'Legume', location: 'warehouse', minStock: 10, unit: 'kg' },
  { id: 2, name: 'Carne de curcan tocata BIO', stock: '3 kg', category: 'Carne', location: 'kitchen', minStock: 5, unit: 'kg' },
  { id: 3, name: 'Cartofi Dollar Chips', stock: '24.89 kg', category: 'Legume', location: 'warehouse', minStock: 15, unit: 'kg' },
  { id: 4, name: 'Faina Castellano Albastra', stock: '17 kg', category: 'Ingrediente', location: 'warehouse', minStock: 10, unit: 'kg' },
  { id: 5, name: 'Gyros puiii', stock: '302.7 kg', category: 'Carne', location: 'kitchen', minStock: 50, unit: 'kg' },
  { id: 6, name: 'Izvorul Alb 0,5L', stock: '12 L', category: 'Băuturi', location: 'bar', minStock: 20, unit: 'L' },
  { id: 7, name: 'Mozzarella', stock: '8.5 kg', category: 'Lactate', location: 'kitchen', minStock: 5, unit: 'kg' },
  { id: 8, name: 'Sos Tzatziki', stock: '15 L', category: 'Sosuri', location: 'kitchen', minStock: 10, unit: 'L' },
  { id: 9, name: 'Pâine Pita', stock: '200 buc', category: 'Panificație', location: 'kitchen', minStock: 100, unit: 'buc' },
];

const mockRecipes = [
  { id: 1, name: 'Pizza Margherita', ingredients: ['Mozzarella', 'Sos roșii', 'Busuioc'], prepTime: 15, portions: 1 },
  { id: 2, name: 'Gyros Pui', ingredients: ['Gyros puiii', 'Pâine Pita', 'Sos Tzatziki'], prepTime: 10, portions: 1 },
  { id: 3, name: 'Salată Caesar', ingredients: ['Salată', 'Parmezan', 'Pui'], prepTime: 8, portions: 1 },
];

const mockCategories = [
  { id: 1, name: 'Legume', count: 24, color: 'bg-green-500' },
  { id: 2, name: 'Carne', count: 18, color: 'bg-red-500' },
  { id: 3, name: 'Lactate', count: 12, color: 'bg-blue-400' },
  { id: 4, name: 'Băuturi', count: 35, color: 'bg-purple-500' },
  { id: 5, name: 'Sosuri', count: 15, color: 'bg-orange-500' },
  { id: 6, name: 'Panificație', count: 8, color: 'bg-amber-600' },
  { id: 7, name: 'Ingrediente', count: 44, color: 'bg-slate-500' },
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
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<typeof mockRecipes[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);

  const filteredProducts = mockProducts.filter(p => 
    (selectedLocation === 'all' || p.location === selectedLocation) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = () => {
    toast({ title: "Produs salvat", description: "Produsul a fost adăugat cu succes" });
    setShowNewProductDialog(false);
  };

  const handleTransfer = () => {
    toast({ title: "Transfer realizat", description: "Produsele au fost transferate" });
    setShowTransferDialog(false);
  };

  const handleOrderProduct = (product: string) => {
    toast({ title: "Comandă trimisă", description: `Comandă pentru ${product} a fost trimisă` });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Stocuri & Rețete" 
        description="Gestionare inventar și rețetar"
      >
        <Button variant="outline" onClick={() => setShowTransferDialog(true)}>
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transfer
        </Button>
        <Button onClick={() => setShowNewProductDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Produs Nou
        </Button>
      </PageHeader>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Produse</TabsTrigger>
          <TabsTrigger value="recipes">Rețete</TabsTrigger>
          <TabsTrigger value="inventory">Inventar</TabsTrigger>
          <TabsTrigger value="categories">Categorii</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerte
            <Badge variant="destructive" className="ml-2">3</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
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
                  <Badge variant={selectedLocation === loc.id ? "secondary" : "outline"} className="ml-1">
                    {loc.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Caută produs..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                stock={product.stock}
                onEdit={() => { setSelectedProduct(product); setShowNewProductDialog(true); }}
              />
            ))}
          </div>
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută rețetă..." className="pl-10" />
            </div>
            <Button onClick={() => { setSelectedRecipe(null); setShowRecipeDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Rețetă Nouă
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRecipes.map((recipe) => (
              <Card key={recipe.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedRecipe(recipe); setShowRecipeDialog(true); }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    {recipe.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{recipe.ingredients.length} ingrediente</p>
                    <p className="text-sm">Timp: {recipe.prepTime} min</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{ing}</Badge>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{recipe.ingredients.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Inventar Curent</h3>
            <Button onClick={() => setShowInventoryDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Inventar Nou
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Produse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">156</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Valoare Stoc</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">45,230 RON</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Ultimul Inventar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">15.12.2024</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Istoric Inventare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { date: '15.12.2024', user: 'Ion Popescu', diff: '-234 RON' },
                  { date: '01.12.2024', user: 'Maria Ionescu', diff: '+120 RON' },
                  { date: '15.11.2024', user: 'Ion Popescu', diff: '-89 RON' },
                ].map((inv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{inv.date}</p>
                      <p className="text-sm text-muted-foreground">{inv.user}</p>
                    </div>
                    <Badge variant={inv.diff.startsWith('-') ? 'destructive' : 'default'}>{inv.diff}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Categorii Produse</h3>
            <Button onClick={() => setShowCategoryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Categorie Nouă
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockCategories.map((cat) => (
              <Card key={cat.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">{cat.count} produse</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            {[
              { product: 'Carne vită', current: '2.5 kg', min: '5 kg', severity: 'critical' },
              { product: 'Ulei măsline', current: '3 L', min: '5 L', severity: 'warning' },
              { product: 'Roșii', current: '4 kg', min: '10 kg', severity: 'warning' },
            ].map((alert, i) => (
              <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/50' : 'border-yellow-500/50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${alert.severity === 'critical' ? 'bg-destructive/10' : 'bg-yellow-500/10'}`}>
                        <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{alert.product}</p>
                        <p className="text-sm text-muted-foreground">
                          Stoc actual: {alert.current} | Minim: {alert.min}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleOrderProduct(alert.product)}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Comandă
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Product Dialog */}
      <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Editare Produs' : 'Produs Nou'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume produs</Label>
              <Input placeholder="Ex: Mozzarella" defaultValue={selectedProduct?.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantitate</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Unitate</Label>
                <Select defaultValue={selectedProduct?.unit || 'kg'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograme (kg)</SelectItem>
                    <SelectItem value="L">Litri (L)</SelectItem>
                    <SelectItem value="buc">Bucăți (buc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select defaultValue={selectedProduct?.category}>
                  <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                  <SelectContent>
                    {mockCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Locație</Label>
                <Select defaultValue={selectedProduct?.location || 'warehouse'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Depozit</SelectItem>
                    <SelectItem value="kitchen">Bucătărie</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stoc minim (alertă)</Label>
              <Input type="number" placeholder="5" defaultValue={selectedProduct?.minStock} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProductDialog(false)}>Anulează</Button>
            <Button onClick={handleSaveProduct}><Save className="h-4 w-4 mr-2" />Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Stoc</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produs</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selectează produsul" /></SelectTrigger>
                <SelectContent>
                  {mockProducts.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Din</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Sursă" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Depozit</SelectItem>
                    <SelectItem value="kitchen">Bucătărie</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>În</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Destinație" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Depozit</SelectItem>
                    <SelectItem value="kitchen">Bucătărie</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cantitate</Label>
              <Input type="number" placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Anulează</Button>
            <Button onClick={handleTransfer}><ArrowRightLeft className="h-4 w-4 mr-2" />Transferă</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRecipe ? selectedRecipe.name : 'Rețetă Nouă'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume rețetă</Label>
              <Input placeholder="Ex: Pizza Margherita" defaultValue={selectedRecipe?.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timp preparare (min)</Label>
                <Input type="number" placeholder="15" defaultValue={selectedRecipe?.prepTime} />
              </div>
              <div className="space-y-2">
                <Label>Porții</Label>
                <Input type="number" placeholder="1" defaultValue={selectedRecipe?.portions} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ingrediente</Label>
              <div className="border rounded-lg p-3 space-y-2">
                {(selectedRecipe?.ingredients || ['Ingredient 1']).map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input defaultValue={ing} className="flex-1" />
                    <Input placeholder="Cantitate" className="w-24" />
                    <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full"><Plus className="h-4 w-4 mr-2" />Adaugă ingredient</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipeDialog(false)}>Anulează</Button>
            <Button onClick={() => { toast({ title: "Rețetă salvată" }); setShowRecipeDialog(false); }}>
              <Save className="h-4 w-4 mr-2" />Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Categorie Nouă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume categorie</Label>
              <Input placeholder="Ex: Deserturi" />
            </div>
            <div className="space-y-2">
              <Label>Culoare</Label>
              <div className="flex gap-2">
                {['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-amber-500'].map(color => (
                  <button key={color} className={`w-8 h-8 rounded-lg ${color} hover:ring-2 ring-offset-2`} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Anulează</Button>
            <Button onClick={() => { toast({ title: "Categorie salvată" }); setShowCategoryDialog(false); }}>
              <Save className="h-4 w-4 mr-2" />Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inventar Nou</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">Selectează locația și începe inventarul. Toate produsele vor fi afișate pentru verificare.</p>
            <div className="space-y-2">
              <Label>Locație inventar</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selectează locația" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate locațiile</SelectItem>
                  <SelectItem value="warehouse">Depozit</SelectItem>
                  <SelectItem value="kitchen">Bucătărie</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInventoryDialog(false)}>Anulează</Button>
            <Button onClick={() => { toast({ title: "Inventar pornit" }); setShowInventoryDialog(false); }}>
              <BarChart3 className="h-4 w-4 mr-2" />Începe Inventar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button 
        size="icon"
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14"
        onClick={() => setShowNewProductDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default StocksModule;
