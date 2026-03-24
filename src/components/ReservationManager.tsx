import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Reservation, Table } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Calendar, Clock, Users, Phone, Mail, Plus, 
  Check, X, Edit2, Trash2, MapPin 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { reservationsApi, type ReservationApi } from '@/lib/api';

interface ReservationManagerProps {
  reservations: Reservation[];
  tables: Table[];
  onCreateReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
  onUpdateReservation: (reservation: Reservation) => void;
  onDeleteReservation: (id: number) => void;
}

const ReservationManager: React.FC<ReservationManagerProps> = ({
  reservations,
  tables,
  onCreateReservation,
  onUpdateReservation,
  onDeleteReservation,
}) => {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [apiReservations, setApiReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    partySize: '2',
    notes: '',
    source: 'phone' as Reservation['source'],
  });

  // Suggest tables based on party size
  const suggestTables = (partySize: number): number[] => {
    const sortedTables = [...tables]
      .filter((t) => availableTables.some((at) => at.id === t.id))
      .sort((a, b) => a.seats - b.seats);

    // First, try to find a single table that fits
    const singleTable = sortedTables.find(t => t.seats >= partySize);
    if (singleTable) {
      return [singleTable.id];
    }

    // If no single table fits, combine tables
    let remainingSeats = partySize;
    const selectedTables: number[] = [];
    
    // Start with largest tables
    const largestFirst = [...sortedTables].reverse();
    
    for (const table of largestFirst) {
      if (remainingSeats <= 0) break;
      selectedTables.push(table.id);
      remainingSeats -= table.seats;
    }

    if (remainingSeats > 0) {
      return []; // Not enough capacity
    }

    return selectedTables;
  };

  const [suggestedTableIds, setSuggestedTableIds] = useState<number[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);

  const mapApiReservation = (r: ReservationApi): Reservation => ({
    id: r.id,
    customerName: r.customerName,
    customerPhone: r.customerPhone ?? '',
    customerEmail: r.customerEmail ?? undefined,
    date: new Date(r.date),
    time: r.time,
    partySize: r.partySize,
    tableIds: r.reservationTables?.map((rt) => rt.tableId) ?? [],
    status: r.status,
    notes: r.notes ?? undefined,
    source: r.source,
    createdAt: new Date(r.createdAt),
  });

  const loadReservations = async (date?: string) => {
    setLoadingReservations(true);
    try {
      const list = await reservationsApi.getAll(date);
      setApiReservations(list.map(mapApiReservation));
    } catch {
      setApiReservations([]);
      toast({
        title: 'Nu s-au putut încărca rezervările din DB',
        description: 'Verifică backend-ul / baza de date.',
        variant: 'destructive',
      });
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    void loadReservations(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const reservationsList = apiReservations;

  const handlePartySizeChange = (size: string) => {
    setForm({ ...form, partySize: size });
    const suggested = suggestTables(parseInt(size));
    setSuggestedTableIds(suggested);
    setSelectedTableIds(suggested);
  };

  const availableTables = useMemo(() => {
    const blockedByReservation = new Set(
      reservationsList
        .filter((r) => {
          if (!['pending', 'confirmed', 'arrived'].includes(r.status)) return false;
          const sameDate = new Date(r.date).toDateString() === new Date(form.date).toDateString();
          return sameDate && r.time === form.time;
        })
        .flatMap((r) => r.tableIds),
    );
    return tables.filter((t) => !blockedByReservation.has(t.id));
  }, [tables, reservationsList, form.date, form.time]);

  const toggleSelectedTable = (tableId: number) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId],
    );
  };

  const handleSubmit = () => {
    if (!form.customerName || !form.customerPhone || selectedTableIds.length === 0) {
      toast({ title: 'Completează toate câmpurile', variant: 'destructive' });
      return;
    }

    reservationsApi
      .create({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        date: form.date,
        time: form.time,
        partySize: parseInt(form.partySize, 10),
        tableIds: selectedTableIds,
        status: 'pending',
        notes: form.notes || undefined,
        source: form.source,
      })
      .then(async () => {
        onCreateReservation({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          date: new Date(form.date),
          time: form.time,
          partySize: parseInt(form.partySize, 10),
          tableIds: selectedTableIds,
          status: 'pending',
          notes: form.notes || undefined,
          source: form.source,
        });
        await loadReservations(selectedDate);
        toast({ title: 'Rezervare creată cu succes' });
        setShowAddDialog(false);
        setForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          partySize: '2',
          notes: '',
          source: 'phone',
        });
        setSuggestedTableIds([]);
        setSelectedTableIds([]);
      })
      .catch((e) =>
        toast({
          title: 'Eroare la crearea rezervării',
          description: String(e),
          variant: 'destructive',
        }),
      );
  };

  const todayReservations = reservationsList.filter(r => 
    new Date(r.date).toDateString() === new Date(selectedDate).toDateString()
  );

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning border-warning';
      case 'confirmed': return 'bg-primary/20 text-primary border-primary';
      case 'arrived': return 'bg-success/20 text-success border-success';
      case 'completed': return 'bg-muted text-muted-foreground border-muted';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive';
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'În așteptare';
      case 'confirmed': return 'Confirmată';
      case 'arrived': return 'Sosit';
      case 'completed': return 'Finalizată';
      case 'cancelled': return 'Anulată';
    }
  };

  const timeSlots = [];
  for (let h = 12; h <= 22; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Rezervări</h2>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Rezervare nouă
        </Button>
      </div>

      {/* Reservations List */}
      <div className="flex-1 overflow-auto p-4">
        {todayReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nu sunt rezervări pentru această dată</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayReservations
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(reservation => (
                <div
                  key={reservation.id}
                  className="p-3 rounded-xl bg-card border border-border"
                >
                  {/* Header Row - Time, Status, Source */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xl font-bold">{reservation.time}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                      getStatusColor(reservation.status)
                    )}>
                      {getStatusLabel(reservation.status)}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {reservation.source === 'online' ? '🌐 Online' : '📞 Telefon'}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1 text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{reservation.customerName}</span>
                      <span className="text-muted-foreground shrink-0">({reservation.partySize} pers.)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{reservation.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        Mese: {reservation.tableIds.map(id => {
                          const table = tables.find(t => t.id === id);
                          return table?.number;
                        }).join(', ')}
                      </span>
                    </div>
                    {reservation.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{reservation.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  {reservation.notes && (
                    <p className="text-sm text-muted-foreground mb-2 italic truncate">
                      "{reservation.notes}"
                    </p>
                  )}

                  {/* Action Buttons - Stacked on small screens */}
                  <div className="flex flex-wrap gap-2">
                    {reservation.status === 'pending' && (
                      <Button
                        size="sm"
                        className="flex-1 min-w-[80px]"
                        onClick={() => {
                          reservationsApi
                            .update(reservation.id, { status: 'confirmed' })
                            .then(async () => {
                              onUpdateReservation({ ...reservation, status: 'confirmed' });
                              await loadReservations(selectedDate);
                            })
                            .catch(() =>
                              toast({ title: 'Eroare la actualizare', variant: 'destructive' }),
                            );
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirmă
                      </Button>
                    )}
                    {reservation.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="success"
                        className="flex-1 min-w-[80px]"
                        onClick={() => {
                          reservationsApi
                            .update(reservation.id, { status: 'arrived' })
                            .then(async () => {
                              onUpdateReservation({ ...reservation, status: 'arrived' });
                              await loadReservations(selectedDate);
                            })
                            .catch(() =>
                              toast({ title: 'Eroare la actualizare', variant: 'destructive' }),
                            );
                        }}
                      >
                        Sosit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="shrink-0"
                      onClick={() => {
                        reservationsApi
                          .delete(reservation.id)
                          .then(async () => {
                            onDeleteReservation(reservation.id);
                            await loadReservations(selectedDate);
                          })
                          .catch(() =>
                            toast({ title: 'Eroare la ștergere', variant: 'destructive' }),
                          );
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Reservation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rezervare nouă</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nume client *</label>
              <Input
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                placeholder="Nume complet"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Telefon *</label>
                <Input
                  value={form.customerPhone}
                  onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="07xxxxxxxx"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.customerEmail}
                  onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ora</label>
                <Select value={form.time} onValueChange={v => setForm({ ...form, time: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nr. persoane *</label>
                <Select value={form.partySize} onValueChange={handlePartySizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} persoane</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Sursa</label>
                <Select 
                  value={form.source} 
                  onValueChange={(v: Reservation['source']) => setForm({ ...form, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">📞 Telefon</SelectItem>
                    <SelectItem value="online">🌐 Online</SelectItem>
                    <SelectItem value="walk-in">🚶 Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Suggested Tables */}
            {parseInt(form.partySize) > 0 && (
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-sm font-medium mb-2">
                  Mese sugerate pentru {form.partySize} persoane:
                </p>
                {suggestedTableIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {suggestedTableIds.map(id => {
                      const table = tables.find(t => t.id === id);
                      return table ? (
                        <span key={id} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                          Masa {table.number} ({table.seats} loc.)
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nu sunt mese disponibile pentru această capacitate
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Selectează mesele *</label>
              <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-border p-2">
                {availableTables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nu sunt mese disponibile la data/ora selectată.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTables.map((table) => {
                      const selected = selectedTableIds.includes(table.id);
                      return (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => toggleSelectedTable(table.id)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-sm transition-colors',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:border-primary',
                          )}
                        >
                          Masa {table.number} ({table.seats})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Note</label>
              <Input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: Aniversare, alergie la gluten..."
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={selectedTableIds.length === 0 || loadingReservations}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Creează rezervare
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationManager;
