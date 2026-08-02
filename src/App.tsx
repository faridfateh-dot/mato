import React, { useState } from 'react';
import { HashRouter, useLocation, useNavigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/Header';
import { Sidebar, ViewType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { SuppliersView } from './components/SuppliersView';
import { ExpensesView } from './components/ExpensesView';
import { RecipesView } from './components/RecipesView';
import { PosView } from './components/PosView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { AIChatView } from './components/AIChatView';
import { UsersSettingsView } from './components/UsersSettingsView';
import { SoftwareSalesView } from './components/SoftwareSalesView';
import { AuthGate } from './components/AuthGate';
import { AnnualLicenseLock } from './components/AnnualLicenseLock';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppMainContent: React.FC = () => {
  const { isAuthenticated, isLicenseExpired } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [recipeProductTargetId, setRecipeProductTargetId] = useState<string | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Derive current view from hash location pathname
  const pathSegment = location.pathname.replace(/^\//, '');
  const validViews: ViewType[] = [
    'dashboard', 'pos', 'products', 'inventory', 
    'suppliers', 'expenses', 'recipes', 'logs', 
    'ai', 'users', 'saas'
  ];
  
  const currentView: ViewType = validViews.includes(pathSegment as ViewType) 
    ? (pathSegment as ViewType) 
    : 'dashboard';

  const setCurrentView = (view: ViewType) => {
    navigate('/' + (view === 'dashboard' ? '' : view));
  };

  const handleNavigateRecipeForProduct = (productId: string) => {
    setRecipeProductTargetId(productId);
    setCurrentView('recipes');
  };

  // Mandatory login / register screen on initial open if not authenticated
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  // Lock system if 1-year annual activation subscription has expired
  if (isLicenseExpired) {
    return <AnnualLicenseLock />;
  }

  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigateView={setCurrentView} />;
      case 'pos':
        return <PosView />;
      case 'products':
        return (
          <ProductsView
            onNavigateRecipeForProduct={handleNavigateRecipeForProduct}
          />
        );
      case 'inventory':
        return <InventoryView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'recipes':
        return <RecipesView initialProductId={recipeProductTargetId} />;
      case 'logs':
        return <ActivityLogsView />;
      case 'ai':
        return <AIChatView />;
      case 'users':
        return <UsersSettingsView />;
      case 'saas':
        return <SoftwareSalesView />;
      default:
        return <DashboardView onNavigateView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col dir-rtl text-right">
      
      {/* Global Top Navbar */}
      <Header
        onOpenAiChat={() => setCurrentView('ai')}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main App Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-visible min-h-0">
        
        {/* Navigation Sidebar */}
        <Sidebar currentView={currentView} onSelectView={setCurrentView} />

        {/* View Main Work Area */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-32 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderMainView()}
        </main>

      </div>

      {/* Optional Auth Switcher Modal */}
      {showAuthModal && (
        <AuthGate isModalMode onClose={() => setShowAuthModal(false)} />
      )}

    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <DataProvider>
          <AppMainContent />
        </DataProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
