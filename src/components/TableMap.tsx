import React, { useState, useRef, useCallback } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { Users, Link2, Move, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TableMapProps {
  onTableSelect: (table: Table) => void;
}

const DRAG_THRESHOLD = 6; // px — movement beyond this = drag, not click

const TableMap: React.FC<TableMapProps> = ({ onTableSelect }) => {
  const { tables, getActiveOrderForTable, updateTable } = useRestaurant();
  const { toast } = useToast();
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    tableId: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
    dragging: boolean;
  } | null>(null);
  const [dragTableId, setDragTableId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const pxToPercent = useCallback((clientX: number, clientY: number) => {
    const map = mapRef.current;
    if (!map) return { x: 0, y: 0 };
    const rect = map.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, table: Table) => {
    if (!editMode || mergeMode) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      tableId: table.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: table.position.x,
      startPosY: table.position.y,
      dragging: false,
    };
  }, [editMode, mergeMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startMouseX;
    const dy = e.clientY - drag.startMouseY;

    if (!drag.dragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
    drag.dragging = true;

    const pos = pxToPercent(e.clientX, e.clientY);
    setDragTableId(drag.tableId);
    setDragPos(pos);
  }, [pxToPercent]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    if (drag.dragging && dragPos) {
      const table = tables.find(t => t.id === drag.tableId);
      if (table) {
        updateTable({ ...table, position: { x: dragPos.x, y: dragPos.y } });
        toast({ title: `Masa ${table.number} mutată`, description: `Poziție: ${dragPos.x.toFixed(1)}%, ${dragPos.y.toFixed(1)}%` });
      }
    }

    setDragTableId(null);
    setDragPos(null);
  }, [dragPos, tables, updateTable, toast]);

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
    // In edit mode, clicks are handled by pointer events (drag). Only act on non-drags.
    if (editMode) return;

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

  const handleEditTableClick = useCallback((table: Table) => {
    // In edit mode, only fire if there was no drag
    if (dragRef.current?.dragging) return;
    // no-op — edit mode doesn't open orders
  }, []);

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
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setEditMode(!editMode); if (mergeMode) { setMergeMode(false); setSelectedForMerge([]); } }}
        >
          {editMode ? <Lock className="w-4 h-4 mr-1" /> : <Move className="w-4 h-4 mr-1" />}
          {editMode ? 'Blochează' : 'Editează hartă'}
        </Button>
        {!editMode && (
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

      <div
        ref={containerRef}
        className={cn("flex-1 relative bg-secondary/30 overflow-auto p-4", editMode && "cursor-grab")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {editMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            <Move className="w-3 h-3 inline mr-1.5 -mt-0.5" />
            Trage mesele pentru a le repoziționa
          </div>
        )}
        <div
          ref={mapRef}
          className="relative h-full w-full min-h-[500px]"
          style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {tables.map(table => {
            const order = getActiveOrderForTable(table.id);
            const hasItems = order && order.items.length > 0;
            const isSelectedForMerge = selectedForMerge.includes(table.id);
            const isDragging = dragTableId === table.id;
            const pos = isDragging && dragPos ? dragPos : table.position;

            return (
              <button
                key={table.id}
                onClick={() => editMode ? handleEditTableClick(table) : handleTableClick(table)}
                onPointerDown={(e) => handlePointerDown(e, table)}
                className={cn(
                  "absolute border-2 flex flex-col items-center justify-center gap-0.5 shadow-md min-w-[70px] min-h-[70px] md:min-w-[90px] md:min-h-[90px] touch-none select-none",
                  !isDragging && "transition-all duration-200",
                  getTableShape(table.shape),
                  getStatusColor(table.status),
                  !editMode && "hover:shadow-lg hover:scale-105",
                  isSelectedForMerge && "ring-4 ring-primary ring-offset-2",
                  editMode && "cursor-grab active:cursor-grabbing",
                  isDragging && "z-20 scale-110 shadow-xl ring-2 ring-primary/50 opacity-90"
                )}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: table.shape === 'rectangle' ? '120px' : '80px',
                }}
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
      </div>
    </div>
  );
};

export default TableMap;
