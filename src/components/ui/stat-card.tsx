import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'green' | 'red' | 'blue' | 'orange';
  className?: string;
}

const colorClasses = {
  default: 'text-foreground',
  green: 'text-stat-green',
  red: 'text-stat-red',
  blue: 'text-stat-blue',
  orange: 'text-stat-orange',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'default',
  className,
}) => {
  return (
    <Card className={cn("p-6 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold mt-2", colorClasses[color])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              trend.isPositive ? "text-stat-green" : "text-stat-red"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs. ieri</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;