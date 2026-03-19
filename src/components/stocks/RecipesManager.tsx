'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Search,
  Plus,
  ChefHat,
  Clock,
  Users,
  GripVertical,
  X,
  Save,
  ImagePlus,
  Calculator,
  Edit,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react';
import { menuApi, recipesApi, imageSrc, type MenuItemApi, type RecipeApi, type RecipeIngredientApi, type CreateRecipeBody, type InstructionStepApi } from '@/lib/api';
import { ImageUploadButton } from '@/components/ui/image-upload-button';

const UNITS = ['g', 'kg', 'ml', 'L', 'buc'];

interface FormIngredient {
  id: string;
  ingredientId: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  /** Procent pierdere 0–100; intră în calculul costului per porție */
  lossPercent: number;
}

export const RecipesManager: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeApi[]>([]);
  const [menuProducts, setMenuProducts] = useState<MenuItemApi[]>([]);
  const [ingredientsFromApi, setIngredientsFromApi] = useState<{ id: number; name: string; defaultUnit?: string | null }[]>([]);
  const [allergens, setAllergens] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toate');
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeApi | null>(null);
  const [saving, setSaving] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  const [formProductId, setFormProductId] = useState<number | ''>('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrepTime, setFormPrepTime] = useState(0);
  const [formPortions, setFormPortions] = useState(1);
  const [formInstructions, setFormInstructions] = useState<{ text: string; timeMinutes: number }[]>([{ text: '', timeMinutes: 0 }]);
  const [formAllergenIds, setFormAllergenIds] = useState<number[]>([]);
  const [formIngredients, setFormIngredients] = useState<FormIngredient[]>([]);
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formGallery, setFormGallery] = useState<string[]>([]);

  const fetchRecipes = useCallback(async () => {
    try {
      const data = await recipesApi.getAll();
      setRecipes(data);
    } catch (e) {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca rețetele', variant: 'destructive' });
    }
  }, []);

  const fetchMenuAllergensIngredients = useCallback(async () => {
    try {
      const [items, allAllergens, ingredients] = await Promise.all([
        menuApi.getItems(),
        menuApi.getAllergens(),
        menuApi.getIngredients(),
      ]);
      setMenuProducts(items);
      setAllergens(allAllergens);
      setIngredientsFromApi(ingredients);
    } catch (e) {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca produsele, alergenii sau ingredientele', variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchRecipes(), fetchMenuAllergensIngredients()]);
      setLoading(false);
    })();
  }, [fetchRecipes, fetchMenuAllergensIngredients]);

  const categories = useMemo(() => {
    const cats = new Set<string>(['Toate']);
    menuProducts.forEach((p) => cats.add(p.category));
    recipes.forEach((r) => cats.add(r.category));
    return Array.from(cats);
  }, [menuProducts, recipes]);

  const filteredRecipes = useMemo(
    () =>
      recipes.filter(
        (r) =>
          (selectedCategory === 'Toate' || r.category === selectedCategory) &&
          r.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [recipes, selectedCategory, searchTerm]
  );

  const openCreate = () => {
    setEditingRecipe(null);
    setFormProductId('');
    setFormName('');
    setFormCategory('');
    setFormPrepTime(0);
    setFormPortions(1);
    setFormInstructions([{ text: '', timeMinutes: 0 }]);
    setFormAllergenIds([]);
    setFormIngredients([]);
    setFormImage(null);
    setFormGallery([]);
    setPortionMultiplier(1);
    setShowRecipeDialog(true);
  };

  const openEdit = (recipe: RecipeApi) => {
    setEditingRecipe(recipe);
    setFormProductId(recipe.menuItemId ?? '');
    const product = recipe.menuItemId != null ? menuProducts.find((p) => p.id === recipe.menuItemId) : null;
    if (product) {
      setFormName(product.name);
      setFormCategory(product.category);
      setFormPrepTime(product.prepTime ?? 0);
      setFormAllergenIds((product.allergens ?? []).map((a) => a.id));
    } else {
      setFormName(recipe.name);
      setFormCategory(recipe.category);
      setFormPrepTime(recipe.prepTimeMinutes);
      setFormAllergenIds(recipe.allergenIds ?? []);
    }
    setFormPortions(recipe.portions);
    setFormInstructions(
      recipe.instructions?.length
        ? recipe.instructions.map((s) => ({
            text: typeof s === 'string' ? s : (s as InstructionStepApi).text,
            timeMinutes: typeof s === 'string' ? 0 : ((s as InstructionStepApi).timeMinutes ?? 0),
          }))
        : [{ text: '', timeMinutes: 0 }]
    );
    if (recipe.ingredients?.length) {
      setFormIngredients(
        recipe.ingredients.map((i) => ({
          id: crypto.randomUUID(),
          ingredientId: i.ingredientId,
          name: i.ingredient?.name ?? '',
          quantity: Number(i.quantity),
          unit: i.unit ?? 'g',
          pricePerUnit: Number(i.pricePerUnit),
          lossPercent: Number(i.lossPercent ?? 0),
        }))
      );
    } else if (product?.ingredients?.length) {
      setFormIngredients(
        product.ingredients.map((ing) => ({
          id: crypto.randomUUID(),
          ingredientId: ing.id,
          name: ing.name,
          quantity: 0,
          unit: ing.defaultUnit ?? 'g',
          pricePerUnit: 0,
          lossPercent: 0,
        }))
      );
    } else {
      setFormIngredients([]);
    }
    if (product?.image) {
      setFormImage(product.image);
    } else {
      setFormImage(recipe.image ?? null);
    }
    setFormGallery(recipe.gallery ?? []);
    setPortionMultiplier(recipe.portions || 1);
    setShowRecipeDialog(true);
  };

  const onSelectProduct = (menuItemId: number | '') => {
    setFormProductId(menuItemId);
    if (menuItemId === '') return;
    const product = menuProducts.find((p) => p.id === menuItemId);
    if (!product) return;
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrepTime(product.prepTime ?? 0);
    setFormAllergenIds((product.allergens ?? []).map((a) => a.id));
    const fromProduct = (product.ingredients ?? []).map((ing) => ({
      id: crypto.randomUUID(),
      ingredientId: ing.id,
      name: ing.name,
      quantity: 0,
      unit: ing.defaultUnit ?? 'g',
      pricePerUnit: 0,
      lossPercent: 0,
    }));
    setFormIngredients(fromProduct);
    if (product.image) setFormImage(product.image);
  };

  const addIngredientRow = () => {
    const first = ingredientsFromApi[0];
    setFormIngredients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ingredientId: first?.id ?? 0,
        name: first?.name ?? '',
        quantity: 0,
        unit: first?.defaultUnit ?? 'g',
        pricePerUnit: 0,
        lossPercent: 0,
      },
    ]);
  };
  const validIngredientId = (id: number) => id > 0;

  const onSelectIngredientInRow = (rowId: string, ingredientId: number) => {
    const ing = ingredientsFromApi.find((i) => i.id === ingredientId);
    setFormIngredients((prev) =>
      prev.map((i) =>
        i.id === rowId
          ? { ...i, ingredientId, name: ing?.name ?? '', unit: ing?.defaultUnit ?? i.unit }
          : i
      )
    );
  };

  const addInstruction = () =>
    setFormInstructions((prev) => [...prev, { text: '', timeMinutes: 0 }]);
  const removeInstruction = (index: number) =>
    setFormInstructions((prev) => prev.filter((_, i) => i !== index));
  const setInstructionText = (index: number, value: string) =>
    setFormInstructions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text: value };
      return next;
    });
  const setInstructionTime = (index: number, value: number) =>
    setFormInstructions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], timeMinutes: Math.max(0, value) };
      return next;
    });

  const removeIngredient = (id: string) => setFormIngredients((prev) => prev.filter((i) => i.id !== id));
  const updateIngredient = (id: string, field: keyof FormIngredient, value: string | number) =>
    setFormIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );

  const totalCost = useMemo(
    () =>
      formIngredients.reduce((sum, i) => {
        const lossFactor = 1 + (Number(i.lossPercent ?? 0) / 100);
        return sum + i.quantity * lossFactor * i.pricePerUnit;
      }, 0),
    [formIngredients]
  );
  const costPerPortion = formPortions > 0 ? totalCost / formPortions : 0;
  const basePortions = formPortions || 1;
  const scaledCost = totalCost * (portionMultiplier / basePortions);

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: 'Lipsește numele rețetei', variant: 'destructive' });
      return;
    }
    const instructions = formInstructions
      .map((s) => ({ text: s.text.trim(), timeMinutes: s.timeMinutes }))
      .filter((s) => s.text.length > 0);
    const ingredients = formIngredients
      .filter((i) => validIngredientId(i.ingredientId))
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit,
        pricePerUnit: i.pricePerUnit,
        lossPercent: i.lossPercent ?? 0,
      }));
    const body: CreateRecipeBody = {
      menuItemId: formProductId === '' ? null : formProductId,
      name: formName.trim(),
      category: formCategory.trim() || 'General',
      prepTimeMinutes: formPrepTime,
      portions: formPortions,
      instructions,
      allergenIds: formAllergenIds,
      image: formImage,
      gallery: formGallery,
      ingredients,
    };
    setSaving(true);
    try {
      if (editingRecipe) {
        await recipesApi.update(editingRecipe.id, body);
        toast({ title: 'Rețetă actualizată' });
      } else {
        await recipesApi.create(body);
        toast({ title: 'Rețetă creată' });
      }
      if (formProductId !== '' && typeof formProductId === 'number') {
        try {
          await menuApi.updateItem(formProductId, {
            name: formName.trim(),
            category: formCategory.trim(),
            prepTime: formPrepTime,
            allergenIds: formAllergenIds,
            ingredients: formIngredients
              .filter((i) => validIngredientId(i.ingredientId))
              .map((i) => ({
                ingredientId: i.ingredientId,
                quantity: i.quantity,
                unit: i.unit,
                pricePerUnit: i.pricePerUnit,
                lossPercent: i.lossPercent ?? 0,
              })),
            image: formImage ?? undefined,
          });
        } catch {
          // produsul poate fi șters sau inaccesibil
        }
      }
      await fetchRecipes();
      setShowRecipeDialog(false);
    } catch (e) {
      toast({ title: 'Eroare la salvare', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (recipe: RecipeApi) => {
    const body: CreateRecipeBody = {
      menuItemId: recipe.menuItemId,
      name: `${recipe.name} (copie)`,
      category: recipe.category,
      prepTimeMinutes: recipe.prepTimeMinutes,
      portions: recipe.portions,
      instructions: (recipe.instructions ?? []).map((s) =>
        typeof s === 'string' ? { text: s, timeMinutes: 0 } : { text: s.text, timeMinutes: s.timeMinutes ?? 0 }
      ),
      allergenIds: recipe.allergenIds ?? [],
      image: recipe.image,
      gallery: recipe.gallery ?? [],
      ingredients: (recipe.ingredients ?? []).map((i) => ({
        ingredientId: i.ingredientId,
        quantity: Number(i.quantity),
        unit: i.unit ?? 'g',
        pricePerUnit: Number(i.pricePerUnit),
        lossPercent: Number(i.lossPercent ?? 0),
      })),
    };
    try {
      await recipesApi.create(body);
      toast({ title: 'Rețetă duplicată' });
      await fetchRecipes();
    } catch (e) {
      toast({ title: 'Eroare la duplicare', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Ștergi această rețetă?')) return;
    try {
      await recipesApi.delete(id);
      toast({ title: 'Rețetă ștearsă' });
      await fetchRecipes();
      setShowRecipeDialog(false);
    } catch (e) {
      toast({ title: 'Eroare la ștergere', variant: 'destructive' });
    }
  };

  const toggleAllergen = (id: number) =>
    setFormAllergenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const addGalleryImage = (dataUrl: string) => setFormGallery((prev) => [...prev, dataUrl]);
  const removeGalleryImage = (index: number) => setFormGallery((prev) => prev.filter((_, i) => i !== index));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută rețetă..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <Button onClick={openCreate} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Rețetă Nouă
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => {
          const recCost = (recipe.ingredients ?? []).reduce((s, i) => {
            const lossFactor = 1 + (Number(i.lossPercent ?? 0) / 100);
            return s + Number(i.quantity) * lossFactor * Number(i.pricePerUnit);
          }, 0);
          const recCostPerPortion = recipe.portions > 0 ? recCost / recipe.portions : 0;
          const recipeImage = recipe.image || (recipe.menuItemId ? menuProducts.find((p) => p.id === recipe.menuItemId)?.image : undefined);
          return (
            <Card
              key={recipe.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden"
              onClick={() => openEdit(recipe)}
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {recipeImage ? (
                  <img src={imageSrc(recipeImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ChefHat className="h-16 w-16 text-primary/40" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Editează
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(recipe);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{recipe.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {recipe.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recipe.prepTimeMinutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipe.portions} {recipe.portions === 1 ? 'porție' : 'porții'}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex gap-1 flex-wrap">
                    {allergens
                      .filter((a) => (recipe.allergenIds ?? []).includes(a.id))
                      .slice(0, 2)
                      .map((a) => (
                        <Badge key={a.id} variant="outline" className="text-xs">
                          {a.name}
                        </Badge>
                      ))}
                    {(recipe.allergenIds ?? []).length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{(recipe.allergenIds ?? []).length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cost/porție</p>
                    <p className="font-bold text-primary">{recCostPerPortion.toFixed(2)} RON</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {recipes.length === 0
              ? 'Nicio rețetă. Adaugă una legată de un produs din meniu.'
              : 'Nicio rețetă nu corespunde filtrelor.'}
          </CardContent>
        </Card>
      )}

      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'Editare Rețetă' : 'Rețetă Nouă'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4 flex-1 min-h-0 flex flex-col">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">Detalii</TabsTrigger>
              <TabsTrigger value="ingredients">Ingrediente</TabsTrigger>
              <TabsTrigger value="calculator">Calculator Porții</TabsTrigger>
              <TabsTrigger value="gallery">Galerie</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[55vh] mt-4">
              <TabsContent value="details" className="space-y-4 pb-4 pr-2 mt-0">
                <div className="space-y-2">
                  <Label>Produs din meniu (opțional)</Label>
                  <SearchableSelect
                    value={formProductId === '' ? '' : String(formProductId)}
                    placeholder="— Selectează produs —"
                    searchPlaceholder="Caută produs..."
                    options={menuProducts.map((p) => ({
                      value: String(p.id),
                      label: `${p.name} (${p.category})`,
                      keywords: `${p.name} ${p.category}`,
                    }))}
                    onValueChange={(v) => onSelectProduct(v === '' ? '' : Number(v))}
                  />
                  <p className="text-xs text-muted-foreground">
                    La selectare se completează automat: nume, categorie, timp preparare, alergeni, ingrediente.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nume rețetă</Label>
                    <Input
                      placeholder="Ex: Pizza Margherita"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categorie</Label>
                    <Input
                      placeholder="Ex: Pizza"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timp preparare (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formPrepTime || ''}
                      onChange={(e) => setFormPrepTime(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porții rezultate</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formPortions}
                      onChange={(e) => setFormPortions(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alergeni</Label>
                  <div className="flex flex-wrap gap-3">
                    {allergens.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formAllergenIds.includes(a.id)}
                          onCheckedChange={() => toggleAllergen(a.id)}
                        />
                        <span className="text-sm">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instrucțiuni preparare (fiecare pas – text + timp în minute)</Label>
                  {formInstructions.map((step, index) => (
                    <div key={index} className="flex gap-2 items-center flex-wrap">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <Input
                        placeholder={`Pas ${index + 1}`}
                        value={step.text}
                        onChange={(e) => setInstructionText(index, e.target.value)}
                        className="flex-1 min-w-[200px]"
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Min"
                          className="w-16"
                          value={step.timeMinutes === 0 ? '' : step.timeMinutes}
                          onChange={(e) => setInstructionTime(index, parseInt(e.target.value, 10) || 0)}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInstruction(index)}
                        disabled={formInstructions.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă pas
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ingredients" className="space-y-4 pb-4 pr-2 mt-0">
                <Label>Ingrediente</Label>
                <div className="space-y-3">
                  {formIngredients.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-[220px] flex-1">
                        <SearchableSelect
                          value={validIngredientId(ing.ingredientId) ? String(ing.ingredientId) : ''}
                          placeholder="— Selectează ingredient —"
                          searchPlaceholder="Caută ingredient..."
                          options={ingredientsFromApi.map((i) => ({
                            value: String(i.id),
                            label: `${i.name}${i.defaultUnit ? ` (${i.defaultUnit})` : ''}`,
                            keywords: `${i.name} ${i.defaultUnit ?? ''}`,
                          }))}
                          onValueChange={(v) => onSelectIngredientInRow(ing.id, Number(v))}
                        />
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Cantitate"
                        className="w-24"
                        value={ing.quantity || ''}
                        onChange={(e) => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                      <select
                        className="flex h-10 w-20 rounded-md border border-input bg-background px-2 text-sm"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Preț unit."
                          className="w-24"
                          value={ing.pricePerUnit || ''}
                          onChange={(e) => updateIngredient(ing.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-sm text-muted-foreground">RON</span>
                      </div>
                      <div className="flex items-center gap-1" title="Procent pierdere (0–100); intră în cost per porție">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="Pierdere %"
                          className="w-20"
                          value={ing.lossPercent ?? ''}
                          onChange={(e) => updateIngredient(ing.id, 'lossPercent', parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(ing.id)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full" onClick={addIngredientRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă ingredient
                  </Button>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Cost total estimat</p>
                        <p className="text-2xl font-bold text-primary">{totalCost.toFixed(2)} RON</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost per porție</p>
                        <p className="text-xl font-bold">{costPerPortion.toFixed(2)} RON</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calculator" className="space-y-4 pb-4 pr-2 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Calculator proporții (porții dorite)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label>Număr porții dorite:</Label>
                      <Input
                        type="number"
                        className="w-24"
                        min={1}
                        value={portionMultiplier}
                        onChange={(e) =>
                          setPortionMultiplier(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        (rețeta de bază: {basePortions} porții)
                      </span>
                    </div>
                    <div className="border rounded-lg divide-y">
                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 font-medium text-sm">
                        <span>Ingredient</span>
                        <span>Pentru {basePortions} porții</span>
                        <span>Pentru {portionMultiplier} porții</span>
                        <span>Cost total</span>
                      </div>
                      {formIngredients
                        .filter((i) => validIngredientId(i.ingredientId))
                        .map((ing) => {
                          const q = ing.quantity * (portionMultiplier / basePortions);
                          const lossFactor = 1 + (Number(ing.lossPercent ?? 0) / 100);
                          const cost = q * lossFactor * ing.pricePerUnit;
                          return (
                            <div key={ing.id} className="grid grid-cols-4 gap-4 p-3 text-sm">
                              <span className="font-medium">{ing.name || '—'}</span>
                              <span className="text-muted-foreground">
                                {ing.quantity} {ing.unit}
                              </span>
                              <span className="font-medium text-primary">
                                {q.toFixed(1)} {ing.unit}
                              </span>
                              <span>{cost.toFixed(2)} RON</span>
                            </div>
                          );
                        })}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Cost total pentru {portionMultiplier} porții
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {scaledCost.toFixed(2)} RON
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gallery" className="space-y-4 pb-4 pr-2 mt-0">
                <div className="space-y-2">
                  <Label>Imagine principală</Label>
                  <ImageUploadButton
                    value={formImage ?? undefined}
                    onChange={(v) => setFormImage(v || null)}
                    onError={(msg) => toast({ title: msg, variant: 'destructive' })}
                    label=""
                  />
                </div>
                <div className="space-y-2">
                  <Label>Galerie (imagini suplimentare)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formGallery.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl border overflow-hidden bg-muted group"
                      >
                        <img
                          src={imageSrc(url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file?.type.startsWith('image/')) return;
                          const reader = new FileReader();
                          reader.onload = () => typeof reader.result === 'string' && addGalleryImage(reader.result);
                          reader.readAsDataURL(file);
                        }}
                      />
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground mt-1">Adaugă în galerie</span>
                    </label>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            {editingRecipe && (
              <Button
                variant="destructive"
                onClick={() => handleDelete(editingRecipe.id)}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowRecipeDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvează Rețeta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipesManager;
