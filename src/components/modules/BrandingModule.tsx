import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Palette,
  Upload,
  Image,
  Type,
  Layout,
  Eye,
  Save,
  RefreshCw,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Paintbrush,
  PenLine,
  RotateCcw,
  ShoppingCart,
  Plus,
  Minus,
  QrCode,
  Truck,
  ChevronRight,
  UtensilsCrossed,
  CreditCard,
  Volume2
} from 'lucide-react';

// Color presets
const colorPresets = [
  { id: 'blue', name: 'Albastru Profesional', primary: '#3B82F6', accent: '#1D4ED8', bg: '#F8FAFC' },
  { id: 'green', name: 'Verde Natural', primary: '#22C55E', accent: '#15803D', bg: '#F0FDF4' },
  { id: 'purple', name: 'Violet Elegant', primary: '#A855F7', accent: '#7C3AED', bg: '#FAF5FF' },
  { id: 'orange', name: 'Portocaliu Cald', primary: '#F97316', accent: '#EA580C', bg: '#FFF7ED' },
  { id: 'red', name: 'Roșu Modern', primary: '#EF4444', accent: '#DC2626', bg: '#FEF2F2' },
  { id: 'teal', name: 'Turcoaz Fresh', primary: '#14B8A6', accent: '#0D9488', bg: '#F0FDFA' },
];

// Template options
const templates = [
  { id: 'modern', name: 'Modern', description: 'Design curat cu accente subtile', preview: '🎨' },
  { id: 'classic', name: 'Clasic', description: 'Aspect tradițional și elegant', preview: '🏛️' },
  { id: 'minimal', name: 'Minimal', description: 'Ultra-simplu, focusat pe conținut', preview: '⬜' },
  { id: 'bold', name: 'Bold', description: 'Culori vibrante, design îndrăzneț', preview: '🔥' },
];

// Editable labels
const defaultLabels = {
  orderButton: 'Comandă',
  addToCart: 'Adaugă în Coș',
  checkout: 'Finalizează Comanda',
  tableLabel: 'Masă',
  waiterCall: 'Cheamă Ospătar',
  payButton: 'Plătește',
  menuTitle: 'Meniu',
  categoriesTitle: 'Categorii',
  searchPlaceholder: 'Caută produse...',
  emptyCart: 'Coșul este gol',
};

