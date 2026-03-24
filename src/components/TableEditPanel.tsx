import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { Plus, Trash2, Save, Circle, Square, RectangleHorizontal, QrCode, Info, Copy, RefreshCw, Users, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TableEditPanelProps {
  selectedTableId: number | null;
  onSelectTable: (id: number | null) => void;
  /** Lista meselor de pe hartă (ex. din API); altfel se folosește contextul. */
  tablesForEdit?: Table[];
  /**
   * Înlocuiește doar `updateTable` când e setat: actualizare context + sincron părinte/API.
   * Dacă lipsește, se folosește `updateTable` din context.
   */
  onTableUpdated?: (table: Table) => void;
  /** Când e furnizat, adăugarea de masă se face prin părinte (ex: API), nu local context. */
  onTableCreated?: (table: Omit<Table, 'id'>) => Promise<void> | void;
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
const qrInfoText = 'Identificator unic pentru codul QR generat pentru aplicația Self Order. Clienții scanează acest cod pentru a comanda direct de la masă. Poate fi regenerat și descărcat.';

const useQrDataUrl = (data: string, size: number) => {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    if (!data) return;
    QRCode.toDataURL(data, { width: size, margin: 2, errorCorrectionLevel: 'M' })
      .then(setUrl)
      .catch(() => setUrl(''));
  }, [data, size]);
  return url;
};

const RealQrCode: React.FC<{ qrId: string; size?: number }> = ({ qrId, size = 150 }) => {
  const dataUrl = useQrDataUrl(qrId, size);
  if (!dataUrl) return <div className="bg-muted rounded-lg animate-pulse" style={{ width: size, height: size }} />;
  return <img src={dataUrl} alt={`QR ${qrId}`} width={size} height={size} className="rounded-lg" />;
};

const downloadQrPng = async (qrId: string, tableNumber: number) => {
  try {
    const dataUrl = await QRCode.toDataURL(qrId, { width: 600, margin: 3, errorCorrectionLevel: 'M' });
    const link = document.createElement('a');
    link.download = `QR-Masa-${tableNumber}.png`;
    link.href = dataUrl;
    link.click();
  } catch {
    // silent fail
  }
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

const TableEditPanel: React.FC<TableEditPanelProps> = ({
  selectedTableId,
  onSelectTable,
  tablesForEdit,
  onTableUpdated,
  onTableCreated,
}) => {
  const { tables: contextTables, updateTable, addTable, deleteTable } = useRestaurant();
  const editList = tablesForEdit ?? contextTables;
  const { toast } = useToast();
  const selectedTable = editList.find((t) => t.id === selectedTableId);

  const [editNumber, setEditNumber] = useState(0);
  const [editSeats, setEditSeats] = useState(4);
  const [editShape, setEditShape] = useState<Table['shape']>('square');
  const [editColor, setEditColor] = useState('default');
  const [editQrCode, setEditQrCode] = useState('');
  const [editPosX, setEditPosX] = useState(50);
  const [editPosY, setEditPosY] = useState(50);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);

  // Track which table we loaded into form to avoid resetting on every render
  const loadedTableIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedTable && loadedTableIdRef.current !== selectedTable.id) {
      loadedTableIdRef.current = selectedTable.id;
      setEditNumber(selectedTable.number);
      setEditSeats(selectedTable.seats);
      setEditShape(selectedTable.shape);
      setEditColor(selectedTable.color || 'default');
      setEditQrCode(selectedTable.qrCode || generateQrId());
      setEditPosX(selectedTable.position.x);
      setEditPosY(selectedTable.position.y);
    }
    // Always sync position from map drag
    if (selectedTable && loadedTableIdRef.current === selectedTable.id) {
      setEditPosX(selectedTable.position.x);
      setEditPosY(selectedTable.position.y);
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
    const updated: Table = {
      ...selectedTable,
      number: editNumber,
      seats: editSeats,
      shape: editShape,
      color: editColor,
      qrCode: editQrCode,
      position: { x: editPosX, y: editPosY },
    };
    if (onTableUpdated) {
      onTableUpdated(updated);
    } else {
      updateTable(updated);
    }
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

  const handleAddTable = async () => {
    const maxNumber = editList.reduce((max, t) => Math.max(max, t.number), 0);
    const draft: Omit<Table, 'id'> = {
      number: maxNumber + 1,
      seats: 4,
      status: 'free',
      position: { x: 50, y: 50 },
      shape: 'square',
      qrCode: generateQrId(),
    };
    if (onTableCreated) {
      await onTableCreated(draft);
    } else {
      addTable(draft);
    }
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
          <Button onClick={() => void handleAddTable()} size="sm" className="w-full">
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
              <Label className="text-xs">Poziție pe hartă (%)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="table-pos-x" className="text-[10px] text-muted-foreground">X</Label>
                  <Input
                    id="table-pos-x"
                    type="number"
                    min={2}
                    max={98}
                    step={0.5}
                    value={editPosX}
                    onChange={e => setEditPosX(parseFloat(e.target.value) || 2)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="table-pos-y" className="text-[10px] text-muted-foreground">Y</Label>
                  <Input
                    id="table-pos-y"
                    type="number"
                    min={2}
                    max={98}
                    step={0.5}
                    value={editPosY}
                    onChange={e => setEditPosY(parseFloat(e.target.value) || 2)}
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Se actualizează și la drag pe hartă.</p>
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
                <RealQrCode qrId={editQrCode} size={120} />
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
                  onClick={() => downloadQrPng(editQrCode, editNumber)}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Descarcă PNG
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
              <RealQrCode qrId={editQrCode} size={240} />
              <p className="text-xs font-mono text-muted-foreground text-center break-all">{editQrCode}</p>
              <p className="text-xs text-muted-foreground text-center">Clienții scanează acest cod pentru a accesa meniul Self Order la masă.</p>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => { handleRegenerateQr(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerează
                </Button>
                <Button className="flex-1" onClick={() => downloadQrPng(editQrCode, editNumber)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă PNG
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
