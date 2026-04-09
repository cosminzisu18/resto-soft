import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  billingApi,
  type InvoiceApi,
  type SubscriptionPlanApi,
  type TenantWithSubscriptionRowApi,
} from '@/lib/api';
import {
  CreditCard,
  Users,
  TrendingUp,
  FileText,
  Check,
  Calendar,
  Building2,
  Crown,
  Sparkles,
  Zap,
  RefreshCw,
} from 'lucide-react';

function planIcon(code: string) {
  if (code === 'starter') return Zap;
  if (code === 'professional') return Sparkles;
  return Crown;
}

function formatMoney(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function subStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'Activ';
    case 'trialing':
      return 'Perioadă probă';
    case 'past_due':
      return 'Restanțier';
    case 'canceled':
      return 'Anulat';
    case 'paused':
      return 'Pauză';
    default:
      return 'Fără abonament';
  }
}

export const SubscriptionsAdminModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlanApi[]>([]);
  const [tenantRows, setTenantRows] = useState<TenantWithSubscriptionRowApi[]>([]);
  const [invoices, setInvoices] = useState<InvoiceApi[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const primaryTenantId = tenantRows[0]?.tenant?.id ?? null;

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([billingApi.getPlans(), billingApi.getTenants()]);
      setPlans(p);
      setTenantRows(t);
    } catch (e) {
      toast({
        title: 'Eroare billing',
        description: e instanceof Error ? e.message : 'Nu s-au putut încărca datele.',
        variant: 'destructive',
      });
      setPlans([]);
      setTenantRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async (tenantId: string) => {
    setInvoiceLoading(true);
    try {
      const list = await billingApi.getInvoices(tenantId);
      setInvoices(list);
    } catch {
      setInvoices([]);
      toast({ title: 'Facturi', description: 'Nu s-au putut încărca facturile.', variant: 'destructive' });
    } finally {
      setInvoiceLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (primaryTenantId) void loadInvoices(primaryTenantId);
  }, [primaryTenantId, loadInvoices]);

  const activeTenants = useMemo(
    () => tenantRows.filter((r) => r.subscription?.status === 'active').length,
    [tenantRows],
  );

  const mrr = useMemo(() => {
    let sum = 0;
    for (const row of tenantRows) {
      if (row.subscription?.status !== 'active' || !row.plan) continue;
      sum += parseFloat(row.plan.priceMonthRon) || 0;
    }
    return sum;
  }, [tenantRows]);

  const pendingInvoices = useMemo(() => invoices.filter((i) => i.status === 'open').length, [invoices]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl">
              <CreditCard className="h-8 w-8 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Abonamente & Facturare</h1>
              <p className="text-muted-foreground">Multi-tenant — planuri, tenanți și facturi din API</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void loadCore()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reîncarcă
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tenanți activi (abonament)</p>
                    <p className="text-3xl font-bold text-foreground">{activeTenants}</p>
                  </div>
                  <Users className="h-8 w-8 text-success opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">MRR estimat</p>
                    <p className="text-3xl font-bold text-foreground">{mrr.toFixed(2)} RON</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Facturi deschise (tenant principal)</p>
                    <p className="text-3xl font-bold text-foreground">{invoiceLoading ? '…' : pendingInvoices}</p>
                  </div>
                  <FileText className="h-8 w-8 text-warning opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="subscriptions" className="gap-2">
                <Users className="h-4 w-4" />
                Tenanți
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

            <TabsContent value="subscriptions" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Limite</TableHead>
                        <TableHead>Preț / lună</TableHead>
                        <TableHead>Perioadă curentă până la</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenantRows.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Niciun tenant. Pornește backend-ul și verifică `/billing/tenants`.
                          </TableCell>
                        </TableRow>
                      )}
                      {tenantRows.map((row) => (
                        <TableRow key={row.tenant.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{row.tenant.name}</p>
                              <p className="text-sm text-muted-foreground">{row.tenant.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {row.plan ? (
                              <Badge variant="outline" className="gap-1">
                                {React.createElement(planIcon(row.plan.code), { className: 'h-3 w-3' })}
                                {row.plan.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.subscription?.status === 'active' ? 'default' : 'secondary'}>
                              {subStatusLabel(row.subscription?.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.plan ? (
                              <>
                                {row.plan.maxLocations == null ? '∞' : row.plan.maxLocations} loc. ·{' '}
                                {row.plan.maxUsers == null ? '∞' : row.plan.maxUsers} utiliz.
                              </>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.plan ? `${formatMoney(row.plan.priceMonthRon)} RON` : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {row.subscription?.currentPeriodEnd
                              ? new Date(row.subscription.currentPeriodEnd).toLocaleDateString('ro-RO')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="mt-6">
              {loading ? (
                <p className="text-muted-foreground">Se încarcă planurile…</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const Icon = planIcon(plan.code);
                    const activeOnPlan = tenantRows.filter(
                      (r) => r.subscription?.status === 'active' && r.plan?.code === plan.code,
                    ).length;
                    return (
                      <Card key={plan.id} className="relative overflow-hidden">
                        {plan.badge === 'popular' && (
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                            POPULAR
                          </div>
                        )}
                        <CardHeader className="text-center pb-2">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Icon className="h-8 w-8 text-primary" />
                          </div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <div className="mt-2">
                            <span className="text-4xl font-bold">{formatMoney(plan.priceMonthRon)}</span>
                            <span className="text-muted-foreground"> RON/lună</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {(plan.features ?? []).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-success shrink-0" />
                                <span className="text-sm text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Clienți activi (marketing)</span>
                              <span className="font-semibold">{plan.marketingActiveClients}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                              <span className="text-muted-foreground">Abonamente reale pe plan</span>
                              <span className="font-semibold">{activeOnPlan}</span>
                            </div>
                            <Progress
                              value={tenantRows.length ? Math.min(100, (activeOnPlan / tenantRows.length) * 100) : 0}
                              className="mt-2 h-2"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Facturi pentru tenant:{' '}
                <span className="font-medium text-foreground">
                  {primaryTenantId ? tenantRows[0]?.tenant.name ?? primaryTenantId : '—'}
                </span>
                {primaryTenantId && (
                  <Button variant="ghost" size="sm" onClick={() => void loadInvoices(primaryTenantId)}>
                    Reîncarcă facturi
                  </Button>
                )}
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nr.</TableHead>
                        <TableHead>Sumă</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Emisă</TableHead>
                        <TableHead>Descriere</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 && !invoiceLoading && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nicio factură. Se creează una demo la primul boot backend (INV-2026-0001).
                          </TableCell>
                        </TableRow>
                      )}
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono">{inv.invoiceNumber ?? inv.id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium">
                            {formatMoney(inv.amount)} {inv.currency}
                          </TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>{inv.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {inv.issuedAt ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(inv.issuedAt).toLocaleDateString('ro-RO')}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                            {inv.description ?? '—'}
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

export default SubscriptionsAdminModule;
