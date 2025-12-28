import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  CreditCard,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Send,
  RefreshCw,
  Building2,
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';

// Mock data pentru abonamente
const mockSubscriptions = [
  { 
    id: 1, 
    clientName: 'Restaurant La Mama', 
    email: 'contact@lamama.ro',
    plan: 'business',
    status: 'active',
    startDate: '2024-01-01',
    nextBilling: '2024-02-01',
    amount: 499,
    locations: 3,
    users: 15,
    features: ['POS', 'KDS', 'Stocuri', 'Rapoarte', 'AI']
  },
  { 
    id: 2, 
    clientName: 'Pizzeria Napoli', 
    email: 'info@napoli.ro',
    plan: 'starter',
    status: 'active',
    startDate: '2024-01-10',
    nextBilling: '2024-02-10',
    amount: 149,
    locations: 1,
    users: 5,
    features: ['POS', 'KDS']
  },
  { 
    id: 3, 
    clientName: 'Bistro Central', 
    email: 'office@bistrocentral.ro',
    plan: 'professional',
    status: 'pending',
    startDate: '2024-01-15',
    nextBilling: '2024-02-15',
    amount: 299,
    locations: 2,
    users: 10,
    features: ['POS', 'KDS', 'Stocuri', 'Rapoarte']
  },
  { 
    id: 4, 
    clientName: 'Casa Veche', 
    email: 'rezervari@casaveche.ro',
    plan: 'business',
    status: 'overdue',
    startDate: '2023-11-01',
    nextBilling: '2024-01-01',
    amount: 499,
    locations: 4,
    users: 20,
    features: ['POS', 'KDS', 'Stocuri', 'Rapoarte', 'AI']
  },
  { 
    id: 5, 
    clientName: 'Fast Food Express', 
    email: 'comenzi@ffexpress.ro',
    plan: 'starter',
    status: 'cancelled',
    startDate: '2023-09-01',
    nextBilling: '-',
    amount: 0,
    locations: 1,
    users: 3,
    features: ['POS']
  },
];

// Mock facturi
const mockInvoices = [
  { id: 'INV-2024-001', client: 'Restaurant La Mama', date: '2024-01-01', amount: 499, status: 'paid', dueDate: '2024-01-15' },
  { id: 'INV-2024-002', client: 'Pizzeria Napoli', date: '2024-01-10', amount: 149, status: 'paid', dueDate: '2024-01-25' },
  { id: 'INV-2024-003', client: 'Bistro Central', date: '2024-01-15', amount: 299, status: 'pending', dueDate: '2024-01-30' },
  { id: 'INV-2024-004', client: 'Casa Veche', date: '2024-01-01', amount: 499, status: 'overdue', dueDate: '2024-01-15' },
  { id: 'INV-2024-005', client: 'Restaurant La Mama', date: '2023-12-01', amount: 499, status: 'paid', dueDate: '2023-12-15' },
  { id: 'INV-2024-006', client: 'Pizzeria Napoli', date: '2023-12-10', amount: 149, status: 'paid', dueDate: '2023-12-25' },
];

// Planuri disponibile
const plans = [
  { 
    id: 'starter', 
    name: 'Starter', 
    price: 149, 
    icon: Zap,
    features: ['1 Locație', '5 Utilizatori', 'POS Basic', 'KDS', 'Email Support'],
    color: 'text-info'
  },
  { 
    id: 'professional', 
    name: 'Professional', 
    price: 299, 
    icon: Sparkles,
    features: ['3 Locații', '15 Utilizatori', 'POS Complet', 'KDS', 'Stocuri', 'Rapoarte', 'Chat Support'],
    color: 'text-primary'
  },
  { 
    id: 'business', 
    name: 'Business', 
    price: 499, 
    icon: Crown,
    features: ['Locații Nelimitate', 'Utilizatori Nelimitați', 'Toate Modulele', 'AI & Automatizări', 'API Access', 'Priority Support'],
    color: 'text-warning'
  },
];