export const BrandingModule: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState('blue');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [labels, setLabels] = useState(defaultLabels);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState({
    primary: '#3B82F6',
    accent: '#1D4ED8',
    background: '#F8FAFC',
    text: '#1E293B',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      toast({ title: "Logo încărcat", description: "Logo-ul a fost actualizat cu succes." });
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = colorPresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setCustomColors({
        ...customColors,
        primary: preset.primary,
        accent: preset.accent,
        background: preset.bg,
      });
    }
  };

  const handleSave = () => {
    toast({ title: "Branding salvat", description: "Toate modificările au fost aplicate." });
  };

  const handleReset = () => {
    setLabels(defaultLabels);
    setSelectedPreset('blue');
    setSelectedTemplate('modern');
    setCustomColors({
      primary: '#3B82F6',
      accent: '#1D4ED8',
      background: '#F8FAFC',
      text: '#1E293B',
    });
    toast({ title: "Resetat la implicit", description: "Setările de branding au fost resetate." });
  };

  const currentPreset = colorPresets.find(p => p.id === selectedPreset);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Branding & Customizare</h1>
              <p className="text-muted-foreground">Personalizați aspectul aplicației</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetează
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Settings Panel */}
        <div className="w-1/2 border-r border-border">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <Tabs defaultValue="logo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="logo" className="gap-1 text-xs">
                    <Image className="h-4 w-4" />
                    Logo
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="gap-1 text-xs">
                    <Paintbrush className="h-4 w-4" />
                    Culori
                  </TabsTrigger>
                  <TabsTrigger value="template" className="gap-1 text-xs">
                    <Layout className="h-4 w-4" />
                    Template
                  </TabsTrigger>
                  <TabsTrigger value="labels" className="gap-1 text-xs">
                    <PenLine className="h-4 w-4" />
                    Labels
                  </TabsTrigger>
                </TabsList>

                {/* Logo Upload */}
                <TabsContent value="logo" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Logo Principal
                      </CardTitle>
                      <CardDescription>Încărcați logo-ul restaurantului (PNG, SVG recomandat)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        {logoUrl ? (
                          <div className="space-y-4">
                            <img src={logoUrl} alt="Logo" className="max-h-32 mx-auto" />
                            <Button variant="outline" size="sm" onClick={() => setLogoUrl(null)}>
                              Elimină Logo
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleLogoUpload}
                            />
                            <div className="space-y-2">
                              <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground">Click pentru a încărca</p>
                              <p className="text-xs text-muted-foreground">sau drag & drop</p>
                            </div>
                          </label>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Favicon</Label>
                          <Button variant="outline" className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Încarcă Favicon
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Logo Secundar (Alb)</Label>
                          <Button variant="outline" className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Încarcă Logo Alb
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Color Picker */}
                <TabsContent value="colors" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Paletă de Culori
                      </CardTitle>
                      <CardDescription>Alegeți un preset sau personalizați culorile</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Presets */}
                      <div className="grid grid-cols-3 gap-3">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset.id)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              selectedPreset === preset.id 
                                ? 'border-primary shadow-md' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            <p className="text-xs font-medium text-foreground">{preset.name}</p>
                            {selectedPreset === preset.id && (
                              <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Custom Colors */}
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium text-foreground mb-4">Culori Personalizate</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Culoare Primară</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={customColors.primary}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <Input 
                                value={customColors.primary}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Culoare Accent</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={customColors.accent}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, accent: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <Input 
                                value={customColors.accent}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, accent: e.target.value }))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Fundal</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={customColors.background}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <Input 
                                value={customColors.background}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Text</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={customColors.text}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, text: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <Input 
                                value={customColors.text}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, text: e.target.value }))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                          <div>
                            <p className="font-medium text-foreground">Mod {isDarkMode ? 'Întunecat' : 'Luminos'}</p>
                            <p className="text-xs text-muted-foreground">Toggle pentru previzualizare</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsDarkMode(!isDarkMode)}
                        >
                          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Template Selector */}
                <TabsContent value="template" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-primary" />
                        Șablon Interfață
                      </CardTitle>
                      <CardDescription>Alegeți un stil de design pentru aplicație</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <div className="grid grid-cols-2 gap-4">
                          {templates.map((template) => (
                            <label
                              key={template.id}
                              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedTemplate === template.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <RadioGroupItem 
                                value={template.id} 
                                className="absolute top-3 right-3"
                              />
                              <div className="text-4xl mb-3">{template.preview}</div>
                              <h4 className="font-semibold text-foreground">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </label>
                          ))}
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Custom Labels */}
                <TabsContent value="labels" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-primary" />
                        Denumiri Custom
                      </CardTitle>
                      <CardDescription>Personalizați textele din aplicație</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(labels).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-4 items-center">
                          <Label className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <Input
                            value={value}
                            onChange={(e) => setLabels(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 bg-muted/30 flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Preview Branding</span>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button 
                variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button 
                variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setPreviewDevice('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button 
                variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
            <div 
              className={`rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
                previewDevice === 'desktop' ? 'w-full max-w-3xl h-[550px]' :
                previewDevice === 'tablet' ? 'w-96 h-[600px]' : 'w-72 h-[580px]'
              }`}
              style={{ 
                backgroundColor: isDarkMode ? '#0f172a' : customColors.background,
                color: isDarkMode ? '#ffffff' : customColors.text
              }}
            >
              {/* Real Self-Order Preview */}
              <div className="h-full flex flex-col relative overflow-hidden">
                {/* Background Image Overlay - Idle Screen Style */}
                <div className="absolute inset-0">
                  <img 
                    src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(to top, ${isDarkMode ? 'rgba(15,23,42,0.95)' : 'rgba(0,0,0,0.7)'} 0%, transparent 50%, ${isDarkMode ? 'rgba(15,23,42,0.5)' : 'rgba(0,0,0,0.3)'} 100%)` 
                    }}
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(to top, ${customColors.primary}60 0%, transparent 60%)` 
                    }}
                  />
                </div>

                {/* Language & Sound Buttons */}
                <div className="relative z-10 flex justify-between items-center p-3">
                  <button className="p-2 rounded-full bg-black/30 text-white">
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1.5">
                    {['🇷🇴', '🇬🇧', '🇩🇪'].map((flag, idx) => (
                      <button
                        key={flag}
                        className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all ${
                          idx === 0 ? 'bg-white shadow-lg scale-105' : 'bg-white/30 hover:bg-white/50'
                        }`}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-white px-4">
                  {/* Logo */}
                  <div className="mb-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: customColors.primary }}
                      >
                        <UtensilsCrossed className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h1 className={`font-bold mb-2 text-center ${previewDevice === 'mobile' ? 'text-xl' : 'text-2xl'}`}>
                    Bine ai venit!
                  </h1>
                  <p className="text-white/80 mb-6 text-center text-sm">
                    Apasă pentru a comanda
                  </p>

                  {/* Order Options */}
                  <div className={`flex flex-col gap-3 w-full ${previewDevice === 'mobile' ? 'max-w-[200px]' : 'max-w-xs'}`}>
                    <button
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                    >
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-white"
                      >
                        <QrCode className="w-5 h-5" style={{ color: customColors.primary }} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-sm font-bold block">{labels.tableLabel || 'Scanează masa'}</span>
                        <span className="text-xs text-white/70">Comandă direct la masa ta</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/50" />
                    </button>

                    <button
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                    >
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <Truck className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-sm font-bold block">Livrare la domiciliu</span>
                        <span className="text-xs text-white/70">Comandă acasă sau la birou</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/50" />
                    </button>
                  </div>
                </div>

                {/* Promo Indicators */}
                <div className="relative z-10 pb-4 flex justify-center gap-2">
                  {[0, 1, 2].map((idx) => (
                    <div 
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === 0 ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Menu Preview Overlay (when in menu mode) */}
                {previewDevice === 'desktop' && (
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-card/95 backdrop-blur-sm border-l border-border flex flex-col">
                    {/* Menu Header */}
                    <div 
                      className="p-3 flex items-center justify-between"
                      style={{ backgroundColor: customColors.primary }}
                    >
                      <div className="flex items-center gap-2">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-6" />
                        ) : (
                          <div className="w-6 h-6 bg-white/20 rounded-lg" />
                        )}
                        <span className="font-bold text-white text-sm">Restaurant Demo</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-0 text-xs">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        3
                      </Badge>
                    </div>

                    {/* Categories */}
                    <div className="p-3 border-b border-border">
                      <ScrollArea className="w-full">
                        <div className="flex gap-2">
                          {[
                            { icon: '🍕', name: 'Pizza', active: true },
                            { icon: '🍝', name: 'Paste', active: false },
                            { icon: '🥗', name: 'Salate', active: false },
                            { icon: '🥤', name: 'Băuturi', active: false },
                          ].map((cat) => (
                            <button
                              key={cat.name}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                cat.active 
                                  ? 'text-white shadow-lg' 
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                              style={cat.active ? { backgroundColor: customColors.primary } : {}}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Menu Items */}
                    <ScrollArea className="flex-1">
                      <div className="p-3 space-y-2">
                        {[
                          { name: 'Pizza Margherita', price: 32, img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200' },
                          { name: 'Pizza Quattro Formaggi', price: 38, img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200' },
                          { name: 'Pizza Diavola', price: 35, img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200' },
                        ].map((item) => (
                          <div 
                            key={item.name} 
                            className="p-2 rounded-xl flex items-center gap-3"
                            style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                          >
                            <img 
                              src={item.img} 
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate" style={{ color: isDarkMode ? '#fff' : customColors.text }}>
                                {item.name}
                              </p>
                              <p className="text-xs" style={{ color: customColors.primary }}>
                                {item.price} RON
                              </p>
                            </div>
                            <button 
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: customColors.primary }}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Cart Footer */}
                    <div className="p-3 border-t border-border">
                      <button 
                        className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                        style={{ backgroundColor: customColors.accent }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {labels.checkout} - 105 RON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingModule;
