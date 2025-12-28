import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { 
  Printer, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Settings, Banknote, CreditCard, Tag, Monitor,
  Smartphone, QrCode, Server, Usb, Bluetooth, Loader2
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'printer' | 'payment' | 'display' | 'scanner';
  status: 'connected' | 'disconnected' | 'warning' | 'busy';
  model: string;
  lastSeen: string;
  icon: React.ReactNode;
}

const mockDevices: Device[] = [
  { 
    id: '1', 
    name: 'Imprimantă Fiscală', 
    type: 'printer', 
    status: 'connected', 
    model: 'Epson TM-T88VI',
    lastSeen: 'Acum',
    icon: <Printer className="w-6 h-6" />
  },
  { 
    id: '2', 
    name: 'Imprimantă Comenzi (Bucătărie)', 
    type: 'printer', 
    status: 'connected', 
    model: 'Star TSP143III',
    lastSeen: 'Acum',
    icon: <Printer className="w-6 h-6" />
  },
  { 
    id: '3', 
    name: 'Imprimantă Comenzi (Bar)', 
    type: 'printer', 
    status: 'warning', 
    model: 'Star TSP143III',
    lastSeen: 'Acum 2 min',
    icon: <Printer className="w-6 h-6" />
  },
  { 
    id: '4', 
    name: 'Imprimantă Etichete', 
    type: 'printer', 
    status: 'connected', 
    model: 'Zebra ZD420',
    lastSeen: 'Acum',
    icon: <Tag className="w-6 h-6" />
  },
  { 
    id: '5', 
    name: 'Cashmatic SelfPay 1060', 
    type: 'payment', 
    status: 'connected', 
    model: 'Cashmatic SelfPay 1060',
    lastSeen: 'Acum',
    icon: <Banknote className="w-6 h-6" />
  },
  { 
    id: '6', 
    name: 'POS Bancar (Kiosk)', 
    type: 'payment', 
    status: 'connected', 
    model: 'Ingenico Move 5000',
    lastSeen: 'Acum',
    icon: <CreditCard className="w-6 h-6" />
  },
  { 
    id: '7', 
    name: 'POS Bancar (Casă)', 
    type: 'payment', 
    status: 'disconnected', 
    model: 'Ingenico Move 5000',
    lastSeen: 'Acum 15 min',
    icon: <CreditCard className="w-6 h-6" />
  },
  { 
    id: '8', 
    name: 'Display Client', 
    type: 'display', 
    status: 'connected', 
    model: 'Epson DM-D30',
    lastSeen: 'Acum',
    icon: <Monitor className="w-6 h-6" />
  },
  { 
    id: '9', 
    name: 'Scanner Cod Bare', 
    type: 'scanner', 
    status: 'connected', 
    model: 'Zebra DS2208',
    lastSeen: 'Acum',
    icon: <QrCode className="w-6 h-6" />
  },
];

const HardwareStatusModule: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'disconnected': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'busy': return 'text-primary';
    }
  };

  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'connected': 
        return <Badge variant="default" className="bg-success">Conectat</Badge>;
      case 'disconnected': 
        return <Badge variant="destructive">Deconectat</Badge>;
      case 'warning': 
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Atenție</Badge>;
      case 'busy': 
        return <Badge variant="secondary">Ocupat</Badge>;
    }
  };

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'disconnected': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'busy': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleReconnect = (deviceId: string) => {
    setDevices(devices.map(d => 
      d.id === deviceId ? { ...d, status: 'busy' as const } : d
    ));
    setTimeout(() => {
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, status: 'connected' as const, lastSeen: 'Acum' } : d
      ));
    }, 2000);
  };

  const handleTestPrint = (deviceId: string) => {
    setDevices(devices.map(d => 
      d.id === deviceId ? { ...d, status: 'busy' as const } : d
    ));
    setTimeout(() => {
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, status: 'connected' as const } : d
      ));
    }, 1500);
  };

  const connectedCount = devices.filter(d => d.status === 'connected').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const disconnectedCount = devices.filter(d => d.status === 'disconnected').length;

  const devicesByType = {
    printer: devices.filter(d => d.type === 'printer'),
    payment: devices.filter(d => d.type === 'payment'),
    display: devices.filter(d => d.type === 'display'),
    scanner: devices.filter(d => d.type === 'scanner'),
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader 
        title="Integrări Hardware" 
        description="Status echipamente și conexiuni"
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Conectate</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Avertismente</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{disconnectedCount}</p>
                <p className="text-sm text-muted-foreground">Deconectate</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Reîmprospătează
            </Button>
            <div className="flex items-center gap-2">
              <Switch checked={autoReconnect} onCheckedChange={setAutoReconnect} />
              <span className="text-sm text-muted-foreground">Reconectare automată</span>
            </div>
          </div>
        </div>

        {/* Printers */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Imprimante ({devicesByType.printer.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devicesByType.printer.map(device => (
              <Card key={device.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", 
                    device.status === 'connected' ? "bg-success/10" : 
                    device.status === 'warning' ? "bg-warning/10" : "bg-destructive/10"
                  )}>
                    <div className={getStatusColor(device.status)}>{device.icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{device.name}</h4>
                      {getStatusBadge(device.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{device.model}</p>
                    <p className="text-xs text-muted-foreground">Văzut: {device.lastSeen}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {device.status === 'disconnected' && (
                      <Button size="sm" variant="outline" onClick={() => handleReconnect(device.id)}>
                        Reconectează
                      </Button>
                    )}
                    {device.status === 'connected' && (
                      <Button size="sm" variant="outline" onClick={() => handleTestPrint(device.id)}>
                        Test Print
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Devices */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Dispozitive Plată ({devicesByType.payment.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devicesByType.payment.map(device => (
              <Card key={device.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", 
                    device.status === 'connected' ? "bg-success/10" : 
                    device.status === 'warning' ? "bg-warning/10" : "bg-destructive/10"
                  )}>
                    <div className={getStatusColor(device.status)}>{device.icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{device.name}</h4>
                      {getStatusBadge(device.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{device.model}</p>
                    <p className="text-xs text-muted-foreground">Văzut: {device.lastSeen}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {device.status === 'disconnected' && (
                      <Button size="sm" variant="outline" onClick={() => handleReconnect(device.id)}>
                        Reconectează
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Other Devices */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Usb className="w-5 h-5 text-primary" />
            Alte Dispozitive ({devicesByType.display.length + devicesByType.scanner.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...devicesByType.display, ...devicesByType.scanner].map(device => (
              <Card key={device.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", 
                    device.status === 'connected' ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    <div className={getStatusColor(device.status)}>{device.icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{device.name}</h4>
                      {getStatusBadge(device.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{device.model}</p>
                    <p className="text-xs text-muted-foreground">Văzut: {device.lastSeen}</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Connection Info */}
        <Card className="p-4 mt-6 bg-muted/50">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium">Rețea: Restaurant_POS_Network</p>
              <p className="text-sm text-muted-foreground">IP: 192.168.1.100 | Gateway: 192.168.1.1</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HardwareStatusModule;