export const SubscriptionsAdminModule: React.FC = () => {
  const [subscriptions] = useState(mockSubscriptions);
  const [invoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<typeof mockSubscriptions[0] | null>(null);

  // Stats
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const totalMRR = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
  const overdueCount = subscriptions.filter(s => s.status === 'overdue').length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30">Activ</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">În așteptare</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Restanțier</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Anulat</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const planData = plans.find(p => p.id === plan);
    if (!planData) return <Badge variant="outline">{plan}</Badge>;
    
    return (
      <Badge variant="outline" className={`gap-1 ${planData.color}`}>
        <planData.icon className="h-3 w-3" />
        {planData.name}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl">
              <CreditCard className="h-8 w-8 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Abonamente & Facturare</h1>
              <p className="text-muted-foreground">Gestionare abonamente clienți platformă</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Trimite Reminder
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clienți Activi</p>
                    <p className="text-3xl font-bold text-foreground">{activeCount}</p>
                  </div>
                  <div className="p-3 bg-success/20 rounded-lg">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-success mt-2">+2 luna aceasta</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">MRR Total</p>
                    <p className="text-3xl font-bold text-foreground">{totalMRR.toLocaleString()} RON</p>
                  </div>
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-primary mt-2">+12% vs. luna trecută</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Restanțieri</p>
                    <p className="text-3xl font-bold text-foreground">{overdueCount}</p>
                  </div>
                  <div className="p-3 bg-destructive/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <p className="text-xs text-destructive mt-2">Necesită atenție</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Facturi Pending</p>
                    <p className="text-3xl font-bold text-foreground">{pendingInvoices}</p>
                  </div>
                  <div className="p-3 bg-warning/20 rounded-lg">
                    <FileText className="h-6 w-6 text-warning" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">De încasat</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="subscriptions" className="gap-2">
                <Users className="h-4 w-4" />
                Abonamente
              </TabsTrigger>
              <TabsTrigger value="plans" className="gap-2">
                <Crown className="h-4 w-4" />
                Planuri
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <FileText className="h-4 w-4" />
                Facturi
              </TabsTrigger>
            </TabsList>

            {/* Subscriptions List */}
            <TabsContent value="subscriptions" className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Caută client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">În așteptare</SelectItem>
                    <SelectItem value="overdue">Restanțieri</SelectItem>
                    <SelectItem value="cancelled">Anulate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Locații</TableHead>
                        <TableHead>Utilizatori</TableHead>
                        <TableHead>Sumă/lună</TableHead>
                        <TableHead>Următoarea facturare</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{sub.clientName}</p>
                              <p className="text-sm text-muted-foreground">{sub.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {sub.locations}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {sub.users}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{sub.amount} RON</TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {sub.nextBilling}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  setShowPaymentModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {sub.status === 'overdue' && (
                                <Button variant="ghost" size="sm" className="text-warning">
                                  <Send className="h-4 w-4" />
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
            </TabsContent>

            {/* Plans */}
            <TabsContent value="plans" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const PlanIcon = plan.icon;
                  const subscribersCount = subscriptions.filter(s => s.plan === plan.id && s.status === 'active').length;
                  
                  return (
                    <Card key={plan.id} className="relative overflow-hidden">
                      {plan.id === 'business' && (
                        <div className="absolute top-0 right-0 bg-warning text-warning-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                          POPULAR
                        </div>
                      )}
                      <CardHeader className="text-center pb-2">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-${plan.id === 'starter' ? 'info' : plan.id === 'professional' ? 'primary' : 'warning'}/20 to-transparent flex items-center justify-center`}>
                          <PlanIcon className={`h-8 w-8 ${plan.color}`} />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                          <span className="text-muted-foreground"> RON/lună</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-success" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Clienți activi</span>
                            <span className="font-semibold text-foreground">{subscribersCount}</span>
                          </div>
                          <Progress value={(subscribersCount / subscriptions.length) * 100} className="mt-2 h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Invoices */}
            <TabsContent value="invoices" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrează
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ultima lună
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nr. Factură</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Data Emitere</TableHead>
                        <TableHead>Scadență</TableHead>
                        <TableHead>Sumă</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono font-medium">{invoice.id}</TableCell>
                          <TableCell className="font-medium text-foreground">{invoice.client}</TableCell>
                          <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                          <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                          <TableCell className="font-medium">{invoice.amount} RON</TableCell>
                          <TableCell>
                            {invoice.status === 'paid' && (
                              <Badge className="bg-success/20 text-success border-success/30">
                                <Check className="h-3 w-3 mr-1" />
                                Plătit
                              </Badge>
                            )}
                            {invoice.status === 'pending' && (
                              <Badge className="bg-warning/20 text-warning border-warning/30">
                                <Clock className="h-3 w-3 mr-1" />
                                În așteptare
                              </Badge>
                            )}
                            {invoice.status === 'overdue' && (
                              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Restant
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              {invoice.status !== 'paid' && (
                                <Button variant="ghost" size="sm" className="text-warning">
                                  <Send className="h-4 w-4" />
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
            </TabsContent>
          </Tabs>

          {/* Payment Modal */}
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Detalii Abonament</DialogTitle>
              </DialogHeader>
              {selectedSubscription && (
                <div className="space-y-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedSubscription.clientName}</h3>
                      <p className="text-sm text-muted-foreground">{selectedSubscription.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Plan Curent</p>
                      <div className="mt-1">{getPlanBadge(selectedSubscription.plan)}</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Schimbă Plan</Label>
                    <Select defaultValue={selectedSubscription.plan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price} RON/lună
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 border border-border rounded-xl space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Formular Plată (Mock)
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Număr Card</Label>
                        <Input placeholder="4242 4242 4242 4242" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expirare</Label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input placeholder="123" type="password" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Nume Titular</Label>
                        <Input placeholder="NUME PRENUME" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                    <span className="font-medium text-foreground">Total de plată</span>
                    <span className="text-2xl font-bold text-primary">{selectedSubscription.amount} RON</span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Anulează</Button>
                <Button onClick={() => {
                  setShowPaymentModal(false);
                  toast({ title: "Plată procesată", description: "Abonamentul a fost actualizat cu succes." });
                }}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Procesează Plata
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SubscriptionsAdminModule;
