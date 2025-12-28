import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  Play,
  Pause,
  XCircle,
  Loader2,
  Database,
  ShoppingCart,
  Receipt,
  Users,
  CreditCard,
  Package,
  ChevronRight,
  Activity,
  Zap,
  Server,
  HardDrive,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium
} from 'lucide-react';

// Mock pending actions
const mockPendingActions = [
  {
    id: '1',
    type: 'order',
    action: 'create',
    data: { orderId: 'ORD-156', table: 5, items: 3, total: 145 },
    timestamp: new Date(Date.now() - 5 * 60000),
    status: 'pending',
    retries: 0,
  },
  {
    id: '2',
    type: 'order',
    action: 'update',
    data: { orderId: 'ORD-155', status: 'completed' },
    timestamp: new Date(Date.now() - 8 * 60000),
    status: 'pending',
    retries: 0,
  },
  {
    id: '3',
    type: 'payment',
    action: 'create',
    data: { paymentId: 'PAY-089', amount: 230, method: 'card' },
    timestamp: new Date(Date.now() - 12 * 60000),
    status: 'error',
    retries: 3,
    error: 'Eroare procesare plată',
  },
  {
    id: '4',
    type: 'stock',
    action: 'update',
    data: { item: 'Pizza Margherita', quantity: -2 },
    timestamp: new Date(Date.now() - 15 * 60000),
    status: 'pending',
    retries: 0,
  },
  {
    id: '5',
    type: 'customer',
    action: 'create',
    data: { name: 'Ion Popescu', phone: '0721...' },
    timestamp: new Date(Date.now() - 20 * 60000),
    status: 'synced',
    retries: 0,
  },
];

const mockSyncHistory = [
  { id: '1', timestamp: new Date(Date.now() - 30 * 60000), actions: 12, success: 12, failed: 0 },
  { id: '2', timestamp: new Date(Date.now() - 2 * 3600000), actions: 45, success: 43, failed: 2 },
  { id: '3', timestamp: new Date(Date.now() - 5 * 3600000), actions: 28, success: 28, failed: 0 },
];

