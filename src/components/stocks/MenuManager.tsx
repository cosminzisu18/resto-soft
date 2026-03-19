import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItem, extraIngredients as mockExtraIngredients } from '@/data/mockData';
import { menuApi, recipesApi, imageSrc, type MenuItemApi, type MenuCategoryApi, type MenuItemIngredientApi, type InstructionStepApi } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ImageUploadButton } from '@/components/ui/image-upload-button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Plus, Search, Edit, Trash2, Save, X, Image as ImageIcon, ImagePlus,
  UtensilsCrossed, Clock, DollarSign, Tag, Store, Truck, Smartphone, Monitor,
  ChevronDown, Calculator, GripVertical
} from 'lucide-react';

const UNITS = ['g', 'kg', 'ml', 'L', 'buc'];

// Category icons
const categoryIcons: Record<string, string> = {
  'Supe': '🍲',
  'Pizza': '🍕',
  'Grill': '🔥',
  'Giros': '🥙',
  'Paste': '🍝',
  'Salate': '🥗',
  'Garnituri': '🍟',
  'Deserturi': '🍰',
  'Băuturi': '🥤',
};

/** Un rând de ingredient în formular (ca la rețetă). */
interface FormIngredient {
  id: string;
  ingredientId: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  lossPercent: number;
}

/** Element din listă: id string pentru afișare, menuItemIngredients pentru formular */
interface MenuItemDisplay extends Omit<MenuItem, 'id' | 'kdsStation' | 'allergenIds' | 'availableExtras' | 'ingredients'> {
  id: string;
  kdsStation: string;
  menuItemIngredients?: MenuItemIngredientApi[];
  allergenIds: number[];
  availableExtras: number[];
  instructions?: InstructionStepApi[];
  portions?: number;
  gallery?: string[];
}

interface MenuFormData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  kdsStation: number;
  prepTime: number;
  allergenIds: number[];
  image: string;
  availableExtras: number[];
  availability: {
    restaurant: boolean;
    kiosk: boolean;
    app: boolean;
    delivery: boolean;
  };
  platformPricing: {
    glovo: { name: string; price: number; enabled: boolean };
    wolt: { name: string; price: number; enabled: boolean };
    bolt: { name: string; price: number; enabled: boolean };
    own: { name: string; price: number; enabled: boolean };
  };
}

const defaultFormData: MenuFormData = {
  id: '',
  name: '',
  description: '',
  price: 0,
  category: 'Supe',
  kdsStation: 1,
  prepTime: 10,
  allergenIds: [],
  image: '',
  availableExtras: [],
  availability: {
    restaurant: true,
    kiosk: true,
    app: true,
    delivery: true,
  },
  platformPricing: {
    glovo: { name: '', price: 0, enabled: false },
    wolt: { name: '', price: 0, enabled: false },
    bolt: { name: '', price: 0, enabled: false },
    own: { name: '', price: 0, enabled: false },
  },
};

function mapApiItemToMenuItem(api: MenuItemApi): MenuItemDisplay {
  return {
    id: String(api.id),
    name: api.name,
    description: api.description ?? '',
    price: api.price,
    category: api.category,
    kdsStation: String(api.kdsStationId),
    prepTime: api.prepTime,
    portions: api.portions,
    instructions: api.instructions,
    menuItemIngredients: api.menuItemIngredients,
    allergenIds: api.allergens?.map((a) => a.id) ?? [],
    availableExtras: api.availableExtras?.map((e) => e.id) ?? [],
    image: api.image,
    gallery: api.gallery,
    availability: {
      restaurant: api.availability?.restaurant ?? true,
      kiosk: api.availability?.kiosk ?? true,
      app: api.availability?.app ?? true,
      delivery: api.availability?.delivery ?? true,
    },
    platformPricing: api.platformPricing,
  };
}

