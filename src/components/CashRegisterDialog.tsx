import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Order } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Banknote, ArrowDownToLine, ArrowUpFromLine, Calculator, 
  FileText, Printer, Download, Clock, TrendingUp, CreditCard,
  Barcode, Plus, Minus
} from 'lucide-react';

interface CashOperation {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  reason: string;
  timestamp: Date;
  operator: string;
}

interface CashRegisterDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  operatorName: string;
}

const CashRegisterDialog: React.FC<CashRegisterDialogProps> = ({ open, onClose, orders, operatorName }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [operations, setOperations] = useState<CashOperation[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReason, setDepositReason] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [showXReport, setShowXReport] = useState(false);

  const today = new Date();
  const todayStr = today.toDateString();

  // Today's completed orders
  const todayCompleted = useMemo(() => 
    orders.filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === todayStr),
    [orders, todayStr]
  );

  // Cash received from orders
  const cashOrders = todayCompleted.filter(o => o.paymentMethod === 'cash');
  const cardOrders = todayCompleted.filter(o => o.paymentMethod === 'card');
  const usageCardOrders = todayCompleted.filter(o => o.paymentMethod === 'usage_card');

  const cashFromOrders = cashOrders.reduce((s, o) => s + o.totalAmount, 0);
  const cashTips = cashOrders.reduce((s, o) => s + (o.tip || 0), 0);
  const cardFromOrders = cardOrders.reduce((s, o) => s + o.totalAmount, 0);
  const cardTips = cardOrders.reduce((s, o) => s + (o.tip || 0), 0);
  const usageCardTotal = usageCardOrders.reduce((s, o) => s + o.totalAmount, 0);

  const totalRevenue = todayCompleted.reduce((s, o) => s + o.totalAmount, 0);
  const totalTips = todayCompleted.reduce((s, o) => s + (o.tip || 0), 0);

  // Operations today
  const todayOperations = operations.filter(op => op.timestamp.toDateString() === todayStr);
  const totalDeposits = todayOperations.filter(op => op.type === 'deposit').reduce((s, op) => s + op.amount, 0);
  const totalWithdrawals = todayOperations.filter(op => op.type === 'withdrawal').reduce((s, op) => s + op.amount, 0);

  // Expected cash in register
  const expectedCash = cashFromOrders + cashTips + totalDeposits - totalWithdrawals;

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Introduceți o sumă validă', variant: 'destructive' });
      return;
    }
    setOperations(prev => [...prev, {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      reason: depositReason || 'Depunere numerar',
      timestamp: new Date(),
      operator: operatorName,
    }]);
    toast({ title: 'Depunere înregistrată', description: `+${amount.toFixed(2)} RON` });
    setDepositAmount('');
    setDepositReason('');
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Introduceți o sumă validă', variant: 'destructive' });
      return;
    }
    if (amount > expectedCash) {
      toast({ title: 'Sumă insuficientă în casierie', description: `Disponibil: ${expectedCash.toFixed(2)} RON`, variant: 'destructive' });
      return;
    }
    setOperations(prev => [...prev, {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      reason: withdrawalReason || 'Retragere numerar',
      timestamp: new Date(),
      operator: operatorName,
    }]);
    toast({ title: 'Retragere înregistrată', description: `-${amount.toFixed(2)} RON` });
    setWithdrawalAmount('');
    setWithdrawalReason('');
  };

  const handleExportXReport = () => {
    const reportLines = [
      'RAPORT X - RestoPOS',
      `Data: ${today.toLocaleDateString('ro-RO')}`,
      `Ora: ${today.toLocaleTimeString('ro-RO')}`,
      `Operator: ${operatorName}`,
      '',
      '=== VÂNZĂRI ===',
      `Total comenzi finalizate: ${todayCompleted.length}`,
      `Venituri totale: ${totalRevenue.toFixed(2)} RON`,
      `Bacșișuri totale: ${totalTips.toFixed(2)} RON`,
      '',
      '=== DEFALCARE PLĂȚI ===',
      `Cash: ${cashFromOrders.toFixed(2)} RON (${cashOrders.length} comenzi)`,
      `  Bacșișuri cash: ${cashTips.toFixed(2)} RON`,
      `Card: ${cardFromOrders.toFixed(2)} RON (${cardOrders.length} comenzi)`,
      `  Bacșișuri card: ${cardTips.toFixed(2)} RON`,
      `Card Utilizare: ${usageCardTotal.toFixed(2)} RON (${usageCardOrders.length} comenzi)`,
      '',
      '=== OPERAȚIUNI CASIERIE ===',
      `Depuneri: +${totalDeposits.toFixed(2)} RON`,
      `Retrageri: -${totalWithdrawals.toFixed(2)} RON`,
      '',
      '=== SOLD CASIERIE ===',
      `Numerar din vânzări: ${cashFromOrders.toFixed(2)} RON`,
      `Bacșișuri cash: ${cashTips.toFixed(2)} RON`,
      `Depuneri: +${totalDeposits.toFixed(2)} RON`,
      `Retrageri: -${totalWithdrawals.toFixed(2)} RON`,
      `TOTAL NUMERAR ÎN CASIERIE: ${expectedCash.toFixed(2)} RON`,
    ];

    if (todayOperations.length > 0) {
      reportLines.push('', '=== ISTORIC OPERAȚIUNI ===');
      todayOperations.forEach(op => {
        reportLines.push(
          `${op.timestamp.toLocaleTimeString('ro-RO')} | ${op.type === 'deposit' ? 'DEPUNERE' : 'RETRAGERE'} | ${op.amount.toFixed(2)} RON | ${op.reason} | ${op.operator}`
        );
      });
    }

    const content = reportLines.join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raport-x-${today.toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Raport X exportat' });
  };

  const handlePrintXReport = () => {
    toast({ title: 'Se trimite la imprimantă...', description: 'Raportul X se printează' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Casierie
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Situație</TabsTrigger>
            <TabsTrigger value="operations" className="flex-1">Operațiuni</TabsTrigger>
            <TabsTrigger value="xreport" className="flex-1">Raport X</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-1">
                {/* Cash Balance */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Banknote className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Numerar în casierie</p>
                      <p className="text-3xl font-bold text-primary">{expectedCash.toFixed(2)} RON</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-3 pt-3 border-t border-primary/10">
                    <div className="flex justify-between">
                      <span>Din vânzări cash</span>
                      <span>+{cashFromOrders.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bacșișuri cash</span>
                      <span>+{cashTips.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depuneri</span>
                      <span>+{totalDeposits.toFixed(2)} RON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retrageri</span>
                      <span>-{totalWithdrawals.toFixed(2)} RON</span>
                    </div>
                  </div>
                </Card>

                {/* Revenue Overview */}
                <div className="grid grid-cols-3 gap-2">
                  <Card className="p-3 text-center">
                    <Banknote className="w-4 h-4 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{cashFromOrders.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Cash ({cashOrders.length})</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">{cardFromOrders.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Card ({cardOrders.length})</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <Barcode className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-bold">{usageCardTotal.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Utilizare ({usageCardOrders.length})</p>
                  </Card>
                </div>

                {/* Total Summary */}
                <Card className="p-3">
                  <div className="flex justify-between text-sm">
                    <span>Total venituri azi</span>
                    <span className="font-bold">{totalRevenue.toFixed(2)} RON</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Total bacșișuri</span>
                    <span>{totalTips.toFixed(2)} RON</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Comenzi finalizate</span>
                    <span>{todayCompleted.length}</span>
                  </div>
                </Card>

                {/* Recent Operations */}
                {todayOperations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Operațiuni Recente</h4>
                    <div className="space-y-1.5">
                      {todayOperations.slice(-5).reverse().map(op => (
                        <div key={op.id} className="flex items-center justify-between p-2 bg-card border rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            {op.type === 'deposit' 
                              ? <ArrowDownToLine className="w-4 h-4 text-green-500" />
                              : <ArrowUpFromLine className="w-4 h-4 text-red-500" />
                            }
                            <div>
                              <span className="font-medium">{op.reason}</span>
                              <p className="text-xs text-muted-foreground">
                                {op.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} • {op.operator}
                              </p>
                            </div>
                          </div>
                          <span className={cn("font-medium", op.type === 'deposit' ? "text-green-600" : "text-red-600")}>
                            {op.type === 'deposit' ? '+' : '-'}{op.amount.toFixed(2)} RON
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="flex-1 overflow-auto mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                {/* Deposit */}
                <Card className="p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <ArrowDownToLine className="w-4 h-4 text-green-500" />
                    Depunere Numerar
                  </h4>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Sumă (RON)"
                      className="h-12 text-lg"
                    />
                    <Input
                      value={depositReason}
                      onChange={(e) => setDepositReason(e.target.value)}
                      placeholder="Motiv (opțional)"
                    />
                    <div className="flex gap-2">
                      {[50, 100, 200, 500].map(amt => (
                        <Button
                          key={amt}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setDepositAmount(String(amt))}
                        >
                          {amt}
                        </Button>
                      ))}
                    </div>
                    <Button className="w-full" onClick={handleDeposit}>
                      <Plus className="w-4 h-4 mr-2" />
                      Depune
                    </Button>
                  </div>
                </Card>

                {/* Withdrawal */}
                <Card className="p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <ArrowUpFromLine className="w-4 h-4 text-red-500" />
                    Retragere Numerar
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Disponibil: <span className="font-bold text-foreground">{expectedCash.toFixed(2)} RON</span>
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="Sumă (RON)"
                      className="h-12 text-lg"
                    />
                    <Input
                      value={withdrawalReason}
                      onChange={(e) => setWithdrawalReason(e.target.value)}
                      placeholder="Motiv (opțional)"
                    />
                    <div className="flex gap-2">
                      {[50, 100, 200, 500].map(amt => (
                        <Button
                          key={amt}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setWithdrawalAmount(String(amt))}
                        >
                          {amt}
                        </Button>
                      ))}
                    </div>
                    <Button variant="destructive" className="w-full" onClick={handleWithdrawal}>
                      <Minus className="w-4 h-4 mr-2" />
                      Retrage
                    </Button>
                  </div>
                </Card>

                {/* All Operations History */}
                {todayOperations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Toate Operațiunile Azi</h4>
                    <div className="space-y-1.5">
                      {[...todayOperations].reverse().map(op => (
                        <div key={op.id} className="flex items-center justify-between p-2 bg-card border rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            {op.type === 'deposit' 
                              ? <ArrowDownToLine className="w-4 h-4 text-green-500" />
                              : <ArrowUpFromLine className="w-4 h-4 text-red-500" />
                            }
                            <div>
                              <span className="font-medium">{op.reason}</span>
                              <p className="text-xs text-muted-foreground">
                                {op.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} • {op.operator}
                              </p>
                            </div>
                          </div>
                          <span className={cn("font-medium", op.type === 'deposit' ? "text-green-600" : "text-red-600")}>
                            {op.type === 'deposit' ? '+' : '-'}{op.amount.toFixed(2)} RON
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* X Report Tab */}
          <TabsContent value="xreport" className="flex-1 overflow-auto mt-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-1">
                <div className="bg-muted rounded-xl p-4 font-mono text-sm space-y-1">
                  <div className="text-center font-bold text-base mb-2">RAPORT X</div>
                  <div className="text-center text-xs text-muted-foreground mb-3">
                    RestoPOS • {today.toLocaleDateString('ro-RO')} • {today.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Separator />

                  <div className="py-2">
                    <p className="font-bold mb-1">VÂNZĂRI</p>
                    <div className="flex justify-between"><span>Comenzi finalizate:</span><span>{todayCompleted.length}</span></div>
                    <div className="flex justify-between"><span>Venituri totale:</span><span>{totalRevenue.toFixed(2)} RON</span></div>
                    <div className="flex justify-between"><span>Bacșișuri totale:</span><span>{totalTips.toFixed(2)} RON</span></div>
                  </div>
                  <Separator />

                  <div className="py-2">
                    <p className="font-bold mb-1">DEFALCARE PLĂȚI</p>
                    <div className="flex justify-between"><span>Cash ({cashOrders.length}):</span><span>{cashFromOrders.toFixed(2)} RON</span></div>
                    <div className="flex justify-between text-xs text-muted-foreground"><span>  └ Bacșișuri cash:</span><span>{cashTips.toFixed(2)} RON</span></div>
                    <div className="flex justify-between"><span>Card ({cardOrders.length}):</span><span>{cardFromOrders.toFixed(2)} RON</span></div>
                    <div className="flex justify-between text-xs text-muted-foreground"><span>  └ Bacșișuri card:</span><span>{cardTips.toFixed(2)} RON</span></div>
                    <div className="flex justify-between"><span>Card Utilizare ({usageCardOrders.length}):</span><span>{usageCardTotal.toFixed(2)} RON</span></div>
                  </div>
                  <Separator />

                  <div className="py-2">
                    <p className="font-bold mb-1">CASIERIE</p>
                    <div className="flex justify-between"><span>Depuneri:</span><span>+{totalDeposits.toFixed(2)} RON</span></div>
                    <div className="flex justify-between"><span>Retrageri:</span><span>-{totalWithdrawals.toFixed(2)} RON</span></div>
                  </div>
                  <Separator />

                  <div className="py-2">
                    <p className="font-bold mb-1">SOLD FINAL</p>
                    <div className="flex justify-between text-base font-bold">
                      <span>NUMERAR ÎN CASIERIE:</span>
                      <span className="text-primary">{expectedCash.toFixed(2)} RON</span>
                    </div>
                  </div>
                  <Separator />

                  {todayOperations.length > 0 && (
                    <div className="py-2">
                      <p className="font-bold mb-1">OPERAȚIUNI ({todayOperations.length})</p>
                      {todayOperations.map(op => (
                        <div key={op.id} className="flex justify-between text-xs">
                          <span>{op.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} {op.type === 'deposit' ? 'DEP' : 'RET'} - {op.reason}</span>
                          <span>{op.type === 'deposit' ? '+' : '-'}{op.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center text-xs text-muted-foreground mt-2">
                    Operator: {operatorName}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handlePrintXReport}>
                    <Printer className="w-4 h-4 mr-2" />
                    Printează
                  </Button>
                  <Button className="flex-1" onClick={handleExportXReport}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportă
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterDialog;
