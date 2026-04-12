import type { ModuleType } from '@/components/layout/MainLayout';

/** Segmentele URL valide pentru modulul din dashboard (inclusiv `dashboard`). */
export const DASHBOARD_MODULE_SEGMENTS: ModuleType[] = [
  'dashboard',
  'pos',
  'kiosk',
  'kds',
  'stocks',
  'employees',
  'reports',
  'management',
  'suppliers',
  'customers',
  'delivery',
  'ai',
  'admin',
  'branding',
  'subscriptions',
  'communication',
  'offline',
  'chat',
];

export function isDashboardModuleSegment(s: string): s is ModuleType {
  return (DASHBOARD_MODULE_SEGMENTS as string[]).includes(s);
}

export type ParsedAppRoute =
  | { kind: 'login' }
  | { kind: 'kiosk' }
  | { kind: 'self-order' }
  | { kind: 'order-monitor' }
  | { kind: 'dashboard'; module: ModuleType }
  /** Shell similar dashboard, pentru bucătărie — nu folosește `/dashboard` (rezervat admin 0000). */
  | { kind: 'kitchenDesk'; module: ModuleType }
  | { kind: 'waiter' }
  | { kind: 'order'; tableId: number }
  | { kind: 'unknown' };

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * Mapează pathname-ul Next către zona aplicației.
 * Convenții: `/dashboard`, `/dashboard/pos`, `/restosoft`, `/restosoft/order/:tableId`
 */
export function parsePathname(pathname: string): ParsedAppRoute {
  const p = normalizePath(pathname);

  if (p === '/' || p === '/login') return { kind: 'login' };
  if (p === '/kiosk') return { kind: 'kiosk' };
  if (p === '/self-order') return { kind: 'self-order' };
  if (p === '/order-monitor') return { kind: 'order-monitor' };

  if (p === '/restosoft') return { kind: 'waiter' };
  const orderMatch = /^\/restosoft\/order\/(\d+)$/.exec(p);
  if (orderMatch) {
    return { kind: 'order', tableId: parseInt(orderMatch[1], 10) };
  }

  /** Zonă bucătărie (aceleași module ca în shell-ul vechi din /dashboard/kds, fără să folosească /dashboard). */
  if (p === '/kitchen') return { kind: 'kitchenDesk', module: 'kds' };
  if (p.startsWith('/kitchen/')) {
    const seg = p.slice('/kitchen/'.length).split('/')[0];
    if (seg && isDashboardModuleSegment(seg)) {
      return { kind: 'kitchenDesk', module: seg };
    }
    return { kind: 'kitchenDesk', module: 'kds' };
  }

  if (p === '/dashboard') return { kind: 'dashboard', module: 'dashboard' };
  if (p.startsWith('/dashboard/')) {
    const seg = p.slice('/dashboard/'.length).split('/')[0];
    if (seg && isDashboardModuleSegment(seg)) {
      return { kind: 'dashboard', module: seg };
    }
    return { kind: 'dashboard', module: 'dashboard' };
  }

  /** Alias scurt: `/admin` → modul admin în același shell ca dashboard */
  if (p === '/admin') return { kind: 'dashboard', module: 'admin' };
  if (p.startsWith('/admin/')) {
    const seg = p.slice('/admin/'.length).split('/')[0];
    if (seg && isDashboardModuleSegment(seg)) {
      return { kind: 'dashboard', module: seg };
    }
    return { kind: 'dashboard', module: 'admin' };
  }

  return { kind: 'unknown' };
}

/** Modul dashboard în URL — `/dashboard` pentru modulul principal, altfel `/dashboard/:module */
export function pathDashboardModule(module: ModuleType): string {
  return module === 'dashboard' ? '/dashboard' : `/dashboard/${module}`;
}

/** Alias pentru zona administrare (același UI ca dashboard, alt prefix URL) */
export function pathAdminModule(module: ModuleType = 'admin'): string {
  return module === 'admin' ? '/admin' : `/admin/${module}`;
}

/** Modul în zona bucătărie — `/kitchen` = KDS implicit. */
export function pathKitchenModule(module: ModuleType = 'kds'): string {
  return module === 'kds' ? '/kitchen' : `/kitchen/${module}`;
}

/** Link-uri în sidebar: păstrează prefixul `/dashboard`, `/admin` sau `/kitchen`. */
export function pathModuleWithBase(
  navBase: '/dashboard' | '/admin' | '/kitchen',
  module: ModuleType,
): string {
  if (navBase === '/admin') {
    return pathAdminModule(module);
  }
  if (navBase === '/kitchen') {
    return pathKitchenModule(module);
  }
  return pathDashboardModule(module);
}

export const ROUTES = {
  login: '/login',
  kiosk: '/kiosk',
  selfOrder: '/self-order',
  orderMonitor: '/order-monitor',
  waiter: '/restosoft',
  order: (tableId: number) => `/restosoft/order/${tableId}`,
  dashboard: pathDashboardModule,
  admin: pathAdminModule,
  kitchen: pathKitchenModule,
} as const;
