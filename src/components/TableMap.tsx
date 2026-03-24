import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { Users, Link2, Move, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TableEditPanel from '@/components/TableEditPanel';

interface TableMapProps {
  onTableSelect: (table: Table) => void;
  /** Când sunt furnizate, se folosesc aceste mese în locul celor din context (ex. din API). */
  tables?: Table[];
  /** Când e furnizat, se folosește pentru badge-ul de articole pe masă (ex. comanda din API). */
  getActiveOrderForTable?: (tableId: number) => { items: unknown[] } | undefined;
  /**
   * După mutare/salvare pe hartă: actualizează lista controlată de părinte + opțional API.
   * Necesar când `tables` vine din state (ex. ospătar/POS din DB) — altfel doar contextul se actualiza.
   */
  onTableUpdated?: (table: Table) => void;
  /** Creează o masă nouă (ex. POST /tables) când harta e API-controlled. */
  onTableCreated?: (table: Omit<Table, 'id'>) => Promise<void> | void;
}

const DRAG_THRESHOLD = 6;

const TABLE_COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500/25 border-red-500',
  blue: 'bg-blue-500/25 border-blue-500',
  green: 'bg-emerald-500/25 border-emerald-500',
  amber: 'bg-amber-500/25 border-amber-500',
  purple: 'bg-purple-500/25 border-purple-500',
  pink: 'bg-pink-500/25 border-pink-500',
};

