import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/context/RestaurantContext';
import OrderPanel from '@/components/OrderPanel';

const OrderPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { tables } = useRestaurant();

  const table = tables.find(t => t.id === tableId);

  if (!table) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Masa nu a fost găsită.</p>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <OrderPanel table={table} onClose={() => navigate('/waiter')} />
    </div>
  );
};

export default OrderPage;
