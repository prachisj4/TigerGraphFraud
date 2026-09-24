import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Overview } from './pages/Overview';
import { Cases } from './pages/Cases';
import { Investigation } from './pages/Investigation';
import { GraphIntelligence } from './pages/GraphIntelligence';
import { History } from './pages/History';

const MainLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Overview';
    if (pathname.startsWith('/cases')) return 'Cases';
    if (pathname.startsWith('/investigation')) return 'Investigation Workspace';
    if (pathname.startsWith('/graph')) return 'Graph Intelligence';
    if (pathname.startsWith('/history')) return 'History';
    return 'Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar pageTitle={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/investigation/:caseId" element={<Investigation />} />
            <Route path="/graph" element={<GraphIntelligence />} />
            <Route path="/graph/:caseId" element={<GraphIntelligence />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;
