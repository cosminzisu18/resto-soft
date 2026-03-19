import React, { useState } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { Users, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TableMapProps {
  onTableSelect: (table: Table) => void;
  /** Când sunt furnizate, se folosesc aceste mese în locul celor din context (ex. din API). */
  tables?: Table[];
  /** Când e furnizat, se folosește pentru badge-ul de articole pe masă (ex. comanda din API). */
  getActiveOrderForTable?: (tableId: number) => { items: unknown[] } | undefined;
}

const TableMap: React.FC<TableMapProps> = ({ onTableSelect, tables: tablesProp, getActiveOrderForTable: getOrderProp }) => {
  const { tables: contextTables, getActiveOrderForTable: contextGetOrder, updateTable } = useRestaurant();
  const tables = tablesProp ?? contextTables;
  const getActiveOrderForTable = getOrderProp ?? contextGetOrder;
  const { toast } = useToast();
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<number[]>([]);

  const getTableShape = (shape: Table['shape']) => {
    switch (shape) {
      case 'round': return 'rounded-full';
      case 'rectangle': return 'rounded-xl aspect-[2/1]';
      default: return 'rounded-xl';
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'free': return 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/30';
      case 'occupied': return 'bg-blue-500/30 border-blue-500 hover:bg-blue-500/40';
      case 'reserved': return 'bg-amber-500/20 border-amber-500 hover:bg-amber-500/30';
    }
  };

  const handleTableClick = (table: Table) => {
    if (mergeMode) {
      if (table.status !== 'free') {
        toast({ title: 'Doar mesele libere pot fi unite', variant: 'destructive' });
        return;
      }
      setSelectedForMerge(prev => 
        prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]
      );
    } else {
      onTableSelect(table);
    }
  };

  const handleMergeTables = () => {
    if (selectedForMerge.length < 2) {
      toast({ title: 'Selectează cel puțin 2 mese', variant: 'destructive' });
      return;
    }
    const mainTable = tables.find(t => t.id === selectedForMerge[0]);
    if (mainTable) {
      updateTable({ ...mainTable, mergedWith: selectedForMerge.slice(1) });
      toast({ title: `Mese unite: ${selectedForMerge.map(id => tables.find(t => t.id === id)?.number).join(' + ')}` });
    }
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-3 p-3 md:p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Harta Restaurantului</h2>
        <div className="flex gap-3 ml-auto text-xs md:text-sm flex-wrap">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" />Liberă</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" />Ocupată</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" />Rezervată</span>
        </div>
        {!tablesProp && (
          <>
            <Button variant={mergeMode ? 'default' : 'outline'} size="sm" onClick={() => { setMergeMode(!mergeMode); setSelectedForMerge([]); }}>
              <Link2 className="w-4 h-4 mr-1" />{mergeMode ? 'Anulează' : 'Unește mese'}
            </Button>
            {mergeMode && selectedForMerge.length >= 2 && (
              <Button size="sm" onClick={handleMergeTables}>Confirmă ({selectedForMerge.length})</Button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 relative bg-secondary/30 overflow-auto p-4">
        {tablesProp !== undefined && tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground px-4">
            <p className="font-medium text-foreground mb-1">Nu există mese în baza de date</p>
            <p className="text-sm max-w-md">Adaugă mese din admin (sau asigură-te că backend-ul returnează rânduri în tabela <code className="text-xs bg-muted px-1 rounded">tables</code>). ID-urile meselor sunt numerice (auto-increment) în baza de date.</p>
          </div>
        ) : (
        <div className="relative min-h-[500px] min-w-full" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {tables.map(table => {
            const order = getActiveOrderForTable(table.id);
            const hasItems = order && order.items.length > 0;
            const isSelectedForMerge = selectedForMerge.includes(table.id);
            
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={cn(
                  "absolute transition-all duration-200 border-2 flex flex-col items-center justify-center gap-0.5 shadow-md hover:shadow-lg hover:scale-105 min-w-[70px] min-h-[70px] md:min-w-[90px] md:min-h-[90px]",
                  getTableShape(table.shape),
                  getStatusColor(table.status),
                  isSelectedForMerge && "ring-4 ring-primary ring-offset-2"
                )}
                style={{ left: `${table.position.x}%`, top: `${table.position.y}%`, transform: 'translate(-50%, -50%)', width: table.shape === 'rectangle' ? '120px' : '80px' }}
              >
                <span className="text-xl md:text-2xl font-bold">{table.number}</span>
                <span className="text-[10px] md:text-xs flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {table.status === 'occupied' && table.currentGuests ? `${table.currentGuests}/` : ''}{table.seats}
                </span>
                {table.mergedWith?.length ? <span className="text-[9px] text-muted-foreground">+{table.mergedWith.length}</span> : null}
                {hasItems && <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{order.items.length}</span>}
              </button>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default TableMap;
