'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { menuApi, type IngredientApi } from '@/lib/api';
import { Search, Plus, Edit, Trash2, Loader2, Beaker } from 'lucide-react';

const UNITS = ['g', 'kg', 'ml', 'L', 'buc'];

export const IngredientsManager: React.FC = () => {
  const [ingredients, setIngredients] = useState<IngredientApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('g');

  const fetchIngredients = useCallback(async () => {
    try {
      const list = await menuApi.getIngredients();
      setIngredients(list);
    } catch (e) {
      toast({ title: 'Eroare la încărcare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormUnit('g');
    setShowDialog(true);
  };

  const openEdit = (ing: IngredientApi) => {
    setEditingId(ing.id);
    setFormName(ing.name);
    setFormUnit(ing.defaultUnit ?? 'g');
    setShowDialog(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      toast({ title: 'Numele este obligatoriu', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId !== null) {
        await menuApi.updateIngredient(editingId, { name, defaultUnit: formUnit || undefined });
        toast({ title: 'Ingredient actualizat', description: `„${name}" a fost modificat.` });
      } else {
        await menuApi.createIngredient({ name, defaultUnit: formUnit || undefined });
        toast({ title: 'Ingredient adăugat', description: `„${name}" a fost creat.` });
      }
      setShowDialog(false);
      await fetchIngredients();
    } catch (e) {
      toast({ title: 'Eroare la salvare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Ștergi ingredientul „${name}"?`)) return;
    try {
      await menuApi.deleteIngredient(id);
      toast({ title: 'Ingredient șters' });
      await fetchIngredients();
      if (editingId === id) setShowDialog(false);
    } catch (e) {
      toast({ title: 'Eroare la ștergere', description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header – același stil ca Meniu */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă ingredient
          </Button>
        </div>
      </div>

      {/* Grid de carduri – același stil ca Meniu / Rețete */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIngredients.map((ing) => (
          <Card
            key={ing.id}
            className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => openEdit(ing)}
          >
            <div className="relative h-24 sm:h-28 bg-muted flex items-center justify-center">
              <Beaker className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/60 group-hover:text-primary/50 transition-colors" />
              <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                {ing.defaultUnit ?? '—'}
              </Badge>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); openEdit(ing); }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); handleDelete(ing.id, ing.name); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{ing.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Unitate: {ing.defaultUnit ?? 'nespecificat'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIngredients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {ingredients.length === 0
              ? 'Niciun ingredient. Adaugă unul sau încarcă datele inițiale din Meniu.'
              : 'Niciun ingredient nu corespunde căutării.'}
          </CardContent>
        </Card>
      )}

      {/* Dialog Adaugă / Editează */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? 'Editează ingredient' : 'Adaugă ingredient'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ing-name">Nume</Label>
              <Input
                id="ing-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Mozzarella"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ing-unit">Unitate de măsură</Label>
              <select
                id="ing-unit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            {editingId !== null && (
              <Button
                variant="destructive"
                onClick={() => {
                  const ing = ingredients.find((i) => i.id === editingId);
                  if (ing) handleDelete(editingId, ing.name);
                }}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IngredientsManager;
