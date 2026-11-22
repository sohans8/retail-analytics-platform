import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const MainLayout = ({ children, activePage, onNavigate }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Navbar activePage={activePage} isSidebarCollapsed={isSidebarCollapsed} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        <footer className="h-12 border-t border-slate-200/80 bg-white px-6 flex items-center justify-between text-xs text-slate-500">
          <span>RetailPulse Enterprise Intelligence Platform • v1.1.0</span>
          <span>Powered by FastAPI, PostgreSQL, XGBoost & React</span>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
