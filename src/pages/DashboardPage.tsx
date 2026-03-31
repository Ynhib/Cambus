import React from 'react';
import Dashboard from '../features/dashboard/components/Dashboard';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      {/* On passe une fonction qui redirige vers la page réception au lieu d'ouvrir une modale */}
      <Dashboard onOpenStock={() => navigate('/reception')} />
    </div>
  );
}
