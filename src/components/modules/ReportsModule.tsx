import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { FilterChips } from '@/components/ui/filter-chips';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const periodOptions = [
  { id: 'today', label: 'Astăzi' },
  { id: 'week', label: 'Săpt. aceasta' },
  { id: 'month', label: 'Luna aceasta' },
  { id: 'all', label: 'Totdeauna' },
];

const mockReceptions = [
  { id: 1, product: 'Gyros pui', supplier: 'furnizor testsx', user: 'User #1', date: '16.11.2025, 11:18', received: 40.00, returned: 20.00, returns: 1 },
  { id: 2, product: 'Carne vită', supplier: 'Meat Pro SRL', user: 'User #2', date: '16.11.2025, 10:30', received: 25.00, returned: 0, returns: 0 },
  { id: 3, product: 'Cartofi', supplier: 'Legume Fresh', user: 'User #1', date: '15.11.2025, 14:20', received: 100.00, returned: 5.00, returns: 1 },
];

export const ReportsModule: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Rapoarte" 
        description="Analiză și statistici"
      >
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      {/* Tabs */}
      <Tabs defaultValue="receptions" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="discarded">Aruncate</TabsTrigger>
          <TabsTrigger value="consumed">Consumate</TabsTrigger>
          <TabsTrigger value="prepared">Preparate</TabsTrigger>
          <TabsTrigger value="employees">Angajați</TabsTrigger>
          <TabsTrigger value="tasks">Sarcini</TabsTrigger>
          <TabsTrigger value="stock">Stoc</TabsTrigger>
          <TabsTrigger value="suppliers">Furnizori</TabsTrigger>
          <TabsTrigger value="receptions">Recepții & Returnări</TabsTrigger>
        </TabsList>

        <TabsContent value="receptions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Filtrează după nume
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Selectează un produs..." 
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Filtrează după perioadă
                  </label>
                  <FilterChips
                    options={periodOptions}
                    selected={selectedPeriod}
                    onChange={setSelectedPeriod}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Furnizor
                  </label>
                  <Input placeholder="Selectează furnizor" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status recepție
                  </label>
                  <FilterChips
                    options={[
                      { id: 'all', label: 'Toate' },
                      { id: 'complete', label: 'Complete' },
                      { id: 'returned', label: 'Returnate' },
                    ]}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  16 noi 2025 - 16 noi 2025
                </Button>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Recepționat"
              value="40.00"
              color="green"
            />
            <StatCard
              title="Total Returnat"
              value="20.00"
              color="red"
            />
            <StatCard
              title="Produse cu Returnări"
              value="1"
              color="orange"
            />
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Raport Recepții & Returnări
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {mockReceptions.length} produse
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PRODUS</TableHead>
                    <TableHead>FURNIZOR</TableHead>
                    <TableHead>RECEPȚIONAT DE</TableHead>
                    <TableHead>DATA & ORA RECEPȚIEI</TableHead>
                    <TableHead className="text-right">RECEPȚIONAT</TableHead>
                    <TableHead className="text-right">RETURNAT</TableHead>
                    <TableHead className="text-right">RETURNĂRI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReceptions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>{item.user}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success-soft">{item.received.toFixed(2)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.returned > 0 ? (
                          <Badge variant="destructive-soft">{item.returned.toFixed(2)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.returns > 0 ? (
                          <Badge variant="warning-soft">{item.returns}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder for other tabs */}
        {['discarded', 'consumed', 'prepared', 'employees', 'tasks', 'stock', 'suppliers'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Raport {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </h3>
                <p className="text-muted-foreground">
                  Acest modul va fi implementat în etapele următoare.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ReportsModule;