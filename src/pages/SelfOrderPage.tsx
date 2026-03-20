import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomerSelfOrder from '@/components/CustomerSelfOrder';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SelfOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();

  return (
    <div className="relative">
      <CustomerSelfOrder initialTableId={tableId || 't1'} />
      <Button variant="outline" className="fixed top-4 left-4 z-50" onClick={() => navigate('/')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Ieși
      </Button>
    </div>
  );
};

export default SelfOrderPage;
