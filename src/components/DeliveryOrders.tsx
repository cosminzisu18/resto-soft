import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Order, OrderItem, MenuItem, menuCategories, deliveryPlatforms, OrderSource,
  Customer, mockCustomers, orderHistoryItems, menuItems, PaymentMethod, CustomerAddress, extraIngredients
} from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Phone, Truck, Plus, ChefHat, Clock, Check, 
  MapPin, User, Send, X, Package, Search, History,
  CreditCard, Banknote, Barcode, PlusCircle, Trash2, Edit2, UtensilsCrossed, Minus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DeliveryOrdersProps {
  onClose?: () => void;
}

interface OrderItemWithMods {
  menuItem: MenuItem;
  quantity: number;
  modifications: {
    added: string[];
    removed: string[];
    extraIngredients: { id: string; name: string; price: number }[];
  };
}

const DeliveryOrders: React.FC<DeliveryOrdersProps> = ({ onClose }) => {
  const { 
    orders, menu, createDeliveryOrder, addItemToOrder, 
    updateOrderItemStatus, getDeliveryOrders, getPhoneOrders
  } = useRestaurant();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'delivery' | 'phone'>('delivery');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<OrderSource>('phone');
  
  // Customer search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  
  // New customer form
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: 'București',
  });
  
  // Selected address
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', street: '', city: 'București', notes: '' });
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedUsageCardId, setSelectedUsageCardId] = useState<string | null>(null);
  
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [orderStep, setOrderStep] = useState<'customer' | 'products' | 'payment'>('customer');

  // Order items with modifications (local state for new order)
  const [orderItems, setOrderItems] = useState<OrderItemWithMods[]>([]);

  // Customization state
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempRemovals, setTempRemovals] = useState<string[]>([]);
  const [tempAdditions, setTempAdditions] = useState<string[]>([]);
  const [tempExtraIngredients, setTempExtraIngredients] = useState<{ id: string; name: string; price: number }[]>([]);
  const [editingOrderItemIdx, setEditingOrderItemIdx] = useState<number | null>(null);

  const deliveryOrders = getDeliveryOrders();
  const phoneOrders = getPhoneOrders();
  const displayOrders = activeTab === 'delivery' ? deliveryOrders : phoneOrders;

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mockCustomers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query)
    );
  }, [searchQuery]);

  // Get customer order history with item details
  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return orderHistoryItems
      .filter(oh => oh.customerId === selectedCustomer.id)
      .map(oh => ({
        ...oh,
        items: oh.items.map(item => ({
          ...item,
          menuItem: menuItems.find(m => m.id === item.menuItemId),
        }))
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCustomer]);

  // Calculate total for local order items
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const basePrice = item.menuItem.price * item.quantity;
      const extraPrice = item.modifications.extraIngredients.reduce((s, e) => s + e.price, 0) * item.quantity;
      return sum + basePrice + extraPrice;
    }, 0);
  }, [orderItems]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    if (customer.addresses.length > 0) {
      const defaultAddr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  };

  const handleCreateNewCustomer = () => {
    const newCustomer: Customer = {
      id: `c${Date.now()}`,
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email || undefined,
      addresses: newCustomerForm.street ? [{
        id: `a${Date.now()}`,
        label: 'Acasă',
        street: newCustomerForm.street,
        city: newCustomerForm.city,
        isDefault: true,
      }] : [],
      usageCards: [],
      orderHistory: [],
      createdAt: new Date(),
    };
    setSelectedCustomer(newCustomer);
    if (newCustomer.addresses.length > 0) {
      setSelectedAddressId(newCustomer.addresses[0].id);
    }
    setShowNewCustomer(false);
    toast({ title: 'Client creat' });
  };

  const handleCreateOrder = () => {
    if (!selectedCustomer) {
      toast({ title: 'Selectează un client', variant: 'destructive' });
      return;
    }

    const selectedAddress = selectedCustomer.addresses.find(a => a.id === selectedAddressId);

    const order = createDeliveryOrder(activeTab === 'phone' ? 'phone' : selectedPlatform, {
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      address: selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : undefined,
    });

    setNewOrderId(order.id);
    setOrderStep('products');
    toast({ title: 'Comandă creată' });
  };

  const openCustomization = (item: MenuItem, existingIdx?: number) => {
    setCustomizingItem(item);
    if (existingIdx !== undefined) {
      const existing = orderItems[existingIdx];
      setTempRemovals(existing.modifications.removed);
      setTempAdditions(existing.modifications.added);
      setTempExtraIngredients(existing.modifications.extraIngredients);
      setEditingOrderItemIdx(existingIdx);
    } else {
      setTempRemovals([]);
      setTempAdditions([]);
      setTempExtraIngredients([]);
      setEditingOrderItemIdx(null);
    }
    setShowCustomization(true);
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;

    if (editingOrderItemIdx !== null) {
      setOrderItems(prev => prev.map((item, idx) => 
        idx === editingOrderItemIdx 
          ? { ...item, modifications: { added: tempAdditions, removed: tempRemovals, extraIngredients: tempExtraIngredients } }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        menuItem: customizingItem,
        quantity: 1,
        modifications: { added: tempAdditions, removed: tempRemovals, extraIngredients: tempExtraIngredients }
      }]);
    }

    setShowCustomization(false);
    setCustomizingItem(null);
    toast({ title: editingOrderItemIdx !== null ? 'Produs modificat' : `${customizingItem.name} adăugat` });
  };

  const handleAddToOrderQuick = (menuItem: MenuItem) => {
    if (menuItem.ingredients && menuItem.ingredients.length > 0) {
      openCustomization(menuItem);
    } else {
      // No ingredients, add directly
      setOrderItems(prev => {
        const existing = prev.findIndex(i => 
          i.menuItem.id === menuItem.id && 
          i.modifications.added.length === 0 && 
          i.modifications.removed.length === 0 &&
          i.modifications.extraIngredients.length === 0
        );
        if (existing >= 0) {
          return prev.map((item, idx) => 
            idx === existing ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { menuItem, quantity: 1, modifications: { added: [], removed: [], extraIngredients: [] } }];
      });
      toast({ title: `${menuItem.name} adăugat` });
    }
  };

  const handleAddFromHistory = (historyOrder: typeof customerHistory[0]) => {
    historyOrder.items.forEach(item => {
      if (item.menuItem) {
        setOrderItems(prev => [...prev, {
          menuItem: item.menuItem!,
          quantity: item.quantity,
          modifications: { added: [], removed: [], extraIngredients: [] }
        }]);
      }
    });
    toast({ title: 'Produse din istoric adăugate' });
  };

  const updateOrderItemQuantity = (idx: number, delta: number) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === idx) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeOrderItem = (idx: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSendToKitchen = () => {
    if (!newOrderId) return;

    // Add all items to the actual order
    orderItems.forEach(item => {
      addItemToOrder(newOrderId, item.menuItem, item.quantity);
    });

    const order = orders.find(o => o.id === newOrderId);
    if (order) {
      order.items.filter(i => i.status === 'pending').forEach(item => {
        updateOrderItemStatus(newOrderId, item.id, 'cooking');
      });
    }

    toast({ title: 'Comandă trimisă la bucătărie' });
    resetOrder();
  };

  const resetOrder = () => {
    setShowNewOrder(false);
    setNewOrderId(null);
    setSelectedCustomer(null);
    setSearchQuery('');
    setOrderStep('customer');
    setPaymentMethod('cash');
    setSelectedUsageCardId(null);
    setSelectedAddressId(null);
    setOrderItems([]);
  };

  const getSourceIcon = (source: OrderSource) => {
    switch (source) {
      case 'glovo': return '🟡';
      case 'wolt': return '🔵';
      case 'bolt': return '🟢';
      case 'own_website': return '🏠';
      case 'phone': return '📞';
      default: return '🍽️';
    }
  };

  const getSourceLabel = (source: OrderSource) => {
    switch (source) {
      case 'glovo': return 'Glovo';
      case 'wolt': return 'Wolt';
      case 'bolt': return 'Bolt Food';
      case 'own_website': return 'Website';
      case 'phone': return 'Telefon';
      default: return 'Restaurant';
    }
  };

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-muted-foreground" />;
      case 'cooking': return <ChefHat className="w-3 h-3 text-warning" />;
      case 'ready': return <Check className="w-3 h-3 text-success" />;
      default: return null;
    }
  };

  // Group extra ingredients by category
  const extraIngredientsByCategory = useMemo(() => {
    return extraIngredients.reduce((acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    }, {} as Record<string, typeof extraIngredients>);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border-b border-border gap-3">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'delivery' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('delivery')}
            className="flex-1 md:flex-none"
          >
            <Truck className="w-4 h-4 mr-2" />
            Livrări ({deliveryOrders.length})
          </Button>
          <Button
            variant={activeTab === 'phone' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('phone')}
            className="flex-1 md:flex-none"
          >
            <Phone className="w-4 h-4 mr-2" />
            Telefon ({phoneOrders.length})
          </Button>
        </div>
        <Button onClick={() => { setShowNewOrder(true); setActiveTab('phone'); }} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Comandă nouă
        </Button>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {displayOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nu sunt comenzi active</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {displayOrders.map(order => (
              <div key={order.id} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getSourceIcon(order.source)}</span>
                      <span className="font-bold">{getSourceLabel(order.source)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      {order.customerName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {order.customerPhone}
                    </div>
                    {order.deliveryAddress && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="line-clamp-2">{order.deliveryAddress}</span>
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-primary">{order.totalAmount.toFixed(2)} RON</span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span>{item.quantity}x {item.menuItem.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {order.items.some(i => i.status === 'pending') && (
                  <Button className="w-full" size="sm" onClick={() => {
                    order.items.filter(i => i.status === 'pending').forEach(item => {
                      updateOrderItemStatus(order.id, item.id, 'cooking');
                    });
                    toast({ title: 'Comandă trimisă la bucătărie' });
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Trimite la bucătărie
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Order Dialog */}
      <Dialog open={showNewOrder} onOpenChange={(open) => { if (!open) resetOrder(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Comandă {activeTab === 'phone' ? 'Telefonică' : 'Livrare'} - 
              {orderStep === 'customer' && ' Selectează Client'}
              {orderStep === 'products' && ' Adaugă Produse'}
              {orderStep === 'payment' && ' Plată'}
            </DialogTitle>
          </DialogHeader>

          {orderStep === 'customer' && (
            <div className="space-y-4 overflow-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Caută client după nume sau telefon..."
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {filteredCustomers.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-auto">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full p-3 text-left hover:bg-secondary transition-colors"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      {customer.addresses[0] && (
                        <div className="text-xs text-muted-foreground">{customer.addresses[0].street}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{selectedCustomer.name}</h4>
                      <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                      {selectedCustomer.notes && (
                        <p className="text-sm text-warning mt-1">⚠️ {selectedCustomer.notes}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Addresses */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Adresă livrare</label>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddAddress(true)}>
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Adaugă
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedCustomer.addresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            selectedAddressId === addr.id 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="font-medium text-sm">{addr.label}</div>
                          <div className="text-xs text-muted-foreground">{addr.street}</div>
                          <div className="text-xs text-muted-foreground">{addr.city}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order History */}
                  {customerHistory.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        <History className="w-4 h-4 inline mr-1" />
                        Istoric comenzi
                      </label>
                      <div className="space-y-2 max-h-40 overflow-auto">
                        {customerHistory.slice(0, 5).map(oh => (
                          <div key={oh.orderId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                            <div className="text-sm">
                              <span className="text-muted-foreground">{new Date(oh.date).toLocaleDateString()}</span>
                              <span className="mx-2">•</span>
                              <span>{oh.items.map(i => `${i.quantity}x ${i.menuItem?.name}`).join(', ')}</span>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleAddFromHistory(oh)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usage Cards */}
                  {selectedCustomer.usageCards.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        <Barcode className="w-4 h-4 inline mr-1" />
                        Carduri de folosire
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedCustomer.usageCards.filter(c => c.isActive).map(card => (
                          <div key={card.id} className="p-2 rounded-lg bg-secondary/50 text-sm">
                            <div className="font-mono">{card.barcode}</div>
                            <div className="text-primary font-bold">{card.balance} RON</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New Customer Button */}
              {!selectedCustomer && (
                <Button variant="outline" className="w-full" onClick={() => setShowNewCustomer(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Client nou
                </Button>
              )}

              {selectedCustomer && (
                <Button className="w-full" onClick={handleCreateOrder}>
                  Continuă cu produsele
                </Button>
              )}
            </div>
          )}

          {orderStep === 'products' && (
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
              {/* Menu */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex gap-2 pb-2 overflow-x-auto">
                  {menuCategories.map(cat => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className="whitespace-nowrap text-xs"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {menu.filter(m => m.category === activeCategory).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddToOrderQuick(item)}
                        className="p-3 rounded-lg bg-secondary text-left hover:bg-primary/10 transition-all"
                      >
                        <p className="font-medium text-xs">{item.name}</p>
                        <p className="text-primary font-bold text-sm">{item.price} RON</p>
                        {item.ingredients && item.ingredients.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Personalizabil</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 flex flex-col">
                <div className="text-sm text-muted-foreground mb-2">
                  Client: <span className="font-medium text-foreground">{selectedCustomer?.name}</span>
                </div>
                
                <h4 className="font-semibold mb-2 text-sm">Comandă</h4>
                <div className="space-y-2 flex-1 max-h-60 overflow-auto mb-3">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-secondary/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{item.quantity}x {item.menuItem.name}</span>
                          {/* Show modifications */}
                          {(item.modifications.added.length > 0 || item.modifications.removed.length > 0 || item.modifications.extraIngredients.length > 0) && (
                            <div className="text-xs mt-1 space-x-1">
                              {item.modifications.added.map(a => (
                                <span key={a} className="text-emerald-500">+{a}</span>
                              ))}
                              {item.modifications.removed.map(r => (
                                <span key={r} className="text-destructive">-{r}</span>
                              ))}
                              {item.modifications.extraIngredients.map(e => (
                                <span key={e.id} className="text-primary">+{e.name}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold">
                          {((item.menuItem.price + item.modifications.extraIngredients.reduce((s, e) => s + e.price, 0)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {item.menuItem.ingredients && item.menuItem.ingredients.length > 0 && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openCustomization(item.menuItem, idx)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateOrderItemQuantity(idx, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateOrderItemQuantity(idx, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeOrderItem(idx)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {orderItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Niciun produs adăugat</p>
                  )}
                </div>
                
                <div className="flex justify-between font-bold mb-3 pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{orderTotal.toFixed(2)} RON</span>
                </div>

                {/* Payment Method */}
                <div className="mb-3">
                  <label className="text-sm font-medium mb-2 block">Metodă plată</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all",
                        paymentMethod === 'cash' ? "border-primary bg-primary/10" : "border-border"
                      )}
                    >
                      <Banknote className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all",
                        paymentMethod === 'card' ? "border-primary bg-primary/10" : "border-border"
                      )}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('usage_card')}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all",
                        paymentMethod === 'usage_card' ? "border-primary bg-primary/10" : "border-border",
                        !selectedCustomer?.usageCards.length && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!selectedCustomer?.usageCards.length}
                    >
                      <Barcode className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">Card Folosire</span>
                    </button>
                  </div>
                  
                  {paymentMethod === 'usage_card' && selectedCustomer?.usageCards.length && (
                    <Select value={selectedUsageCardId || ''} onValueChange={setSelectedUsageCardId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selectează card" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCustomer.usageCards.filter(c => c.isActive).map(card => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.barcode} - {card.balance} RON
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSendToKitchen}
                  disabled={orderItems.length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Trimite
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customization Dialog */}
      <Dialog open={showCustomization} onOpenChange={(open) => { if (!open) { setShowCustomization(false); setCustomizingItem(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Personalizează {customizingItem?.name}</DialogTitle>
          </DialogHeader>
          
          {customizingItem && (
            <div className="flex-1 overflow-auto space-y-6">
              {/* Current Ingredients */}
              {customizingItem.ingredients && customizingItem.ingredients.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    Ingrediente ({customizingItem.ingredients.length})
                  </h4>
                  <div className="grid gap-2">
                    {customizingItem.ingredients.map(ing => {
                      const isRemoved = tempRemovals.includes(ing);
                      const isExtra = tempAdditions.includes(ing);
                      
                      return (
                        <div 
                          key={ing}
                          className={cn(
                            "p-3 rounded-lg border flex items-center justify-between",
                            isRemoved && "border-destructive/50 bg-destructive/10",
                            isExtra && "border-primary bg-primary/10",
                            !isRemoved && !isExtra && "border-border bg-card"
                          )}
                        >
                          <span className={cn(
                            "font-medium",
                            isRemoved && "line-through text-muted-foreground"
                          )}>
                            {ing}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isRemoved ? 'destructive' : 'outline'}
                              onClick={() => {
                                if (isRemoved) {
                                  setTempRemovals(tempRemovals.filter(r => r !== ing));
                                } else {
                                  setTempRemovals([...tempRemovals, ing]);
                                  setTempAdditions(tempAdditions.filter(a => a !== ing));
                                }
                              }}
                            >
                              {isRemoved ? '✓ Fără' : 'Fără'}
                            </Button>
                            <Button
                              size="sm"
                              variant={isExtra ? 'default' : 'outline'}
                              onClick={() => {
                                if (isExtra) {
                                  setTempAdditions(tempAdditions.filter(a => a !== ing));
                                } else {
                                  setTempAdditions([...tempAdditions, ing]);
                                  setTempRemovals(tempRemovals.filter(r => r !== ing));
                                }
                              }}
                            >
                              {isExtra ? '✓ Extra' : 'Extra'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extra Ingredients */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adaugă ingrediente extra
                </h4>
                {Object.entries(extraIngredientsByCategory).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map(ing => {
                        const isSelected = tempExtraIngredients.some(e => e.id === ing.id);
                        return (
                          <button
                            key={ing.id}
                            onClick={() => {
                              if (isSelected) {
                                setTempExtraIngredients(tempExtraIngredients.filter(e => e.id !== ing.id));
                              } else {
                                setTempExtraIngredients([...tempExtraIngredients, ing]);
                              }
                            }}
                            className={cn(
                              "px-3 py-2 rounded-lg border text-sm transition-all",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {ing.name} <span className="text-primary font-bold">+{ing.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {(tempAdditions.length > 0 || tempRemovals.length > 0 || tempExtraIngredients.length > 0) && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-semibold mb-2 text-sm">Modificări selectate:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tempAdditions.map(a => (
                      <span key={a} className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                        + Extra {a}
                      </span>
                    ))}
                    {tempRemovals.map(r => (
                      <span key={r} className="px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs">
                        - Fără {r}
                      </span>
                    ))}
                    {tempExtraIngredients.map(e => (
                      <span key={e.id} className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                        + {e.name} (+{e.price} RON)
                      </span>
                    ))}
                  </div>
                  {tempExtraIngredients.length > 0 && (
                    <p className="text-sm mt-2">
                      Cost extra: <span className="font-bold text-primary">+{tempExtraIngredients.reduce((s, e) => s + e.price, 0)} RON</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Button className="w-full" onClick={confirmCustomization}>
              <Check className="w-4 h-4 mr-2" />
              {editingOrderItemIdx !== null ? 'Actualizează' : 'Adaugă în comandă'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client nou</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nume *</label>
                <Input
                  value={newCustomerForm.name}
                  onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon *</label>
                <Input
                  value={newCustomerForm.phone}
                  onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={newCustomerForm.email}
                onChange={e => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Adresă</label>
              <Input
                value={newCustomerForm.street}
                onChange={e => setNewCustomerForm({...newCustomerForm, street: e.target.value})}
                placeholder="Stradă, număr, bloc, apartament"
              />
            </div>
            <Button className="w-full" onClick={handleCreateNewCustomer} disabled={!newCustomerForm.name || !newCustomerForm.phone}>
              Creează client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adresă nouă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Etichetă</label>
              <Input
                value={newAddress.label}
                onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                placeholder="Ex: Acasă, Birou..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Adresă</label>
              <Input
                value={newAddress.street}
                onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                placeholder="Stradă, număr, bloc, apartament"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Oraș</label>
              <Input
                value={newAddress.city}
                onChange={e => setNewAddress({...newAddress, city: e.target.value})}
              />
            </div>
            <Button className="w-full" onClick={() => {
              if (selectedCustomer && newAddress.street) {
                const addr: CustomerAddress = {
                  id: `a${Date.now()}`,
                  label: newAddress.label || 'Adresă',
                  street: newAddress.street,
                  city: newAddress.city,
                  isDefault: false,
                };
                setSelectedCustomer({
                  ...selectedCustomer,
                  addresses: [...selectedCustomer.addresses, addr]
                });
                setSelectedAddressId(addr.id);
                setShowAddAddress(false);
                setNewAddress({ label: '', street: '', city: 'București', notes: '' });
              }
            }}>
              Adaugă adresă
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryOrders;
