import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import ErrorBoundary from './components/Shared/ErrorBoundary';

// Lazy load components
const Login = lazy(() => import('./components/Auth/Login'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const TallyCheck = lazy(() => import('./components/Tally/TallyCheck'));
const TicketList = lazy(() => import('./components/Tickets/TicketList'));
const TruckList = lazy(() => import('./components/QuanLy/TruckList'));
const CostTable = lazy(() => import('./components/BangKe/CostTable'));
const AdminPanel = lazy(() => import('./components/QuanLy/AdminPanel'));
const SettingsManager = lazy(() => import('./components/Settings/SettingsManager'));
const Navbar = lazy(() => import('./components/Shared/Navbar'));
const AIAssistant = lazy(() => import('./components/Assistant/AIAssistant'));

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center p-10">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-10 h-10 text-[#0f4c75] animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Đang tải hệ thống...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role && user?.role !== 'admin') return <Navigate to="/" />;
  
  return <>{children}</>;
};

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans transition-colors duration-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white dark:bg-slate-950">
                      <Navbar />
                      <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5 transition-colors duration-500 relative bg-zinc-50 dark:bg-black">
                        <Suspense fallback={<LoadingFallback />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/tally" element={<TallyCheck />} />
                            <Route path="/tickets" element={<TicketList />} />
                            <Route path="/trucks" element={<TruckList />} />
                            <Route path="/costs" element={<CostTable />} />
                            <Route path="/settings" element={<SettingsManager />} />
                            <Route 
                              path="/admin" 
                              element={
                                <ProtectedRoute role="admin">
                                  <AdminPanel />
                                </ProtectedRoute>
                              } 
                            />
                            <Route path="*" element={<Navigate to="/" />} />
                          </Routes>
                        </Suspense>
                      </main>
                      <AIAssistant />
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
