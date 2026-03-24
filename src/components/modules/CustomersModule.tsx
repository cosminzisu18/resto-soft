import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, UserCircle, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  customersApi,
  type CustomerApi,
  type CreateCustomerBody,
  type UpdateCustomerBody,
} from '@/lib/api';

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyForm: CustomerFormState = {
  name: '',
  phone: '',
  email: '',
  notes: '',
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ro-RO');
};

const CustomersModule: React.FC = () => {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<CustomerApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerApi | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerApi | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await customersApi.getAll();
      setCustomers(list);
    } catch (e) {
      toast({
        title: 'Eroare la încărcarea clienților',
        description: String(e),
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q),
    );
  }, [customers, search]);

  const openCreateDialog = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setShowCustomerDialog(true);
  };

  const openEditDialog = (customer: CustomerApi) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      notes: customer.notes ?? '',
    });
    setShowCustomerDialog(true);
  };

  const submitCustomer = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Numele clientului este obligatoriu', variant: 'destructive' });
      return;
    }

    const payload: CreateCustomerBody | UpdateCustomerBody = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editingCustomer) {
        const updated = await customersApi.update(editingCustomer.id, payload);
        if (updated) {
          setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated);
        }
        toast({ title: 'Client actualizat' });
      } else {
        const created = await customersApi.create(payload as CreateCustomerBody);
        setCustomers((prev) => [created, ...prev]);
        toast({ title: 'Client adăugat' });
      }
      setShowCustomerDialog(false);
      setForm(emptyForm);
      setEditingCustomer(null);
    } catch (e) {
      toast({ title: 'Eroare la salvare client', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (customer: CustomerApi) => {
    if (!window.confirm(`Ștergi clientul "${customer.name}"?`)) return;
    try {
      await customersApi.delete(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(null);
      toast({ title: 'Client șters' });
    } catch (e) {
      toast({ title: 'Eroare la ștergere client', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-4 sm:p-6 flex-1 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Clienți</h1>
          <p className="text-muted-foreground">Gestionare clienți din baza de date</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Caută după nume, telefon, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => void loadCustomers()} disabled={loading}>
            Reîncarcă
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Adaugă client
          </Button>
        </div>

        {selectedCustomer ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedCustomer(null)}>
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Înapoi la listă
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Detalii client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{selectedCustomer.phone || '-'}</p>
                    <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{selectedCustomer.email || '-'}</p>
                    <p className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />Creat la: {formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observații</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedCustomer.notes || '-'}</p>
                  </div>
                  <div>
                    <Badge variant="outline">{(selectedCustomer.orderHistory ?? []).length} comenzi în istoric</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            {loading && customers.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Se încarcă clienții...</CardContent></Card>
            ) : filteredCustomers.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Nu există clienți.</CardContent></Card>
            ) : (
              filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-primary" />
                          <p className="font-semibold truncate">{customer.name}</p>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone || '-'}</span>
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(customer); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); void deleteCustomer(customer); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Editează client' : 'Adaugă client'}</DialogTitle>
            <DialogDescription>
              Completează datele clientului. Poți actualiza ulterior orice câmp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nume *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Observații</Label>
              <Textarea rows={4} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>Anulează</Button>
            <Button onClick={() => void submitCustomer()} disabled={saving}>
              {saving ? 'Se salvează...' : 'Salvează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersModule;
