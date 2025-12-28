import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Search, Plus, Package, Warehouse, ChefHat, Wine, Edit, Trash2, 
  ArrowRightLeft, Save, Eye, CheckCircle2, XCircle
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  stockReal: number;
  stockScriptic: number;
  unit: string;
  category: string;
  location: string;
  minStock: number;
  price: number;
  image?: string;
  lastUpdate: string;
}

const mockProducts: Product[] = [
  { id: 1, name: 'Ardei Kapia', stockReal: 17, stockScriptic: 18, unit: 'kg', category: 'Legume', location: 'warehouse', minStock: 10, price: 12.5, lastUpdate: '2024-12-28' },
  { id: 2, name: 'Carne de curcan tocata BIO', stockReal: 3, stockScriptic: 3.5, unit: 'kg', category: 'Carne', location: 'kitchen', minStock: 5, price: 45, lastUpdate: '2024-12-28' },
  { id: 3, name: 'Cartofi Dollar Chips', stockReal: 24.89, stockScriptic: 25, unit: 'kg', category: 'Legume', location: 'warehouse', minStock: 15, price: 8.5, lastUpdate: '2024-12-27' },
  { id: 4, name: 'Faina Castellano Albastra', stockReal: 17, stockScriptic: 17, unit: 'kg', category: 'Ingrediente', location: 'warehouse', minStock: 10, price: 4.2, lastUpdate: '2024-12-28' },
  { id: 5, name: 'Gyros pui', stockReal: 302.7, stockScriptic: 305, unit: 'kg', category: 'Carne', location: 'kitchen', minStock: 50, price: 32, lastUpdate: '2024-12-28' },
  { id: 6, name: 'Izvorul Alb 0,5L', stockReal: 12, stockScriptic: 12, unit: 'L', category: 'Băuturi', location: 'bar', minStock: 20, price: 3.5, lastUpdate: '2024-12-28' },
  { id: 7, name: 'Mozzarella', stockReal: 8.5, stockScriptic: 9, unit: 'kg', category: 'Lactate', location: 'kitchen', minStock: 5, price: 58, lastUpdate: '2024-12-28' },
  { id: 8, name: 'Sos Tzatziki', stockReal: 15, stockScriptic: 15, unit: 'L', category: 'Sosuri', location: 'kitchen', minStock: 10, price: 22, lastUpdate: '2024-12-27' },
  { id: 9, name: 'Pâine Pita', stockReal: 200, stockScriptic: 200, unit: 'buc', category: 'Panificație', location: 'kitchen', minStock: 100, price: 1.8, lastUpdate: '2024-12-28' },
];

const categories = ['Toate', 'Legume', 'Carne', 'Lactate', 'Băuturi', 'Sosuri', 'Panificație', 'Ingrediente'];

const stockLocations = [
  { id: 'all', label: 'Toate', icon: Package, count: 156 },
  { id: 'warehouse', label: 'Depozit', icon: Warehouse, count: 89 },
  { id: 'kitchen', label: 'Bucătărie', icon: ChefHat, count: 45 },
  { id: 'bar', label: 'Bar', icon: Wine, count: 22 },
];

