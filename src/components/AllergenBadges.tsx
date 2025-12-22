import React from 'react';
import { allergens, Allergen } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AllergenBadgesProps {
  allergenIds?: string[];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const AllergenBadges: React.FC<AllergenBadgesProps> = ({ 
  allergenIds, 
  size = 'sm', 
  showLabel = false,
  className 
}) => {
  if (!allergenIds || allergenIds.length === 0) return null;

  const itemAllergens = allergenIds
    .map(id => allergens.find(a => a.id === id))
    .filter((a): a is Allergen => a !== undefined);

  if (itemAllergens.length === 0) return null;

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  const labelSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap gap-1", className)}>
        {itemAllergens.map(allergen => (
          <Tooltip key={allergen.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-full flex items-center justify-center flex-shrink-0 cursor-help",
                  sizeClasses[size],
                  allergen.color,
                  showLabel && "px-2 gap-1"
                )}
                style={{ minWidth: showLabel ? 'auto' : undefined }}
              >
                <span>{allergen.icon}</span>
                {showLabel && (
                  <span className={cn("text-white font-medium", labelSizeClasses[size])}>
                    {allergen.name}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground">
              <p className="font-medium">{allergen.icon} {allergen.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default AllergenBadges;
