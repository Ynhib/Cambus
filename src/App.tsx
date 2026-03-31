import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import ReceptionPage from './pages/ReceptionPage';
import RecipesPage from './pages/RecipesPage';
import SettingsPage from './pages/SettingsPage';
import ProcurementPage from './pages/ProcurementPage';
import EndOfDayPage from './pages/EndOfDayPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'reception',
        element: <ReceptionPage />,
      },
      {
        path: 'stock',
        element: <StockPage />,
      },
      {
        path: 'recipes',
        element: <RecipesPage />,
      },
      {
        path: 'procurement',
        element: <ProcurementPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'eod',
        element: <EndOfDayPage />,
      },
    ],
  },
]);


function App() {
  return <RouterProvider router={router} />;
}

export default App;



