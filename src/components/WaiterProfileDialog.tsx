import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Order } from '@/data/mockData';
import { 
  UserCircle, Clock, ShoppingCart, TrendingUp, Star, 
  Utensils, Banknote, CreditCard, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaiterProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  orders: Order[];
  onLogout: () => void;
}

const WaiterProfileDialog: React.FC<WaiterProfileDialogProps> = ({ open, onClose, user, orders, onLogout }) => {
  if (!user) return null;

  const today = new Date();
  const todayStr = today.toDateString();

  // Orders for this waiter
  const myOrders = orders.filter(o => o.waiterName === user.name);
  const todayOrders = myOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
  const completedToday = todayOrders.filter(o => o.status === 'completed');
  const activeToday = todayOrders.filter(o => o.status === 'active');
  const cancelledToday = todayOrders.filter(o => o.status === 'cancelled');

  // Revenue today
  const todayRevenue = completedToday.reduce((s, o) => s + o.totalAmount, 0);
  const todayTips = completedToday.reduce((s, o) => s + (o.tip || 0), 0);
  const totalItems = todayOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);

  // Average order value
  const avgOrder = completedToday.length > 0 ? todayRevenue / completedToday.length : 0;

  // Payment breakdown
  const cashOrders = completedToday.filter(o => o.paymentMethod === 'cash');
  const cardOrders = completedToday.filter(o => o.paymentMethod === 'card');
  const cashTotal = cashOrders.reduce((s, o) => s + o.totalAmount, 0);
  const cardTotal = cardOrders.reduce((s, o) => s + o.totalAmount, 0);

  // All time stats
  const allCompleted = myOrders.filter(o => o.status === 'completed');
  const allRevenue = allCompleted.reduce((s, o) => s + o.totalAmount, 0);
  const allTips = allCompleted.reduce((s, o) => s + (o.tip || 0), 0);

  // Shift start (first order today)
  const shiftStart = todayOrders.length > 0
    ? new Date(Math.min(...todayOrders.map(o => new Date(o.createdAt).getTime())))
    : null;

  const shiftDuration = shiftStart
    ? Math.floor((today.getTime() - shiftStart.getTime()) / (1000 * 60))
    : 0;
  const shiftHours = Math.floor(shiftDuration / 60);
  const shiftMinutes = shiftDuration % 60;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Profilul Meu
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-2">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {user.avatar}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{user.name}</h3>
                <Badge variant="secondary" className="capitalize">{user.role === 'waiter' ? 'Ospătar' : user.role}</Badge>
                {shiftStart && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Tură activă: {shiftHours}h {shiftMinutes}m (din {shiftStart.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })})
                  </p>
                )}
              </div>
            </div>

            {/* Today Stats */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Statistici Azi</h4>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <ShoppingCart className="w-4 h-4" />
                    Comenzi
                  </div>
                  <p className="text-2xl font-bold">{todayOrders.length}</p>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-blue-500">{activeToday.length} active</span>
                    <span className="text-green-500">{completedToday.length} finalizate</span>
                    {cancelledToday.length > 0 && <span className="text-destructive">{cancelledToday.length} anulate</span>}
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Încasări
                  </div>
                  <p className="text-2xl font-bold">{todayRevenue.toFixed(0)} <span className="text-sm font-normal">RON</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Media: {avgOrder.toFixed(0)} RON/comandă</p>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Star className="w-4 h-4" />
                    Bacșișuri
                  </div>
                  <p className="text-2xl font-bold">{todayTips.toFixed(0)} <span className="text-sm font-normal">RON</span></p>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Utensils className="w-4 h-4" />
                    Produse servite
                  </div>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </Card>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Defalcare Plăți Azi</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-card border rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Banknote className="w-4 h-4" />
                    Cash
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{cashTotal.toFixed(2)} RON</span>
                    <span className="text-xs text-muted-foreground ml-2">({cashOrders.length} comenzi)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-card border rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4" />
                    Card
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{cardTotal.toFixed(2)} RON</span>
                    <span className="text-xs text-muted-foreground ml-2">({cardOrders.length} comenzi)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* All-time Stats */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Total General</h4>
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold">{allCompleted.length}</p>
                  <p className="text-xs text-muted-foreground">Comenzi</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold">{allRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">RON venituri</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-lg font-bold">{allTips.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">RON bacșișuri</p>
                </Card>
              </div>
            </div>

            {/* Recent orders */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Ultimele Comenzi</h4>
              <div className="space-y-1.5">
                {todayOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-card border rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary">#{order.id.slice(0, 6)}</span>
                      {order.tableNumber && <span>Masa {order.tableNumber}</span>}
                      <Badge variant={order.status === 'completed' ? 'default' : order.status === 'active' ? 'secondary' : 'destructive'} className="text-xs">
                        {order.status === 'completed' ? 'Finalizat' : order.status === 'active' ? 'Activ' : 'Anulat'}
                      </Badge>
                    </div>
                    <span className="font-medium">{order.totalAmount.toFixed(2)} RON</span>
                  </div>
                ))}
                {todayOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nicio comandă azi</p>
                )}
              </div>
            </div>

            {/* Logout */}
            <Button variant="destructive" className="w-full" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Închide Tura / Deconectare
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default WaiterProfileDialog;
