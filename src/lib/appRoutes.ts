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

/** Link-uri în sidebar: păstrează prefixul `/dashboard` sau `/admin`. */
export function pathModuleWithBase(
  navBase: '/dashboard' | '/admin',
  module: ModuleType,
): string {
  if (navBase === '/admin') {
    return pathAdminModule(module);
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
} as const;