export const MenuManager: React.FC = () => {
  const [menu, setMenu] = useState<MenuItemDisplay[]>([]);
  const [kdsStationsFromApi, setKdsStationsFromApi] = useState<{ id: number; name: string; type: string }[]>([]);
  const [allergensFromApi, setAllergensFromApi] = useState<{ id: number; name: string; icon?: string }[]>([]);
  const [extraIngredients, setExtraIngredients] = useState<{ id: number; name: string; price: number; category?: string }[]>([]);
  const [categoriesFromApi, setCategoriesFromApi] = useState<MenuCategoryApi[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDisplay | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData);
  const [ingredientsFromApi, setIngredientsFromApi] = useState<{ id: number; name: string; defaultUnit?: string | null }[]>([]);
  const [formIngredients, setFormIngredients] = useState<FormIngredient[]>([]);
  const [formInstructions, setFormInstructions] = useState<{ text: string; timeMinutes: number }[]>([{ text: '', timeMinutes: 0 }]);
  const [formPortions, setFormPortions] = useState(1);
  const [formGallery, setFormGallery] = useState<string[]>([]);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [formTab, setFormTab] = useState('basic');

  const validIngredientId = (id: number) => Number.isFinite(id) && id > 0;
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

  const fetchMenu = async () => {
    try {
      const list = await menuApi.getItems();
      setMenu(list.map(mapApiItemToMenuItem));
    } catch (e) {
      toast({ title: 'Eroare la încărcare meniu', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraIngredients = async () => {
    try {
      const list = await menuApi.getExtraIngredients();
      if (list.length > 0) setExtraIngredients(list);
    } catch {
      setExtraIngredients(mockExtraIngredients.map((e, i) => ({ id: i + 1, name: e.name, price: e.price, category: e.category })));
    }
  };

  const fetchKdsAndAllergens = async () => {
    try {
      const [kds, allergens] = await Promise.all([menuApi.getKdsStations(), menuApi.getAllergens()]);
      if (kds.length > 0) setKdsStationsFromApi(kds);
      if (allergens.length > 0) setAllergensFromApi(allergens);
    } catch {
      // rămân listele goale până la seed
    }
  };

  const fetchCategories = async () => {
    try {
      const list = await menuApi.getCategories();
      setCategoriesFromApi(list);
    } catch {
      setCategoriesFromApi([]);
    }
  };

  const fetchIngredients = async () => {
    try {
      const list = await menuApi.getIngredients();
      setIngredientsFromApi(list);
    } catch {
      setIngredientsFromApi([]);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchExtraIngredients();
    fetchKdsAndAllergens();
    fetchCategories();
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      fetchCategories();
      fetchIngredients();
    }
  }, [isDialogOpen]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchQuery, selectedCategory]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      ...defaultFormData,
      id: '',
      category: categoriesFromApi[0]?.name ?? defaultFormData.category,
      kdsStation: kdsStationsFromApi[0]?.id ?? 1,
    });
    setFormInstructions([{ text: '', timeMinutes: 0 }]);
    setFormPortions(1);
    setFormGallery([]);
    setFormIngredients([]);
    setPortionMultiplier(1);
    setFormTab('basic');
    setIsDialogOpen(true);
  };

  const addIngredientRow = () =>
    setFormIngredients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ingredientId: 0,
        name: '',
        quantity: 0,
        unit: 'g',
        pricePerUnit: 0,
        lossPercent: 0,
      },
    ]);

  const removeIngredientRow = (id: string) =>
    setFormIngredients((prev) => prev.filter((i) => i.id !== id));

  const updateIngredientRow = (id: string, field: keyof FormIngredient, value: string | number) =>
    setFormIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );

  const onSelectIngredientInRow = (rowId: string, ingredientId: number) => {
    const ing = ingredientsFromApi.find((i) => i.id === ingredientId);
    setFormIngredients((prev) =>
      prev.map((i) =>
        i.id === rowId
          ? {
              ...i,
              ingredientId,
              name: ing?.name ?? '',
              unit: ing?.defaultUnit ?? 'g',
            }
          : i
      )
    );
  };

  const openEditDialog = (item: MenuItemDisplay) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category,
      kdsStation: Number(item.kdsStation) || 1,
      prepTime: item.prepTime,
      allergenIds: item.allergenIds || [],
      image: item.image || '',
      availableExtras: item.availableExtras || [],
      availability: item.availability || { restaurant: true, kiosk: true, app: true, delivery: true },
      platformPricing: {
        glovo: item.platformPricing?.glovo || { name: '', price: 0, enabled: false },
        wolt: item.platformPricing?.wolt || { name: '', price: 0, enabled: false },
        bolt: item.platformPricing?.bolt || { name: '', price: 0, enabled: false },
        own: item.platformPricing?.own || { name: '', price: 0, enabled: false },
      },
    });
    setFormInstructions(
      item.instructions?.length
        ? item.instructions.map((s) => ({
            text: typeof s === 'string' ? s : (s as InstructionStepApi).text,
            timeMinutes: typeof s === 'string' ? 0 : ((s as InstructionStepApi).timeMinutes ?? 0),
          }))
        : [{ text: '', timeMinutes: 0 }]
    );
    setFormPortions(item.portions ?? 1);
    setFormGallery(item.gallery ?? []);
    setPortionMultiplier(item.portions ?? 1);
    setFormIngredients(
      item.menuItemIngredients?.length
        ? item.menuItemIngredients.map((mi) => ({
            id: crypto.randomUUID(),
            ingredientId: mi.ingredientId,
            name: mi.ingredient?.name ?? '',
            quantity: Number(mi.quantity),
            unit: mi.unit ?? 'g',
            pricePerUnit: Number(mi.pricePerUnit),
            lossPercent: Number(mi.lossPercent ?? 0),
          }))
        : []
    );
    setFormTab('basic');
    setIsDialogOpen(true);
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

  const buildItemBody = () => {
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
    return {
      name: formData.name.trim(),
      description: formData.description || undefined,
      price: formData.price,
      category: formData.category,
      kdsStationId: formData.kdsStation,
      prepTime: formData.prepTime,
      portions: formPortions,
      instructions: instructions.length ? instructions : undefined,
      ingredients: ingredients.length ? ingredients : undefined,
      image: formData.image || undefined,
      gallery: formGallery.length ? formGallery : undefined,
      availability: formData.availability,
      platformPricing: formData.platformPricing,
      allergenIds: formData.allergenIds.length ? formData.allergenIds : undefined,
      availableExtrasIds: formData.availableExtras.length ? formData.availableExtras : undefined,
    };
  };

  const addGalleryImage = (dataUrl: string) => setFormGallery((prev) => [...prev, dataUrl]);
  const removeGalleryImage = (index: number) =>
    setFormGallery((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Eroare', description: 'Numele este obligatoriu.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const body = buildItemBody();
      if (editingItem) {
        await menuApi.updateItem(Number(editingItem.id), body);
        try {
          await recipesApi.syncFromMenuItem(Number(editingItem.id), {
            name: formData.name.trim(),
            category: formData.category,
            prepTimeMinutes: formData.prepTime,
            allergenIds: formData.allergenIds,
            image: formData.image || null,
          });
        } catch {
          // rețetele legate se actualizează la salvare rețetă
        }
        toast({ title: 'Produs actualizat', description: `${formData.name} a fost modificat.` });
      } else {
        await menuApi.createItem(body);
        toast({ title: 'Produs creat', description: `${formData.name} a fost adăugat în meniu.` });
      }
      setIsDialogOpen(false);
      await fetchMenu();
    } catch (e) {
      toast({ title: 'Eroare la salvare', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await menuApi.createCategory({ name, icon: newCategoryIcon.trim() || undefined });
      await fetchCategories();
      setFormData((prev) => ({ ...prev, category: name }));
      setNewCategoryName('');
      setNewCategoryIcon('');
      toast({ title: 'Categorie adăugată', description: `„${name}" a fost creată.` });
    } catch (e) {
      toast({ title: 'Eroare', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, cat: MenuCategoryApi) => {
    e.stopPropagation();
    if (!confirm(`Ștergi categoria „${cat.name}"? Produsele cu această categorie nu vor fi șterse.`)) return;
    try {
      await menuApi.deleteCategory(cat.id);
      await fetchCategories();
      if (formData.category === cat.name) setFormData((prev) => ({ ...prev, category: categoriesFromApi[0]?.name ?? '' }));
      toast({ title: 'Categorie ștearsă' });
    } catch (err) {
      toast({ title: 'Eroare', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const toggleAllergen = (allergenId: number) => {
    setFormData(prev => ({
      ...prev,
      allergenIds: prev.allergenIds.includes(allergenId)
        ? prev.allergenIds.filter(a => a !== allergenId)
        : [...prev.allergenIds, allergenId]
    }));
  };

  const toggleExtra = (extraId: number) => {
    setFormData(prev => ({
      ...prev,
      availableExtras: prev.availableExtras.includes(extraId)
        ? prev.availableExtras.filter(e => e !== extraId)
        : [...prev.availableExtras, extraId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Se încarcă meniul...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută produse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await menuApi.seedBaseData();
                toast({ title: 'Date inițiale încărcate', description: 'Stații KDS, categorii, alergeni și ingrediente extra au fost adăugate.' });
                fetchExtraIngredients();
                fetchKdsAndAllergens();
                fetchCategories();
              } catch (e) {
                toast({ title: 'Eroare seed', description: (e as Error).message, variant: 'destructive' });
              }
            }}
          >
            Încarcă date inițiale
          </Button>
          <Button onClick={openCreateDialog} className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă produs
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Toate ({menu.length})
          </Button>
          {categoriesFromApi.map(cat => {
            const count = menu.filter(m => m.category === cat.name).length;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
                className="whitespace-nowrap"
              >
                {cat.icon ?? categoryIcons[cat.name] ?? '•'} {cat.name} ({count})
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMenu.map(item => (
          <Card 
            key={item.id} 
            className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => openEditDialog(item)}
          >
            {/* Image */}
            <div className="relative h-32 sm:h-40 bg-muted overflow-hidden">
              {item.image ? (
                <img src={imageSrc(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {categoryIcons[item.category] || '🍽️'}
                </div>
              )}
              {/* Category Badge */}
              <Badge className="absolute top-2 left-2 text-xs">
                {item.category}
              </Badge>
              {/* Edit Button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{item.name}</h3>
                <span className="font-bold text-primary whitespace-nowrap">{item.price} RON</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
              
              {/* Info Row */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.prepTime} min
                </span>
                <span>•</span>
                <span>{kdsStationsFromApi.find(s => s.id === Number(item.kdsStation))?.name ?? item.kdsStation}</span>
              </div>

              {/* Allergens */}
              {item.allergenIds && item.allergenIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.allergenIds.map(aid => {
                    const allergen = allergensFromApi.find(a => a.id === aid);
                    return allergen ? (
                      <span key={aid} className="text-xs" title={allergen.name}>
                        {allergen.icon ?? '•'}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Availability Icons */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                {item.availability?.restaurant && <span title="Restaurant"><Monitor className="h-3.5 w-3.5 text-green-500" /></span>}
                {item.availability?.kiosk && <span title="Kiosk"><Store className="h-3.5 w-3.5 text-blue-500" /></span>}
                {item.availability?.app && <span title="App"><Smartphone className="h-3.5 w-3.5 text-purple-500" /></span>}
                {item.availability?.delivery && <span title="Delivery"><Truck className="h-3.5 w-3.5 text-orange-500" /></span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nu s-au găsit produse</p>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingItem ? 'Editează produs' : 'Adaugă produs nou'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={formTab} onValueChange={setFormTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="flex flex-wrap gap-1 w-full h-auto">
              <TabsTrigger value="basic">General</TabsTrigger>
              <TabsTrigger value="instructions">Instrucțiuni</TabsTrigger>
              <TabsTrigger value="ingredients">Ingrediente</TabsTrigger>
              <TabsTrigger value="calculator">Calculator proporții</TabsTrigger>
              <TabsTrigger value="gallery">Galerie</TabsTrigger>
              <TabsTrigger value="availability">Disponibilitate</TabsTrigger>
              <TabsTrigger value="pricing">Prețuri</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[55vh] mt-4">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="m-0 space-y-4 pb-4 pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nume</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Numele produsului"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preț (RON)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descriere</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrierea produsului..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Categorie</Label>
                    <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">{formData.category || 'Selectează categoria'}</span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <div className="max-h-64 overflow-y-auto">
                          {categoriesFromApi.map((cat) => (
                            <div
                              key={cat.id}
                              className={cn(
                                "flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted",
                                formData.category === cat.name && "bg-muted"
                              )}
                              onClick={() => { setFormData((prev) => ({ ...prev, category: cat.name })); setCategoryPopoverOpen(false); }}
                            >
                              <span>{cat.icon ?? categoryIcons[cat.name] ?? '•'} {cat.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDeleteCategory(e, cat)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="border-t p-2 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground px-1">Adaugă categorie nouă</p>
                          <div className="space-y-2">
                            <Input
                              placeholder="Nume categorie"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                              className="h-9"
                            />
                            <Input
                              placeholder="Icon (ex: 🍕 sau emoji)"
                              value={newCategoryIcon}
                              onChange={(e) => setNewCategoryIcon(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                              className="h-9"
                            />
                            <Button type="button" size="sm" className="w-full gap-2" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                              <Plus className="h-4 w-4" />
                              Adaugă
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Stație KDS</Label>
                    <Select
                      value={String(formData.kdsStation)}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, kdsStation: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {kdsStationsFromApi.map(station => (
                          <SelectItem key={station.id} value={String(station.id)}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timp preparare (min)</Label>
                    <Input
                      type="number"
                      value={formData.prepTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>
                </div>

                <ImageUploadButton
                  label=""
                  value={formData.image || undefined}
                  onChange={(value) => setFormData((prev) => ({ ...prev, image: value }))}
                  onError={(msg) => msg && toast({ title: 'Eroare imagine', description: msg, variant: 'destructive' })}
                />

                {/* Allergens */}
                <div className="space-y-2">
                  <Label>Alergeni</Label>
                  <div className="flex flex-wrap gap-2">
                    {allergensFromApi.map(allergen => (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
                          formData.allergenIds.includes(allergen.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {allergen.icon && <span>{allergen.icon}</span>}
                        <span>{allergen.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Instrucțiuni preparare */}
              <TabsContent value="instructions" className="m-0 space-y-4 pb-4 pr-2">
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

              {/* Ingredients Tab – ca la rețetă: rânduri cu cantitate, unitate, preț, pierdere % */}
              <TabsContent value="ingredients" className="m-0 space-y-4 pb-4 pr-2">
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
                        onChange={(e) => updateIngredientRow(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                      <select
                        className="flex h-10 w-20 rounded-md border border-input bg-background px-2 text-sm"
                        value={ing.unit}
                        onChange={(e) => updateIngredientRow(ing.id, 'unit', e.target.value)}
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
                          onChange={(e) => updateIngredientRow(ing.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-sm text-muted-foreground">RON</span>
                      </div>
                      <div className="flex items-center gap-1" title="Procent pierdere (0–100)">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="Pierdere %"
                          className="w-20"
                          value={ing.lossPercent ?? ''}
                          onChange={(e) => updateIngredientRow(ing.id, 'lossPercent', parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredientRow(ing.id)}
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

                <div className="space-y-2">
                  <Label>Ingrediente Extra Disponibile</Label>
                  <p className="text-sm text-muted-foreground">Selectează ce extra-uri pot fi adăugate la acest produs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {extraIngredients.map(extra => (
                      <label
                        key={extra.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                          formData.availableExtras.includes(extra.id)
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={formData.availableExtras.includes(extra.id)}
                          onCheckedChange={() => toggleExtra(extra.id)}
                        />
                        <span className="flex-1 text-sm">{extra.name}</span>
                        <span className="text-sm text-muted-foreground">(+{extra.price} RON)</span>
                      </label>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Calculator proporții – ca la rețetă: listă ingrediente + cantități scalate + cost */}
              <TabsContent value="calculator" className="m-0 space-y-4 pb-4 pr-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Calculator proporții (porții dorite)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="space-y-1">
                        <Label>Porții de bază</Label>
                        <Input
                          type="number"
                          className="w-24"
                          min={1}
                          value={formPortions}
                          onChange={(e) =>
                            setFormPortions(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Număr porții dorite</Label>
                        <Input
                          type="number"
                          className="w-24"
                          min={1}
                          value={portionMultiplier}
                          onChange={(e) =>
                            setPortionMultiplier(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                        />
                      </div>
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

              {/* Galerie */}
              <TabsContent value="gallery" className="m-0 space-y-4 pb-4 pr-2">
                <div className="space-y-2">
                  <Label>Imagine principală</Label>
                  <ImageUploadButton
                    value={formData.image || undefined}
                    onChange={(v) => setFormData((prev) => ({ ...prev, image: v || '' }))}
                    onError={(msg) => msg && toast({ title: 'Eroare imagine', description: msg, variant: 'destructive' })}
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

              {/* Availability Tab */}
              <TabsContent value="availability" className="m-0 space-y-4 pb-4 pr-2">
                <Label className="text-base font-semibold">Disponibilitate</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Monitor className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Restaurant</p>
                        <p className="text-sm text-muted-foreground">POS și ospătari</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.availability.restaurant}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        availability: { ...prev.availability, restaurant: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Store className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Kiosk</p>
                        <p className="text-sm text-muted-foreground">Self-service</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.availability.kiosk}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        availability: { ...prev.availability, kiosk: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">App</p>
                        <p className="text-sm text-muted-foreground">Aplicație mobilă</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.availability.app}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        availability: { ...prev.availability, app: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Delivery</p>
                        <p className="text-sm text-muted-foreground">Livrare la domiciliu</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.availability.delivery}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        availability: { ...prev.availability, delivery: checked }
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="m-0 space-y-4 pb-4 pr-2">
                <div className="p-4 rounded-xl border bg-muted/30 mb-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Preț standard: {formData.price} RON</p>
                      <p className="text-sm text-muted-foreground">Configurat în tab-ul General</p>
                    </div>
                  </div>
                </div>

                <Label className="text-base font-semibold">Prețuri platforme</Label>
                <p className="text-sm text-muted-foreground">Configurează prețuri diferite pentru fiecare platformă de livrare</p>

                <ScrollArea className="h-[320px] w-full rounded-lg border p-1">
                <div className="space-y-4 pr-3 pb-2">
                  {/* Glovo */}
                  <div className="p-4 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🟡</span>
                        <span className="font-medium">Glovo</span>
                      </div>
                      <Switch
                        checked={formData.platformPricing.glovo.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          platformPricing: {
                            ...prev.platformPricing,
                            glovo: { ...prev.platformPricing.glovo, enabled: checked }
                          }
                        }))}
                      />
                    </div>
                    {formData.platformPricing.glovo.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nume afișat</Label>
                          <Input
                            value={formData.platformPricing.glovo.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                glovo: { ...prev.platformPricing.glovo, name: e.target.value }
                              }
                            }))}
                            placeholder={formData.name}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preț (RON)</Label>
                          <Input
                            type="number"
                            value={formData.platformPricing.glovo.price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                glovo: { ...prev.platformPricing.glovo, price: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wolt */}
                  <div className="p-4 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔵</span>
                        <span className="font-medium">Wolt</span>
                      </div>
                      <Switch
                        checked={formData.platformPricing.wolt.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          platformPricing: {
                            ...prev.platformPricing,
                            wolt: { ...prev.platformPricing.wolt, enabled: checked }
                          }
                        }))}
                      />
                    </div>
                    {formData.platformPricing.wolt.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nume afișat</Label>
                          <Input
                            value={formData.platformPricing.wolt.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                wolt: { ...prev.platformPricing.wolt, name: e.target.value }
                              }
                            }))}
                            placeholder={formData.name}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preț (RON)</Label>
                          <Input
                            type="number"
                            value={formData.platformPricing.wolt.price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                wolt: { ...prev.platformPricing.wolt, price: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bolt */}
                  <div className="p-4 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🟢</span>
                        <span className="font-medium">Bolt Food</span>
                      </div>
                      <Switch
                        checked={formData.platformPricing.bolt.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          platformPricing: {
                            ...prev.platformPricing,
                            bolt: { ...prev.platformPricing.bolt, enabled: checked }
                          }
                        }))}
                      />
                    </div>
                    {formData.platformPricing.bolt.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nume afișat</Label>
                          <Input
                            value={formData.platformPricing.bolt.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                bolt: { ...prev.platformPricing.bolt, name: e.target.value }
                              }
                            }))}
                            placeholder={formData.name}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preț (RON)</Label>
                          <Input
                            type="number"
                            value={formData.platformPricing.bolt.price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                bolt: { ...prev.platformPricing.bolt, price: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  <div className="p-4 rounded-xl border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏠</span>
                        <span className="font-medium">Website Propriu</span>
                      </div>
                      <Switch
                        checked={formData.platformPricing.own.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          platformPricing: {
                            ...prev.platformPricing,
                            own: { ...prev.platformPricing.own, enabled: checked }
                          }
                        }))}
                      />
                    </div>
                    {formData.platformPricing.own.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nume afișat</Label>
                          <Input
                            value={formData.platformPricing.own.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                own: { ...prev.platformPricing.own, name: e.target.value }
                              }
                            }))}
                            placeholder={formData.name}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preț (RON)</Label>
                          <Input
                            type="number"
                            value={formData.platformPricing.own.price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              platformPricing: {
                                ...prev.platformPricing,
                                own: { ...prev.platformPricing.own, price: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </ScrollArea>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManager;
