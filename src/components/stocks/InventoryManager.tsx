import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Search, Camera, BarChart3, FileText, CheckCircle2, XCircle, 
  ArrowRight, Clock, Package, AlertTriangle, Printer, Download,
  Plus, Minus, Save, RotateCcw, ScanBarcode, Warehouse, ChefHat, Wine
} from 'lucide-react';

interface InventoryItem {
  id: number;
  product: string;
  stockScriptic: number;
  stockReal: number | null;
  unit: string;
  difference: number | null;
  differenceValue: number | null;
  status: 'pending' | 'counted' | 'verified';
  category: string;
  location: string;
  barcode: string;
  pricePerUnit: number;
}

interface InventoryHistory {
  id: number;
  date: string;
  location: string;
  user: string;
  totalProducts: number;
  differences: number;
  differenceValue: number;
  status: 'completed' | 'in_progress';
}

interface InventorySession {
  id: number;
  startDate: string;
  location: string;
  user: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  totalProducts: number;
  countedProducts: number;
}

const mockInventoryItems: InventoryItem[] = [
  { id: 1, product: 'Ardei Kapia', stockScriptic: 18, stockReal: 17, unit: 'kg', difference: -1, differenceValue: -12.5, status: 'counted', category: 'Legume', location: 'warehouse', barcode: '5941234567890', pricePerUnit: 12.5 },
  { id: 2, product: 'Carne vită', stockScriptic: 5, stockReal: 2.5, unit: 'kg', difference: -2.5, differenceValue: -87.5, status: 'counted', category: 'Carne', location: 'kitchen', barcode: '5941234567891', pricePerUnit: 35 },
  { id: 3, product: 'Mozzarella', stockScriptic: 9, stockReal: 8.5, unit: 'kg', difference: -0.5, differenceValue: -29, status: 'counted', category: 'Lactate', location: 'kitchen', barcode: '5941234567892', pricePerUnit: 58 },
  { id: 4, product: 'Gyros pui', stockScriptic: 305, stockReal: 302.7, unit: 'kg', difference: -2.3, differenceValue: -73.6, status: 'counted', category: 'Carne', location: 'kitchen', barcode: '5941234567893', pricePerUnit: 32 },
  { id: 5, product: 'Pâine Pita', stockScriptic: 200, stockReal: null, unit: 'buc', difference: null, differenceValue: null, status: 'pending', category: 'Panificație', location: 'kitchen', barcode: '5941234567894', pricePerUnit: 1.8 },
  { id: 6, product: 'Sos Tzatziki', stockScriptic: 15, stockReal: null, unit: 'L', difference: null, differenceValue: null, status: 'pending', category: 'Sosuri', location: 'kitchen', barcode: '5941234567895', pricePerUnit: 22 },
  { id: 7, product: 'Cartofi Dollar Chips', stockScriptic: 25, stockReal: null, unit: 'kg', difference: null, differenceValue: null, status: 'pending', category: 'Legume', location: 'warehouse', barcode: '5941234567896', pricePerUnit: 8.5 },
  { id: 8, product: 'Izvorul Alb 0,5L', stockScriptic: 48, stockReal: null, unit: 'buc', difference: null, differenceValue: null, status: 'pending', category: 'Băuturi', location: 'bar', barcode: '5941234567897', pricePerUnit: 3.5 },
];

const inventoryHistory: InventoryHistory[] = [
  { id: 1, date: '15.12.2024 14:30', location: 'Toate locațiile', user: 'Ion Popescu', totalProducts: 156, differences: 12, differenceValue: -234, status: 'completed' },
  { id: 2, date: '01.12.2024 10:00', location: 'Bucătărie', user: 'Maria Ionescu', totalProducts: 45, differences: 5, differenceValue: +120, status: 'completed' },
  { id: 3, date: '15.11.2024 16:45', location: 'Bar', user: 'Andrei Marin', totalProducts: 22, differences: 3, differenceValue: -89, status: 'completed' },
];

const locations = [
  { id: 'all', label: 'Toate locațiile', icon: Package },
  { id: 'warehouse', label: 'Depozit', icon: Warehouse },
  { id: 'kitchen', label: 'Bucătărie', icon: ChefHat },
  { id: 'bar', label: 'Bar', icon: Wine },
];

