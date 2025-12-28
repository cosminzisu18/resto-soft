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
import { toast } from '@/hooks/use-toast';
import { 
  Search, Camera, BarChart3, FileText, CheckCircle2, XCircle, 
  ArrowRight, Clock, Package, AlertTriangle, Printer, Download
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

const mockInventoryItems: InventoryItem[] = [
  { id: 1, product: 'Ardei Kapia', stockScriptic: 18, stockReal: 17, unit: 'kg', difference: -1, differenceValue: -12.5, status: 'counted' },
  { id: 2, product: 'Carne vită', stockScriptic: 5, stockReal: 2.5, unit: 'kg', difference: -2.5, differenceValue: -87.5, status: 'counted' },
  { id: 3, product: 'Mozzarella', stockScriptic: 9, stockReal: 8.5, unit: 'kg', difference: -0.5, differenceValue: -29, status: 'counted' },
  { id: 4, product: 'Gyros pui', stockScriptic: 305, stockReal: 302.7, unit: 'kg', difference: -2.3, differenceValue: -73.6, status: 'counted' },
  { id: 5, product: 'Pâine Pita', stockScriptic: 200, stockReal: null, unit: 'buc', difference: null, differenceValue: null, status: 'pending' },
  { id: 6, product: 'Sos Tzatziki', stockScriptic: 15, stockReal: null, unit: 'L', difference: null, differenceValue: null, status: 'pending' },
];

const inventoryHistory: InventoryHistory[] = [
  { id: 1, date: '15.12.2024 14:30', location: 'Toate locațiile', user: 'Ion Popescu', totalProducts: 156, differences: 12, differenceValue: -234, status: 'completed' },
  { id: 2, date: '01.12.2024 10:00', location: 'Bucătărie', user: 'Maria Ionescu', totalProducts: 45, differences: 5, differenceValue: +120, status: 'completed' },
  { id: 3, date: '15.11.2024 16:45', location: 'Bar', user: 'Andrei Marin', totalProducts: 22, differences: 3, differenceValue: -89, status: 'completed' },
];

export const InventoryManager: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showDifferenceReport, setShowDifferenceReport] = useState(false);
  const [currentInventoryLocation, setCurrentInventoryLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingCount = inventoryItems.filter(i => i.status === 'pending').length;
  const countedCount = inventoryItems.filter(i => i.status === 'counted').length;
  const totalDifference = inventoryItems
    .filter(i => i.differenceValue !== null)
    .reduce((sum, i) => sum + (i.differenceValue || 0), 0);

  const handleStartInventory = () => {
    toast({ title: "Inventar pornit", description: `Inventar pentru ${currentInventoryLocation || 'toate locațiile'}` });
    setShowInventoryDialog(false);
  };

  const handleScanProduct = () => {
    toast({ title: "Produs scanat", description: "Cod bare: 5941234567890" });
    setShowScanDialog(false);
  };

  const updateRealStock = (id: number, value: number) => {
    setInventoryItems(items => items.map(item => {
      if (item.id === id) {
        const diff = value - item.stockScriptic;
        return {
          ...item,
          stockReal: value,
          difference: diff,
          differenceValue: diff * 12.5, // mock price
          status: 'counted' as const
        };
      }
      return item;
    }));
  };

  const filteredItems = inventoryItems.filter(i => 
    i.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current" className="gap-2">
            Inventar Curent
            {pendingCount > 0 && <Badge variant="outline">{pendingCount} pending</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">Istoric</TabsTrigger>
          <TabsTrigger value="differences">Raport Diferențe</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Produse</p>
                    <p className="text-3xl font-bold">{inventoryItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/10">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">În așteptare</p>
                    <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Numărate</p>
                    <p className="text-3xl font-bold text-green-600">{countedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={totalDifference < 0 ? "bg-destructive/5 border-destructive/30" : "bg-green-500/5 border-green-500/30"}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${totalDifference < 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                    <AlertTriangle className={`h-6 w-6 ${totalDifference < 0 ? 'text-destructive' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diferență Totală</p>
                    <p className={`text-3xl font-bold ${totalDifference < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {totalDifference > 0 ? '+' : ''}{totalDifference.toFixed(0)} RON
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Row */}
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

            <Button variant="outline" onClick={() => setShowScanDialog(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Scanează Produs
            </Button>

            <Button onClick={() => setShowInventoryDialog(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Inventar Nou
            </Button>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progres Inventar</span>
                <span className="text-sm text-muted-foreground">
                  {countedCount} / {inventoryItems.length} produse
                </span>
              </div>
              <Progress value={(countedCount / inventoryItems.length) * 100} className="h-3" />
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produs</TableHead>
                    <TableHead className="text-center">Stoc Scriptic</TableHead>
                    <TableHead className="text-center">Stoc Real</TableHead>
                    <TableHead className="text-center">Diferență</TableHead>
                    <TableHead className="text-center">Valoare Dif.</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell className="text-center">{item.stockScriptic} {item.unit}</TableCell>
                      <TableCell className="text-center">
                        <Input 
                          type="number"
                          className="w-24 mx-auto text-center"
                          placeholder="—"
                          value={item.stockReal ?? ''}
                          onChange={(e) => updateRealStock(item.id, parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {item.difference !== null ? (
                          <span className={item.difference < 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                            {item.difference > 0 ? '+' : ''}{item.difference} {item.unit}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.differenceValue !== null ? (
                          <span className={item.differenceValue < 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                            {item.differenceValue > 0 ? '+' : ''}{item.differenceValue.toFixed(0)} RON
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={item.status === 'counted' ? 'default' : 'outline'}
                          className={item.status === 'counted' ? 'bg-green-500' : ''}
                        >
                          {item.status === 'counted' ? 'Numărat' : 'În așteptare'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowDifferenceReport(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generează Raport
            </Button>
            <Button>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalizează Inventar
            </Button>
          </div>
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

        <TabsContent value="differences" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Raport Diferențe</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
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
                        <h4 className="font-medium">{item.product}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">Scriptic: {item.stockScriptic} {item.unit}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Real: {item.stockReal} {item.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${(item.difference || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {(item.difference || 0) > 0 ? '+' : ''}{item.difference} {item.unit}
                        </p>
                        <p className={`text-sm ${(item.differenceValue || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {(item.differenceValue || 0) > 0 ? '+' : ''}{item.differenceValue?.toFixed(0)} RON
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

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
              <Input placeholder="Ex: 5941234567890" />
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
    </div>
  );
};

export default InventoryManager;
