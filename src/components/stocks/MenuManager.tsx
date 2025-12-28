import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useRestaurant } from '@/context/RestaurantContext';
import { MenuItem, menuCategories, kdsStations, allergens, extraIngredients } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, Search, Edit, Trash2, Save, X, Image as ImageIcon,
  UtensilsCrossed, Clock, DollarSign, Tag, Store, Truck, Smartphone, Monitor
} from 'lucide-react';

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

interface MenuFormData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  kdsStation: string;
  prepTime: number;
  ingredients: string[];
  allergenIds: string[];
  image: string;
  availableExtras: string[];
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
  kdsStation: 'soups',
  prepTime: 10,
  ingredients: [],
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

export const MenuManager: React.FC = () => {
  const { menu } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData);
  const [newIngredient, setNewIngredient] = useState('');
  const [formTab, setFormTab] = useState('basic');

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchQuery, selectedCategory]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({ ...defaultFormData, id: `m${Date.now()}` });
    setFormTab('basic');
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      kdsStation: item.kdsStation,
      prepTime: item.prepTime,
      ingredients: item.ingredients || [],
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
    setFormTab('basic');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // In a real app, this would update the menu via context/API
    console.log('Saving menu item:', formData);
    setIsDialogOpen(false);
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !formData.ingredients.includes(newIngredient.trim())) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i !== ingredient)
    }));
  };

  const toggleAllergen = (allergenId: string) => {
    setFormData(prev => ({
      ...prev,
      allergenIds: prev.allergenIds.includes(allergenId)
        ? prev.allergenIds.filter(a => a !== allergenId)
        : [...prev.allergenIds, allergenId]
    }));
  };

  const toggleExtra = (extraId: string) => {
    setFormData(prev => ({
      ...prev,
      availableExtras: prev.availableExtras.includes(extraId)
        ? prev.availableExtras.filter(e => e !== extraId)
        : [...prev.availableExtras, extraId]
    }));
  };

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
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Adaugă produs
        </Button>
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
          {menuCategories.map(cat => {
            const count = menu.filter(m => m.category === cat).length;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {categoryIcons[cat]} {cat} ({count})
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
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                <span>{kdsStations.find(s => s.id === item.kdsStation)?.name || item.kdsStation}</span>
              </div>

              {/* Allergens */}
              {item.allergenIds && item.allergenIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.allergenIds.map(aid => {
                    const allergen = allergens.find(a => a.id === aid);
                    return allergen ? (
                      <span key={aid} className="text-xs" title={allergen.name}>
                        {allergen.icon}
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
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">General</TabsTrigger>
              <TabsTrigger value="ingredients">Ingrediente</TabsTrigger>
              <TabsTrigger value="availability">Disponibilitate</TabsTrigger>
              <TabsTrigger value="pricing">Prețuri</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="m-0 space-y-4">
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
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {menuCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {categoryIcons[cat]} {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Stație KDS</Label>
                    <Select
                      value={formData.kdsStation}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, kdsStation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {kdsStations.map(station => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.icon} {station.name}
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

                <div className="space-y-2">
                  <Label>Imagine URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    {formData.image && (
                      <div className="h-10 w-10 rounded border overflow-hidden flex-shrink-0">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Allergens */}
                <div className="space-y-2">
                  <Label>Alergeni</Label>
                  <div className="flex flex-wrap gap-2">
                    {allergens.map(allergen => (
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
                        <span>{allergen.icon}</span>
                        <span>{allergen.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Ingredients Tab */}
              <TabsContent value="ingredients" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label>Ingrediente</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      placeholder="Adaugă ingredient..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                    />
                    <Button type="button" onClick={addIngredient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.ingredients.map(ing => (
                      <Badge key={ing} variant="secondary" className="gap-1.5 pr-1.5">
                        {ing}
                        <button
                          type="button"
                          onClick={() => removeIngredient(ing)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

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

              {/* Availability Tab */}
              <TabsContent value="availability" className="m-0 space-y-4">
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
              <TabsContent value="pricing" className="m-0 space-y-4">
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

                <div className="space-y-4">
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
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Anulează
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManager;
