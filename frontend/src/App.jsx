import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import SalesAnalytics from './pages/SalesAnalytics';
import Forecasting from './pages/Forecasting';
import StorePerformance from './pages/StorePerformance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedStoreForForecast, setSelectedStoreForForecast] = useState(1);

  const handleNavigate = (page, storeId = null) => {
    if (storeId) {
      setSelectedStoreForForecast(storeId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'analytics':
        return <SalesAnalytics />;
      case 'forecasting':
        return <Forecasting initialStoreId={selectedStoreForForecast} />;
      case 'stores':
        return (
          <StorePerformance
            onSelectStoreForForecast={(storeId) => handleNavigate('forecasting', storeId)}
          />
        );
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
