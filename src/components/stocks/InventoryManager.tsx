import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2, Package, Save, Search } from 'lucide-react';
import { storageApi, type InventoryApi, type InventoryCountApi, type StorageZoneApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type DraftCounts = Record<number, string>;

export const InventoryManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryApi[]>([]);
  const [zones, setZones] = useState<StorageZoneApi[]>([]);
  const [counts, setCounts] = useState<InventoryCountApi[]>([]);
  const [draftCounts, setDraftCounts] = useState<DraftCounts>({});
  const [search, setSearch] = useState('');
  const [zoneId, setZoneId] = useState<number | 'all'>('all');
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, zonesList, countRows] = await Promise.all([
        storageApi.getInventory(),
        storageApi.getZones(),
        storageApi.getInventoryCounts(),
      ]);
      setInventory(inv);
      setZones(zonesList);
      setCounts(countRows);
      const initialDrafts: DraftCounts = {};
      for (const row of inv) initialDrafts[row.id] = String(Number(row.quantity));
      setDraftCounts(initialDrafts);
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((row) => {
      const matchSearch = row.menuItem?.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
      const matchZone = zoneId === 'all' || row.zoneId === zoneId;
      return matchSearch && matchZone;
    });
  }, [inventory, search, zoneId]);

  const totalDiff = useMemo(
    () => counts.reduce((sum, c) => sum + Number(c.differenceQuantity || 0), 0),
    [counts],
  );

  const saveCount = async (row: InventoryApi) => {
    const raw = draftCounts[row.id] ?? '';
    const counted = Number(raw);
    if (!Number.isFinite(counted) || counted < 0) {
      toast({ title: 'Valoare invalidă', description: 'Cantitatea numărată trebuie să fie >= 0.', variant: 'destructive' });
      return;
    }
    setSavingId(row.id);
    try {
      await storageApi.recordInventoryCount({
        inventoryId: row.id,
        countedQuantity: counted,
        countedBy: 'Inventar UI',
      });
      toast({ title: 'Inventar salvat', description: `${row.menuItem?.name ?? 'Produs'} actualizat.` });
      await fetchData();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
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
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Inventar Curent</TabsTrigger>
          <TabsTrigger value="history">Istoric Numărări</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Rânduri inventar</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Zone</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Diferență totală (cantitate)</p>
                <p className={`text-2xl font-bold ${totalDiff < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(3)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Caută produs..." />
            </div>
            <div className="w-64">
              <Label className="text-xs mb-1 block">Filtru zonă</Label>
              <SearchableSelect
                value={zoneId === 'all' ? 'all' : String(zoneId)}
                placeholder="Toate zonele"
                options={[
                  { value: 'all', label: 'Toate zonele' },
                  ...zones.map((z) => ({ value: String(z.id), label: z.name })),
                ]}
                onValueChange={(v) => setZoneId(v === 'all' ? 'all' : parseInt(v, 10))}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Numărare inventar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produs</TableHead>
                    <TableHead>Zonă</TableHead>
                    <TableHead>Scriptic</TableHead>
                    <TableHead>Numărat</TableHead>
                    <TableHead>Unitate</TableHead>
                    <TableHead>Acțiune</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.menuItem?.name ?? `Produs #${row.menuItemId}`}</TableCell>
                      <TableCell>{row.zone?.name ?? `Zonă #${row.zoneId}`}</TableCell>
                      <TableCell>{Number(row.quantity).toFixed(3)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          value={draftCounts[row.id] ?? ''}
                          onChange={(e) => setDraftCounts((p) => ({ ...p, [row.id]: e.target.value }))}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => void saveCount(row)} disabled={savingId === row.id}>
                          {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                          Salvează
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nu există date de inventar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Istoric numărări (inventory_counts)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {counts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  Nu există înregistrări de inventar.
                </div>
              ) : (
                counts.slice(0, 100).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{c.inventory?.menuItem?.name ?? `Produs #${c.inventory?.menuItemId ?? '-'}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.inventory?.zone?.name ?? '-'} • {new Date(c.countedAt).toLocaleString('ro-RO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Scriptic: {Number(c.scripticQuantity).toFixed(3)}</p>
                      <p className="text-sm">Numărat: {Number(c.countedQuantity).toFixed(3)}</p>
                      <Badge variant={Number(c.differenceQuantity) === 0 ? 'secondary' : Number(c.differenceQuantity) < 0 ? 'destructive' : 'default'}>
                        Dif: {Number(c.differenceQuantity) > 0 ? '+' : ''}{Number(c.differenceQuantity).toFixed(3)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManager;

