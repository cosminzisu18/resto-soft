import React from 'react';
import { Button } from '@/components/ui/button';
import { Notification } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Bell, Check, ChefHat, Phone, Truck, AlertCircle, X, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onClearAll,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order_ready': return <ChefHat className="w-5 h-5 text-success" />;
      case 'new_order': return <Bell className="w-5 h-5 text-accent" />;
      case 'reservation': return <Calendar className="w-5 h-5 text-primary" />;
      case 'delivery': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'urgent': return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'acum';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ore`;
    return `${Math.floor(hours / 24)} zile`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificări</SheetTitle>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearAll}>
                Șterge tot
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-2 max-h-[calc(100vh-120px)] overflow-auto">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nu ai notificări
            </p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => onMarkRead(notification.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  notification.read 
                    ? "bg-background border-border opacity-60"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                )}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "font-medium text-sm",
                        !notification.read && "text-primary"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
