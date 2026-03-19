import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { menuApi, storageApi, tablesApi, type KdsStationApi, type KdsStationType, type StorageZoneApi, type TableApi } from '@/lib/api';
import {
  Settings,
  MapPin,
  Building2,
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  Check,
  X,
  ChevronRight,
  Globe,
  Clock,
  Phone,
  Mail,
  DollarSign,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Key,
  UserPlus,
  Search,
  LayoutGrid,
  Monitor,
  Smartphone,
  Tablet,
  Image,
  Upload,
  Palette,
  Languages,
  Store,
  Truck,
  Pizza,
  Flame,
  Salad,
  CirclePlus,
  GripVertical,
  Move,
  Warehouse
} from 'lucide-react';

// Mock data pentru locații
const mockLocations = [
  { id: 1, name: 'Restaurant Central', address: 'Str. Victoriei 25, București', phone: '+40 21 123 4567', email: 'central@restaurant.ro', status: 'active', tables: 24, employees: 15 },
  { id: 2, name: 'Restaurant Mall', address: 'Mall Promenada, Etaj 2', phone: '+40 21 234 5678', email: 'mall@restaurant.ro', status: 'active', tables: 18, employees: 12 },
  { id: 3, name: 'Restaurant Parc', address: 'Bd. Unirii 100, București', phone: '+40 21 345 6789', email: 'parc@restaurant.ro', status: 'inactive', tables: 30, employees: 0 },
];

// Mock data pentru meniuri per locație
const mockMenusPerLocation = [
  { locationId: 1, menuName: 'Meniu Principal', items: 45, active: true },
  { locationId: 1, menuName: 'Meniu Prânz', items: 12, active: true },
  { locationId: 1, menuName: 'Meniu Seară', items: 28, active: true },
  { locationId: 2, menuName: 'Meniu Principal', items: 38, active: true },
  { locationId: 2, menuName: 'Meniu Express', items: 15, active: true },
];

// Mock data pentru utilizatori
const mockUsers = [
  { id: 1, name: 'Admin Principal', email: 'admin@restaurant.ro', role: 'admin', location: 'Toate', status: 'active', lastLogin: '2024-01-15 14:30' },
  { id: 2, name: 'Maria Ionescu', email: 'maria@restaurant.ro', role: 'manager', location: 'Restaurant Central', status: 'active', lastLogin: '2024-01-15 10:15' },
  { id: 3, name: 'Ion Popescu', email: 'ion@restaurant.ro', role: 'waiter', location: 'Restaurant Central', status: 'active', lastLogin: '2024-01-14 18:00' },
  { id: 4, name: 'Ana Dumitrescu', email: 'ana@restaurant.ro', role: 'kitchen', location: 'Restaurant Mall', status: 'active', lastLogin: '2024-01-15 08:00' },
  { id: 5, name: 'Mihai Stoica', email: 'mihai@restaurant.ro', role: 'waiter', location: 'Restaurant Mall', status: 'inactive', lastLogin: '2024-01-10 12:00' },
];

const roles = [
  { id: 'admin', name: 'Administrator', permissions: ['all'] },
  { id: 'manager', name: 'Manager', permissions: ['pos', 'reports', 'stocks', 'employees'] },
  { id: 'waiter', name: 'Ospătar', permissions: ['pos'] },
  { id: 'kitchen', name: 'Bucătărie', permissions: ['kds'] },
  { id: 'cashier', name: 'Casier', permissions: ['pos', 'reports'] },
];

const TABLE_ZONE_PRESETS = ['Interior', 'Terasă', 'Bar'] as const;

// Mock data pentru disponibilitate meniu
const mockMenuAvailability = [
  { id: 1, name: 'Pizza Margherita', restaurant: true, kiosk: true, app: true, delivery: true },
  { id: 2, name: 'Paste Carbonara', restaurant: true, kiosk: true, app: true, delivery: false },
  { id: 3, name: 'Salată Caesar', restaurant: true, kiosk: false, app: true, delivery: true },
  { id: 4, name: 'Ciorbă de burtă', restaurant: true, kiosk: true, app: false, delivery: false },
  { id: 5, name: 'Mici (10 buc)', restaurant: true, kiosk: true, app: true, delivery: true },
  { id: 6, name: 'Cola 330ml', restaurant: true, kiosk: true, app: true, delivery: true },
];

const KDS_STATION_TYPES: { value: KdsStationType; label: string }[] = [
  { value: 'soups', label: 'Supe & Ciorbe' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'grill', label: 'Grill & Mâncare Gătită' },
  { value: 'giros', label: 'Giros & Doner' },
];
const KDS_ICONS = ['🍲', '🍕', '🔥', '🥙', '🥗', '🍰', '🍹'];

