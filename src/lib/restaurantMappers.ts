import type { MenuItem, Notification, Reservation, Table } from '@/data/mockData';
import {
  normalizeTablePosition,
  type MenuItemApi,
  type NotificationApi,
  type ReservationApi,
  type TableApi,
} from '@/lib/api';

/** Mapare meniu API → model UI (inclusiv `kdsStationId` pentru KDS). */
export function menuItemApiToMenuItem(api: MenuItemApi): MenuItem {
  return {
    id: String(api.id),
    name: api.name,
    description: api.description ?? '',
    price: typeof api.price === 'number' ? api.price : Number(api.price),
    category: api.category,
    kdsStation: api.kdsStation?.type ?? String(api.kdsStationId),
    prepTime: api.prepTime,
    ingredients:
      api.menuItemIngredients?.map((mi) => mi.ingredient?.name ?? `Ingredient ${mi.ingredientId}`) ?? [],
    allergenIds: api.allergens?.map((a) => String(a.id)),
    availableExtras: api.availableExtras?.map((e) => String(e.id)),
    image: api.image,
    unitType: api.unitType,
    availability: api.availability as MenuItem['availability'],
    platformPricing: api.platformPricing as MenuItem['platformPricing'],
    ...(api.kdsStationId != null ? { kdsStationId: api.kdsStationId } : {}),
  };
}

export function tableApiToTable(t: TableApi): Table {
  const pos = normalizeTablePosition(t.position);
  return {
    id: t.id,
    number: t.number,
    seats: t.seats,
    status: t.status,
    position: pos ?? { x: 50, y: 50 },
    shape: t.shape,
    currentOrderId: t.currentOrderId ?? undefined,
    reservationId: t.reservationId ?? undefined,
    currentGuests: t.currentGuests,
    mergedWith: t.mergedWith ?? undefined,
    qrCode: t.qrCode ?? undefined,
  };
}

export function reservationApiToReservation(r: ReservationApi): Reservation {
  return {
    id: r.id,
    customerName: r.customerName,
    customerPhone: r.customerPhone ?? '',
    customerEmail: r.customerEmail ?? undefined,
    date: new Date(r.date),
    time: r.time,
    partySize: r.partySize,
    tableIds: (r.reservationTables ?? []).map((x) => x.tableId),
    status: r.status,
    notes: r.notes ?? undefined,
    source: r.source,
    createdAt: new Date(r.createdAt),
  };
}

export function notificationApiToNotification(n: NotificationApi): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message ?? '',
    orderId: n.orderId != null ? String(n.orderId) : undefined,
    tableNumber: n.tableNumber ?? undefined,
    read: n.read,
    createdAt: new Date(n.createdAt),
    targetRole: n.targetRole ?? undefined,
    targetUserId: n.targetUserId ?? undefined,
  };
}
