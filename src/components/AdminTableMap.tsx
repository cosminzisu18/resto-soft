import React, { useState, useRef, useCallback } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { Users, QrCode, Printer, RotateCcw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AdminTableMapProps {
  tables: Table[];
  onUpdateTable: (table: Table) => void;
}

const AdminTableMap: React.FC<AdminTableMapProps> = ({ tables, onUpdateTable }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<Table | null>(null);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    setDraggingTable(tableId);
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

  const handleMouseUp = () => {
    if (draggingTable) {
      toast({ title: 'Poziție actualizată' });
    }
    setDraggingTable(null);
  };

  const generateQRCode = (table: Table): string => {
    // Generate a unique QR code ID for the table
    return `TBL-${table.number}-${table.id.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Move className="w-4 h-4" />
          <span>Trage mesele pentru a le repoziționa</span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" />Liberă</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" />Ocupată</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" />Rezervată</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full aspect-[16/9] bg-secondary/30 rounded-xl border-2 border-dashed border-border cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {tables.map(table => (
          <div
            key={table.id}
            onMouseDown={(e) => handleMouseDown(e, table.id)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-0.5 transition-shadow border-2 border-white/50",
              getTableShape(table.shape),
              getStatusColor(table.status),
              draggingTable === table.id ? "shadow-2xl scale-110 z-50 cursor-grabbing" : "cursor-grab hover:shadow-lg hover:scale-105",
              table.shape === 'rectangle' ? 'w-28 h-16' : table.seats <= 2 ? 'w-14 h-14' : table.seats <= 4 ? 'w-18 h-18' : 'w-22 h-22'
            )}
            style={{ left: `${table.position.x}%`, top: `${table.position.y}%`, width: table.shape === 'rectangle' ? '120px' : table.seats <= 2 ? '60px' : table.seats <= 4 ? '75px' : '90px', height: table.shape === 'rectangle' ? '60px' : undefined, aspectRatio: table.shape !== 'rectangle' ? '1' : undefined }}
          >
            <span className="text-lg font-bold text-white drop-shadow">{table.number}</span>
            <span className="text-[10px] text-white/80 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" />{table.seats}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowQR(table); }}
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            >
              <QrCode className="w-3.5 h-3.5 text-gray-700" />
            </button>
          </div>
        ))}
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
