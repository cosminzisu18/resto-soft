import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, Plus, Upload, Download, Building2, Phone, Mail, 
  MapPin, Clock, CheckCircle2, AlertCircle, Eye, Edit, Truck, Calendar
} from 'lucide-react';

interface Invoice {
  id: number;
  number: string;
  supplier: string;
  date: string;
  dueDate: string;
  total: number;
  status: 'pending' | 'received' | 'processed';
  items: number;
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  lastOrder: string;
  totalOrders: number;
  rating: number;
}

interface ActivityLog {
  id: number;
  type: 'nir' | 'invoice' | 'transfer' | 'inventory' | 'order';
  description: string;
  user: string;
  timestamp: string;
  details?: string;
}

const mockInvoices: Invoice[] = [
  { id: 1, number: 'FAC-2024-1234', supplier: 'Metro Cash & Carry', date: '28.12.2024', dueDate: '27.01.2025', total: 4580, status: 'pending', items: 24 },
  { id: 2, number: 'FAC-2024-1233', supplier: 'Selgros', date: '27.12.2024', dueDate: '26.01.2025', total: 2340, status: 'received', items: 15 },
  { id: 3, number: 'FAC-2024-1232', supplier: 'Distribuitorul Local SRL', date: '26.12.2024', dueDate: '25.01.2025', total: 1890, status: 'processed', items: 8 },
  { id: 4, number: 'FAC-2024-1231', supplier: 'Lactate Premium', date: '25.12.2024', dueDate: '24.01.2025', total: 3200, status: 'processed', items: 12 },
];

const mockSuppliers: Supplier[] = [
  { id: 1, name: 'Metro Cash & Carry', contact: 'Ion Marinescu', phone: '0722 123 456', email: 'comenzi@metro.ro', address: 'Str. Principală nr. 100, București', category: 'General', lastOrder: '28.12.2024', totalOrders: 156, rating: 4.8 },
  { id: 2, name: 'Selgros', contact: 'Maria Popescu', phone: '0733 234 567', email: 'comenzi@selgros.ro', address: 'Bd. Industrial nr. 50, București', category: 'General', lastOrder: '27.12.2024', totalOrders: 89, rating: 4.5 },
  { id: 3, name: 'Lactate Premium', contact: 'Andrei Ionescu', phone: '0744 345 678', email: 'comenzi@lactatepremium.ro', address: 'Str. Fermei nr. 25, Brașov', category: 'Lactate', lastOrder: '25.12.2024', totalOrders: 45, rating: 4.9 },
  { id: 4, name: 'Carmangerie Artizanală', contact: 'Gheorghe Marin', phone: '0755 456 789', email: 'comenzi@carmangerie.ro', address: 'Str. Meșterilor nr. 15, Sibiu', category: 'Carne', lastOrder: '24.12.2024', totalOrders: 67, rating: 4.7 },
];

const activityLog: ActivityLog[] = [
  { id: 1, type: 'nir', description: 'NIR generat pentru factură FAC-2024-1233', user: 'Ion Popescu', timestamp: '28.12.2024 14:30', details: '15 produse recepționate' },
  { id: 2, type: 'invoice', description: 'Factură nouă primită de la Metro', user: 'Maria Ionescu', timestamp: '28.12.2024 10:15', details: 'FAC-2024-1234 - 4,580 RON' },
  { id: 3, type: 'transfer', description: 'Transfer stoc aprobat', user: 'Admin', timestamp: '28.12.2024 09:45', details: '5kg Mozzarella: Depozit → Bucătărie' },
  { id: 4, type: 'inventory', description: 'Inventar finalizat - Bucătărie', user: 'Ion Popescu', timestamp: '27.12.2024 18:00', details: '45 produse, diferență: -234 RON' },
  { id: 5, type: 'order', description: 'Comandă trimisă la Selgros', user: 'Maria Ionescu', timestamp: '27.12.2024 11:30', details: '8 produse, valoare: 1,250 RON' },
];

