import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderModuleProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  title,
  description,
  icon: Icon,
  features = [],
}) => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
          
          {features.length > 0 && (
            <div className="max-w-sm mx-auto text-left">
              <p className="text-sm font-medium text-muted-foreground mb-3">Funcționalități planificate:</p>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderModule;