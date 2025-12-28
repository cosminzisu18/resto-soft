import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  ChefHat, Clock, Play, Pause, Check, Printer, AlertTriangle, 
  Package, Scale, Timer, ArrowLeft, Image, Tag
} from 'lucide-react';
import { menuItems } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  name: string;
  image?: string;
  category: string;
  baseQuantity: string;
  prepTime: number;
  ingredients: { name: string; quantity: string; unit: string; stockLevel: 'high' | 'medium' | 'low' }[];
  steps: { id: number; text: string; duration?: number }[];
  expirationDays: number;
}

// Mock recipes with detailed data
const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    name: 'Ciorbă de burtă',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    category: 'Supe',
    baseQuantity: '25L',
    prepTime: 120,
    expirationDays: 2,
    ingredients: [
      { name: 'Burtă curățată', quantity: '5', unit: 'kg', stockLevel: 'high' },
      { name: 'Smântână', quantity: '2', unit: 'L', stockLevel: 'medium' },
      { name: 'Usturoi', quantity: '200', unit: 'g', stockLevel: 'high' },
      { name: 'Oțet', quantity: '500', unit: 'ml', stockLevel: 'high' },
      { name: 'Gălbenuș de ou', quantity: '10', unit: 'buc', stockLevel: 'low' },
      { name: 'Sare', quantity: '100', unit: 'g', stockLevel: 'high' },
      { name: 'Piper', quantity: '20', unit: 'g', stockLevel: 'high' },
    ],
    steps: [
      { id: 1, text: 'Spală și curăță burta', duration: 15 },
      { id: 2, text: 'Fierbe burta 2-3 ore până se înmoaie', duration: 180 },
      { id: 3, text: 'Taie burta în fâșii subțiri', duration: 20 },
      { id: 4, text: 'Pregătește dressingul din smântână și gălbenușuri', duration: 10 },
      { id: 5, text: 'Adaugă usturoiul pisat și oțetul', duration: 5 },
      { id: 6, text: 'Amestecă și potrivește de sare și piper', duration: 5 },
    ]
  },
  {
    id: 'r2',
    name: 'Sos Carbonara',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    category: 'Sosuri',
    baseQuantity: '10L',
    prepTime: 45,
    expirationDays: 3,
    ingredients: [
      { name: 'Smântână lichidă', quantity: '5', unit: 'L', stockLevel: 'medium' },
      { name: 'Parmezan', quantity: '500', unit: 'g', stockLevel: 'high' },
      { name: 'Bacon', quantity: '1', unit: 'kg', stockLevel: 'low' },
      { name: 'Gălbenușuri', quantity: '20', unit: 'buc', stockLevel: 'medium' },
      { name: 'Piper negru', quantity: '50', unit: 'g', stockLevel: 'high' },
      { name: 'Sare', quantity: '30', unit: 'g', stockLevel: 'high' },
    ],
    steps: [
      { id: 1, text: 'Prăjește baconul până devine crocant', duration: 10 },
      { id: 2, text: 'Bate gălbenușurile cu parmezanul', duration: 5 },
      { id: 3, text: 'Încălzește smântâna (nu fierbe!)', duration: 10 },
      { id: 4, text: 'Combină toate ingredientele', duration: 5 },
      { id: 5, text: 'Condimentează cu piper și sare', duration: 5 },
    ]
  },
  {
    id: 'r3',
    name: 'Pizza Dough',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    category: 'Aluaturi',
    baseQuantity: '50 porții',
    prepTime: 90,
    expirationDays: 1,
    ingredients: [
      { name: 'Făină 00', quantity: '10', unit: 'kg', stockLevel: 'high' },
      { name: 'Apă', quantity: '6', unit: 'L', stockLevel: 'high' },
      { name: 'Drojdie', quantity: '100', unit: 'g', stockLevel: 'medium' },
      { name: 'Sare', quantity: '200', unit: 'g', stockLevel: 'high' },
      { name: 'Ulei de măsline', quantity: '300', unit: 'ml', stockLevel: 'medium' },
      { name: 'Zahăr', quantity: '50', unit: 'g', stockLevel: 'high' },
    ],
    steps: [
      { id: 1, text: 'Dizolvă drojdia în apă caldă cu zahăr', duration: 10 },
      { id: 2, text: 'Amestecă făina cu sarea', duration: 5 },
      { id: 3, text: 'Adaugă lichidul și frământă 15 min', duration: 15 },
      { id: 4, text: 'Adaugă uleiul și continuă să frămânți', duration: 10 },
      { id: 5, text: 'Lasă aluatul la dospit 1 oră', duration: 60 },
      { id: 6, text: 'Porționează în bucăți de 250g', duration: 15 },
    ]
  },
  {
    id: 'r4',
    name: 'Sos de roșii',
    image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400',
    category: 'Sosuri',
    baseQuantity: '25L',
    prepTime: 60,
    expirationDays: 5,
    ingredients: [
      { name: 'Roșii pasate', quantity: '20', unit: 'kg', stockLevel: 'high' },
      { name: 'Ceapă', quantity: '2', unit: 'kg', stockLevel: 'high' },
      { name: 'Usturoi', quantity: '300', unit: 'g', stockLevel: 'high' },
      { name: 'Ulei de măsline', quantity: '500', unit: 'ml', stockLevel: 'medium' },
      { name: 'Busuioc', quantity: '100', unit: 'g', stockLevel: 'low' },
      { name: 'Zahăr', quantity: '200', unit: 'g', stockLevel: 'high' },
      { name: 'Sare', quantity: '100', unit: 'g', stockLevel: 'high' },
    ],
    steps: [
      { id: 1, text: 'Călește ceapa și usturoiul în ulei', duration: 10 },
      { id: 2, text: 'Adaugă roșiile pasate', duration: 5 },
      { id: 3, text: 'Fierbe la foc mic 40 minute', duration: 40 },
      { id: 4, text: 'Adaugă busuiocul și condimentele', duration: 5 },
      { id: 5, text: 'Mixează pentru consistență uniformă', duration: 5 },
    ]
  },
];

