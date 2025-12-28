import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StocksDashboard } from '@/components/stocks/StocksDashboard';
import { StockManagement } from '@/components/stocks/StockManagement';
import { StockAlerts } from '@/components/stocks/StockAlerts';
import { RecipesManager } from '@/components/stocks/RecipesManager';
import { InventoryManager } from '@/components/stocks/InventoryManager';
import { PrimaryManagement } from '@/components/stocks/PrimaryManagement';

export const StocksModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigateToAlerts = () => {
    setActiveTab('alerts');
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Stocuri & Gestiune" 
        description="Dashboard, gestiune stocuri, rețete și inventar"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="stocks">Gestiune Stocuri</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            Alerte
            <Badge variant="destructive" className="text-xs">4</Badge>
          </TabsTrigger>
          <TabsTrigger value="recipes">Rețete</TabsTrigger>
          <TabsTrigger value="inventory">Inventar</TabsTrigger>
          <TabsTrigger value="primary">Gestiune Primară</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <StocksDashboard onNavigateToAlerts={handleNavigateToAlerts} />
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
