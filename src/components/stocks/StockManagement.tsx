import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from '@/hooks/use-toast';
import { menuApi, storageApi, imageSrc, type MenuItemApi, type StorageZoneApi, type InventoryApi, type TransferRequestApi } from '@/lib/api';
import {
  Search, Plus, Package, Warehouse, ChefHat, Wine, Edit, ArrowRightLeft,
  CheckCircle2, XCircle, Loader2
} from 'lucide-react';

const ZONE_ICONS: Record<string, React.ElementType> = {
  'Depozit': Warehouse,
  'Bucătărie': ChefHat,
  'Bar': Wine,
};

export const StockManagement: React.FC = () => {
  const [menuProducts, setMenuProducts] = useState<MenuItemApi[]>([]);
  const [zones, setZones] = useState<StorageZoneApi[]>([]);
  const [inventory, setInventory] = useState<InventoryApi[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequestApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toate');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productForm, setProductForm] = useState({ menuItemId: 0, zoneId: 0, quantity: 0, unit: 'buc' });
  const [transferForm, setTransferForm] = useState({ fromZoneId: 0, toZoneId: 0, menuItemId: 0, quantity: 0, unit: 'buc' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [items, zonesList, inv, transfers] = await Promise.all([
        menuApi.getItems(),
        storageApi.getZones(),
        storageApi.getInventory(),
        storageApi.getTransfers('pending'),
      ]);
      setMenuProducts(items);
      setZones(zonesList);
      setInventory(inv);
      setPendingTransfers(transfers);
    } catch (e) {
      toast({ title: 'Eroare la încărcare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(menuProducts.map((p) => p.category));
    return ['Toate', ...Array.from(cats).sort()];
  }, [menuProducts]);

  const inventoryByProductZone = useMemo(() => {
    const map = new Map<string, number>();
    inventory.forEach((inv) => {
      map.set(`${inv.menuItemId}-${inv.zoneId}`, Number(inv.quantity));
    });
    return map;
  }, [inventory]);

  const filteredProducts = useMemo(() => {
    return menuProducts.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Toate' || p.category === selectedCategory;
      if (selectedZoneId === 'all') return matchSearch && matchCategory;
      const qty = inventoryByProductZone.get(`${p.id}-${selectedZoneId}`) ?? 0;
      return matchSearch && matchCategory && qty > 0;
    });
  }, [menuProducts, searchTerm, selectedCategory, selectedZoneId, inventoryByProductZone]);

  const getQty = (menuItemId: number, zoneId: number) => inventoryByProductZone.get(`${menuItemId}-${zoneId}`) ?? 0;

  const handleSaveProduct = async () => {
    if (!productForm.menuItemId || !productForm.zoneId) {
      toast({ title: 'Selectează produsul și zona', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await storageApi.upsertInventory({
        menuItemId: productForm.menuItemId,
        zoneId: productForm.zoneId,
        quantity: productForm.quantity,
        unit: productForm.unit,
      });
      toast({ title: 'Stoc salvat', description: 'Cantitatea a fost actualizată.' });
      setShowProductDialog(false);
      setProductForm({ menuItemId: 0, zoneId: 0, quantity: 0, unit: 'buc' });
      fetchData();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.fromZoneId || !transferForm.toZoneId || !transferForm.menuItemId || transferForm.quantity <= 0) {
      toast({ title: 'Completează toate câmpurile și cantitatea', variant: 'destructive' });
      return;
    }
    if (transferForm.fromZoneId === transferForm.toZoneId) {
      toast({ title: 'Alege zone diferite', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await storageApi.createTransfer({
        fromZoneId: transferForm.fromZoneId,
        toZoneId: transferForm.toZoneId,
        menuItemId: transferForm.menuItemId,
        quantity: transferForm.quantity,
        unit: transferForm.unit,
      });
      toast({ title: 'Transfer solicitat', description: 'Cererea a fost trimisă pentru aprobare.' });
      setShowTransferDialog(false);
      setTransferForm({ fromZoneId: 0, toZoneId: 0, menuItemId: 0, quantity: 0, unit: 'buc' });
      fetchData();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await storageApi.approveTransfer(id);
      toast({ title: 'Transfer aprobat', description: 'Stocurile au fost actualizate.' });
      fetchData();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await storageApi.rejectTransfer(id);
      toast({ title: 'Transfer respins' });
      fetchData();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const openProductDialog = (menuItem?: MenuItemApi, zoneId?: number) => {
    if (menuItem && zoneId) {
      setProductForm({
        menuItemId: menuItem.id,
        zoneId,
        quantity: getQty(menuItem.id, zoneId),
        unit: 'buc',
      });
    } else {
      setProductForm({
        menuItemId: menuProducts[0]?.id ?? 0,
        zoneId: zones[0]?.id ?? 0,
        quantity: 0,
        unit: 'buc',
      });
    }
    setShowProductDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {zones.length === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <p className="text-sm">
              <strong>Zone depozit lipsă.</strong> Adaugă zone (Depozit, Bucătărie, Bar) din <strong>Admin → Zone depozit</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedZoneId === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedZoneId('all')}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Toate
          </Button>
          {zones.map((z) => {
            const Icon = ZONE_ICONS[z.name] ?? Warehouse;
            const count = inventory.filter((i) => i.zoneId === z.id).length;
            return (
              <Button
                key={z.id}
                variant={selectedZoneId === z.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedZoneId(z.id)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {z.name}
                <Badge variant={selectedZoneId === z.id ? 'secondary' : 'outline'} className="ml-1">{count}</Badge>
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant={showApprovalDialog ? 'default' : 'outline'} onClick={() => setShowApprovalDialog(true)} className="relative">
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
          <Button onClick={() => openProductDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Adaugă stoc / Editează
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută produs..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="rounded-none">Tabel</Button>
          <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="rounded-none">Carduri</Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Categorie</TableHead>
                  {zones.map((z) => (
                    <TableHead key={z.id}>{z.name}</TableHead>
                  ))}
                  <TableHead className="w-24">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img src={imageSrc(product.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                    {zones.map((z) => {
                      const qty = getQty(product.id, z.id);
                      return (
                        <TableCell key={z.id} className="font-medium">
                          {qty > 0 ? `${qty} buc` : '—'}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openProductDialog(product, zones[0]?.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square rounded-xl bg-muted flex items-center justify-center mb-3 overflow-hidden">
                  {product.image ? (
                    <img src={imageSrc(product.image)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                <div className="space-y-1 text-sm">
                  {zones.map((z) => {
                    const qty = getQty(product.id, z.id);
                    return (
                      <div key={z.id} className="flex justify-between">
                        <span className="text-muted-foreground">{z.name}</span>
                        <span className="font-medium">{qty > 0 ? `${qty} buc` : '—'}</span>
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => openProductDialog(product, zones[0]?.id)}>
                  <Edit className="h-3 w-3 mr-1" /> Editează stoc
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nu s-au găsit produse. Adaugă produse din tab-ul Meniu.</p>
        </div>
      )}

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă / Editează stoc</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produs (din meniu)</Label>
              <SearchableSelect
                value={productForm.menuItemId ? String(productForm.menuItemId) : ''}
                placeholder="Selectează produs"
                searchPlaceholder="Caută produs..."
                options={menuProducts.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                  keywords: `${p.name} ${p.category ?? ''}`,
                }))}
                onValueChange={(v) => setProductForm((p) => ({ ...p, menuItemId: parseInt(v, 10) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Zonă</Label>
              <SearchableSelect
                value={productForm.zoneId ? String(productForm.zoneId) : ''}
                placeholder="Selectează zona"
                searchPlaceholder="Caută zonă..."
                options={zones.map((z) => ({
                  value: String(z.id),
                  label: z.name,
                  keywords: `${z.name} ${z.code ?? ''}`,
                }))}
                onValueChange={(v) => setProductForm((p) => ({ ...p, zoneId: parseInt(v, 10) }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantitate</Label>
                <Input
                  type="number"
                  min={0}
                  value={productForm.quantity}
                  onChange={(e) => setProductForm((p) => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unitate</Label>
                <SearchableSelect
                  value={productForm.unit}
                  placeholder="Selectează unitatea"
                  searchPlaceholder="Caută unitate..."
                  options={[
                    { value: 'buc', label: 'buc' },
                    { value: 'kg', label: 'kg' },
                    { value: 'L', label: 'L' },
                  ]}
                  onValueChange={(v) => setProductForm((p) => ({ ...p, unit: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Anulează</Button>
            <Button onClick={handleSaveProduct} disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer stoc (trimis în aprobări)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produs</Label>
              <SearchableSelect
                value={transferForm.menuItemId ? String(transferForm.menuItemId) : ''}
                placeholder="Selectează produs"
                searchPlaceholder="Caută produs..."
                options={menuProducts.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                  keywords: `${p.name} ${p.category ?? ''}`,
                }))}
                onValueChange={(v) => setTransferForm((p) => ({ ...p, menuItemId: parseInt(v, 10) }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Din zonă</Label>
                <Select
                  value={String(transferForm.fromZoneId || '')}
                  onValueChange={(v) => setTransferForm((p) => ({ ...p, fromZoneId: parseInt(v, 10) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sursă" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>În zonă</Label>
                <Select
                  value={String(transferForm.toZoneId || '')}
                  onValueChange={(v) => setTransferForm((p) => ({ ...p, toZoneId: parseInt(v, 10) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Destinație" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cantitate</Label>
              <Input
                type="number"
                min={0.001}
                value={transferForm.quantity || ''}
                onChange={(e) => setTransferForm((p) => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Anulează</Button>
            <Button onClick={handleTransfer} disabled={saving}>{saving ? 'Se trimite...' : 'Solicită transfer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Aprobări transferuri</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nu există cereri de transfer în așteptare.</div>
            ) : (
              pendingTransfers.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.menuItem?.name ?? `Produs #${t.menuItemId}`}</span>
                          <Badge variant="outline">{t.quantity} {t.unit}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.fromZone?.name ?? ''} → {t.toZone?.name ?? ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(t.requestedAt).toLocaleString('ro')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleReject(t.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> Respinge
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(t.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobă
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
