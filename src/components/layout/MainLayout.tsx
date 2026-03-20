import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed, 
  Package, 
  Users, 
  BarChart3, 
  FileText, 
  Building2, 
  UserCircle, 
  Truck, 
  Bot, 
  Settings, 
  Palette, 
  CreditCard, 
  MessageSquare,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ModuleType = 
  | 'dashboard'
  | 'pos'
  | 'kiosk'
  | 'kds'
  | 'stocks'
  | 'employees'
  | 'reports'
  | 'management'
  | 'suppliers'
  | 'customers'
  | 'delivery'
  | 'ai'
  | 'admin'
  | 'branding'
  | 'subscriptions'
  | 'communication'
  | 'offline'
  | 'chat';

interface NavItem {
  id: ModuleType;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'RestoSoft', icon: ShoppingCart },
  { id: 'kiosk', label: 'Kiosk Self-Order', icon: Store },
  { id: 'kds', label: 'KDS & Producție', icon: UtensilsCrossed },
  { id: 'stocks', label: 'Stocuri & Rețete', icon: Package },
  { id: 'employees', label: 'Angajați', icon: Users },
  { id: 'reports', label: 'Rapoarte', icon: BarChart3 },
  
  { id: 'suppliers', label: 'Furnizori B2B', icon: Building2 },
  { id: 'customers', label: 'Clienți', icon: UserCircle },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'ai', label: 'AI & Automatizări', icon: Bot },
  { id: 'admin', label: 'Admin', icon: Settings },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'subscriptions', label: 'Abonamente', icon: CreditCard },
  { id: 'communication', label: 'Comunicare', icon: MessageSquare },
  { id: 'offline', label: 'Mod Offline', icon: Wifi },
];

interface MainLayoutProps {
  children: React.ReactNode;
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  isOnline?: boolean;
  restaurantName?: string;
  currentLocation?: string;
  onLogout?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeModule,
  onModuleChange,
  isOnline = true,
  restaurantName = 'Restaurant Demo',
  currentLocation = 'Locația 1',
  onLogout,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen h-[100dvh] flex flex-col lg:flex-row w-full bg-background overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-card border-b border-border flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-foreground text-sm truncate">{restaurantName}</span>
            <span className="text-xs text-muted-foreground truncate">{currentLocation}</span>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300",
            collapsed ? "w-16" : "w-64",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center h-16 px-4 border-b border-border",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-foreground truncate">{restaurantName}</span>
                <span className="text-xs text-muted-foreground truncate">{currentLocation}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="flex flex-col gap-1 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                const button = (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center h-12 rounded-lg transition-colors",
                      collapsed ? "justify-center px-0" : "gap-4 px-4",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => {
                      onModuleChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-base font-bold truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-sm font-bold rounded-full px-2 py-1 min-w-[24px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="text-base font-bold">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.id}>{button}</div>;
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className={cn("flex items-center gap-2 p-4 border-t border-border", collapsed && "flex-col")}>
            {/* Online Status */}
            <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              {!collapsed && (
                <span className={cn("text-xs", isOnline ? "text-success" : "text-destructive")}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              )}
            </div>

            {/* Logout */}
            {onLogout && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={collapsed ? "icon-sm" : "sm"}
                    className={cn(!collapsed && "ml-auto")}
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Ieșire</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Ieșire</TooltipContent>}
              </Tooltip>
            )}
          </div>
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 min-h-0 transition-all duration-300 overflow-hidden",
            collapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          <div className="h-full min-h-0 overflow-auto">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default MainLayout;