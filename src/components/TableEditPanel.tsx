import React, { useState, useEffect } from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Circle, Square, RectangleHorizontal } from 'lucide-react';
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

const TableEditPanel: React.FC<TableEditPanelProps> = ({ selectedTableId, onSelectTable }) => {
  const { tables, updateTable, addTable, deleteTable } = useRestaurant();
  const { toast } = useToast();
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const [editNumber, setEditNumber] = useState(0);
  const [editSeats, setEditSeats] = useState(4);
  const [editShape, setEditShape] = useState<Table['shape']>('square');
  const [editColor, setEditColor] = useState('default');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (selectedTable) {
      setEditNumber(selectedTable.number);
      setEditSeats(selectedTable.seats);
      setEditShape(selectedTable.shape);
      setEditColor((selectedTable as any).color || 'default');
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
    } as any);
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
    });
    toast({ title: `Masa ${maxNumber + 1} adăugată` });
  };

  return (
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
                { value: 'round', icon: Circle, label: 'Rotundă' },
                { value: 'square', icon: Square, label: 'Pătrată' },
                { value: 'rectangle', icon: RectangleHorizontal, label: 'Dreptunghi' },
              ] as const).map(shape => (
                <button
                  key={shape.value}
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

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              <Save className="w-4 h-4 mr-1" />
              Salvează
            </Button>
            <Button onClick={handleDelete} size="sm" variant="destructive">
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
  );
};

export default TableEditPanel;