export const OfflineModeModule: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState(mockPendingActions);
  const [autoSync, setAutoSync] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');
  const [showSyncAnimation, setShowSyncAnimation] = useState(false);

  // Simulate connection status changes
  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        const random = Math.random();
        if (random < 0.3) {
          setIsOnline(false);
          setConnectionQuality('offline');
        } else {
          setIsOnline(true);
          if (random < 0.5) setConnectionQuality('poor');
          else if (random < 0.7) setConnectionQuality('good');
          else setConnectionQuality('excellent');
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  // Auto sync when connection returns
  useEffect(() => {
    if (isOnline && autoSync && pendingActions.some(a => a.status === 'pending')) {
      setShowSyncAnimation(true);
      setTimeout(() => {
        handleSync();
        setShowSyncAnimation(false);
      }, 1500);
    }
  }, [isOnline, autoSync]);

  const handleSync = () => {
    setIsSyncing(true);
    setSyncProgress(0);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          setPendingActions(prev => prev.map(a => 
            a.status === 'pending' ? { ...a, status: 'synced' } : a
          ));
          toast({ title: 'Sincronizare completă', description: 'Toate acțiunile au fost sincronizate' });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRetry = (id: string) => {
    setPendingActions(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'pending', retries: a.retries + 1 } : a
    ));
    toast({ title: 'Reîncercare', description: 'Acțiunea va fi resincronizată' });
  };

  const handleDelete = (id: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Acțiune ștearsă', description: 'Acțiunea a fost eliminată din coadă' });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'payment': return CreditCard;
      case 'stock': return Package;
      case 'customer': return Users;
      default: return Database;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">În așteptare</Badge>;
      case 'syncing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sincronizare...</Badge>;
      case 'synced':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sincronizat</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Eroare</Badge>;
      default:
        return null;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <SignalHigh className="h-5 w-5 text-green-500" />;
      case 'good': return <SignalMedium className="h-5 w-5 text-green-500" />;
      case 'poor': return <SignalLow className="h-5 w-5 text-yellow-500" />;
      case 'offline': return <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  const pendingCount = pendingActions.filter(a => a.status === 'pending').length;
  const errorCount = pendingActions.filter(a => a.status === 'error').length;
  const syncedCount = pendingActions.filter(a => a.status === 'synced').length;

  return (
    <div className="h-full flex flex-col">
      {/* Offline Banner - Always visible when offline */}
      {!isOnline && (
        <div className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full animate-pulse">
                <WifiOff className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Mod Offline Activ</p>
                <p className="text-sm text-white/80">Comenzile sunt salvate local și vor fi sincronizate automat</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-white/80">nesincronizate</p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                <RefreshCw className="h-4 w-4 mr-2" />
                În așteptare
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Animation Banner */}
      {showSyncAnimation && isOnline && (
        <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <div className="flex items-center justify-center gap-3 px-6 py-3">
            <div className="relative">
              <Cloud className="h-6 w-6" />
              <RefreshCw className="h-3 w-3 absolute -bottom-0.5 -right-0.5 animate-spin" />
            </div>
            <p className="font-medium">Conexiune restabilită! Sincronizare în curs...</p>
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              isOnline 
                ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10" 
                : "bg-gradient-to-br from-red-500/20 to-orange-500/10"
            )}>
              {isOnline ? (
                <Wifi className="h-8 w-8 text-green-500" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-500" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mod Offline</h1>
              <p className="text-muted-foreground">Gestionare conectivitate și sincronizare</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isSimulating}
                onCheckedChange={setIsSimulating}
              />
              <Label className="text-sm">Simulare conexiune</Label>
            </div>
            <Button
              variant={isOnline ? 'outline' : 'destructive'}
              onClick={() => {
                setIsOnline(!isOnline);
                setConnectionQuality(isOnline ? 'offline' : 'excellent');
              }}
            >
              {isOnline ? 'Deconectează' : 'Conectează'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card className={cn(
                "transition-colors",
                isOnline ? "border-green-500/30" : "border-red-500/30"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getConnectionIcon()}
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    isOnline ? "text-green-500" : "text-red-500"
                  )}>
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {connectionQuality === 'excellent' && 'Conexiune excelentă'}
                    {connectionQuality === 'good' && 'Conexiune bună'}
                    {connectionQuality === 'poor' && 'Conexiune slabă'}
                    {connectionQuality === 'offline' && 'Fără conexiune'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">În așteptare</span>
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <p className="text-xl font-bold text-yellow-500">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">acțiuni</p>
                </CardContent>
              </Card>

              <Card className="border-red-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Erori</span>
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-xl font-bold text-red-500">{errorCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">de rezolvat</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Sincronizate</span>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xl font-bold text-green-500">{syncedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">astăzi</p>
                </CardContent>
              </Card>
            </div>

            {/* Sync Progress */}
            {isSyncing && (
              <Card className="border-primary/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Sincronizare în progres</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(syncProgress / 100 * pendingCount)} din {pendingCount} acțiuni
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-primary">{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </CardContent>
              </Card>
            )}

            {/* Pending Actions Queue */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Coadă de Sincronizare</CardTitle>
                    {pendingCount > 0 && (
                      <Badge variant="secondary">{pendingCount} în așteptare</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPendingActions(mockPendingActions)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Demo
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSync}
                      disabled={!isOnline || isSyncing || pendingCount === 0}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                      Sincronizează
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] pr-4 -mr-4">
                  <div className="space-y-3">
                    {pendingActions.map((action) => {
                      const Icon = getActionIcon(action.type);
                      return (
                        <div
                          key={action.id}
                          className={cn(
                            "p-4 rounded-xl border transition-colors",
                            action.status === 'error' && "border-red-500/30 bg-red-500/5",
                            action.status === 'synced' && "border-green-500/30 bg-green-500/5",
                            action.status === 'pending' && "border-yellow-500/30 bg-yellow-500/5"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "p-2 rounded-lg",
                              action.status === 'error' && "bg-red-500/10",
                              action.status === 'synced' && "bg-green-500/10",
                              action.status === 'pending' && "bg-yellow-500/10"
                            )}>
                              <Icon className={cn(
                                "h-5 w-5",
                                action.status === 'error' && "text-red-500",
                                action.status === 'synced' && "text-green-500",
                                action.status === 'pending' && "text-yellow-500"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium capitalize">{action.type}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">{action.action}</span>
                                {getStatusBadge(action.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {action.type === 'order' && `Comandă ${action.data.orderId} - Masă ${action.data.table}`}
                                {action.type === 'payment' && `Plată ${action.data.paymentId} - ${action.data.amount} RON`}
                                {action.type === 'stock' && `${action.data.item} (${action.data.quantity})`}
                                {action.type === 'customer' && `Client: ${action.data.name}`}
                              </p>
                              {action.error && (
                                <div className="flex items-center gap-2 text-sm text-red-500 mb-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  {action.error}
                                  <span className="text-xs text-muted-foreground">
                                    ({action.retries} încercări)
                                  </span>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {action.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {action.status !== 'synced' && (
                              <div className="flex items-center gap-1">
                                {action.status === 'error' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRetry(action.id)}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(action.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                            {action.status === 'synced' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Setări Sincronizare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Sincronizare automată</Label>
                    <p className="text-xs text-muted-foreground">La revenirea conexiunii</p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Notificări offline</Label>
                    <p className="text-xs text-muted-foreground">Alertă când pierzi conexiunea</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Salvare locală</Label>
                    <p className="text-xs text-muted-foreground">Păstrează datele nesincronizate</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Stocare Locală
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Spațiu utilizat</span>
                    <span className="font-medium">2.4 MB / 50 MB</span>
                  </div>
                  <Progress value={4.8} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Comenzi</p>
                    <p className="font-semibold">156</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Clienți</p>
                    <p className="font-semibold">42</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Produse</p>
                    <p className="font-semibold">89</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Acțiuni</p>
                    <p className="font-semibold">{pendingActions.length}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Golește Cache
                </Button>
              </CardContent>
            </Card>

            {/* Sync History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Istoric Sincronizări
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockSyncHistory.map((sync) => (
                  <div key={sync.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={cn(
                      "p-1.5 rounded-full",
                      sync.failed === 0 ? "bg-green-500/10" : "bg-yellow-500/10"
                    )}>
                      {sync.failed === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {sync.success}/{sync.actions} sincronizate
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sync.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {sync.failed > 0 && (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        {sync.failed} erori
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineModeModule;
