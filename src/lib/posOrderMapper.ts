import type { Order, OrderItem, MenuItem, OrderSource, PaymentMethod } from '@/data/mockData';
import type { OrderApi, OrderItemApi } from '@/lib/api';

function menuItemFromSnapshot(menuItemId: number, raw: Record<string, unknown> | null): MenuItem {
  const mj = raw ?? {};
  const name = String(mj.name ?? 'Produs');
  const price = Number(mj.price ?? 0);
  const prepTime = Number(mj.prepTime ?? 0);
  const kdsStation =
    typeof mj.kdsStation === 'string'
      ? mj.kdsStation
      : typeof mj.kdsStationType === 'string'
        ? mj.kdsStationType
        : 'grill';
  return {
    id: String(menuItemId),
    name,
    description: String(mj.description ?? ''),
    price,
    category: String(mj.category ?? ''),
    kdsStation,
    prepTime,
    ingredients: [],
    unitType: mj.unitType === 'gram' || mj.unitType === 'portie' || mj.unitType === 'buc' ? mj.unitType : undefined,
  };
}

export function orderItemApiToOrderItem(i: OrderItemApi): OrderItem {
  const mods = i.modifications ?? { added: [], removed: [], notes: '' };
  return {
    id: i.id,
    menuItemId: String(i.menuItemId),
    menuItem: menuItemFromSnapshot(i.menuItemId, i.menuItem),
    quantity: i.quantity,
    weightGrams: i.weightGrams ?? undefined,
    modifications: {
      added: mods.added ?? [],
      removed: mods.removed ?? [],
      notes: mods.notes ?? '',
    },
    status: i.status,
    complimentary: i.complimentary,
  };
}

/** Mapare OrderApi → Order (mock shape) pentru RestoSoft / POS. */
export function orderApiToPosOrder(a: OrderApi): Order {
  const source = (a.source || 'restaurant') as OrderSource;
  const pm = a.paymentMethod;
  const paymentMethod: PaymentMethod | undefined =
    pm === 'cash' || pm === 'card' || pm === 'usage_card' ? pm : undefined;

  return {
    id: String(a.id),
    tableId: a.tableId ?? undefined,
    tableNumber: a.tableNumber ?? undefined,
    waiterId: a.waiterId ?? '',
    waiterName: a.waiterName ?? '',
    items: (a.items ?? []).map(orderItemApiToOrderItem),
    status: a.status,
    createdAt: new Date(a.createdAt),
    syncTiming: a.syncTiming ?? false,
    totalAmount: Number(a.totalAmount),
    tip: Number(a.tip ?? 0),
    cui: a.cui ?? undefined,
    source,
    customerName: a.customerName ?? undefined,
    customerPhone: a.customerPhone ?? undefined,
    deliveryAddress: a.deliveryAddress ?? undefined,
    paymentMethod,
  };
}
