import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginScreen from '@/components/LoginScreen';
import { Button } from '@/components/ui/button';
import { Tablet, QrCode, Monitor as MonitorIcon, Eye } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (role: 'admin' | 'kitchen' | 'waiter') => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'kitchen') {
      navigate('/admin/kds');
    } else {
      navigate('/waiter');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LoginScreen onLoginSuccess={handleLoginSuccess} />
      
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-card/90 backdrop-blur p-3 rounded-2xl border shadow-lg">
        <Button variant="outline" size="sm" onClick={() => navigate('/kiosk')} className="flex items-center gap-2">
          <Tablet className="w-4 h-4" />
          Kiosk Demo
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/self-order')} className="flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Self-Order
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2">
          <MonitorIcon className="w-4 h-4" />
          Dashboard Nou
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/monitor')} className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Monitorizare Comenzi
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
