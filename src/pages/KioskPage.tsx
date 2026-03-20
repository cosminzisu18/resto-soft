import React from 'react';
import { useNavigate } from 'react-router-dom';
import KioskOrdering from '@/components/KioskOrdering';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const KioskPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <KioskOrdering />
      <Button variant="outline" className="fixed top-4 left-4 z-50" onClick={() => navigate('/')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Ieși
      </Button>
    </div>
  );
};

export default KioskPage;