export const PrimaryManagement: React.FC = () => {
  const [showNirDialog, setShowNirDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleExport = (format: 'fgo' | 'excel' | 'pdf') => {
    const formatNames = { fgo: 'FGO (SAGA)', excel: 'Excel', pdf: 'PDF' };
    toast({ title: "Export inițiat", description: `Se exportă în format ${formatNames[format]}...` });
  };

  const handleGenerateNir = () => {
    toast({ title: "NIR generat", description: "Nota de Intrare Recepție a fost generată" });
    setShowNirDialog(false);
  };

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'nir': return <FileText className="h-4 w-4" />;
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'transfer': return <Truck className="h-4 w-4" />;
      case 'inventory': return <CheckCircle2 className="h-4 w-4" />;
      case 'order': return <Truck className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'nir': return 'bg-blue-500';
      case 'invoice': return 'bg-purple-500';
      case 'transfer': return 'bg-orange-500';
      case 'inventory': return 'bg-green-500';
      case 'order': return 'bg-primary';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">Facturi</TabsTrigger>
          <TabsTrigger value="nir">NIR</TabsTrigger>
          <TabsTrigger value="suppliers">Furnizori</TabsTrigger>
          <TabsTrigger value="activity">Jurnal Activitate</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Actions Row */}
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import SPV (Mock)
            </Button>
            <Button onClick={() => { setSelectedInvoice(null); setShowInvoiceDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Factură Manuală
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => handleExport('fgo')}>
                <Download className="h-4 w-4 mr-2" />
                FGO (SAGA)
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr. Factură</TableHead>
                    <TableHead>Furnizor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Scadență</TableHead>
                    <TableHead>Produse</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{invoice.supplier}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{invoice.items}</TableCell>
                      <TableCell className="font-semibold">{invoice.total.toLocaleString()} RON</TableCell>
                      <TableCell>
                        <Badge 
                          variant={invoice.status === 'processed' ? 'default' : invoice.status === 'received' ? 'secondary' : 'outline'}
                          className={invoice.status === 'processed' ? 'bg-green-500' : ''}
                        >
                          {invoice.status === 'pending' && 'În așteptare'}
                          {invoice.status === 'received' && 'Recepționat'}
                          {invoice.status === 'processed' && 'Procesat'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'processed' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => { setSelectedInvoice(invoice); setShowNirDialog(true); }}
                            >
                              <FileText className="h-4 w-4" />
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

        <TabsContent value="nir" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formular NIR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Număr NIR</Label>
                  <Input placeholder="Auto-generat" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Data recepție</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Furnizor</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selectează furnizor" /></SelectTrigger>
                    <SelectContent>
                      {mockSuppliers.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Factură asociată</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selectează factură" /></SelectTrigger>
                    <SelectContent>
                      {mockInvoices.map(i => (
                        <SelectItem key={i.id} value={i.id.toString()}>{i.number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Produse recepționate</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {[1, 2, 3].map((_, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-3 items-end">
                      <div className="col-span-2">
                        <Label className="text-xs">Produs</Label>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mozzarella">Mozzarella</SelectItem>
                            <SelectItem value="rosii">Roșii</SelectItem>
                            <SelectItem value="carne">Carne vită</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Cantitate</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div>
                        <Label className="text-xs">Unitate</Label>
                        <Select defaultValue="kg">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="buc">buc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Preț unitar</Label>
                        <Input type="number" placeholder="0.00" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă produs
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observații</Label>
                <Textarea placeholder="Observații despre recepție..." />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Anulează</Button>
                <Button onClick={handleGenerateNir}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generează NIR
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="flex justify-between items-center">
            <Input placeholder="Caută furnizor..." className="max-w-md" />
            <Button onClick={() => { setSelectedSupplier(null); setShowSupplierDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Furnizor Nou
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockSuppliers.map((supplier) => (
              <Card 
                key={supplier.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => { setSelectedSupplier(supplier); setShowSupplierDialog(true); }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{supplier.name}</h3>
                        <Badge variant="secondary" className="text-xs">{supplier.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{supplier.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Ultima comandă: </span>
                      <span className="font-medium">{supplier.lastOrder}</span>
                    </div>
                    <Badge variant="outline">{supplier.totalOrders} comenzi</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Jurnal Activitate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-6">
                    {activityLog.map((activity, idx) => (
                      <div key={activity.id} className="relative flex gap-4 pl-12">
                        {/* Timeline dot */}
                        <div className={`absolute left-3 w-5 h-5 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white`}>
                          {getActivityIcon(activity.type)}
                        </div>

                        <div className="flex-1 p-4 rounded-xl border bg-muted/30">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{activity.description}</p>
                              {activity.details && (
                                <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {activity.timestamp}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{activity.user}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* NIR Dialog */}
      <Dialog open={showNirDialog} onOpenChange={setShowNirDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generare NIR</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-medium">Factură: {selectedInvoice.number}</p>
                  <p className="text-sm text-muted-foreground">Furnizor: {selectedInvoice.supplier}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.items} produse - {selectedInvoice.total.toLocaleString()} RON</p>
                </div>
                <p className="text-muted-foreground">
                  Se va genera NIR pentru toate produsele din această factură. Stocurile vor fi actualizate automat.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNirDialog(false)}>Anulează</Button>
            <Button onClick={handleGenerateNir}>
              <FileText className="h-4 w-4 mr-2" />
              Generează NIR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Editare Furnizor' : 'Furnizor Nou'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nume companie</Label>
              <Input placeholder="Ex: Metro Cash & Carry" defaultValue={selectedSupplier?.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Persoană contact</Label>
                <Input placeholder="Nume complet" defaultValue={selectedSupplier?.contact} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input placeholder="0722 123 456" defaultValue={selectedSupplier?.phone} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@companie.ro" defaultValue={selectedSupplier?.email} />
              </div>
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select defaultValue={selectedSupplier?.category}>
                  <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Carne">Carne</SelectItem>
                    <SelectItem value="Lactate">Lactate</SelectItem>
                    <SelectItem value="Legume">Legume</SelectItem>
                    <SelectItem value="Băuturi">Băuturi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresă</Label>
              <Textarea placeholder="Adresa completă..." defaultValue={selectedSupplier?.address} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>Anulează</Button>
            <Button onClick={() => { 
              toast({ title: "Furnizor salvat" }); 
              setShowSupplierDialog(false); 
            }}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrimaryManagement;
