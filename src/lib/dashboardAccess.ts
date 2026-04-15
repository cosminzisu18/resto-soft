import type { User } from '@/data/mockData';

/** Acces la shell-ul `/dashboard` și `/admin`: orice utilizator cu rol `admin`. */
export function canAccessDashboardShell(user: User | null): boolean {
  return !!user && user.role === 'admin';
}

/** Zona `/kitchen` (bucătărie): rol kitchen sau același admin ca la dashboard. */
export function canAccessKitchenDesk(user: User | null): boolean {
  if (!user) return false;
  if (canAccessDashboardShell(user)) return true;
  return user.role === 'kitchen';
}
