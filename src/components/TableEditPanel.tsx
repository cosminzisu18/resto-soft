import React, { useState, useEffect, useRef } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Circle, Square, RectangleHorizontal, QrCode, Info, Copy, RefreshCw, Users, Printer, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TableEditPanelProps {
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
}

const TABLE_COLORS = [
  { value: 'default', label: 'Implicit', class: 'bg-muted border-border' },
  { value: 'red', label: 'Roșu', class: 'bg-red-500/30 border-red-500' },
  { value: 'blue', label: 'Albastru', class: 'bg-blue-500/30 border-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-emerald-500/30 border-emerald-500' },
  { value: 'amber', label: 'Portocaliu', class: 'bg-amber-500/30 border-amber-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500/30 border-purple-500' },
  { value: 'pink', label: 'Roz', class: 'bg-pink-500/30 border-pink-500' },
];

const generateQrId = () => `QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
const qrInfoText = 'Identificator unic pentru codul QR generat pentru aplicația Self Order. Clienții scanează acest cod pentru a comanda direct de la masă. Poate fi regenerat și printat.';

// Deterministic pseudo-random QR pattern from string
const generateQrPattern = (str: string): boolean[] => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const pattern: boolean[] = [];
  for (let i = 0; i < 225; i++) {
    hash = ((hash * 16807) + 1) | 0;
    pattern.push(Math.abs(hash) % 3 !== 0);
  }
  // Fixed finder patterns (corners)
  const setBlock = (row: number, col: number, size: number, val: boolean) => {
    for (let r = row; r < row + size && r < 15; r++)
      for (let c = col; c < col + size && c < 15; c++)
        pattern[r * 15 + c] = val;
  };
  // Top-left
  setBlock(0, 0, 3, true); setBlock(1, 1, 1, false);
  // Top-right
  setBlock(0, 12, 3, true); setBlock(1, 13, 1, false);
  // Bottom-left
  setBlock(12, 0, 3, true); setBlock(13, 1, 1, false);
  return pattern;
};

const QrCodeVisual: React.FC<{ qrId: string; size?: number; tableNumber: number }> = ({ qrId, size = 150, tableNumber }) => {
  const pattern = generateQrPattern(qrId);
  const cellSize = size / 15;
  return (
    <div className="bg-white p-3 rounded-lg inline-block" style={{ width: size + 24, height: size + 24 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" />
        {pattern.map((filled, i) => {
          if (!filled) return null;
          const row = Math.floor(i / 15);
          const col = i % 15;
          return (
            <rect
              key={i}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
              rx={0.5}
            />
          );
        })}
        {/* Center label */}
        <rect x={size / 2 - 14} y={size / 2 - 8} width={28} height={16} fill="white" rx={2} />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="black">
          {tableNumber}
        </text>
      </svg>
    </div>
  );
};

const handlePrintQr = (qrId: string, tableNumber: number) => {
  const pattern = generateQrPattern(qrId);
  const size = 300;
  const cellSize = size / 15;
  let svgCells = '';
  pattern.forEach((filled, i) => {
    if (!filled) return;
    const row = Math.floor(i / 15);
    const col = i % 15;
    svgCells += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="black" rx="0.5"/>`;
  });

  const printWindow = window.open('', '_blank', 'width=500,height=600');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>QR Masa ${tableNumber}</title>
    <style>
      body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; }
      .label { font-size: 28px; font-weight: 700; margin-top: 16px; }
      .sublabel { font-size: 14px; color: #666; margin-top: 4px; }
      .qr { background: white; padding: 24px; border: 2px solid #eee; border-radius: 12px; }
      @media print { body { height: auto; padding: 40px 0; } }
    </style>
    </head>
    <body>
      <div class="qr">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <rect width="${size}" height="${size}" fill="white"/>
          ${svgCells}
          <rect x="${size / 2 - 28}" y="${size / 2 - 16}" width="56" height="32" fill="white" rx="4"/>
          <text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="22" font-weight="bold">${tableNumber}</text>
        </svg>
      </div>
      <div class="label">Masa ${tableNumber}</div>
      <div class="sublabel">Scanează pentru a comanda</div>
      <div class="sublabel" style="font-size:10px;margin-top:8px;font-family:monospace;color:#999">${qrId}</div>
      <script>setTimeout(()=>{window.print()},300)</script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

const getPreviewShapeClass = (shape: Table['shape'], seats: number) => {
  const sizeClass = shape === 'rectangle'
    ? 'w-28 h-16'
    : seats <= 2
      ? 'w-16 h-16'
      : seats <= 4
        ? 'w-20 h-20'
        : 'w-24 h-24';

  return cn(sizeClass, shape === 'round' ? 'rounded-full' : 'rounded-xl');
};

const TableEditPanel: React.FC<TableEditPanelProps> = ({ selectedTableId, onSelectTable }) => {
  const { tables, updateTable, addTable, deleteTable } = useRestaurant();
  const { toast } = useToast();
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const [editNumber, setEditNumber] = useState(0);
  const [editSeats, setEditSeats] = useState(4);
  const [editShape, setEditShape] = useState<Table['shape']>('square');
  const [editColor, setEditColor] = useState('default');
  const [editQrCode, setEditQrCode] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);

  // Track which table we loaded into form to avoid resetting on every render
  const loadedTableIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedTable && loadedTableIdRef.current !== selectedTable.id) {
      loadedTableIdRef.current = selectedTable.id;
      setEditNumber(selectedTable.number);
      setEditSeats(selectedTable.seats);
      setEditShape(selectedTable.shape);
      setEditColor(selectedTable.color || 'default');
      setEditQrCode(selectedTable.qrCode || generateQrId());
    }
    if (!selectedTable) {
      loadedTableIdRef.current = null;
    }
  }, [selectedTable]);

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    if (!selectedTable) return;
    updateTable({
      ...selectedTable,
      number: editNumber,
      seats: editSeats,
      shape: editShape,
      color: editColor,
      qrCode: editQrCode,
    });
    toast({ title: `Masa ${editNumber} actualizată` });
    setShowSaveConfirm(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!selectedTable) return;
    const num = selectedTable.number;
    deleteTable(selectedTable.id);
    onSelectTable(null);
    toast({ title: `Masa ${num} ștearsă` });
    setShowDeleteConfirm(false);
  };

  const handleAddTable = () => {
    const maxNumber = tables.reduce((max, t) => Math.max(max, t.number), 0);
    addTable({
      number: maxNumber + 1,
      seats: 4,
      status: 'free',
      position: { x: 50, y: 50 },
      shape: 'square',
      qrCode: generateQrId(),
    });
    toast({ title: `Masa ${maxNumber + 1} adăugată` });
  };

  const handleRegenerateQr = () => {
    const newQr = generateQrId();
    setEditQrCode(newQr);
    toast({ title: 'QR Code regenerat', description: 'Salvează pentru a aplica.' });
  };

  const handleCopyQr = () => {
    navigator.clipboard.writeText(editQrCode);
    toast({ title: 'ID QR copiat' });
  };

  return (
    <TooltipProvider>
      <div className="w-72 border-l border-border bg-card flex flex-col h-full">
        <div className="p-3 border-b border-border bg-muted/50">
          <h3 className="text-sm font-semibold">Editor Mese</h3>
        </div>

        <div className="p-3">
          <Button onClick={handleAddTable} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adaugă masă nouă
          </Button>
        </div>

        {selectedTable ? (
          <div className="flex-1 overflow-auto p-3 space-y-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Editare Masa #{selectedTable.number}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Previzualizare</Label>
              <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-center">
                <div
                  className={cn(
                    "border-2 shadow-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                    getPreviewShapeClass(editShape, editSeats),
                    TABLE_COLORS.find(color => color.value === editColor)?.class || TABLE_COLORS[0].class
                  )}
                >
                  <span className="text-lg font-bold">{editNumber}</span>
                  <span className="text-[10px] flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {editSeats}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Forma și culoarea se văd aici instant, iar pe hartă după confirmarea salvării.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-number" className="text-xs">Număr masă</Label>
              <Input
                id="table-number"
                type="number"
                min={1}
                value={editNumber}
                onChange={e => setEditNumber(parseInt(e.target.value) || 1)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-seats" className="text-xs">Locuri (persoane)</Label>
              <Input
                id="table-seats"
                type="number"
                min={1}
                max={20}
                value={editSeats}
                onChange={e => setEditSeats(parseInt(e.target.value) || 1)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Formă</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'round' as const, icon: Circle, label: 'Rotundă' },
                  { value: 'square' as const, icon: Square, label: 'Pătrată' },
                  { value: 'rectangle' as const, icon: RectangleHorizontal, label: 'Dreptunghi' },
                ]).map(shape => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => setEditShape(shape.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs transition-colors",
                      editShape === shape.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <shape.icon className="w-5 h-5" />
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Culoare</Label>
              <div className="grid grid-cols-4 gap-2">
                {TABLE_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEditColor(color.value)}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 transition-all",
                      color.class,
                      editColor === color.value
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-105"
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* QR Code ID */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  ID Cod QR
                </Label>
                <div className="relative group">
                  <button
                    type="button"
                    title={qrInfoText}
                    aria-label={qrInfoText}
                    className="inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    <Info className="w-3.5 h-3.5 cursor-help" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-56 rounded-md border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-md opacity-0 invisible transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {qrInfoText}
                  </div>
                </div>
              </div>

              {/* QR Visual Preview */}
              <div className="flex justify-center py-2">
                <QrCodeVisual qrId={editQrCode} size={120} tableNumber={editNumber} />
              </div>

              <div className="flex gap-1">
                <Input
                  value={editQrCode}
                  readOnly
                  className="h-9 text-xs font-mono bg-muted/50"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopyQr}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiază ID</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleRegenerateQr}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerează QR</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setShowQrPreview(true)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Previzualizare
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handlePrintQr(editQrCode, editNumber)}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Printează QR
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={handleSave} size="sm" className="flex-1">
                <Save className="w-4 h-4 mr-1" />
                Salvează
              </Button>
              <Button type="button" onClick={handleDelete} size="sm" variant="destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              Selectează o masă de pe hartă pentru a o edita
            </p>
          </div>
        )}

        {/* Confirm save */}
        <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmare modificare</AlertDialogTitle>
              <AlertDialogDescription>
                Salvezi modificările pentru Masa #{editNumber}?
                {selectedTable && editNumber !== selectedTable.number && (
                  <span className="block mt-1 font-medium">Numărul se schimbă din {selectedTable.number} → {editNumber}</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulează</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSave}>Salvează</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm delete */}

        {/* QR Preview Dialog */}
        <Dialog open={showQrPreview} onOpenChange={setShowQrPreview}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Cod QR — Masa {editNumber}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-2">
              <QrCodeVisual qrId={editQrCode} size={240} tableNumber={editNumber} />
              <p className="text-xs font-mono text-muted-foreground text-center break-all">{editQrCode}</p>
              <p className="text-xs text-muted-foreground text-center">Clienții scanează acest cod pentru a accesa meniul Self Order la masă.</p>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => { handleRegenerateQr(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerează
                </Button>
                <Button className="flex-1" onClick={() => handlePrintQr(editQrCode, editNumber)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Printează
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Șterge Masa #{selectedTable?.number}?</AlertDialogTitle>
              <AlertDialogDescription>
                Această acțiune este ireversibilă. Masa va fi eliminată de pe hartă.
                {selectedTable?.status === 'occupied' && (
                  <span className="block mt-1 text-destructive font-medium">⚠️ Masa este ocupată! Comanda activă va fi afectată.</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulează</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Șterge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default TableEditPanel;
