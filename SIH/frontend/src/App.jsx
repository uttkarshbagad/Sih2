import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { CommandCenter } from './pages/CommandCenter';
import { RiskMapPage } from './pages/RiskMapPage';
import { ForecastPage } from './pages/ForecastPage';
import { ClimateSignalsPage } from './pages/ClimateSignalsPage';
import { SoilScannerPage } from './pages/SoilScannerPage';
import { CropAdvisoryPage } from './pages/CropAdvisoryPage';
import { FarmerModePage } from './pages/FarmerModePage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { HistoricalPage } from './pages/HistoricalPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { AuthPage } from './pages/AuthPage';
import { WeatherBroadcastBanner } from './components/common/WeatherBroadcastBanner';

function AppContent() {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage />;
      case 'command-center':
      case 'alerts':
        return <CommandCenter />;
      case 'risk-map':
        return <RiskMapPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'climate-signals':
        return <ClimateSignalsPage />;
      case 'soil-scanner':
        return <SoilScannerPage />;
      case 'advisories':
        return <CropAdvisoryPage />;
      case 'farmer-mode':
        return <FarmerModePage />;
      case 'notifications':
        return <NotificationCenterPage />;
      case 'historical':
        return <HistoricalPage />;
      case 'explainability':
        return <ExplainabilityPage />;
      case 'system-status':
        return <SystemStatusPage />;
      case 'auth':
        return <AuthPage />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans max-w-full overflow-x-hidden">
      <WeatherBroadcastBanner />
      <Navbar />

      <div className="flex flex-1 overflow-hidden max-w-full">
        {/* Only show standard sidebar when NOT in full mobile Farmer Mode */}
        {activeTab !== 'farmer-mode' && <Sidebar />}

        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-slate-950 min-w-0">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