const TableMap: React.FC<TableMapProps> = ({
  onTableSelect,
  tables: tablesProp,
  getActiveOrderForTable: getOrderProp,
  onTableUpdated,
  onTableCreated,
}) => {
  const { tables: contextTables, getActiveOrderForTable: contextGetOrder, updateTable } = useRestaurant();
  const tables = tablesProp ?? contextTables;
  const getActiveOrderForTable = getOrderProp ?? contextGetOrder;
  const { toast } = useToast();
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedEditTableId, setSelectedEditTableId] = useState<number | null>(null);

  const isApiControlled = Boolean(tablesProp && onTableUpdated);
  const [stagedTables, setStagedTables] = useState<Table[]>(tables);
  const [dirtyTableIds, setDirtyTableIds] = useState<Set<number>>(new Set());
  const hasDirtyRef = useRef(false);

  useEffect(() => {
    // În edit mode API-controlled, nu suprascriem stagedTables dacă există modificări locale nesalvate.
    if (isApiControlled && editMode && hasDirtyRef.current) return;
    setStagedTables(tables);
    hasDirtyRef.current = false;
    setDirtyTableIds(new Set());
  }, [tables, isApiControlled, editMode]);

  const visibleTables = useMemo(
    () => (isApiControlled && editMode ? stagedTables : tables),
    [isApiControlled, editMode, stagedTables, tables],
  );

  const applyTableUpdate = useCallback(
    (t: Table) => {
      if (isApiControlled) {
        setStagedTables((prev) => prev.map((x) => (x.id === t.id ? t : x)));
        setDirtyTableIds((prev) => {
          const next = new Set(prev);
          next.add(t.id);
          hasDirtyRef.current = next.size > 0;
          return next;
        });
        return;
      }
      updateTable(t);
      onTableUpdated?.(t);
    },
    [isApiControlled, updateTable, onTableUpdated],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    tableId: number;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
    dragging: boolean;
  } | null>(null);
  const latestDragPosRef = useRef<{ x: number; y: number } | null>(null);
  const [dragTableId, setDragTableId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const pxToPercent = useCallback((clientX: number, clientY: number) => {
    const map = mapRef.current;
    if (!map) return { x: 0, y: 0 };
    const rect = map.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, table: Table) => {
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
      latestDragPosRef.current = null;
    },
    [editMode, mergeMode],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startMouseX;
      const dy = e.clientY - drag.startMouseY;
      if (!drag.dragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      drag.dragging = true;
      const pos = pxToPercent(e.clientX, e.clientY);
      latestDragPosRef.current = pos;
      setDragTableId(drag.tableId);
      setDragPos(pos);
    },
    [pxToPercent],
  );

  /** Salvează poziția în context + părinte/API dacă există drag activ cu poziție; golește mereu starea de drag. */
  const persistInProgressDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    const wasDragging = drag.dragging;
    const tid = drag.tableId;
    const finalPos = latestDragPosRef.current;
    dragRef.current = null;
    latestDragPosRef.current = null;
    setDragTableId(null);
    setDragPos(null);

    if (wasDragging && finalPos) {
      const table = visibleTables.find((t) => t.id === tid);
      if (table) {
        applyTableUpdate({ ...table, position: { x: finalPos.x, y: finalPos.y } });
        toast({
          title: `Masa ${table.number} mutată`,
          description: `Poziție: ${finalPos.x.toFixed(1)}%, ${finalPos.y.toFixed(1)}%`,
        });
      }
    }
  }, [visibleTables, applyTableUpdate, toast]);

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    const wasDragging = drag.dragging;
    const tid = drag.tableId;
    const finalPos = latestDragPosRef.current;

    if (wasDragging && finalPos) {
      persistInProgressDrag();
      return;
    }

    dragRef.current = null;
    latestDragPosRef.current = null;
    setDragTableId(null);
    setDragPos(null);

    if (!wasDragging && editMode) {
      setSelectedEditTableId(tid);
    }
  }, [editMode, persistInProgressDrag]);


  const getTableShape = (shape: Table['shape']) => {
    switch (shape) {
      case 'round':
        return 'rounded-full';
      case 'rectangle':
        return 'rounded-xl aspect-[2/1]';
      default:
        return 'rounded-xl';
    }
  };

  const getStatusColor = (table: Table) => {
    const customColor = table.color;
    if (customColor && customColor !== 'default' && TABLE_COLOR_MAP[customColor]) {
      return TABLE_COLOR_MAP[customColor];
    }
    switch (table.status) {
      case 'free':
        return 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/30';
      case 'occupied':
        return 'bg-blue-500/30 border-blue-500 hover:bg-blue-500/40';
      case 'reserved':
        return 'bg-amber-500/20 border-amber-500 hover:bg-amber-500/30';
    }
  };

  const handleTableClick = (table: Table) => {
    if (editMode) return;
    if (mergeMode) {
      if (table.status !== 'free') {
        toast({ title: 'Doar mesele libere pot fi unite', variant: 'destructive' });
        return;
      }
      setSelectedForMerge((prev) =>
        prev.includes(table.id) ? prev.filter((id) => id !== table.id) : [...prev, table.id],
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
    const mainTable = visibleTables.find((t) => t.id === selectedForMerge[0]);
    if (mainTable) {
      applyTableUpdate({ ...mainTable, mergedWith: selectedForMerge.slice(1) });
      toast({
        title: `Mese unite: ${selectedForMerge.map((id) => visibleTables.find((t) => t.id === id)?.number).join(' + ')}`,
      });
    }
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  const toggleEditMode = async () => {
    if (editMode) {
      // La „Blochează”: persistă și o tragere neterminată (dacă există), ca poziția să ajungă în DB
      persistInProgressDrag();
      if (isApiControlled && dirtyTableIds.size > 0) {
        try {
          for (const id of dirtyTableIds) {
            const changed = stagedTables.find((t) => t.id === id);
            if (changed) {
              await onTableUpdated?.(changed);
            }
          }
          toast({
            title: 'Harta salvată în baza de date',
            description: `${dirtyTableIds.size} ${dirtyTableIds.size === 1 ? 'masă actualizată' : 'mese actualizate'}.`,
          });
          hasDirtyRef.current = false;
          setDirtyTableIds(new Set());
        } catch {
          toast({
            title: 'Eroare la salvarea hărții',
            description: 'Unele poziții nu au fost salvate. Încearcă din nou.',
            variant: 'destructive',
          });
          return;
        }
      }
      setSelectedEditTableId(null);
    }
    setEditMode((prev) => !prev);
    if (mergeMode) {
      setMergeMode(false);
      setSelectedForMerge([]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-3 p-3 md:p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Harta Restaurantului</h2>
        <div className="flex gap-3 ml-auto text-xs md:text-sm flex-wrap">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            Liberă
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Ocupată
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            Rezervată
          </span>
        </div>
        <Button variant={editMode ? 'default' : 'outline'} size="sm" onClick={() => void toggleEditMode()}>
          {editMode ? <Lock className="w-4 h-4 mr-1" /> : <Move className="w-4 h-4 mr-1" />}
          {editMode ? 'Blochează' : 'Editează hartă'}
        </Button>
        {!editMode && !tablesProp && (
          <>
            <Button
              variant={mergeMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setMergeMode(!mergeMode);
                setSelectedForMerge([]);
              }}
            >
              <Link2 className="w-4 h-4 mr-1" />
              {mergeMode ? 'Anulează' : 'Unește mese'}
            </Button>
            {mergeMode && selectedForMerge.length >= 2 && (
              <Button size="sm" onClick={handleMergeTables}>
                Confirmă ({selectedForMerge.length})
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {tablesProp !== undefined && visibleTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] text-center text-muted-foreground px-4">
            <p className="font-medium text-foreground mb-1">Nu există mese în baza de date</p>
            <p className="text-sm max-w-md">
              Adaugă mese din admin (sau asigură-te că backend-ul returnează rânduri în tabela{' '}
              <code className="text-xs bg-muted px-1 rounded">tables</code>). ID-urile meselor sunt numerice
              (auto-increment) în baza de date.
            </p>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className={cn('flex-1 relative bg-secondary/30 overflow-hidden', editMode && 'cursor-grab')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {editMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
                  <Move className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                  Trage mesele sau click pentru editare
                </div>
              )}
              <div
                ref={mapRef}
                className="relative h-full w-full min-h-[500px]"
                style={{
                  backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                {visibleTables.map((table) => {
                  const order = getActiveOrderForTable(table.id);
                  const hasItems = order && order.items.length > 0;
                  const isSelectedForMerge = selectedForMerge.includes(table.id);
                  const isDragging = dragTableId === table.id;
                  const isEditSelected = editMode && selectedEditTableId === table.id;
                  const pos = isDragging && dragPos ? dragPos : table.position;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => !editMode && handleTableClick(table)}
                      onPointerDown={(e) => handlePointerDown(e, table)}
                      className={cn(
                        'absolute border-2 flex flex-col items-center justify-center gap-0.5 shadow-md min-w-[70px] min-h-[70px] md:min-w-[90px] md:min-h-[90px] touch-none select-none',
                        !isDragging && 'transition-all duration-200',
                        getTableShape(table.shape),
                        getStatusColor(table),
                        !editMode && 'hover:shadow-lg hover:scale-105',
                        isSelectedForMerge && 'ring-4 ring-primary ring-offset-2',
                        editMode && 'cursor-grab active:cursor-grabbing',
                        isDragging && 'z-20 scale-110 shadow-xl ring-2 ring-primary/50 opacity-90',
                        isEditSelected && 'ring-4 ring-primary ring-offset-2 ring-offset-background',
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
                        {table.status === 'occupied' && table.currentGuests ? `${table.currentGuests}/` : ''}
                        {table.seats}
                      </span>
                      {table.mergedWith?.length ? (
                        <span className="text-[9px] text-muted-foreground">+{table.mergedWith.length}</span>
                      ) : null}
                      {hasItems && (
                        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {order.items.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {editMode && (
              <TableEditPanel
                selectedTableId={selectedEditTableId}
                onSelectTable={setSelectedEditTableId}
                tablesForEdit={visibleTables}
                onTableUpdated={applyTableUpdate}
                onTableCreated={onTableCreated}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TableMap;
