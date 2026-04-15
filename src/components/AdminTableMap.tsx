import React, { useState, useRef, useCallback } from 'react';
import { Table } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Users, QrCode, Printer, RotateCcw, Move, Link2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AdminTableMapProps {
  tables: Table[];
  onUpdateTable: (table: Table) => void;
  onPersistTable?: (table: Table) => Promise<void> | void;
  onSaveSchema?: () => void;
  onConfirmMerge?: (selectedIds: number[]) => void;
}

const AdminTableMap: React.FC<AdminTableMapProps> = ({
  tables,
  onUpdateTable,
  onPersistTable,
  onSaveSchema,
  onConfirmMerge,
}) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTable, setDraggingTable] = useState<number | null>(null);
  const [showQR, setShowQR] = useState<Table | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<number[]>([]);
  /** Masa selectată pentru mutare la click (apoi click pe plan o plasează). */
  const [selectedTableForMove, setSelectedTableForMove] = useState<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent, tableId: number) => {
    e.preventDefault();
    if (mergeMode) return;
    setDraggingTable(tableId);
  };

  const handleTableClick = (e: React.MouseEvent, tableId: number) => {
    if (mergeMode) {
      setSelectedForMerge((prev) =>
        prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
      );
      return;
    }
    e.stopPropagation();
    setSelectedTableForMove((prev) => (prev === tableId ? null : tableId));
  };

  /** Click pe plan: mută masa selectată la poziția click-ului. */
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mergeMode || !selectedTableForMove || !containerRef.current) return;
    if (e.target !== e.currentTarget) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    const table = tables.find((t) => t.id === selectedTableForMove);
    if (table) {
      onUpdateTable({ ...table, position: { x: Math.round(x), y: Math.round(y) } });
      setSelectedTableForMove(null);
      toast({ title: 'Poziție actualizată' });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingTable || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    
    const table = tables.find(t => t.id === draggingTable);
    if (table) {
      onUpdateTable({ ...table, position: { x: Math.round(x), y: Math.round(y) } });
    }
  }, [draggingTable, tables, onUpdateTable]);

  const handleMouseUp = async () => {
    if (draggingTable) {
      const updatedTable = tables.find((t) => t.id === draggingTable);
      if (updatedTable && onPersistTable) {
        try {
          await onPersistTable(updatedTable);
          toast({ title: 'Poziție actualizată și salvată' });
        } catch {
          toast({
            title: 'Poziție actualizată local',
            description: 'Salvarea în baza de date a eșuat. Încearcă din nou.',
            variant: 'destructive',
          });
        }
      } else {
        toast({ title: 'Poziție actualizată' });
      }
    }
    setDraggingTable(null);
  };

  const generateQRCode = (table: Table): string => {
    // Generate a unique QR code ID for the table
    return `TBL-${table.number}-${String(table.id).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`;
  };

  const regenerateQR = (table: Table) => {
    const newQR = generateQRCode(table);
    onUpdateTable({ ...table, qrCode: newQR });
    toast({ title: 'Cod QR regenerat' });
  };

  const getTableShape = (shape: Table['shape']) => {
    switch (shape) {
      case 'round': return 'rounded-full';
      case 'rectangle': return 'rounded-xl';
      default: return 'rounded-lg';
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'free': return 'bg-emerald-500';
      case 'occupied': return 'bg-blue-500';
      case 'reserved': return 'bg-amber-500';
    }
  };

  const handleConfirmMerge = () => {
    if (selectedForMerge.length < 2) {
      toast({ title: 'Selectează cel puțin 2 mese pentru unire', variant: 'destructive' });
      return;
    }
    onConfirmMerge?.(selectedForMerge);
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Move className="w-4 h-4" />
          <span>
            {mergeMode
              ? 'Click pe mese pentru a le selecta'
              : 'Click pe o masă, apoi pe plan unde vrei să o muți (sau trage pentru a repoziționa)'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" />Liberă</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" />Ocupată</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" />Rezervată</span>
          </div>
          {onSaveSchema && (
            <Button variant="default" size="sm" onClick={onSaveSchema} disabled={mergeMode}>
              <Save className="w-4 h-4 mr-1" />
              Salvează schema
            </Button>
          )}
          {onConfirmMerge && (
            <>
              <Button
                variant={mergeMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMergeMode((m) => !m); setSelectedForMerge([]); setSelectedTableForMove(null); }}
              >
                <Link2 className="w-4 h-4 mr-1" />
                {mergeMode ? 'Anulează unire' : 'Unește mese'}
              </Button>
              {mergeMode && selectedForMerge.length >= 2 && (
                <Button size="sm" onClick={handleConfirmMerge}>
                  Confirmă unire ({selectedForMerge.length})
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div 
        ref={containerRef}
        role="presentation"
        className="relative w-full aspect-[16/9] bg-secondary/30 rounded-xl border-2 border-dashed border-border cursor-crosshair select-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleContainerClick}
      >
        {tables.map(table => {
          const isSelectedForMerge = mergeMode && selectedForMerge.includes(table.id);
          return (
          <div
            key={table.id}
            role="button"
            tabIndex={0}
            onMouseDown={(e) => handleMouseDown(e, table.id)}
            onClick={(e) => handleTableClick(e, table.id)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-0.5 transition-shadow border-2 border-white/50",
              getTableShape(table.shape),
              getStatusColor(table.status),
              draggingTable === table.id && "shadow-2xl scale-110 z-50 cursor-grabbing",
              !draggingTable && !mergeMode && "cursor-pointer hover:shadow-lg hover:scale-105",
              mergeMode && "cursor-pointer",
              isSelectedForMerge && "ring-4 ring-primary ring-offset-2 ring-offset-background",
              selectedTableForMove === table.id && !mergeMode && "ring-4 ring-primary ring-offset-2 ring-offset-background",
              table.shape === 'rectangle' ? 'w-28 h-16' : table.seats <= 2 ? 'w-14 h-14' : table.seats <= 4 ? 'w-18 h-18' : 'w-22 h-22'
            )}
            style={{ left: `${table.position.x}%`, top: `${table.position.y}%`, width: table.shape === 'rectangle' ? '120px' : table.seats <= 2 ? '60px' : table.seats <= 4 ? '75px' : '90px', height: table.shape === 'rectangle' ? '60px' : undefined, aspectRatio: table.shape !== 'rectangle' ? '1' : undefined }}
          >
            <span className="text-lg font-bold text-white drop-shadow">{table.number}</span>
            <span className="text-[10px] text-white/80 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" />{table.seats}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowQR(table); }}
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            >
              <QrCode className="w-3.5 h-3.5 text-gray-700" />
            </button>
            {table.mergedWith?.length ? (
              <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">+{table.mergedWith.length}</span>
            ) : null}
          </div>
          );
        })}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cod QR - Masa {showQR?.number}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {/* Simulated QR Code */}
            <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-inner">
              <div className="w-full h-full border-4 border-black rounded flex items-center justify-center relative">
                <div className="absolute inset-2 grid grid-cols-8 grid-rows-8 gap-0.5">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className={cn("w-full h-full", Math.random() > 0.5 ? "bg-black" : "bg-white")} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold bg-white px-2">{showQR?.number}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono text-center">
              {showQR?.qrCode || generateQRCode(showQR!)}
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => showQR && regenerateQR(showQR)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Regenerează
              </Button>
              <Button className="flex-1" onClick={() => toast({ title: 'Printare QR...' })}>
                <Printer className="w-4 h-4 mr-2" />
                Printează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTableMap;