export const InventoryManager: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showQuickCountDialog, setShowQuickCountDialog] = useState(false);
  const [showDifferenceReport, setShowDifferenceReport] = useState(false);
  const [currentInventoryLocation, setCurrentInventoryLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [activeInventorySession, setActiveInventorySession] = useState<InventorySession | null>(null);
  const [quickCountProduct, setQuickCountProduct] = useState<InventoryItem | null>(null);
  const [quickCountValue, setQuickCountValue] = useState('');

  const pendingCount = inventoryItems.filter(i => i.status === 'pending').length;
  const countedCount = inventoryItems.filter(i => i.status === 'counted').length;
  const verifiedCount = inventoryItems.filter(i => i.status === 'verified').length;
  const totalDifference = inventoryItems
    .filter(i => i.differenceValue !== null)
    .reduce((sum, i) => sum + (i.differenceValue || 0), 0);

  const filteredItems = inventoryItems.filter(i => 
    i.product.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedLocation === 'all' || i.location === selectedLocation)
  );

  const handleStartInventory = () => {
    const session: InventorySession = {
      id: Date.now(),
      startDate: new Date().toLocaleString('ro-RO'),
      location: currentInventoryLocation || 'all',
      user: 'Utilizator Curent',
      status: 'in_progress',
      totalProducts: inventoryItems.filter(i => 
        currentInventoryLocation === '' || currentInventoryLocation === 'all' || i.location === currentInventoryLocation
      ).length,
      countedProducts: 0
    };
    setActiveInventorySession(session);
    toast({ title: "Inventar pornit", description: `Inventar pentru ${currentInventoryLocation || 'toate locațiile'}` });
    setShowInventoryDialog(false);
  };

  const handleScanProduct = () => {
    const foundProduct = inventoryItems.find(i => i.barcode === scannedBarcode);
    if (foundProduct) {
      setQuickCountProduct(foundProduct);
      setQuickCountValue(foundProduct.stockReal?.toString() || '');
      setShowScanDialog(false);
      setShowQuickCountDialog(true);
      toast({ title: "Produs găsit", description: foundProduct.product });
    } else {
      toast({ title: "Produs negăsit", description: "Codul de bare nu a fost găsit în sistem", variant: "destructive" });
    }
    setScannedBarcode('');
  };

  const handleQuickCount = () => {
    if (quickCountProduct) {
      const value = parseFloat(quickCountValue);
      updateRealStock(quickCountProduct.id, value);
      toast({ title: "Cantitate salvată", description: `${quickCountProduct.product}: ${value} ${quickCountProduct.unit}` });
    }
    setShowQuickCountDialog(false);
    setQuickCountProduct(null);
    setQuickCountValue('');
  };

  const updateRealStock = (id: number, value: number) => {
    setInventoryItems(items => items.map(item => {
      if (item.id === id) {
        const diff = value - item.stockScriptic;
        return {
          ...item,
          stockReal: value,
          difference: diff,
          differenceValue: diff * item.pricePerUnit,
          status: 'counted' as const
        };
      }
      return item;
    }));
  };

  const handleVerifyItem = (id: number) => {
    setInventoryItems(items => items.map(item => 
      item.id === id ? { ...item, status: 'verified' as const } : item
    ));
    toast({ title: "Produs verificat" });
  };

  const handleResetItem = (id: number) => {
    setInventoryItems(items => items.map(item => 
      item.id === id ? { ...item, stockReal: null, difference: null, differenceValue: null, status: 'pending' as const } : item
    ));
  };

  const handleFinalizeInventory = () => {
    if (pendingCount > 0) {
      toast({ 
        title: "Inventar incomplet", 
        description: `Mai sunt ${pendingCount} produse nenumărate`, 
        variant: "destructive" 
      });
      return;
    }
    setActiveInventorySession(null);
    toast({ title: "Inventar finalizat", description: "Stocurile au fost actualizate" });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({ title: "Export inițiat", description: `Se exportă raportul în format ${format.toUpperCase()}` });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current" className="gap-2">
            Inventar Curent
            {activeInventorySession && <Badge variant="secondary">În curs</Badge>}
          </TabsTrigger>
          <TabsTrigger value="quick">Numărare Rapidă</TabsTrigger>
          <TabsTrigger value="differences">Diferențe</TabsTrigger>
          <TabsTrigger value="history">Istoric</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Produse</p>
                    <p className="text-2xl font-bold">{inventoryItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">În așteptare</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Numărate</p>
                    <p className="text-2xl font-bold text-blue-500">{countedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verificate</p>
                    <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={totalDifference < 0 ? "bg-destructive/5 border-destructive/30" : "bg-green-500/5 border-green-500/30"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${totalDifference < 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                    <AlertTriangle className={`h-5 w-5 ${totalDifference < 0 ? 'text-destructive' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diferență</p>
                    <p className={`text-2xl font-bold ${totalDifference < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {totalDifference > 0 ? '+' : ''}{totalDifference.toFixed(0)} RON
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Session Banner */}
          {activeInventorySession && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Inventar în curs</p>
                      <p className="text-sm text-muted-foreground">
                        Început la {activeInventorySession.startDate} • {activeInventorySession.location === 'all' ? 'Toate locațiile' : activeInventorySession.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progres</p>
                      <p className="font-medium">{countedCount + verifiedCount} / {inventoryItems.length}</p>
                    </div>
                    <Button variant="outline" onClick={() => setActiveInventorySession(null)}>
                      Anulează
                    </Button>
                    <Button onClick={handleFinalizeInventory}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizează
                    </Button>
                  </div>
                </div>
                <Progress value={((countedCount + verifiedCount) / inventoryItems.length) * 100} className="mt-4 h-2" />
              </CardContent>
            </Card>
          )}

          {/* Actions Row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {locations.map((loc) => {
                const Icon = loc.icon;
                return (
                  <Button
                    key={loc.id}
                    variant={selectedLocation === loc.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLocation(loc.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {loc.label}
                  </Button>
                );
              })}
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Caută produs..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setShowScanDialog(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Scanează
              </Button>
              {!activeInventorySession && (
                <Button onClick={() => setShowInventoryDialog(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Inventar Nou
                </Button>
              )}
            </div>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produs</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Locație</TableHead>
                    <TableHead className="text-center">Stoc Scriptic</TableHead>
                    <TableHead className="text-center">Stoc Real</TableHead>
                    <TableHead className="text-center">Diferență</TableHead>
                    <TableHead className="text-center">Valoare Dif.</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className={item.status === 'verified' ? 'bg-green-500/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.product}</p>
                            <p className="text-xs text-muted-foreground">{item.barcode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.location === 'warehouse' && 'Depozit'}
                        {item.location === 'kitchen' && 'Bucătărie'}
                        {item.location === 'bar' && 'Bar'}
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.stockScriptic} {item.unit}</TableCell>
                      <TableCell className="text-center">
                        <Input 
                          type="number"
                          className="w-24 mx-auto text-center"
                          placeholder="—"
                          value={item.stockReal ?? ''}
                          onChange={(e) => updateRealStock(item.id, parseFloat(e.target.value) || 0)}
                          disabled={item.status === 'verified'}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {item.difference !== null ? (
                          <span className={item.difference < 0 ? 'text-destructive font-medium' : item.difference > 0 ? 'text-green-600 font-medium' : ''}>
                            {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)} {item.unit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.differenceValue !== null ? (
                          <span className={item.differenceValue < 0 ? 'text-destructive font-medium' : item.differenceValue > 0 ? 'text-green-600 font-medium' : ''}>
                            {item.differenceValue > 0 ? '+' : ''}{item.differenceValue.toFixed(0)} RON
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={item.status === 'verified' ? 'default' : item.status === 'counted' ? 'secondary' : 'outline'}
                          className={item.status === 'verified' ? 'bg-green-500' : ''}
                        >
                          {item.status === 'verified' && 'Verificat'}
                          {item.status === 'counted' && 'Numărat'}
                          {item.status === 'pending' && 'În așteptare'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {item.status === 'counted' && (
                            <Button size="sm" variant="ghost" onClick={() => handleVerifyItem(item.id)}>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {item.status !== 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => handleResetItem(item.id)}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ScanBarcode className="h-5 w-5" />
                Numărare Rapidă cu Scanare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Scanează codul de bare al produsului pentru a introduce rapid cantitatea reală.
              </p>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Cod de bare</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      placeholder="Scanează sau introdu manual codul"
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScanProduct()}
                    />
                    <Button onClick={handleScanProduct}>
                      <Search className="h-4 w-4 mr-2" />
                      Caută
                    </Button>
                  </div>
                </div>
              </div>

              <div className="aspect-video max-w-md mx-auto bg-muted rounded-xl flex flex-col items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Camera Mock - Scanează codul de bare</p>
                <Button variant="outline" className="mt-4" onClick={() => setScannedBarcode('5941234567890')}>
                  Simulează Scanare
                </Button>
              </div>

              {/* Recent Scans */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Ultimele scanări</h4>
                <div className="space-y-2">
                  {inventoryItems.filter(i => i.status === 'counted').slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.product}</p>
                          <p className="text-xs text-muted-foreground">{item.barcode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.stockReal} {item.unit}</p>
                        {item.difference !== 0 && (
                          <p className={`text-xs ${(item.difference || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {(item.difference || 0) > 0 ? '+' : ''}{item.difference} {item.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="differences" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Raport Diferențe</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-1" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems.filter(i => i.difference !== null && i.difference !== 0).map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border ${
                      (item.difference || 0) < 0 ? 'bg-destructive/5 border-destructive/30' : 'bg-green-500/5 border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{item.product}</h4>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Scriptic: {item.stockScriptic} {item.unit}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className={`font-medium ${(item.difference || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                            Real: {item.stockReal} {item.unit}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${(item.difference || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {(item.difference || 0) > 0 ? '+' : ''}{item.difference?.toFixed(2)} {item.unit}
                        </p>
                        <p className={`text-sm ${(item.differenceValue || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {(item.differenceValue || 0) > 0 ? '+' : ''}{item.differenceValue?.toFixed(0)} RON
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {inventoryItems.filter(i => i.difference !== null && i.difference !== 0).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nu există diferențe înregistrate
                  </div>
                )}

                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="font-semibold">Total Diferențe</span>
                  <span className={`text-2xl font-bold ${totalDifference < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {totalDifference > 0 ? '+' : ''}{totalDifference.toFixed(0)} RON
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Istoric Inventare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventoryHistory.map((inv) => (
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{inv.date}</p>
                        <Badge variant="outline">{inv.location}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Efectuat de {inv.user} • {inv.totalProducts} produse • {inv.differences} diferențe
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={inv.differenceValue < 0 ? 'destructive' : 'default'}
                      className={inv.differenceValue >= 0 ? 'bg-green-500' : ''}
                    >
                      {inv.differenceValue > 0 ? '+' : ''}{inv.differenceValue} RON
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Raport
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inventar Nou</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Selectează locația și începe inventarul. Toate produsele vor fi afișate pentru verificare.
            </p>
            <div className="space-y-2">
              <Label>Locație inventar</Label>
              <Select value={currentInventoryLocation} onValueChange={setCurrentInventoryLocation}>
                <SelectTrigger><SelectValue placeholder="Selectează locația" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate locațiile</SelectItem>
                  <SelectItem value="warehouse">Depozit</SelectItem>
                  <SelectItem value="kitchen">Bucătărie</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observații</Label>
              <Textarea placeholder="Notițe despre acest inventar..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInventoryDialog(false)}>Anulează</Button>
            <Button onClick={handleStartInventory}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Începe Inventar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scanare Produs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center">
              <Camera className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Camera Mock - Scanează codul de bare</p>
            </div>
            <div className="space-y-2">
              <Label>Sau introdu manual codul</Label>
              <Input 
                placeholder="Ex: 5941234567890" 
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanDialog(false)}>Anulează</Button>
            <Button onClick={handleScanProduct}>
              <Search className="h-4 w-4 mr-2" />
              Caută Produs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Count Dialog */}
      <Dialog open={showQuickCountDialog} onOpenChange={setShowQuickCountDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Numărare Rapidă</DialogTitle>
          </DialogHeader>
          {quickCountProduct && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">{quickCountProduct.product}</p>
                <p className="text-sm text-muted-foreground">{quickCountProduct.barcode}</p>
                <p className="text-sm mt-2">
                  Stoc scriptic: <span className="font-medium">{quickCountProduct.stockScriptic} {quickCountProduct.unit}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Cantitate reală</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuickCountValue((prev) => String(Math.max(0, (parseFloat(prev) || 0) - 1)))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input 
                    type="number"
                    className="text-center text-lg font-bold"
                    value={quickCountValue}
                    onChange={(e) => setQuickCountValue(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuickCountValue((prev) => String((parseFloat(prev) || 0) + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">{quickCountProduct.unit}</p>
              </div>

              {quickCountValue && (
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Diferență:</p>
                  <p className={`font-bold ${(parseFloat(quickCountValue) - quickCountProduct.stockScriptic) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {(parseFloat(quickCountValue) - quickCountProduct.stockScriptic) > 0 ? '+' : ''}
                    {(parseFloat(quickCountValue) - quickCountProduct.stockScriptic).toFixed(2)} {quickCountProduct.unit}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickCountDialog(false)}>Anulează</Button>
            <Button onClick={handleQuickCount}>
              <Save className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;
