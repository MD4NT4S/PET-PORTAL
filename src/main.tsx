import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StorageProvider } from './context/StorageContext';
import { MainLayout } from './components/layout/MainLayout';
import './index.css';

// Pages
// Pages (Lazy Load)
const Home = React.lazy(() => import('./pages/Home'));
const Ouvidoria = React.lazy(() => import('./pages/Ouvidoria'));
const Ajuda = React.lazy(() => import('./pages/Ajuda'));
const Autoavaliacao = React.lazy(() => import('./pages/Autoavaliacao'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Calendario = React.lazy(() => import('./pages/Calendario'));
const Conhecimento = React.lazy(() => import('./pages/Conhecimento'));
const Feedback = React.lazy(() => import('./pages/Feedback'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Login = React.lazy(() => import('./pages/Login'));
const MyRequests = React.lazy(() => import('./pages/MyRequests'));
const Infraestrutura = React.lazy(() => import('./pages/Infraestrutura'));

import { ErrorBoundary } from './components/ErrorBoundary';

// Loading Component
const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
  </div>
);

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <StorageProvider>
          <HashRouter>
            <React.Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="my-requests" element={<MyRequests />} />
                  <Route path="ouvidoria" element={<Ouvidoria />} />
                  <Route path="ajuda" element={<Ajuda />} />
                  <Route path="autoavaliacao" element={<Autoavaliacao />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="calendario" element={<Calendario />} />
                  <Route path="conhecimento" element={<Conhecimento />} />
                  <Route path="feedback" element={<Feedback />} />
                  <Route path="infraestrutura" element={<Infraestrutura />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
              </Routes>
            </React.Suspense>
            <Toaster richColors position="top-right" />
          </HashRouter>
        </StorageProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  console.error("Critical Application Crash:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Erro Crítico de Inicialização</h1>
      <p>O aplicativo falhou antes mesmo de carregar.</p>
      <pre style="background: #eee; padding: 10px;">${error instanceof Error ? error.message : String(error)}</pre>
      <br/>
      <button onclick="localStorage.clear(); window.location.reload();" style="padding: 10px;">Resetar Dados</button>
    </div>
  `;
}
