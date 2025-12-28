import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StocksDashboard } from '@/components/stocks/StocksDashboard';
import { StockManagement } from '@/components/stocks/StockManagement';
import { StockAlerts } from '@/components/stocks/StockAlerts';
import { RecipesManager } from '@/components/stocks/RecipesManager';
import { InventoryManager } from '@/components/stocks/InventoryManager';
import { PrimaryManagement } from '@/components/stocks/PrimaryManagement';
import { MenuManager } from '@/components/stocks/MenuManager';

export const StocksModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigateToAlerts = () => {
    setActiveTab('alerts');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <PageHeader 
        title="Stocuri & Gestiune" 
        description="Dashboard, gestiune stocuri, meniu, rețete și inventar"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto gap-1 w-max">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="menu" className="text-xs sm:text-sm">Meniu</TabsTrigger>
            <TabsTrigger value="stocks" className="text-xs sm:text-sm">Stocuri</TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              Alerte
              <Badge variant="destructive" className="text-[10px] sm:text-xs">4</Badge>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-xs sm:text-sm">Rețete</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs sm:text-sm">Inventar</TabsTrigger>
            <TabsTrigger value="primary" className="text-xs sm:text-sm">Gestiune Primară</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="dashboard">
          <StocksDashboard onNavigateToAlerts={handleNavigateToAlerts} />
        </TabsContent>

        <TabsContent value="menu">
          <MenuManager />
        </TabsContent>

        <TabsContent value="stocks">
          <StockManagement />
        </TabsContent>

        <TabsContent value="alerts">
          <StockAlerts />
        </TabsContent>

        <TabsContent value="recipes">
          <RecipesManager />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManager />
        </TabsContent>

        <TabsContent value="primary">
          <PrimaryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StocksModule;
