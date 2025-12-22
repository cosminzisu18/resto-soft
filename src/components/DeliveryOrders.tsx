import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Order, OrderItem, MenuItem, menuCategories, deliveryPlatforms, OrderSource,
  Customer, mockCustomers, orderHistoryItems, menuItems, PaymentMethod, CustomerAddress
} from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Phone, Truck, Plus, ChefHat, Clock, Check, 
  MapPin, User, Send, X, Package, Search, History,
  CreditCard, Banknote, Barcode, PlusCircle, Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DeliveryOrdersProps {
  onClose?: () => void;
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

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    if (customer.addresses.length > 0) {
      const defaultAddr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  };

  const handleCreateNewCustomer = () => {
    // In a real app, this would save to database
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

  const handleAddToOrder = (menuItem: MenuItem, quantity: number = 1) => {
    if (!newOrderId) return;
    
    let price = menuItem.price;
    const platformKey = selectedPlatform === 'own_website' ? 'own' : selectedPlatform;
    if (menuItem.platformPricing && menuItem.platformPricing[platformKey as keyof typeof menuItem.platformPricing]?.enabled) {
      price = menuItem.platformPricing[platformKey as keyof typeof menuItem.platformPricing]!.price;
    }

    addItemToOrder(newOrderId, { ...menuItem, price }, quantity);
    toast({ title: `${menuItem.name} adăugat` });
  };

  const handleAddFromHistory = (historyOrder: typeof customerHistory[0]) => {
    historyOrder.items.forEach(item => {
      if (item.menuItem) {
        handleAddToOrder(item.menuItem, item.quantity);
      }
    });
    toast({ title: 'Produse din istoric adăugate' });
  };

  const handleSendToKitchen = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    order.items.filter(i => i.status === 'pending').forEach(item => {
      updateOrderItemStatus(orderId, item.id, 'cooking');
    });

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
  };

  const currentNewOrder = orders.find(o => o.id === newOrderId);
  const filteredMenu = menu.filter(m => m.category === activeCategory);

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
                  <Button className="w-full" size="sm" onClick={() => handleSendToKitchen(order.id)}>
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
                    {filteredMenu.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddToOrder(item)}
                        className="p-3 rounded-lg bg-secondary text-left hover:bg-primary/10 transition-all"
                      >
                        <p className="font-medium text-xs">{item.name}</p>
                        <p className="text-primary font-bold text-sm">{item.price} RON</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 flex flex-col">
                <div className="text-sm text-muted-foreground mb-2">
                  Client: <span className="font-medium text-foreground">{selectedCustomer?.name}</span>
                </div>
                
                <h4 className="font-semibold mb-2 text-sm">Comandă</h4>
                <div className="space-y-1 flex-1 max-h-40 overflow-auto mb-3">
                  {currentNewOrder?.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between font-bold mb-3 pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{currentNewOrder?.totalAmount.toFixed(2)} RON</span>
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
                  onClick={() => handleSendToKitchen(newOrderId!)}
                  disabled={!currentNewOrder?.items.length}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Trimite
                </Button>
              </div>
            </div>
          )}
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
