import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRestaurant } from '@/context/RestaurantContext';
import { Order, OrderItem, MenuItem, menuCategories, deliveryPlatforms, OrderSource } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Phone, Truck, Plus, ChefHat, Clock, Check, 
  MapPin, User, Send, X, Package
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DeliveryOrdersProps {
  onClose?: () => void;
}

const DeliveryOrders: React.FC<DeliveryOrdersProps> = ({ onClose }) => {
  const { 
    orders, menu, createDeliveryOrder, addItemToOrder, 
    updateOrderItemStatus, getDeliveryOrders, getPhoneOrders
  } = useRestaurant();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'delivery' | 'phone'>('delivery');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<OrderSource>('phone');
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    platformOrderId: '',
  });
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);

  const deliveryOrders = getDeliveryOrders();
  const phoneOrders = getPhoneOrders();
  const displayOrders = activeTab === 'delivery' ? deliveryOrders : phoneOrders;

  const handleCreateOrder = () => {
    if (!customerForm.name || !customerForm.phone) {
      toast({ title: 'Completează numele și telefonul', variant: 'destructive' });
      return;
    }

    const order = createDeliveryOrder(selectedPlatform, {
      name: customerForm.name,
      phone: customerForm.phone,
      address: customerForm.address || undefined,
      platformOrderId: customerForm.platformOrderId || undefined,
    });

    setNewOrderId(order.id);
    toast({ title: 'Comandă creată' });
  };

  const handleAddToOrder = (menuItem: MenuItem) => {
    if (!newOrderId) return;
    
    // Use platform-specific pricing if available
    let price = menuItem.price;
    const platformKey = selectedPlatform === 'own_website' ? 'own' : selectedPlatform;
    if (menuItem.platformPricing && menuItem.platformPricing[platformKey as keyof typeof menuItem.platformPricing]?.enabled) {
      price = menuItem.platformPricing[platformKey as keyof typeof menuItem.platformPricing]!.price;
    }

    addItemToOrder(newOrderId, { ...menuItem, price }, 1);
    toast({ title: `${menuItem.name} adăugat` });
  };

  const handleSendToKitchen = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    order.items.filter(i => i.status === 'pending').forEach(item => {
      updateOrderItemStatus(orderId, item.id, 'cooking');
    });

    toast({ title: 'Comandă trimisă la bucătărie' });
    setShowNewOrder(false);
    setNewOrderId(null);
    setCustomerForm({ name: '', phone: '', address: '', platformOrderId: '' });
  };

  const currentNewOrder = orders.find(o => o.id === newOrderId);

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

  const filteredMenu = menu.filter(m => m.category === activeCategory);

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
        <Button onClick={() => setShowNewOrder(true)} size="sm">
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
            {displayOrders.map(order => {
              const pendingCount = order.items.filter(i => i.status === 'pending').length;
              const cookingCount = order.items.filter(i => i.status === 'cooking').length;
              const readyCount = order.items.filter(i => i.status === 'ready').length;

              return (
                <div key={order.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getSourceIcon(order.source)}</span>
                        <span className="font-bold">{getSourceLabel(order.source)}</span>
                        {order.platformOrderId && (
                          <span className="text-xs text-muted-foreground">
                            #{order.platformOrderId}
                          </span>
                        )}
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

                  {/* Items */}
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

                  {/* Status summary */}
                  <div className="flex gap-2 text-xs">
                    {pendingCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-muted">
                        {pendingCount} așteptare
                      </span>
                    )}
                    {cookingCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-warning/20 text-warning">
                        {cookingCount} preparare
                      </span>
                    )}
                    {readyCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-success/20 text-success">
                        {readyCount} gata
                      </span>
                    )}
                  </div>

                  {pendingCount > 0 && (
                    <Button 
                      className="w-full mt-3" 
                      size="sm"
                      onClick={() => handleSendToKitchen(order.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Trimite la bucătărie
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Order Dialog */}
      <Dialog open={showNewOrder} onOpenChange={(open) => {
        if (!open) {
          setShowNewOrder(false);
          setNewOrderId(null);
          setCustomerForm({ name: '', phone: '', address: '', platformOrderId: '' });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comandă nouă - {activeTab === 'delivery' ? 'Livrare' : 'Telefon'}</DialogTitle>
          </DialogHeader>

          {!newOrderId ? (
            <div className="space-y-4">
              {/* Platform selection */}
              {activeTab === 'delivery' && (
                <div>
                  <label className="text-sm font-medium">Platformă</label>
                  <Select 
                    value={selectedPlatform} 
                    onValueChange={(v: OrderSource) => setSelectedPlatform(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryPlatforms.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.icon} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nume client *</label>
                  <Input
                    value={customerForm.name}
                    onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                    placeholder="Nume complet"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefon *</label>
                  <Input
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                    placeholder="07xxxxxxxx"
                  />
                </div>
              </div>

              {activeTab === 'delivery' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Adresă livrare</label>
                    <Input
                      value={customerForm.address}
                      onChange={e => setCustomerForm({...customerForm, address: e.target.value})}
                      placeholder="Strada, număr, bloc, apartament"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ID Comandă platformă</label>
                    <Input
                      value={customerForm.platformOrderId}
                      onChange={e => setCustomerForm({...customerForm, platformOrderId: e.target.value})}
                      placeholder="Ex: GLV-12345"
                    />
                  </div>
                </>
              )}

              <Button className="w-full" onClick={handleCreateOrder}>
                Continuă cu produsele
              </Button>
            </div>
          ) : (
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
                    {filteredMenu.map(item => {
                      const platformKey = selectedPlatform === 'own_website' ? 'own' : selectedPlatform;
                      const platformPricing = item.platformPricing?.[platformKey as keyof typeof item.platformPricing];
                      const displayPrice = platformPricing?.enabled ? platformPricing.price : item.price;
                      const displayName = platformPricing?.enabled ? platformPricing.name : item.name;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleAddToOrder(item)}
                          className="p-3 rounded-lg bg-secondary text-left hover:bg-primary/10 transition-all"
                        >
                          <p className="font-medium text-xs">{displayName}</p>
                          <p className="text-primary font-bold text-sm">{displayPrice} RON</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
                <h4 className="font-semibold mb-2 text-sm">Comandă</h4>
                <div className="space-y-1 max-h-40 overflow-auto mb-3">
                  {currentNewOrder?.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mb-3">
                  <span>Total</span>
                  <span>{currentNewOrder?.totalAmount.toFixed(2)} RON</span>
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
    </div>
  );
};

export default DeliveryOrders;
