import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRestaurant } from '@/context/RestaurantContext';
import { employeeBreaksApi, type EmployeeBreakApi } from '@/lib/api';
import { 
  Users, Search, Plus, User, ChefHat, Shield, Coffee, Clock, 
  Play, Pause, AlertTriangle, Award, TrendingUp, TrendingDown,
  Calendar, CheckCircle2, XCircle, AlertCircle, Star, Target,
  Euro, Timer, RotateCcw, Package, FileText, ThumbsUp, ThumbsDown,
  Bell, Settings, BarChart3, Wallet, Pencil
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';

// Employee data with extended info
interface Employee {
  id: string;
  name: string;
  role: 'waiter' | 'kitchen' | 'cashier' | 'admin';
  avatar: string;
  status: 'online' | 'offline' | 'break' | 'busy';
  phone: string;
  email: string;
  startDate: string;
  schedule: string;
  breaksTaken: number;
  totalBreakTime: number;
  kpiScore: number;
}

const employeesDataSeed: Employee[] = [
  { id: '1', name: 'Maria Popescu', role: 'waiter', avatar: 'MP', status: 'online', phone: '0721 234 567', email: 'maria.p@resto.ro', startDate: '2023-05-15', schedule: '08:00 - 16:00', breaksTaken: 2, totalBreakTime: 45, kpiScore: 92 },
  { id: '2', name: 'Ion Ionescu', role: 'waiter', avatar: 'II', status: 'break', phone: '0722 345 678', email: 'ion.i@resto.ro', startDate: '2023-08-20', schedule: '16:00 - 00:00', breaksTaken: 1, totalBreakTime: 15, kpiScore: 87 },
  { id: '3', name: 'Elena Vasilescu', role: 'waiter', avatar: 'EV', status: 'offline', phone: '0723 456 789', email: 'elena.v@resto.ro', startDate: '2024-01-10', schedule: 'Liber', breaksTaken: 0, totalBreakTime: 0, kpiScore: 78 },
  { id: '4', name: 'Andrei Marin', role: 'kitchen', avatar: 'AM', status: 'online', phone: '0724 567 890', email: 'andrei.m@resto.ro', startDate: '2022-03-01', schedule: '06:00 - 14:00', breaksTaken: 3, totalBreakTime: 60, kpiScore: 95 },
  { id: '5', name: 'Cristina Popa', role: 'kitchen', avatar: 'CP', status: 'busy', phone: '0725 678 901', email: 'cristina.p@resto.ro', startDate: '2023-11-05', schedule: '14:00 - 22:00', breaksTaken: 2, totalBreakTime: 35, kpiScore: 88 },
  { id: '6', name: 'Florin Dumitrescu', role: 'cashier', avatar: 'FD', status: 'online', phone: '0726 789 012', email: 'florin.d@resto.ro', startDate: '2024-02-15', schedule: '10:00 - 18:00', breaksTaken: 1, totalBreakTime: 20, kpiScore: 91 },
];

const defaultEmployeeForm = {
  name: '',
  role: 'waiter' as Employee['role'],
  phone: '',
  email: '',
  startDate: '',
  schedule: '',
  status: 'offline' as Employee['status'],
};

const performanceData = [
  { name: 'Lun', performanta: 85, media: 80 },
  { name: 'Mar', performanta: 92, media: 80 },
  { name: 'Mie', performanta: 78, media: 80 },
  { name: 'Joi', performanta: 88, media: 80 },
  { name: 'Vin', performanta: 95, media: 80 },
  { name: 'Sâm', performanta: 90, media: 80 },
  { name: 'Dum', performanta: 82, media: 80 },
];

export const HRModule: React.FC = () => {
  const { currentUser } = useRestaurant();
  const [employees, setEmployees] = useState<Employee[]>(employeesDataSeed);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentType, setIncidentType] = useState<'incident' | 'praise' | 'warning'>('incident');
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [activeBreak, setActiveBreak] = useState<EmployeeBreakApi | null>(null);
  const [breakHistory, setBreakHistory] = useState<EmployeeBreakApi[]>([]);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState(defaultEmployeeForm);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (roleFilter === 'all' || e.role === roleFilter) &&
    (statusFilter === 'all' || e.status === statusFilter)
  );

  const onlineCount = employees.filter(e => e.status === 'online' || e.status === 'busy').length;
  const onBreakCount = employees.filter(e => e.status === 'break').length;

  useEffect(() => {
    if (!currentUser) return;
    employeeBreaksApi
      .getMyToday()
      .then((payload) => {
        setActiveBreak(payload.activeBreak);
        setBreakHistory(payload.history);
        setIsBreakActive(!!payload.activeBreak);
      })
      .catch(() => {
        setActiveBreak(null);
        setBreakHistory([]);
        setIsBreakActive(false);
      });
  }, [currentUser]);

  useEffect(() => {
    if (!activeBreak) {
      setBreakTimer(0);
      return;
    }
    const updateTimer = () => {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - new Date(activeBreak.startedAt).getTime()) / 60000),
      );
      setBreakTimer(elapsed);
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(id);
  }, [activeBreak]);

  const breakRows = useMemo(
    () =>
      breakHistory.map((entry) => {
        const start = new Date(entry.startedAt);
        const end = entry.endedAt ? new Date(entry.endedAt) : null;
        const duration = entry.durationMinutes ?? Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000));
        return {
          id: entry.id,
          employee: currentUser?.name ?? 'Angajat',
          start: start.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
          end: end ? end.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : 'In curs',
          duration,
          status: duration > 30 ? 'exceeded' : 'ok',
        };
      }),
    [breakHistory, currentUser?.name],
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'kitchen': return <ChefHat className="h-4 w-4" />;
      case 'cashier': return <Wallet className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'kitchen': return 'Bucătar';
      case 'cashier': return 'Casier';
      default: return 'Ospătar';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-400';
      case 'break': return 'bg-yellow-500';
      case 'busy': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'break': return 'Pauză';
      case 'busy': return 'Ocupat';
      default: return status;
    }
  };

  const handleStartBreak = async () => {
    if (!currentUser) {
      toast({ title: 'Eroare', description: 'Nu exista utilizator conectat.', variant: 'destructive' });
      return;
    }
    try {
      const started = await employeeBreaksApi.startMyBreak();
      setActiveBreak(started);
      setIsBreakActive(true);
      setBreakHistory((prev) => [started, ...prev.filter((x) => x.id !== started.id)]);
      toast({ title: 'Pauza inceputa', description: 'Pauza a fost salvata in baza de date.' });
    } catch {
      toast({ title: 'Eroare', description: 'Nu am putut porni pauza.', variant: 'destructive' });
    }
  };

  const handleStopBreak = async () => {
    try {
      const stopped = await employeeBreaksApi.stopMyBreak();
      setIsBreakActive(false);
      setActiveBreak(null);
      setBreakTimer(0);
      setBreakHistory((prev) => [stopped, ...prev.filter((x) => x.id !== stopped.id)]);
      toast({ title: 'Pauza incheiata', description: `Durata: ${stopped.durationMinutes ?? breakTimer} minute` });
    } catch {
      toast({ title: 'Eroare', description: 'Nu exista pauza activa.', variant: 'destructive' });
    }
  };

  const openIncidentDialog = (type: 'incident' | 'praise' | 'warning') => {
    setIncidentType(type);
    setShowIncidentDialog(true);
  };

  const openAddEmployeeDialog = () => {
    setEmployeeForm(defaultEmployeeForm);
    setShowAddEmployeeDialog(true);
  };

  const openEditEmployeeDialog = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      name: employee.name,
      role: employee.role,
      phone: employee.phone,
      email: employee.email,
      startDate: employee.startDate,
      schedule: employee.schedule,
      status: employee.status,
    });
    setShowEditEmployeeDialog(true);
  };

  const getAvatarFromName = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.trim().slice(0, 2).toUpperCase() || 'NA';
  };

  const validateEmployeeForm = (): boolean => {
    if (!employeeForm.name.trim()) {
      toast({ title: 'Nume invalid', description: 'Completează numele angajatului.', variant: 'destructive' });
      return false;
    }
    if (!employeeForm.phone.trim()) {
      toast({ title: 'Telefon invalid', description: 'Completează numărul de telefon.', variant: 'destructive' });
      return false;
    }
    if (!employeeForm.schedule.trim()) {
      toast({ title: 'Program invalid', description: 'Completează programul angajatului.', variant: 'destructive' });
      return false;
    }
    if (!employeeForm.startDate.trim()) {
      toast({ title: 'Dată invalidă', description: 'Completează data angajării.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleAddEmployee = () => {
    if (!validateEmployeeForm()) return;
    const newEmployee: Employee = {
      id: String(Date.now()),
      name: employeeForm.name.trim(),
      role: employeeForm.role,
      avatar: getAvatarFromName(employeeForm.name),
      status: employeeForm.status,
      phone: employeeForm.phone.trim(),
      email: employeeForm.email.trim(),
      startDate: employeeForm.startDate,
      schedule: employeeForm.schedule.trim(),
      breaksTaken: 0,
      totalBreakTime: 0,
      kpiScore: 80,
    };
    setEmployees((prev) => [newEmployee, ...prev]);
    setShowAddEmployeeDialog(false);
    setEmployeeForm(defaultEmployeeForm);
    toast({ title: 'Angajat adăugat', description: `${newEmployee.name} a fost adăugat.` });
  };

  const handleEditEmployee = () => {
    if (!editingEmployeeId) return;
    if (!validateEmployeeForm()) return;
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === editingEmployeeId
          ? {
              ...employee,
              name: employeeForm.name.trim(),
              role: employeeForm.role,
              avatar: getAvatarFromName(employeeForm.name),
              status: employeeForm.status,
              phone: employeeForm.phone.trim(),
              email: employeeForm.email.trim(),
              startDate: employeeForm.startDate,
              schedule: employeeForm.schedule.trim(),
            }
          : employee,
      ),
    );
    if (selectedEmployee?.id === editingEmployeeId) {
      setSelectedEmployee((prev) =>
        prev
          ? {
              ...prev,
              name: employeeForm.name.trim(),
              role: employeeForm.role,
              avatar: getAvatarFromName(employeeForm.name),
              status: employeeForm.status,
              phone: employeeForm.phone.trim(),
              email: employeeForm.email.trim(),
              startDate: employeeForm.startDate,
              schedule: employeeForm.schedule.trim(),
            }
          : null,
      );
    }
    setShowEditEmployeeDialog(false);
    setEditingEmployeeId(null);
    toast({ title: 'Angajat modificat', description: 'Datele au fost actualizate.' });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Angajați & HR" 
        description="Gestionare personal, pauze și performanță"
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees-admin">Adaugă angajat</TabsTrigger>
          <TabsTrigger value="breaks">Pauze</TabsTrigger>
          <TabsTrigger value="kpi-waiter">KPI Ospătari</TabsTrigger>
          <TabsTrigger value="kpi-kitchen">KPI Bucătari</TabsTrigger>
          <TabsTrigger value="kpi-cashier">KPI Casieri</TabsTrigger>
          <TabsTrigger value="manager">Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="employees-admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Administrare Angajați
                </span>
                <Button onClick={openAddEmployeeDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă angajat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border">
                    <div className="min-w-[220px]">
                      <p className="font-semibold">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getRoleLabel(employee.role)} • {employee.phone} • {employee.schedule}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getStatusLabel(employee.status)}</Badge>
                      <Button variant="outline" size="sm" onClick={() => openEditEmployeeDialog(employee)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifică
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-green-500/10">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prezenți Acum</p>
                    <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-yellow-500/10">
                    <Coffee className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">În Pauză</p>
                    <p className="text-3xl font-bold text-yellow-600">{onBreakCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Angajați</p>
                    <p className="text-3xl font-bold">{employees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-purple-500/10">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scor Mediu KPI</p>
                    <p className="text-3xl font-bold text-purple-600">88%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Caută angajat..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Rolurile</SelectItem>
                <SelectItem value="waiter">Ospătar</SelectItem>
                <SelectItem value="kitchen">Bucătar</SelectItem>
                <SelectItem value="cashier">Casier</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="break">Pauză</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card 
                key={employee.id}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]",
                  selectedEmployee?.id === employee.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedEmployee(employee)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {employee.avatar}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                        getStatusColor(employee.status)
                      )} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{employee.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          {getRoleIcon(employee.role)}
                          {getRoleLabel(employee.role)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            employee.status === 'online' && "border-green-500 text-green-600",
                            employee.status === 'break' && "border-yellow-500 text-yellow-600",
                            employee.status === 'busy' && "border-blue-500 text-blue-600"
                          )}
                        >
                          {getStatusLabel(employee.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{employee.schedule}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{employee.kpiScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI Progress */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Scor KPI</span>
                      <span className="font-medium">{employee.kpiScore}%</span>
                    </div>
                    <Progress 
                      value={employee.kpiScore} 
                      className={cn(
                        "h-2",
                        employee.kpiScore >= 90 ? "[&>div]:bg-green-500" :
                        employee.kpiScore >= 75 ? "[&>div]:bg-yellow-500" :
                        "[&>div]:bg-red-500"
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Employee Detail Panel */}
          {selectedEmployee && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedEmployee.avatar}
                  </div>
                  <div>
                    <span>{selectedEmployee.name}</span>
                    <p className="text-sm font-normal text-muted-foreground">{getRoleLabel(selectedEmployee.role)}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Informații Contact</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Telefon:</span> {selectedEmployee.phone}</p>
                      <p><span className="text-muted-foreground">Email:</span> {selectedEmployee.email}</p>
                      <p><span className="text-muted-foreground">Data angajării:</span> {selectedEmployee.startDate}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Statistici Azi</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Program:</span> {selectedEmployee.schedule}</p>
                      <p><span className="text-muted-foreground">Pauze luate:</span> {selectedEmployee.breaksTaken}</p>
                      <p><span className="text-muted-foreground">Timp pauză total:</span> {selectedEmployee.totalBreakTime} min</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Schimbă Rol</h4>
                    <Select defaultValue={selectedEmployee.role}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waiter">Ospătar</SelectItem>
                        <SelectItem value="kitchen">Bucătar</SelectItem>
                        <SelectItem value="cashier">Casier</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Breaks Tab */}
        <TabsContent value="breaks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Break Control */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Control Pauză
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className={cn(
                    "w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl font-bold transition-all",
                    isBreakActive ? "bg-yellow-500/20 text-yellow-600" : "bg-muted"
                  )}>
                    {isBreakActive ? `${breakTimer}:00` : "00:00"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {isBreakActive ? "Pauză în curs" : "Nicio pauză activă"}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!isBreakActive ? (
                    <Button className="flex-1" onClick={handleStartBreak}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Pauză
                    </Button>
                  ) : (
                    <Button variant="destructive" className="flex-1" onClick={handleStopBreak}>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Pauză
                    </Button>
                  )}
                </div>

                {isBreakActive && breakTimer > 30 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Pauză depășită!</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Limita de 30 minute a fost depășită
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Break History */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Istoric Pauze Azi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {breakRows.map((breakItem) => (
                        <div key={breakItem.id} className="relative flex gap-4 pl-12">
                          <div className={cn(
                            "absolute left-3 w-5 h-5 rounded-full flex items-center justify-center",
                            breakItem.status === 'ok' ? "bg-green-500" : "bg-yellow-500"
                          )}>
                            {breakItem.status === 'ok' 
                              ? <CheckCircle2 className="h-3 w-3 text-white" />
                              : <AlertTriangle className="h-3 w-3 text-white" />
                            }
                          </div>
                          <div className="flex-1 p-3 rounded-lg border bg-muted/30">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{breakItem.employee}</p>
                                <p className="text-sm text-muted-foreground">
                                  {breakItem.start} - {breakItem.end}
                                </p>
                              </div>
                              <Badge variant={breakItem.status === 'ok' ? 'secondary' : 'destructive'}>
                                {breakItem.duration} min
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KPI Waiter Tab */}
        <TabsContent value="kpi-waiter" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <Euro className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valoare Medie Bon</p>
                    <p className="text-2xl font-bold">87.50 RON</p>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      +12% vs. medie
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Timer className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timp Servire Mediu</p>
                    <p className="text-2xl font-bold">8:30 min</p>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingDown className="h-3 w-3" />
                      -15% vs. medie
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Erori Comandă</p>
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-xs text-muted-foreground">din 45 comenzi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/10">
                    <RotateCcw className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Note Anulate</p>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-xs text-muted-foreground">valoare: 45 RON</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performanță Săptămânală</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorPerformanta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="performanta" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorPerformanta)" 
                      name="Performanță"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="media" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      name="Media echipă"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison with team */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparație cu Media Echipei</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { metric: 'Valoare bon', personal: 87.50, team: 78.20, unit: 'RON' },
                  { metric: 'Timp servire', personal: 8.5, team: 10.2, unit: 'min', inverse: true },
                  { metric: 'Erori', personal: 2, team: 3.5, unit: '', inverse: true },
                  { metric: 'Feedback pozitiv', personal: 95, team: 88, unit: '%' },
                ].map((item, idx) => {
                  const isBetter = item.inverse 
                    ? item.personal < item.team 
                    : item.personal > item.team;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="w-32 text-sm text-muted-foreground">{item.metric}</span>
                      <div className="flex-1">
                        <Progress 
                          value={(item.personal / Math.max(item.personal, item.team)) * 100} 
                          className={cn("h-3", isBetter ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500")}
                        />
                      </div>
                      <span className={cn("w-20 text-right font-medium", isBetter ? "text-green-600" : "text-red-500")}>
                        {item.personal} {item.unit}
                      </span>
                      <span className="w-20 text-right text-muted-foreground text-sm">
                        vs {item.team} {item.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPI Kitchen Tab */}
        <TabsContent value="kpi-kitchen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Timer className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timp Preparare Mediu</p>
                    <p className="text-2xl font-bold">12:45 min</p>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingDown className="h-3 w-3" />
                      -8% vs. target
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comenzi Întârziate</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">din 67 comenzi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/10">
                    <RotateCcw className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Refaceri</p>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-xs text-muted-foreground">valoare: 32 RON</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pierderi Ingrediente</p>
                    <p className="text-2xl font-bold">2.3%</p>
                    <p className="text-xs text-muted-foreground">~85 RON azi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kitchen Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Ranking Bucătari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.filter(e => e.role === 'kitchen').sort((a, b) => b.kpiScore - a.kpiScore).map((chef, idx) => (
                  <div key={chef.id} className="flex items-center gap-4 p-3 rounded-xl border bg-muted/30">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      idx === 0 && "bg-yellow-500 text-white",
                      idx === 1 && "bg-gray-400 text-white",
                      idx === 2 && "bg-amber-600 text-white",
                      idx > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {chef.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{chef.name}</p>
                      <p className="text-sm text-muted-foreground">Timp mediu: 11:30 min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{chef.kpiScore}%</p>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        +5%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPI Cashier Tab */}
        <TabsContent value="kpi-cashier" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <Wallet className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diferențe Casă</p>
                    <p className="text-2xl font-bold text-red-600">-12.50 RON</p>
                    <p className="text-xs text-muted-foreground">ultima închidere</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Timer className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Viteză Tranzacție</p>
                    <p className="text-2xl font-bold">45 sec</p>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingDown className="h-3 w-3" />
                      -10% vs. medie
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/10">
                    <XCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Erori Bon</p>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">din 89 bonuri</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <Euro className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Încasat</p>
                    <p className="text-2xl font-bold">4,567 RON</p>
                    <p className="text-xs text-muted-foreground">azi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grafic Zilnic - Tranzacții per Oră</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { ora: '10:00', tranzactii: 12, valoare: 450 },
                    { ora: '11:00', tranzactii: 18, valoare: 680 },
                    { ora: '12:00', tranzactii: 35, valoare: 1200 },
                    { ora: '13:00', tranzactii: 42, valoare: 1450 },
                    { ora: '14:00', tranzactii: 28, valoare: 920 },
                    { ora: '15:00', tranzactii: 15, valoare: 520 },
                    { ora: '16:00', tranzactii: 22, valoare: 780 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="ora" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="tranzactii" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tranzacții" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manager Tab */}
        <TabsContent value="manager" className="space-y-6">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Overview Echipă</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: 'Ospătari', count: 3, online: 2, icon: User },
                    { role: 'Bucătari', count: 4, online: 3, icon: ChefHat },
                    { role: 'Casieri', count: 2, online: 1, icon: Wallet },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.role}</p>
                          <p className="text-sm text-muted-foreground">{item.count} angajați</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          {item.online} online
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Acțiuni Rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează angajat pentru acțiune..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} - {getRoleLabel(e.role)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={() => openIncidentDialog('incident')}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Incident
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-green-500/30 text-green-600 hover:bg-green-500/10"
                      onClick={() => openIncidentDialog('praise')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Laudă
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                      onClick={() => openIncidentDialog('warning')}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Avertisment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendar Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day, idx) => (
                    <div key={day} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      idx === new Date().getDay() - 1 && "bg-primary/5 border-primary/30"
                    )}>
                      <span className="font-medium">{day}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {employees[i]?.avatar}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{Math.floor(Math.random() * 3) + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Respectare Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.slice(0, 5).map((emp) => {
                    const compliance = Math.floor(Math.random() * 20) + 80;
                    return (
                      <div key={emp.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {emp.avatar}
                            </div>
                            <span className="text-sm font-medium">{emp.name}</span>
                          </div>
                          <span className={cn(
                            "text-sm font-bold",
                            compliance >= 95 ? "text-green-600" :
                            compliance >= 85 ? "text-yellow-600" : "text-red-500"
                          )}>
                            {compliance}%
                          </span>
                        </div>
                        <Progress 
                          value={compliance} 
                          className={cn(
                            "h-2",
                            compliance >= 95 ? "[&>div]:bg-green-500" :
                            compliance >= 85 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Incident Dialog */}
      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {incidentType === 'incident' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {incidentType === 'praise' && <ThumbsUp className="h-5 w-5 text-green-500" />}
              {incidentType === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {incidentType === 'incident' && 'Raportare Incident'}
              {incidentType === 'praise' && 'Laudă Angajat'}
              {incidentType === 'warning' && 'Avertisment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Angajat</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selectează angajat" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descriere</Label>
              <Textarea placeholder="Descrie situația..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncidentDialog(false)}>Anulează</Button>
            <Button 
              variant={incidentType === 'praise' ? 'default' : 'destructive'}
              onClick={() => {
                toast({ title: "Înregistrat cu succes" });
                setShowIncidentDialog(false);
              }}
            >
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adaugă angajat</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nume complet</Label>
              <Input
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Andrei Popescu"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={employeeForm.role}
                onValueChange={(v: Employee['role']) => setEmployeeForm((prev) => ({ ...prev, role: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">Ospătar</SelectItem>
                  <SelectItem value="kitchen">Bucătar</SelectItem>
                  <SelectItem value="cashier">Casier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={employeeForm.status}
                onValueChange={(v: Employee['status']) => setEmployeeForm((prev) => ({ ...prev, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="break">Pauză</SelectItem>
                  <SelectItem value="busy">Ocupat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="07xx xxx xxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="nume@restaurant.ro"
              />
            </div>
            <div className="space-y-2">
              <Label>Data angajării</Label>
              <Input
                type="date"
                value={employeeForm.startDate}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Input
                value={employeeForm.schedule}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, schedule: e.target.value }))}
                placeholder="08:00 - 16:00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmployeeDialog(false)}>Anulează</Button>
            <Button onClick={handleAddEmployee}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifică angajat</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nume complet</Label>
              <Input
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={employeeForm.role}
                onValueChange={(v: Employee['role']) => setEmployeeForm((prev) => ({ ...prev, role: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">Ospătar</SelectItem>
                  <SelectItem value="kitchen">Bucătar</SelectItem>
                  <SelectItem value="cashier">Casier</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={employeeForm.status}
                onValueChange={(v: Employee['status']) => setEmployeeForm((prev) => ({ ...prev, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="break">Pauză</SelectItem>
                  <SelectItem value="busy">Ocupat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data angajării</Label>
              <Input
                type="date"
                value={employeeForm.startDate}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Input
                value={employeeForm.schedule}
                onChange={(e) => setEmployeeForm((prev) => ({ ...prev, schedule: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmployeeDialog(false)}>Anulează</Button>
            <Button onClick={handleEditEmployee}>Salvează modificările</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRModule;
