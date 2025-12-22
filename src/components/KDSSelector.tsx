import React from 'react';
import { Button } from '@/components/ui/button';
import { kdsStations } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { ArrowLeft, Monitor } from 'lucide-react';

interface KDSSelectorProps {
  onSelectStation: (stationId: string) => void;
  onBack: () => void;
}

const KDSSelector: React.FC<KDSSelectorProps> = ({ onSelectStation, onBack }) => {
  return (
    <div className="min-h-screen bg-kds-background flex flex-col">
      <header className="p-4 border-b border-kds-border">
        <Button variant="ghost" onClick={onBack} className="text-kds-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la login
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Monitor className="w-16 h-16 mx-auto text-kds-foreground/50 mb-4" />
            <h1 className="text-3xl font-bold text-kds-foreground">Selectează stația KDS</h1>
            <p className="text-kds-foreground/60 mt-2">Alege stația de bucătărie pentru afișare</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {kdsStations.map(station => (
              <button
                key={station.id}
                onClick={() => onSelectStation(station.id)}
                className={cn(
                  "p-8 rounded-2xl border-2 border-kds-border transition-all",
                  "hover:border-primary hover:scale-105",
                  "bg-kds-card text-kds-foreground"
                )}
              >
                <span className="text-5xl block mb-4">{station.icon}</span>
                <h2 className="text-xl font-bold">{station.name}</h2>
                <p className="text-sm text-kds-foreground/60 mt-1">
                  Click pentru a deschide
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDSSelector;
