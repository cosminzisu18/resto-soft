import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Search, Plus, ChefHat, Clock, Users, GripVertical, X, Save, 
  ImagePlus, Calculator, Euro, Edit, Copy, Trash2
} from 'lucide-react';

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface Recipe {
  id: number;
  name: string;
  category: string;
  ingredients: Ingredient[];
  prepTime: number;
  portions: number;
  costPerPortion: number;
  image?: string;
  instructions?: string;
  allergens: string[];
}

const mockRecipes: Recipe[] = [
  { 
    id: 1, 
    name: 'Pizza Margherita', 
    category: 'Pizza',
    ingredients: [
      { id: 1, name: 'Mozzarella', quantity: 150, unit: 'g', cost: 8.7 },
      { id: 2, name: 'Sos roșii', quantity: 80, unit: 'ml', cost: 2.5 },
      { id: 3, name: 'Busuioc', quantity: 5, unit: 'g', cost: 0.5 },
      { id: 4, name: 'Aluat pizza', quantity: 250, unit: 'g', cost: 3 },
    ],
    prepTime: 15, 
    portions: 1,
    costPerPortion: 14.7,
    allergens: ['Gluten', 'Lactoză']
  },
  { 
    id: 2, 
    name: 'Gyros Pui', 
    category: 'Meniu Principal',
    ingredients: [
      { id: 1, name: 'Gyros pui', quantity: 200, unit: 'g', cost: 12 },
      { id: 2, name: 'Pâine Pita', quantity: 1, unit: 'buc', cost: 1.8 },
      { id: 3, name: 'Sos Tzatziki', quantity: 50, unit: 'ml', cost: 3 },
      { id: 4, name: 'Ceapă roșie', quantity: 30, unit: 'g', cost: 0.5 },
      { id: 5, name: 'Roșii', quantity: 50, unit: 'g', cost: 1 },
    ],
    prepTime: 10, 
    portions: 1,
    costPerPortion: 18.3,
    allergens: ['Gluten', 'Lactoză']
  },
  { 
    id: 3, 
    name: 'Salată Caesar', 
    category: 'Salate',
    ingredients: [
      { id: 1, name: 'Salată romană', quantity: 150, unit: 'g', cost: 4 },
      { id: 2, name: 'Parmezan', quantity: 30, unit: 'g', cost: 5 },
      { id: 3, name: 'Piept pui', quantity: 120, unit: 'g', cost: 8 },
      { id: 4, name: 'Crutoane', quantity: 40, unit: 'g', cost: 2 },
      { id: 5, name: 'Sos Caesar', quantity: 40, unit: 'ml', cost: 3 },
    ],
    prepTime: 8, 
    portions: 1,
    costPerPortion: 22,
    allergens: ['Gluten', 'Lactoză', 'Ouă']
  },
  { 
    id: 4, 
    name: 'Burger Classic', 
    category: 'Burgeri',
    ingredients: [
      { id: 1, name: 'Carne vită', quantity: 180, unit: 'g', cost: 15 },
      { id: 2, name: 'Chifle burger', quantity: 1, unit: 'buc', cost: 2 },
      { id: 3, name: 'Cheddar', quantity: 30, unit: 'g', cost: 4 },
      { id: 4, name: 'Ceapă caramelizată', quantity: 40, unit: 'g', cost: 2 },
    ],
    prepTime: 12, 
    portions: 1,
    costPerPortion: 23,
    allergens: ['Gluten', 'Lactoză']
  },
];

const categories = ['Toate', 'Pizza', 'Meniu Principal', 'Salate', 'Burgeri', 'Deserturi', 'Băuturi'];

const availableIngredients = [
  { name: 'Mozzarella', unit: 'g', costPer100: 5.8 },
  { name: 'Sos roșii', unit: 'ml', costPer100: 3.1 },
  { name: 'Gyros pui', unit: 'g', costPer100: 6 },
  { name: 'Pâine Pita', unit: 'buc', costPer100: 1.8 },
  { name: 'Parmezan', unit: 'g', costPer100: 16.6 },
  { name: 'Carne vită', unit: 'g', costPer100: 8.3 },
];

export const RecipesManager: React.FC = () => {
  const [recipes] = useState<Recipe[]>(mockRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toate');
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  const filteredRecipes = recipes.filter(r => 
    (selectedCategory === 'Toate' || r.category === selectedCategory) &&
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openRecipeEditor = (recipe?: Recipe) => {
    if (recipe) {
      setSelectedRecipe(recipe);
      setEditIngredients([...recipe.ingredients]);
    } else {
      setSelectedRecipe(null);
      setEditIngredients([{ id: 1, name: '', quantity: 0, unit: 'g', cost: 0 }]);
    }
    setShowRecipeDialog(true);
  };

  const addIngredient = () => {
    setEditIngredients([
      ...editIngredients,
      { id: Date.now(), name: '', quantity: 0, unit: 'g', cost: 0 }
    ]);
  };

  const removeIngredient = (id: number) => {
    setEditIngredients(editIngredients.filter(i => i.id !== id));
  };

  const updateIngredient = (id: number, field: keyof Ingredient, value: string | number) => {
    setEditIngredients(editIngredients.map(i => 
      i.id === id ? { ...i, [field]: value } : i
    ));
  };

  const calculateTotalCost = () => {
    return editIngredients.reduce((sum, i) => sum + i.cost, 0);
  };

  const handleSaveRecipe = () => {
    toast({ title: "Rețetă salvată", description: "Rețeta a fost salvată cu succes" });
    setShowRecipeDialog(false);
  };

  const handleDuplicateRecipe = (recipe: Recipe) => {
    toast({ title: "Rețetă duplicată", description: `${recipe.name} (copie) a fost creată` });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
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
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <Button onClick={() => openRecipeEditor()} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Rețetă Nouă
        </Button>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <Card 
            key={recipe.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden"
            onClick={() => openRecipeEditor(recipe)}
          >
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
              <ChefHat className="h-16 w-16 text-primary/40" />
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
                    handleDuplicateRecipe(recipe);
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
                  <Badge variant="secondary" className="text-xs mt-1">{recipe.category}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {recipe.prepTime} min
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recipe.portions} {recipe.portions === 1 ? 'porție' : 'porții'}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex gap-1 flex-wrap">
                  {recipe.allergens.slice(0, 2).map((allergen, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{allergen}</Badge>
                  ))}
                  {recipe.allergens.length > 2 && (
                    <Badge variant="outline" className="text-xs">+{recipe.allergens.length - 2}</Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Cost/porție</p>
                  <p className="font-bold text-primary">{recipe.costPerPortion.toFixed(2)} RON</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Editor Dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedRecipe ? 'Editare Rețetă' : 'Rețetă Nouă'}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Detalii</TabsTrigger>
              <TabsTrigger value="ingredients">Ingrediente</TabsTrigger>
              <TabsTrigger value="calculator">Calculator Porții</TabsTrigger>
              <TabsTrigger value="gallery">Galerie</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <TabsContent value="details" className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nume rețetă</Label>
                    <Input placeholder="Ex: Pizza Margherita" defaultValue={selectedRecipe?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Categorie</Label>
                    <Select defaultValue={selectedRecipe?.category}>
                      <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c !== 'Toate').map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timp preparare (min)</Label>
                    <Input type="number" placeholder="15" defaultValue={selectedRecipe?.prepTime} />
                  </div>
                  <div className="space-y-2">
                    <Label>Porții rezultate</Label>
                    <Input type="number" placeholder="1" defaultValue={selectedRecipe?.portions} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Alergeni</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Gluten', 'Lactoză', 'Ouă', 'Pește', 'Soia', 'Nuci', 'Arahide', 'Muștar'].map(allergen => (
                      <Badge 
                        key={allergen} 
                        variant={selectedRecipe?.allergens.includes(allergen) ? "default" : "outline"}
                        className="cursor-pointer"
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Instrucțiuni preparare</Label>
                  <Textarea 
                    placeholder="Descrie pașii de preparare..." 
                    className="min-h-[150px]"
                    defaultValue={selectedRecipe?.instructions}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ingredients" className="space-y-4 pr-4">
                <div className="space-y-3">
                  {editIngredients.map((ingredient, idx) => (
                    <div 
                      key={ingredient.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <Select 
                          value={ingredient.name}
                          onValueChange={(val) => updateIngredient(ingredient.id, 'name', val)}
                        >
                          <SelectTrigger><SelectValue placeholder="Ingredient" /></SelectTrigger>
                          <SelectContent>
                            {availableIngredients.map(ing => (
                              <SelectItem key={ing.name} value={ing.name}>{ing.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input 
                          type="number" 
                          placeholder="Cantitate"
                          value={ingredient.quantity || ''}
                          onChange={(e) => updateIngredient(ingredient.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />

                        <Select 
                          value={ingredient.unit}
                          onValueChange={(val) => updateIngredient(ingredient.id, 'unit', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Grame (g)</SelectItem>
                            <SelectItem value="kg">Kilograme (kg)</SelectItem>
                            <SelectItem value="ml">Mililitri (ml)</SelectItem>
                            <SelectItem value="L">Litri (L)</SelectItem>
                            <SelectItem value="buc">Bucăți</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            placeholder="Cost"
                            value={ingredient.cost || ''}
                            onChange={(e) => updateIngredient(ingredient.id, 'cost', parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-sm text-muted-foreground">RON</span>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeIngredient(ingredient.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full" onClick={addIngredient}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă ingredient
                  </Button>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calculator className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cost total estimat</p>
                          <p className="text-2xl font-bold text-primary">
                            {calculateTotalCost().toFixed(2)} RON
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost per porție</p>
                        <p className="text-xl font-bold">
                          {(calculateTotalCost() / (selectedRecipe?.portions || 1)).toFixed(2)} RON
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calculator" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Calculator Cantități Automat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label>Număr porții dorite:</Label>
                      <Input 
                        type="number" 
                        className="w-24"
                        value={portionMultiplier}
                        onChange={(e) => setPortionMultiplier(parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </div>

                    <div className="border rounded-lg divide-y">
                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 font-medium text-sm">
                        <span>Ingredient</span>
                        <span>Original</span>
                        <span>Calculat</span>
                        <span>Cost Total</span>
                      </div>
                      {(selectedRecipe?.ingredients || editIngredients).map((ing, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-4 p-3 text-sm">
                          <span className="font-medium">{ing.name}</span>
                          <span className="text-muted-foreground">{ing.quantity} {ing.unit}</span>
                          <span className="font-medium text-primary">
                            {(ing.quantity * portionMultiplier).toFixed(1)} {ing.unit}
                          </span>
                          <span>{(ing.cost * portionMultiplier).toFixed(2)} RON</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost total pentru {portionMultiplier} porții</p>
                        <p className="text-2xl font-bold text-primary">
                          {(calculateTotalCost() * portionMultiplier).toFixed(2)} RON
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gallery" className="space-y-4 pr-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Adaugă imagine</span>
                  </div>
                  {[1, 2, 3, 4, 5].map((_, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-square rounded-xl bg-muted flex items-center justify-center"
                    >
                      <ChefHat className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowRecipeDialog(false)}>Anulează</Button>
            <Button onClick={handleSaveRecipe}>
              <Save className="h-4 w-4 mr-2" />
              Salvează Rețeta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipesManager;
