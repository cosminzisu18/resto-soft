import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { 
  LogOut, Settings, UtensilsCrossed, LayoutGrid, 
  Monitor, Plus, Trash2, Edit2, Save, X 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, MenuItem, menuCategories } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminView = 'tables' | 'menu' | 'kds';

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const { 
    tables, addTable, updateTable, deleteTable,
    menu, addMenuItem, updateMenuItem, deleteMenuItem,
    kdsStations 
  } = useRestaurant();
  const { toast } = useToast();
  
  const [activeView, setActiveView] = useState<AdminView>('tables');
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Table form
  const [tableForm, setTableForm] = useState({
    number: '',
    seats: '4',
    shape: 'square' as Table['shape'],
    x: '50',
    y: '50'
  });

  // Menu form
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: menuCategories[0],
    kdsStation: 'grill',
    prepTime: '10',
    ingredients: ''
  });

  const handleAddTable = () => {
    addTable({
      number: parseInt(tableForm.number),
      seats: parseInt(tableForm.seats),
      shape: tableForm.shape,
      position: { x: parseInt(tableForm.x), y: parseInt(tableForm.y) },
      status: 'free'
    });
    toast({ title: 'Masă adăugată cu succes' });
    setShowAddTable(false);
    setTableForm({ number: '', seats: '4', shape: 'square', x: '50', y: '50' });
  };

  const handleAddMenuItem = () => {
    addMenuItem({
      name: menuForm.name,
      description: menuForm.description,
      price: parseFloat(menuForm.price),
      category: menuForm.category,
      kdsStation: menuForm.kdsStation,
      prepTime: parseInt(menuForm.prepTime),
      ingredients: menuForm.ingredients.split(',').map(i => i.trim()).filter(Boolean)
    });
    toast({ title: 'Produs adăugat cu succes' });
    setShowAddMenu(false);
    setMenuForm({ name: '', description: '', price: '', category: menuCategories[0], kdsStation: 'grill', prepTime: '10', ingredients: '' });
  };

  const handleUpdateMenuItem = () => {
    if (!editingItem) return;
    updateMenuItem({
      ...editingItem,
      name: menuForm.name,
      description: menuForm.description,
      price: parseFloat(menuForm.price),
      category: menuForm.category,
      kdsStation: menuForm.kdsStation,
      prepTime: parseInt(menuForm.prepTime),
      ingredients: menuForm.ingredients.split(',').map(i => i.trim()).filter(Boolean)
    });
    toast({ title: 'Produs actualizat' });
    setEditingItem(null);
  };

  const startEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      kdsStation: item.kdsStation,
      prepTime: item.prepTime.toString(),
      ingredients: item.ingredients.join(', ')
    });
  };

  const navItems = [
    { id: 'tables' as AdminView, label: 'Mese', icon: LayoutGrid },
    { id: 'menu' as AdminView, label: 'Meniu', icon: UtensilsCrossed },
    { id: 'kds' as AdminView, label: 'KDS', icon: Monitor },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                activeView === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Deconectare
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Tables Management */}
        {activeView === 'tables' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gestionare Mese</h2>
              <Button onClick={() => setShowAddTable(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă masă
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(table => (
                <div key={table.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">Masa {table.number}</span>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        deleteTable(table.id);
                        toast({ title: 'Masă ștearsă' });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Locuri: {table.seats}</p>
                    <p>Formă: {table.shape}</p>
                    <p>Poziție: X:{table.position.x}% Y:{table.position.y}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Management */}
        {activeView === 'menu' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gestionare Meniu</h2>
              <Button onClick={() => setShowAddMenu(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă produs
              </Button>
            </div>

            {menuCategories.map(category => {
              const categoryItems = menu.filter(m => m.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-primary">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map(item => (
                      <div key={item.id} className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <span className="font-bold text-primary">{item.price} RON</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                          <span>KDS: {kdsStations.find(k => k.id === item.kdsStation)?.name}</span>
                          <span>{item.prepTime} min</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => startEditMenuItem(item)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editează
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              deleteMenuItem(item.id);
                              toast({ title: 'Produs șters' });
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* KDS Configuration */}
        {activeView === 'kds' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Configurare KDS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kdsStations.map(station => {
                const stationItems = menu.filter(m => m.kdsStation === station.id);
                
                return (
                  <div key={station.id} className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className={cn("px-4 py-3 text-white", station.color)}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{station.icon}</span>
                        <div>
                          <h3 className="font-bold">{station.name}</h3>
                          <p className="text-sm opacity-80">{stationItems.length} produse</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 max-h-64 overflow-auto">
                      {stationItems.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nu sunt produse asignate</p>
                      ) : (
                        <ul className="space-y-2">
                          {stationItems.map(item => (
                            <li key={item.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">{item.prepTime} min</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Table Dialog */}
      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă masă nouă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Număr masă</label>
                <Input
                  type="number"
                  value={tableForm.number}
                  onChange={e => setTableForm({...tableForm, number: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Locuri</label>
                <Input
                  type="number"
                  value={tableForm.seats}
                  onChange={e => setTableForm({...tableForm, seats: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Formă</label>
              <Select value={tableForm.shape} onValueChange={(v: Table['shape']) => setTableForm({...tableForm, shape: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Rotundă</SelectItem>
                  <SelectItem value="square">Pătrată</SelectItem>
                  <SelectItem value="rectangle">Dreptunghiulară</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Poziție X (%)</label>
                <Input
                  type="number"
                  value={tableForm.x}
                  onChange={e => setTableForm({...tableForm, x: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Poziție Y (%)</label>
                <Input
                  type="number"
                  value={tableForm.y}
                  onChange={e => setTableForm({...tableForm, y: e.target.value})}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleAddTable}>
              Adaugă masă
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Menu Item Dialog */}
      <Dialog open={showAddMenu || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowAddMenu(false);
          setEditingItem(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editează produs' : 'Adaugă produs nou'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-auto">
            <div>
              <label className="text-sm font-medium">Nume</label>
              <Input
                value={menuForm.name}
                onChange={e => setMenuForm({...menuForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descriere</label>
              <Input
                value={menuForm.description}
                onChange={e => setMenuForm({...menuForm, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Preț (RON)</label>
                <Input
                  type="number"
                  value={menuForm.price}
                  onChange={e => setMenuForm({...menuForm, price: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Timp preparare (min)</label>
                <Input
                  type="number"
                  value={menuForm.prepTime}
                  onChange={e => setMenuForm({...menuForm, prepTime: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categorie</label>
              <Select value={menuForm.category} onValueChange={v => setMenuForm({...menuForm, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Stație KDS</label>
              <Select value={menuForm.kdsStation} onValueChange={v => setMenuForm({...menuForm, kdsStation: v})}>
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
            <div>
              <label className="text-sm font-medium">Ingrediente (separate prin virgulă)</label>
              <Input
                value={menuForm.ingredients}
                onChange={e => setMenuForm({...menuForm, ingredients: e.target.value})}
                placeholder="Ingredient 1, Ingredient 2, ..."
              />
            </div>
            <Button className="w-full" onClick={editingItem ? handleUpdateMenuItem : handleAddMenuItem}>
              <Save className="w-4 h-4 mr-2" />
              {editingItem ? 'Salvează modificările' : 'Adaugă produs'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