interface TransferRequest {
  id: number;
  product: string;
  quantity: number;
  unit: string;
  from: string;
  to: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const pendingTransfers: TransferRequest[] = [
  { id: 1, product: 'Mozzarella', quantity: 2, unit: 'kg', from: 'Depozit', to: 'Bucătărie', requestedBy: 'Ion Popescu', status: 'pending', date: '28.12.2024 10:30' },
  { id: 2, product: 'Sos Tzatziki', quantity: 5, unit: 'L', from: 'Depozit', to: 'Bucătărie', requestedBy: 'Maria Ionescu', status: 'pending', date: '28.12.2024 09:15' },
];

export const StockManagement: React.FC = () => {
  const [products] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('Toate');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTransferApprovalDialog, setShowTransferApprovalDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    (selectedLocation === 'all' || p.location === selectedLocation) &&
    (selectedCategory === 'Toate' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (product: Product) => {
    const percentage = (product.stockReal / product.minStock) * 100;
    if (percentage <= 50) return { color: 'bg-destructive', status: 'Critic' };
    if (percentage <= 100) return { color: 'bg-yellow-500', status: 'Scăzut' };
    return { color: 'bg-green-500', status: 'OK' };
  };

  const getStockDifference = (product: Product) => {
    const diff = product.stockReal - product.stockScriptic;
    if (Math.abs(diff) < 0.01) return null;
    return diff;
  };

  const handleSaveProduct = () => {
    toast({ title: "Produs salvat", description: "Produsul a fost salvat cu succes" });
    setShowProductDialog(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = () => {
    toast({ title: "Produs șters", description: `${productToDelete?.name} a fost șters` });
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleTransfer = () => {
    toast({ title: "Transfer solicitat", description: "Cererea de transfer a fost trimisă pentru aprobare" });
    setShowTransferDialog(false);
  };

  const handleApproveTransfer = (id: number) => {
    toast({ title: "Transfer aprobat", description: "Stocurile au fost actualizate" });
  };

  const handleRejectTransfer = (id: number) => {
    toast({ title: "Transfer respins", description: "Cererea a fost anulată" });
  };

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
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

        <div className="flex items-center gap-2 ml-auto">
          <Button 
            variant={showTransferApprovalDialog ? "default" : "outline"} 
            onClick={() => setShowTransferApprovalDialog(true)}
            className="relative"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aprobări
            {pendingTransfers.length > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingTransfers.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowTransferDialog(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer
          </Button>
          <Button onClick={() => { setSelectedProduct(null); setShowProductDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Produs Nou
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Caută produs..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex border rounded-lg overflow-hidden ml-auto">
          <Button 
            variant={viewMode === 'table' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('table')}
            className="rounded-none"
          >
            Tabel
          </Button>
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('cards')}
            className="rounded-none"
          >
            Carduri
          </Button>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Stoc Real</TableHead>
                  <TableHead>Stoc Scriptic</TableHead>
                  <TableHead>Diferență</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valoare</TableHead>
                  <TableHead className="w-20">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const diff = getStockDifference(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.location === 'warehouse' && 'Depozit'}
                        {product.location === 'kitchen' && 'Bucătărie'}
                        {product.location === 'bar' && 'Bar'}
                      </TableCell>
                      <TableCell className="font-medium">{product.stockReal} {product.unit}</TableCell>
                      <TableCell className="text-muted-foreground">{product.stockScriptic} {product.unit}</TableCell>
                      <TableCell>
                        {diff !== null ? (
                          <span className={diff < 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(2)} {product.unit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stockStatus.color}`} />
                          <span className="text-sm">{stockStatus.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {(product.stockReal * product.price).toFixed(0)} RON
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedProduct(product); setShowProductDialog(true); }}
                          >
                            Editează
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(product); }}
                          >
                            Șterge
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const stockPercentage = Math.min((product.stockReal / product.minStock) * 100, 200);
            const diff = getStockDifference(product);
            
            return (
              <Card 
                key={product.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => { setSelectedProduct(product); setShowProductDialog(true); }}
              >
                <CardContent className="p-4">
                  <div className="aspect-square rounded-xl bg-muted flex items-center justify-center mb-3 relative overflow-hidden">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalii
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                  <p className="text-lg font-bold">{product.stockReal} {product.unit}</p>
                  
                  {diff !== null && (
                    <p className={`text-xs ${diff < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      Diferență: {diff > 0 ? '+' : ''}{diff.toFixed(2)} {product.unit}
                    </p>
                  )}
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Min: {product.minStock}</span>
                      <Badge variant="outline" className="text-xs">{stockStatus.status}</Badge>
                    </div>
                    <Progress 
                      value={stockPercentage} 
                      className={`h-2 ${stockStatus.color === 'bg-destructive' ? '[&>div]:bg-destructive' : stockStatus.color === 'bg-yellow-500' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Dialog - Adauga Produs (conform screenshot) */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Editare Produs' : 'Adauga Produs'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selectează produs din nomenclator *</Label>
              <Select defaultValue={selectedProduct?.name}>
                <SelectTrigger><SelectValue placeholder="Selectează produs" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                  <SelectItem value="new">+ Adaugă produs nou în nomenclator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nume produs specific furnizor</Label>
              <Input placeholder="Numele produsului la acest furnizor" defaultValue={selectedProduct?.name} />
            </div>

            <div className="space-y-2">
              <Label>Unitate măsură specifică</Label>
              <Input placeholder="ex: sac 25kg, cutie 12 bucăți" />
            </div>

            <div className="space-y-2">
              <Label>Preț</Label>
              <Input type="number" placeholder="Preț per unitate" defaultValue={selectedProduct?.price} />
            </div>

            <div className="space-y-2">
              <Label>Descriere (opțional)</Label>
              <Textarea placeholder="Descriere suplimentară despre produs" className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Anulează</Button>
            <Button onClick={handleSaveProduct} className="bg-primary/80 hover:bg-primary">Adaugă</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Șterge produs</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Sigur vrei să ștergi „{productToDelete?.name}"?
            </p>
            {productToDelete && productToDelete.stockReal > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                <p className="text-destructive font-medium">
                  Atenție: există stoc pentru acest produs — loturi: {Math.floor(productToDelete.stockReal / 10)}, cantitate totală: {productToDelete.stockReal}.
                </p>
                <p className="text-muted-foreground mt-1">
                  Vor fi șterse și {Math.floor(Math.random() * 5) + 1} asociere(i) din produsele furnizorilor.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Anulează</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Șterge</Button>
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
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} ({p.stockReal} {p.unit})
                    </SelectItem>
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
            <div className="space-y-2">
              <Label>Motiv transfer</Label>
              <Textarea placeholder="De ce este necesar transferul..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Anulează</Button>
            <Button onClick={handleTransfer}><ArrowRightLeft className="h-4 w-4 mr-2" />Solicită Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Approval Dialog */}
      <Dialog open={showTransferApprovalDialog} onOpenChange={setShowTransferApprovalDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Aprobări Transferuri</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nu există cereri de transfer în așteptare
              </div>
            ) : (
              pendingTransfers.map((transfer) => (
                <Card key={transfer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{transfer.product}</span>
                          <Badge variant="outline">{transfer.quantity} {transfer.unit}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transfer.from} → {transfer.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitat de {transfer.requestedBy} la {transfer.date}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRejectTransfer(transfer.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Respinge
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApproveTransfer(transfer.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprobă
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;
