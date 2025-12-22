import React from 'react';
import { Table } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface TableMapProps {
  onTableSelect: (table: Table) => void;
}

const TableMap: React.FC<TableMapProps> = ({ onTableSelect }) => {
  const { tables, getActiveOrderForTable } = useRestaurant();

  const getTableShape = (shape: Table['shape'], size: number) => {
    switch (shape) {
      case 'round':
        return 'rounded-full';
      case 'rectangle':
        return 'rounded-xl aspect-[2/1]';
      default:
        return 'rounded-xl';
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'free':
        return 'bg-table-free/20 border-table-free hover:bg-table-free/30';
      case 'occupied':
        return 'bg-table-occupied/20 border-table-occupied hover:bg-table-occupied/30';
      case 'reserved':
        return 'bg-table-reserved/20 border-table-reserved hover:bg-table-reserved/30';
    }
  };

  const getStatusLabel = (status: Table['status']) => {
    switch (status) {
      case 'free': return 'Liberă';
      case 'occupied': return 'Ocupată';
      case 'reserved': return 'Rezervată';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Harta Restaurantului</h2>
        <div className="flex gap-4 ml-auto text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-table-free" />
            Liberă
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-table-occupied" />
            Ocupată
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-table-reserved" />
            Rezervată
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-secondary/30 overflow-auto p-4">
        {/* Restaurant floor grid */}
        <div 
          className="relative min-h-[500px] min-w-full"
          style={{ 
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {tables.map(table => {
            const order = getActiveOrderForTable(table.id);
            const hasItems = order && order.items.length > 0;
            
            return (
              <button
                key={table.id}
                onClick={() => onTableSelect(table)}
                className={cn(
                  "absolute transition-all duration-200 border-2",
                  "flex flex-col items-center justify-center gap-1",
                  "shadow-md hover:shadow-lg hover:scale-105",
                  "min-w-[80px] min-h-[80px]",
                  getTableShape(table.shape, table.seats),
                  getStatusColor(table.status),
                  table.status === 'occupied' && hasItems && 'animate-pulse-ring'
                )}
                style={{
                  left: `${table.position.x}%`,
                  top: `${table.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: table.shape === 'rectangle' ? '140px' : '90px',
                }}
              >
                <span className="text-2xl font-bold">{table.number}</span>
                <span className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {table.seats}
                </span>
                {order && order.items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {order.items.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TableMap;
