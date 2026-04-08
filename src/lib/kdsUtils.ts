import type { KDSStation, MenuItem, OrderItem, Order } from '@/data/mockData';
import type { KdsStationApi, KdsStationType } from '@/lib/api';

const KDS_DEFAULTS: Record<KdsStationType, { color: string; icon: string }> = {
  soups: { color: 'bg-amber-500', icon: '🍲' },
  pizza: { color: 'bg-red-500', icon: '🍕' },
  grill: { color: 'bg-orange-500', icon: '🔥' },
  giros: { color: 'bg-yellow-500', icon: '🥙' },
};

/** Mapare API → model folosit de KDSEnhancedModule (id numeric ca string pentru chei). */
export function kdsStationApiToKdsStation(api: KdsStationApi): KDSStation {
  const d = KDS_DEFAULTS[api.type] ?? KDS_DEFAULTS.grill;
  const color =
    api.color && String(api.color).startsWith('bg-') ? String(api.color) : d.color;
  return {
    id: String(api.id),
    name: api.name,
    type: api.type,
    color,
    icon: api.icon?.trim() ? api.icon : d.icon,
  };
}

/** Potrivește articolul de comandă cu stația (mock: kdsStation slug; API: kdsStationId + type). */
export function orderItemMatchesKdsStation(item: OrderItem, station: KDSStation): boolean {
  const mi = item.menuItem as MenuItem & { kdsStationId?: number; kdsStationType?: string };
  if (mi.kdsStationId != null && String(mi.kdsStationId) === String(station.id)) return true;
  const typeSlug =
    typeof mi.kdsStation === 'string' && mi.kdsStation.trim() !== ''
      ? mi.kdsStation
      : typeof mi.kdsStationType === 'string'
        ? mi.kdsStationType
        : undefined;
  if (typeSlug === station.id) return true;
  if (typeSlug === station.type) return true;
  const category = (mi.category ?? '').toLowerCase();
  const inferredType: KdsStationType | null = category.includes('sup')
    ? 'soups'
    : category.includes('pizza')
      ? 'pizza'
      : category.includes('giros') || category.includes('doner')
        ? 'giros'
        : category
              ? 'grill'
              : null;
  if (inferredType && inferredType === station.type) return true;
  return false;
}

/** Număr afișat pe KDS: masă sau id comandă pentru livrări (fără masă). */
export function kdsOrderDisplayNumber(order: Order): string {
  if (order.tableNumber != null) return String(order.tableNumber);
  return String(order.id);
}
