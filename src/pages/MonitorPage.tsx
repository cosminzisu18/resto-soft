import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrderMonitorDashboard from '@/components/OrderMonitorDashboard';

const MonitorPage: React.FC = () => {
  const navigate = useNavigate();
  return <OrderMonitorDashboard onBack={() => navigate('/')} />;
};

export default MonitorPage;