const quantityMultipliers: Record<string, number> = {
  '25L': 1,
  '50L': 2,
  '75L': 3,
  '25 porții': 0.5,
  '50 porții': 1,
  '100 porții': 2,
};

const KDSProductionModule: React.FC = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProducing, setIsProducing] = useState(false);
  const [productionTime, setProductionTime] = useState(0);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProducing) {
      interval = setInterval(() => {
        setProductionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProducing]);

  const getStockColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
    }
  };

  const getStockText = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'În stoc';
      case 'medium': return 'Stoc mediu';
      case 'low': return 'Stoc scăzut';
    }
  };

  const calculateQuantity = (baseQty: string, multiplier: number) => {
    const num = parseFloat(baseQty);
    if (isNaN(num)) return baseQty;
    return `${(num * multiplier).toFixed(1)}`;
  };

  const getMultiplier = () => {
    if (!selectedRecipe || !selectedQuantity) return 1;
    const baseKey = selectedRecipe.baseQuantity;
    const selectedKey = selectedQuantity;
    
    // Simple multiplier logic
    if (selectedKey.includes('50')) return 2;
    if (selectedKey.includes('75') || selectedKey.includes('100')) return 3;
    return 1;
  };

  const handleStartProduction = () => {
    setIsProducing(true);
    setProductionTime(0);
    setCompletedSteps([]);
    toast({
      title: "Producție începută",
      description: `${selectedRecipe?.name} - ${selectedQuantity}`,
    });
  };

  const handleToggleStep = (stepId: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const handleFinishProduction = () => {
    setIsProducing(false);
    setShowLabelPreview(true);
    toast({
      title: "Producție finalizată!",
      description: "Previzualizează și printează eticheta",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = selectedRecipe 
    ? Math.round((completedSteps.length / selectedRecipe.steps.length) * 100) 
    : 0;

  // Recipe List View
  if (!selectedRecipe) {
    return (
      <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        <div className="p-3 sm:p-6 flex-shrink-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">KDS Producție & Rețetar</h1>
          <p className="text-sm text-slate-500">Selectează o rețetă pentru a începe producția</p>
        </div>

        <ScrollArea className="flex-1 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {mockRecipes.map(recipe => (
              <Card 
                key={recipe.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden"
                onClick={() => {
                  setSelectedRecipe(recipe);
                  setSelectedQuantity(recipe.baseQuantity);
                }}
              >
                {/* Recipe Image */}
                <div className="h-32 sm:h-40 bg-slate-200 relative overflow-hidden">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-primary text-xs">{recipe.category}</Badge>
                </div>
                
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-lg mb-2">{recipe.name}</h3>
                  
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{recipe.baseQuantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{recipe.prepTime} min</span>
                    </div>
                  </div>

                  {/* Stock indicator */}
                  <div className="mt-2 sm:mt-3 flex items-center gap-2">
                    {recipe.ingredients.some(i => i.stockLevel === 'low') ? (
                      <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Stoc scăzut
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Stoc OK
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Recipe Detail & Production View
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
            setSelectedRecipe(null);
            setIsProducing(false);
            setCompletedSteps([]);
          }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{selectedRecipe.name}</h1>
            <p className="text-sm text-slate-500">{selectedRecipe.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quantity Selector */}
          <Select value={selectedQuantity} onValueChange={setSelectedQuantity} disabled={isProducing}>
            <SelectTrigger className="w-40">
              <Scale className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectedRecipe.baseQuantity}>{selectedRecipe.baseQuantity}</SelectItem>
              <SelectItem value={selectedRecipe.baseQuantity.replace('25', '50').replace('porții', 'porții')}>
                {selectedRecipe.baseQuantity.replace('25', '50')}
              </SelectItem>
              <SelectItem value={selectedRecipe.baseQuantity.replace('25', '75').replace('50', '100')}>
                {selectedRecipe.baseQuantity.replace('25', '75').replace('50', '100')}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Production Timer */}
          {isProducing && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <Timer className="w-5 h-5 animate-pulse" />
              <span className="font-mono font-bold text-lg">{formatTime(productionTime)}</span>
            </div>
          )}

          {/* Progress */}
          <div className="w-32">
            <div className="text-xs text-slate-500 mb-1">Progres</div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Ingredients */}
        <div className="w-1/3 border-r bg-white p-4 overflow-auto">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Ingrediente
          </h2>
          
          <div className="space-y-3">
            {selectedRecipe.ingredients.map((ing, idx) => {
              const multiplier = getMultiplier();
              const calculatedQty = calculateQuantity(ing.quantity, multiplier);
              
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", getStockColor(ing.stockLevel))} />
                    <div>
                      <p className="font-medium">{ing.name}</p>
                      <p className="text-xs text-slate-500">{getStockText(ing.stockLevel)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{calculatedQty} {ing.unit}</p>
                    {multiplier !== 1 && (
                      <p className="text-xs text-slate-400 line-through">{ing.quantity} {ing.unit}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Steps */}
        <div className="flex-1 p-4 overflow-auto">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Pași Preparare
          </h2>

          <div className="space-y-3">
            {selectedRecipe.steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    isCompleted 
                      ? "bg-green-50 border-green-500" 
                      : "bg-white border-slate-200 hover:border-primary"
                  )}
                  onClick={() => isProducing && handleToggleStep(step.id)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
                    isCompleted ? "bg-green-500" : "bg-primary"
                  )}>
                    {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  
                  <div className="flex-1">
                    <p className={cn("font-medium", isCompleted && "line-through text-slate-500")}>
                      {step.text}
                    </p>
                    {step.duration && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.duration} minute
                      </p>
                    )}
                  </div>

                  {isProducing && (
                    <Checkbox 
                      checked={isCompleted}
                      className="w-6 h-6"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t p-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Timp estimat: <span className="font-bold text-slate-900">{selectedRecipe.prepTime} minute</span>
        </div>

        {!isProducing ? (
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8"
            onClick={handleStartProduction}
          >
            <Play className="w-6 h-6 mr-2" />
            START PRODUCȚIE
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setIsProducing(false)}
            >
              <Pause className="w-5 h-5 mr-2" />
              Pauză
            </Button>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFinishProduction}
              disabled={progress < 100}
            >
              <Check className="w-5 h-5 mr-2" />
              Finalizează
            </Button>
          </div>
        )}
      </div>

      {/* Label Preview Dialog */}
      <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Previzualizare Etichetă
            </DialogTitle>
          </DialogHeader>
          
          <div className="border-2 border-dashed border-slate-300 p-4 rounded-lg bg-white font-mono text-sm">
            <div className="text-center border-b-2 border-dashed pb-2 mb-2">
              <p className="font-bold text-lg">{selectedRecipe.name}</p>
              <p className="text-slate-500">{selectedQuantity}</p>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Data producție:</span>
                <span className="font-bold">{new Date().toLocaleDateString('ro-RO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ora:</span>
                <span className="font-bold">{new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>Data expirare:</span>
                <span>
                  {new Date(Date.now() + selectedRecipe.expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString('ro-RO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Timp producție:</span>
                <span className="font-bold">{formatTime(productionTime)}</span>
              </div>
            </div>
            
            <div className="text-center border-t-2 border-dashed pt-2 mt-2 text-xs text-slate-500">
              A se păstra la frigider
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowLabelPreview(false)}>
              Închide
            </Button>
            <Button className="flex-1" onClick={() => {
              toast({ title: "Etichetă trimisă la imprimantă" });
              setShowLabelPreview(false);
              setSelectedRecipe(null);
              setCompletedSteps([]);
            }}>
              <Printer className="w-4 h-4 mr-2" />
              Printează
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KDSProductionModule;
