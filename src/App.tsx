import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import Home from './pages/Home';
import Room from './pages/Room';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './auth/AuthContext';
import SignIn from './auth/SignIn';

const basename = '/' + (window.location.pathname.split('/').filter(Boolean)[0] || '');

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!user) return <SignIn />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/room/:roomId" element={<RequireAuth><Room /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><RequireAdmin><Admin /></RequireAdmin></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