// Mock data pentru ingrediente extra
const mockExtraIngredients = [
  { id: 1, name: 'Brânză extra', price: 5, category: 'Lactate' },
  { id: 2, name: 'Bacon', price: 8, category: 'Carne' },
  { id: 3, name: 'Ciuperci', price: 4, category: 'Legume' },
  { id: 4, name: 'Ou', price: 3, category: 'Lactate' },
  { id: 5, name: 'Ardei iute', price: 2, category: 'Legume' },
  { id: 6, name: 'Sos extra', price: 3, category: 'Sosuri' },
];

export const AdminConfigModule: React.FC = () => {
  const [configTab, setConfigTab] = useState('general');
  const [locations, setLocations] = useState(mockLocations);
  const [users, setUsers] = useState(mockUsers);
  /** Mese din API (GET /tables) – tab Hartă Mese */
  const [dbTables, setDbTables] = useState<TableApi[]>([]);
  const [dbTablesLoading, setDbTablesLoading] = useState(false);
  const [menuAvailability, setMenuAvailability] = useState(mockMenuAvailability);
  const [kdsStations, setKdsStations] = useState<KdsStationApi[]>([]);
  const [kdsLoading, setKdsLoading] = useState(false);
  const [showAddKds, setShowAddKds] = useState(false);
  const [editingKds, setEditingKds] = useState<KdsStationApi | null>(null);
  const [kdsForm, setKdsForm] = useState({ name: '', type: 'soups' as KdsStationType, icon: '🍲', color: 'bg-amber-500' });
  const [extraIngredients, setExtraIngredients] = useState(mockExtraIngredients);
  const [searchUser, setSearchUser] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [tableForm, setTableForm] = useState({
    number: '',
    seats: '4',
    zone: 'Interior',
    shape: 'square' as 'round' | 'square' | 'rectangle',
    status: 'free' as 'free' | 'occupied' | 'reserved',
    posX: '50',
    posY: '50',
  });
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [storageZones, setStorageZones] = useState<StorageZoneApi[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [editingZone, setEditingZone] = useState<StorageZoneApi | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', code: '' });
  const [selectedLocation, setSelectedLocation] = useState<typeof mockLocations[0] | null>(null);
  const [kioskTab, setKioskTab] = useState<'availability' | 'steps' | 'appearance'>('availability');

  // Setări kiosk
  const [kioskSettings, setKioskSettings] = useState({
    welcomeMessage: 'Bine ați venit!',
    defaultLanguage: 'ro',
    primaryColor: '#3B82F6',
  });

  // Setări generale
  const [settings, setSettings] = useState({
    restaurantName: 'Restaurant Demo',
    currency: 'RON',
    timezone: 'Europe/Bucharest',
    language: 'ro',
    taxRate: 19,
    serviceCharge: 0,
    autoLogout: 30,
    printReceipts: true,
    soundNotifications: true,
    darkMode: false,
  });

  const fetchKdsStations = useCallback(async () => {
    setKdsLoading(true);
    try {
      const list = await menuApi.getKdsStations();
      setKdsStations(list);
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca stațiile KDS.', variant: 'destructive' });
    } finally {
      setKdsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKdsStations();
  }, [fetchKdsStations]);

  const fetchZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const list = await storageApi.getZones();
      setStorageZones(list);
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca zonele.', variant: 'destructive' });
    } finally {
      setZonesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const fetchDbTables = useCallback(async () => {
    setDbTablesLoading(true);
    try {
      const list = await tablesApi.getTables();
      setDbTables(list);
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca mesele.', variant: 'destructive' });
    } finally {
      setDbTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (configTab === 'tables') {
      fetchDbTables();
    }
  }, [configTab, fetchDbTables]);

  const tableDisplayName = (t: TableApi) => `M${t.number}`;

  const tableZoneLabel = (t: TableApi) => (t.zone?.trim() ? t.zone.trim() : 'Fără zonă');

  const zonesForMap = useMemo(() => {
    const fromData = dbTables.map((t) => (t.zone?.trim() ? t.zone.trim() : 'Fără zonă'));
    const presets = [...TABLE_ZONE_PRESETS] as string[];
    const extra = [...new Set(fromData)].filter((z) => !presets.includes(z)).sort();
    return [...presets, ...extra];
  }, [dbTables]);

  const openAddTableDialog = () => {
    setEditingTableId(null);
    const maxNum = dbTables.length ? Math.max(...dbTables.map((t) => t.number), 0) : 0;
    setTableForm({
      number: String(maxNum + 1),
      seats: '4',
      zone: 'Interior',
      shape: 'square',
      status: 'free',
      posX: '50',
      posY: '50',
    });
    setShowAddTable(true);
  };

  const openEditTableDialog = (t: TableApi) => {
    setEditingTableId(t.id);
    const pos = t.position ?? { x: 50, y: 50 };
    setTableForm({
      number: String(t.number),
      seats: String(t.seats),
      zone: t.zone?.trim() || 'Fără zonă',
      shape: t.shape,
      status: t.status,
      posX: String(pos.x),
      posY: String(pos.y),
    });
    setShowAddTable(true);
  };

  const handleSaveTable = async () => {
    const num = parseInt(tableForm.number, 10);
    const seats = parseInt(tableForm.seats, 10);
    if (Number.isNaN(num) || num < 1) {
      toast({ title: 'Eroare', description: 'Numărul mesei trebuie să fie un număr valid ≥ 1.', variant: 'destructive' });
      return;
    }
    if (Number.isNaN(seats) || seats < 1) {
      toast({ title: 'Eroare', description: 'Numărul de locuri trebuie să fie valid.', variant: 'destructive' });
      return;
    }
    const px = parseFloat(tableForm.posX);
    const py = parseFloat(tableForm.posY);
    const position =
      !Number.isNaN(px) && !Number.isNaN(py) ? { x: Math.max(0, Math.min(100, px)), y: Math.max(0, Math.min(100, py)) } : undefined;
    try {
      if (editingTableId) {
        await tablesApi.updateTable(editingTableId, {
          number: num,
          seats,
          zone: tableForm.zone.trim() === 'Fără zonă' ? '' : tableForm.zone.trim(),
          shape: tableForm.shape,
          status: tableForm.status,
          position,
        });
        toast({ title: 'Masă actualizată', description: 'Modificările au fost salvate.' });
      } else {
        await tablesApi.createTable({
          number: num,
          seats,
          zone: tableForm.zone.trim() === 'Fără zonă' ? undefined : tableForm.zone.trim() || undefined,
          shape: tableForm.shape,
          status: tableForm.status,
          position,
        });
        toast({ title: 'Masă adăugată', description: 'Masa a fost creată.' });
      }
      setShowAddTable(false);
      setEditingTableId(null);
      fetchDbTables();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteTable = async (t: TableApi) => {
    if (!confirm(`Ștergi masa ${tableDisplayName(t)}?`)) return;
    try {
      await tablesApi.deleteTable(t.id);
      toast({ title: 'Masă ștearsă', description: 'Masa a fost eliminată.' });
      fetchDbTables();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const openAddZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', code: '' });
    setShowAddZone(true);
  };

  const openEditZone = (zone: StorageZoneApi) => {
    setEditingZone(zone);
    setZoneForm({ name: zone.name, code: zone.code ?? '' });
    setShowAddZone(true);
  };

  const handleSaveZone = async () => {
    if (!zoneForm.name.trim()) {
      toast({ title: 'Eroare', description: 'Numele zonei este obligatoriu.', variant: 'destructive' });
      return;
    }
    try {
      if (editingZone) {
        await storageApi.updateZone(editingZone.id, { name: zoneForm.name.trim(), code: zoneForm.code.trim() || undefined });
        toast({ title: 'Zonă actualizată', description: 'Zona a fost modificată.' });
      } else {
        await storageApi.createZone({ name: zoneForm.name.trim(), code: zoneForm.code.trim() || undefined });
        toast({ title: 'Zonă adăugată', description: 'Noua zonă a fost creată.' });
      }
      setShowAddZone(false);
      fetchZones();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteZone = async (zone: StorageZoneApi) => {
    if (!confirm(`Ștergi zona „${zone.name}"? Stocurile și transferurile asociate vor fi afectate.`)) return;
    try {
      await storageApi.deleteZone(zone.id);
      toast({ title: 'Zonă ștearsă', description: 'Zona a fost eliminată.' });
      fetchZones();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const openAddKds = () => {
    setEditingKds(null);
    setKdsForm({ name: '', type: 'soups', icon: '🍲', color: 'bg-amber-500' });
    setShowAddKds(true);
  };

  const openEditKds = (station: KdsStationApi) => {
    setEditingKds(station);
    setKdsForm({
      name: station.name,
      type: station.type,
      icon: station.icon ?? '🍲',
      color: station.color ?? 'bg-amber-500',
    });
    setShowAddKds(true);
  };

  const handleSaveKds = async () => {
    if (!kdsForm.name.trim()) {
      toast({ title: 'Eroare', description: 'Numele stației este obligatoriu.', variant: 'destructive' });
      return;
    }
    try {
      if (editingKds) {
        await menuApi.updateKdsStation(editingKds.id, {
          name: kdsForm.name.trim(),
          type: kdsForm.type,
          icon: kdsForm.icon || undefined,
          color: kdsForm.color || undefined,
        });
        toast({ title: 'Stație actualizată', description: 'Stația KDS a fost modificată.' });
      } else {
        await menuApi.createKdsStation({
          name: kdsForm.name.trim(),
          type: kdsForm.type,
          icon: kdsForm.icon || undefined,
          color: kdsForm.color || undefined,
        });
        toast({ title: 'Stație adăugată', description: 'Noua stație KDS a fost creată.' });
      }
      setShowAddKds(false);
      fetchKdsStations();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteKds = async (station: KdsStationApi) => {
    if (!confirm(`Ștergi stația „${station.name}"? Produsele asociate nu vor mai avea stație validă.`)) return;
    try {
      await menuApi.deleteKdsStation(station.id);
      toast({ title: 'Stație ștearsă', description: 'Stația KDS a fost eliminată.' });
      fetchKdsStations();
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleSaveSettings = () => {
    toast({ title: "Setări salvate", description: "Configurațiile au fost actualizate cu succes." });
  };

  const handleDeleteLocation = (id: number) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    toast({ title: "Locație ștearsă", description: "Locația a fost eliminată din sistem." });
  };

  const handleToggleUserStatus = (id: number) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  const toggleMenuChannel = (productId: number, channel: 'restaurant' | 'kiosk' | 'app' | 'delivery') => {
    setMenuAvailability(prev => prev.map(item => 
      item.id === productId ? { ...item, [channel]: !item[channel] } : item
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin & Configurare</h1>
              <p className="text-muted-foreground">Setări generale, locații și utilizatori</p>
            </div>
          </div>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Salvează Tot
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Tabs value={configTab} onValueChange={setConfigTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="tables" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Hartă Mese
              </TabsTrigger>
              <TabsTrigger value="kiosk" className="gap-2">
                <Monitor className="h-4 w-4" />
                Kiosk & App
              </TabsTrigger>
              <TabsTrigger value="kds" className="gap-2">
                <Flame className="h-4 w-4" />
                KDS
              </TabsTrigger>
              <TabsTrigger value="extras" className="gap-2">
                <CirclePlus className="h-4 w-4" />
                Extras
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="h-4 w-4" />
                Locații
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Utilizatori
              </TabsTrigger>
              <TabsTrigger value="zones" className="gap-2">
                <Warehouse className="h-4 w-4" />
                Zone depozit
              </TabsTrigger>
            </TabsList>

            {/* Setări Generale */}
            <TabsContent value="general" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informații Restaurant */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Informații Restaurant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nume Restaurant</Label>
                      <Input 
                        value={settings.restaurantName}
                        onChange={(e) => setSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monedă</Label>
                        <Select value={settings.currency} onValueChange={(v) => setSettings(prev => ({ ...prev, currency: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RON">RON (Lei)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                            <SelectItem value="USD">USD (Dollar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Limbă</Label>
                        <Select value={settings.language} onValueChange={(v) => setSettings(prev => ({ ...prev, language: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ro">Română</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fus Orar</Label>
                      <Select value={settings.timezone} onValueChange={(v) => setSettings(prev => ({ ...prev, timezone: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Bucharest">Europe/București (GMT+2)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="America/New_York">America/New York (GMT-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Setări Fiscale */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-success" />
                      Setări Fiscale
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rata TVA (%)</Label>
                      <Input 
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa Serviciu (%)</Label>
                      <Input 
                        type="number"
                        value={settings.serviceCharge}
                        onChange={(e) => setSettings(prev => ({ ...prev, serviceCharge: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Printare Automată Bon</Label>
                          <p className="text-xs text-muted-foreground">Printează bonul la finalizarea comenzii</p>
                        </div>
                        <Switch 
                          checked={settings.printReceipts}
                          onCheckedChange={(v) => setSettings(prev => ({ ...prev, printReceipts: v }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notificări Sonore</Label>
                          <p className="text-xs text-muted-foreground">Sunete pentru comenzi noi</p>
                        </div>
                        <Switch 
                          checked={settings.soundNotifications}
                          onCheckedChange={(v) => setSettings(prev => ({ ...prev, soundNotifications: v }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Setări Securitate */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-warning" />
                      Securitate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Auto-Logout (minute)</Label>
                        <Input 
                          type="number"
                          value={settings.autoLogout}
                          onChange={(e) => setSettings(prev => ({ ...prev, autoLogout: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">0 = dezactivat</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Autentificare 2FA</Label>
                        <Button variant="outline" className="w-full">
                          <Key className="h-4 w-4 mr-2" />
                          Configurează 2FA
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Jurnal Activitate</Label>
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Vezi Loguri
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Locații */}
            <TabsContent value="locations" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Locații Restaurant</h3>
                  <p className="text-sm text-muted-foreground">Gestionați toate locațiile din rețea</p>
                </div>
                <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă Locație
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Adaugă Locație Nouă</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nume Locație</Label>
                        <Input placeholder="Ex: Restaurant Central" />
                      </div>
                      <div className="space-y-2">
                        <Label>Adresă</Label>
                        <Input placeholder="Str. Exemplu 123, Oraș" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Telefon</Label>
                          <Input placeholder="+40 21 123 4567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input placeholder="locatie@restaurant.ro" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Număr Mese</Label>
                        <Input type="number" placeholder="20" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddLocation(false)}>Anulează</Button>
                      <Button onClick={() => {
                        setShowAddLocation(false);
                        toast({ title: "Locație adăugată", description: "Noua locație a fost creată cu succes." });
                      }}>
                        <Check className="h-4 w-4 mr-2" />
                        Salvează
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <Card key={location.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{location.name}</h4>
                            <Badge variant={location.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                              {location.status === 'active' ? 'Activ' : 'Inactiv'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{location.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{location.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{location.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                        <div className="text-center flex-1">
                          <p className="text-xl font-bold text-foreground">{location.tables}</p>
                          <p className="text-xs text-muted-foreground">Mese</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-xl font-bold text-foreground">{location.employees}</p>
                          <p className="text-xs text-muted-foreground">Angajați</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Meniuri per Locație */}
            <TabsContent value="menus" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Meniuri per Locație</h3>
                  <p className="text-sm text-muted-foreground">Configurați meniuri și prețuri diferite pentru fiecare locație</p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crează Meniu
                </Button>
              </div>

              {locations.filter(l => l.status === 'active').map((location) => (
                <Card key={location.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4 text-primary" />
                        {location.name}
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Adaugă Meniu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mockMenusPerLocation.filter(m => m.locationId === location.id).map((menu, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">{menu.menuName}</p>
                              <p className="text-xs text-muted-foreground">{menu.items} produse</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={menu.active} />
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <DollarSign className="h-4 w-4" />
                              Prețuri
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Utilizatori & Roluri */}
            <TabsContent value="users" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Caută utilizator..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adaugă Utilizator
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Adaugă Utilizator Nou</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nume Complet</Label>
                        <Input placeholder="Ex: Ion Popescu" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="email@restaurant.ro" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rol</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Locație</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează locație" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toate locațiile</SelectItem>
                              {locations.map(loc => (
                                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Parolă Temporară</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddUser(false)}>Anulează</Button>
                      <Button onClick={() => {
                        setShowAddUser(false);
                        toast({ title: "Utilizator creat", description: "Un email de invitație a fost trimis." });
                      }}>
                        <Check className="h-4 w-4 mr-2" />
                        Creează Utilizator
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Roles Overview */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {roles.map((role) => {
                  const count = users.filter(u => u.role === role.id).length;
                  return (
                    <Card key={role.id} className="bg-muted/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{count}</p>
                        <p className="text-sm text-muted-foreground">{role.name}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Users Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilizator</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Locație</TableHead>
                        <TableHead>Ultima Conectare</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {roles.find(r => r.id === user.role)?.name || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.location}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{user.lastLogin}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status === 'active' ? 'Activ' : 'Inactiv'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleToggleUserStatus(user.id)}
                              >
                                {user.status === 'active' ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Zone depozit */}
            <TabsContent value="zones" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Zone depozit</h3>
                  <p className="text-sm text-muted-foreground">Zone pentru stocuri: Depozit, Bucătărie, Bar etc. Se folosesc la Stocuri pentru inventar și transferuri.</p>
                </div>
                <Button onClick={openAddZone}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă zonă
                </Button>
              </div>
              <Dialog open={showAddZone} onOpenChange={(open) => { if (!open) setShowAddZone(false); setEditingZone(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingZone ? 'Modifică zonă' : 'Adaugă zonă depozit'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nume zonă</Label>
                      <Input
                        placeholder="Ex: Depozit, Bucătărie, Bar"
                        value={zoneForm.name}
                        onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cod (opțional)</Label>
                      <Input
                        placeholder="Ex: DEP, KIT, BAR"
                        value={zoneForm.code}
                        onChange={(e) => setZoneForm((p) => ({ ...p, code: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddZone(false)}>Anulează</Button>
                    <Button onClick={handleSaveZone}>
                      <Check className="h-4 w-4 mr-2" />
                      Salvează
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {zonesLoading ? (
                <p className="text-sm text-muted-foreground">Se încarcă zonele...</p>
              ) : storageZones.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Warehouse className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nu există zone. Adaugă Depozit, Bucătărie, Bar etc.</p>
                    <Button variant="outline" className="mt-4" onClick={openAddZone}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă zonă
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storageZones.map((zone) => (
                    <Card key={zone.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Warehouse className="h-5 w-5" />
                            {zone.name}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditZone(zone)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteZone(zone)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {zone.code && <CardDescription>Cod: {zone.code}</CardDescription>}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Hartă Mese */}
            <TabsContent value="tables" className="mt-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Configurare Mese</h3>
                  <p className="text-sm text-muted-foreground">Organizați mesele pe zone și setați capacitatea</p>
                </div>
                <div className="flex shrink-0 items-center">
                  <Button type="button" onClick={openAddTableDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă Masă
                  </Button>
                  <Dialog
                    open={showAddTable}
                    onOpenChange={(open) => {
                      setShowAddTable(open);
                      if (!open) setEditingTableId(null);
                    }}
                  >
                    <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTableId ? 'Editează masă' : 'Adaugă Masă Nouă'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nume/Număr Masă</Label>
                          <Input
                            inputMode="numeric"
                            placeholder="Ex: 5"
                            value={tableForm.number}
                            onChange={(e) => setTableForm((f) => ({ ...f, number: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nr. Locuri</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="4"
                            value={tableForm.seats}
                            onChange={(e) => setTableForm((f) => ({ ...f, seats: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Zonă</Label>
                        <Select
                          value={tableForm.zone}
                          onValueChange={(v) => setTableForm((f) => ({ ...f, zone: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează zona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Interior">Interior</SelectItem>
                            <SelectItem value="Terasă">Terasă</SelectItem>
                            <SelectItem value="Bar">Bar</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="Fără zonă">Fără zonă</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Formă</Label>
                          <Select
                            value={tableForm.shape}
                            onValueChange={(v) =>
                              setTableForm((f) => ({ ...f, shape: v as typeof f.shape }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="square">Pătrat</SelectItem>
                              <SelectItem value="round">Rotund</SelectItem>
                              <SelectItem value="rectangle">Dreptunghi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={tableForm.status}
                            onValueChange={(v) =>
                              setTableForm((f) => ({ ...f, status: v as typeof f.status }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Liberă</SelectItem>
                              <SelectItem value="occupied">Ocupată</SelectItem>
                              <SelectItem value="reserved">Rezervată</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddTable(false)}>
                        Anulează
                      </Button>
                      <Button type="button" onClick={handleSaveTable}>
                        <Check className="h-4 w-4 mr-2" />
                        Salvează
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Table Map Visual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    Hartă Vizuală Mese
                  </CardTitle>
                  <CardDescription>Trageți mesele pentru a le repoziționa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-xl p-6 min-h-[300px] relative">
                    {dbTablesLoading && (
                      <p className="text-sm text-muted-foreground mb-4">Se încarcă mesele…</p>
                    )}
                    {/* Zones */}
                    {zonesForMap.map((zone) => (
                      <div key={zone} className="mb-6">
                        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <Badge variant="outline">{zone}</Badge>
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {dbTables
                            .filter((t) => tableZoneLabel(t) === zone)
                            .map((table) => (
                            <div
                              key={table.id}
                              className={`
                                relative p-4 rounded-xl border-2 min-w-[80px] text-center cursor-move
                                transition-all hover:shadow-lg
                                ${table.status === 'free' ? 'border-success bg-success/10' : ''}
                                ${table.status === 'occupied' ? 'border-primary bg-primary/10' : ''}
                                ${table.status === 'reserved' ? 'border-warning bg-warning/10' : ''}
                              `}
                            >
                              <Move className="h-3 w-3 absolute top-1 right-1 text-muted-foreground" />
                              <p className="font-bold text-lg text-foreground">{tableDisplayName(table)}</p>
                              <p className="text-xs text-muted-foreground">{table.seats} locuri</p>
                              <Badge 
                                variant="secondary" 
                                className={`mt-2 text-xs ${
                                  table.status === 'free' ? 'bg-success/20 text-success' :
                                  table.status === 'occupied' ? 'bg-primary/20 text-primary' :
                                  'bg-warning/20 text-warning'
                                }`}
                              >
                                {table.status === 'free' ? 'Liberă' : table.status === 'occupied' ? 'Ocupată' : 'Rezervată'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tables List */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Masă</TableHead>
                        <TableHead>Zonă</TableHead>
                        <TableHead>Locuri</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbTablesLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Se încarcă mesele…
                          </TableCell>
                        </TableRow>
                      ) : dbTables.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nicio masă în baza de date. Folosește „Adaugă Masă”.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dbTables.map((table) => (
                          <TableRow key={table.id}>
                            <TableCell className="font-bold">{tableDisplayName(table)}</TableCell>
                            <TableCell>{tableZoneLabel(table)}</TableCell>
                            <TableCell>{table.seats}</TableCell>
                            <TableCell>
                              <Badge variant={table.status === 'free' ? 'default' : 'secondary'}>
                                {table.status === 'free' ? 'Liberă' : table.status === 'occupied' ? 'Ocupată' : 'Rezervată'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditTableDialog(table)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteTable(table)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kiosk & App Configuration */}
            <TabsContent value="kiosk" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Configurare Kiosk & Aplicație Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={kioskTab} onValueChange={(v) => setKioskTab(v as any)}>
                    <TabsList className="mb-6">
                      <TabsTrigger value="availability">Disponibilitate Meniu</TabsTrigger>
                      <TabsTrigger value="steps">Pași Kiosk</TabsTrigger>
                      <TabsTrigger value="appearance">Aspect</TabsTrigger>
                    </TabsList>

                    {/* Menu Availability */}
                    <TabsContent value="availability">
                      <p className="text-sm text-muted-foreground mb-4">Setează care preparate sunt disponibile pe fiecare canal de vânzare.</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Preparat</TableHead>
                            <TableHead className="text-center">
                              <div className="flex flex-col items-center">
                                <Store className="h-4 w-4 mb-1" />
                                Restaurant
                              </div>
                            </TableHead>
                            <TableHead className="text-center">
                              <div className="flex flex-col items-center">
                                <Monitor className="h-4 w-4 mb-1" />
                                Kiosk
                              </div>
                            </TableHead>
                            <TableHead className="text-center">
                              <div className="flex flex-col items-center">
                                <Smartphone className="h-4 w-4 mb-1" />
                                App
                              </div>
                            </TableHead>
                            <TableHead className="text-center">
                              <div className="flex flex-col items-center">
                                <Truck className="h-4 w-4 mb-1" />
                                Delivery
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuAvailability.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={item.restaurant} 
                                  onCheckedChange={() => toggleMenuChannel(item.id, 'restaurant')}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={item.kiosk} 
                                  onCheckedChange={() => toggleMenuChannel(item.id, 'kiosk')}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={item.app} 
                                  onCheckedChange={() => toggleMenuChannel(item.id, 'app')}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={item.delivery} 
                                  onCheckedChange={() => toggleMenuChannel(item.id, 'delivery')}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    {/* Kiosk Steps */}
                    <TabsContent value="steps">
                      <p className="text-sm text-muted-foreground mb-4">Configurează fluxul de comandă pentru kiosk.</p>
                      <div className="space-y-3">
                        {[
                          { step: 1, name: 'Selectare tip comandă', description: 'În restaurant / La pachet', enabled: true },
                          { step: 2, name: 'Selectare număr masă', description: 'Pentru comenzi în restaurant', enabled: true },
                          { step: 3, name: 'Selectare produse', description: 'Navigare meniu și adăugare în coș', enabled: true },
                          { step: 4, name: 'Extras și modificări', description: 'Ingrediente extra, observații', enabled: true },
                          { step: 5, name: 'Rezumat comandă', description: 'Verificare și confirmare', enabled: true },
                          { step: 6, name: 'Plată', description: 'Card / Cash / QR Pay', enabled: true },
                        ].map((step) => (
                          <div key={step.step} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                {step.step}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{step.name}</p>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={step.enabled} />
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <GripVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Appearance */}
                    <TabsContent value="appearance">
                      <p className="text-sm text-muted-foreground mb-4">Personalizează aspectul kiosk-ului și aplicației client.</p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Logo Restaurant</Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Încarcă logo (PNG, JPG)</p>
                              <Button variant="outline" size="sm" className="mt-2">
                                Selectează fișier
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Imagine de fundal</Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                              <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Încarcă imagine fundal</p>
                              <Button variant="outline" size="sm" className="mt-2">
                                Selectează fișier
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Culoare principală</Label>
                            <div className="flex items-center gap-3">
                              <input 
                                type="color" 
                                value={kioskSettings.primaryColor}
                                onChange={(e) => setKioskSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="w-12 h-12 rounded cursor-pointer"
                              />
                              <Input 
                                value={kioskSettings.primaryColor}
                                onChange={(e) => setKioskSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Mesaj de bun venit</Label>
                            <Input 
                              value={kioskSettings.welcomeMessage}
                              onChange={(e) => setKioskSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Limbă implicită</Label>
                            <Select value={kioskSettings.defaultLanguage} onValueChange={(v) => setKioskSettings(prev => ({ ...prev, defaultLanguage: v }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ro">Română</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="hu">Magyar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KDS Configuration */}
            <TabsContent value="kds" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Configurare KDS</h3>
                  <p className="text-sm text-muted-foreground">Stațiile KDS sunt ecranele din bucătărie unde se afișează comenzile. Lista de aici apare la „Adaugă produs” (Stație KDS).</p>
                </div>
                <Button onClick={openAddKds}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă stație KDS
                </Button>
              </div>

              <Dialog open={showAddKds} onOpenChange={(open) => { if (!open) setShowAddKds(false); setEditingKds(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingKds ? 'Modifică Stație KDS' : 'Adaugă Stație KDS'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nume stație</Label>
                      <Input
                        placeholder="Ex: Grill, Supe, Pizza"
                        value={kdsForm.name}
                        onChange={(e) => setKdsForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tip</Label>
                      <Select
                        value={kdsForm.type}
                        onValueChange={(v) => setKdsForm((p) => ({ ...p, type: v as KdsStationType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KDS_STATION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-2">
                        {KDS_ICONS.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant={kdsForm.icon === icon ? 'default' : 'outline'}
                            size="icon"
                            className="text-2xl"
                            onClick={() => setKdsForm((p) => ({ ...p, icon }))}
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Culoare (ex: bg-amber-500)</Label>
                      <Input
                        placeholder="bg-amber-500"
                        value={kdsForm.color}
                        onChange={(e) => setKdsForm((p) => ({ ...p, color: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddKds(false)}>Anulează</Button>
                    <Button onClick={handleSaveKds}>
                      <Check className="h-4 w-4 mr-2" />
                      Salvează
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {kdsLoading ? (
                <p className="text-sm text-muted-foreground">Se încarcă stațiile KDS...</p>
              ) : kdsStations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nu există stații KDS. Adaugă prima stație sau rulează „Încarcă date inițiale” din Stocuri → Meniu.</p>
                    <Button variant="outline" className="mt-4" onClick={openAddKds}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă stație KDS
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kdsStations.map((station) => (
                    <Card key={station.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <span className="text-2xl">{station.icon ?? '🍲'}</span>
                            {station.name}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditKds(station)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteKds(station)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          Tip: {KDS_STATION_TYPES.find((t) => t.value === station.type)?.label ?? station.type}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Extra Ingredients */}
            <TabsContent value="extras" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Ingrediente Extra</h3>
                  <p className="text-sm text-muted-foreground">Ingredientele extra pot fi adăugate de clienți la produse contra cost. Acestea apar în kiosk, aplicație și comenzi telefonice.</p>
                </div>
                <Dialog open={showAddIngredient} onOpenChange={setShowAddIngredient}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă ingredient
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adaugă Ingredient Extra</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nume Ingredient</Label>
                        <Input placeholder="Ex: Brânză extra" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preț (RON)</Label>
                          <Input type="number" placeholder="5" />
                        </div>
                        <div className="space-y-2">
                          <Label>Categorie</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lactate">Lactate</SelectItem>
                              <SelectItem value="carne">Carne</SelectItem>
                              <SelectItem value="legume">Legume</SelectItem>
                              <SelectItem value="sosuri">Sosuri</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddIngredient(false)}>Anulează</Button>
                      <Button onClick={() => {
                        setShowAddIngredient(false);
                        toast({ title: "Ingredient adăugat", description: "Noul ingredient a fost creat." });
                      }}>
                        <Check className="h-4 w-4 mr-2" />
                        Salvează
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Preț</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extraIngredients.map((ingredient) => (
                        <TableRow key={ingredient.id}>
                          <TableCell className="font-medium">{ingredient.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ingredient.category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-primary">{ingredient.price} RON</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdminConfigModule;
