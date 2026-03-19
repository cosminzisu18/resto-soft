import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { imageSrc } from '@/lib/api';
import { ExternalLink, LucideIcon } from 'lucide-react';

interface ProductCardProps {
  name: string;
  stock?: string;
  image?: string;
  icon?: LucideIcon;
  onEdit?: () => void;
  onClick?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  stock,
  image,
  icon: Icon,
  onEdit,
  onClick,
  className,
}) => {
  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {image ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden mb-3 bg-muted">
              <img src={imageSrc(image)} alt={name} className="w-full h-full object-cover" />
            </div>
          ) : Icon ? (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <div className="w-6 h-6 border-2 border-primary rounded grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-primary rounded-sm" />
                <div className="bg-primary rounded-sm" />
                <div className="bg-primary rounded-sm" />
                <div className="bg-primary rounded-sm" />
              </div>
            </div>
          )}
          <h3 className="font-semibold text-foreground line-clamp-2">{name}</h3>
          {stock && (
            <p className="text-sm text-muted-foreground mt-1">Stoc: {stock}</p>
          )}
        </div>
        {onEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
          >
            <ExternalLink className="h-4 w-4 text-primary" />
          </button>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;