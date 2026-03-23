import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, Settings, LogOut, Gamepad2, Heart, Shield } from 'lucide-react';
import Dashboard from './Dashboard.jsx';
import Users from './Users.jsx';
import { verifyCredentials } from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('admin_id') && !!localStorage.getItem('admin_password')
  );
  const [adminIdInput, setAdminIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const navClass = ({ isActive }) => 
    `px-4 py-2 flex items-center gap-2 text-sm font-bold transition-all rounded-xl ${
      isActive 
        ? 'bg-indigo-600/10 text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] border border-indigo-500/20' 
        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('App: Received admin-unauthorized event');
      setIsAuthenticated(false);
      setAuthError(true);
    };
    window.addEventListener('admin-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('admin-unauthorized', handleUnauthorized);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminIdInput.trim() || !passwordInput.trim()) return;

    setVerifying(true);
    setAuthError(false);

    const isValid = await verifyCredentials(adminIdInput, passwordInput);

    if (isValid) {
      localStorage.setItem('admin_id', adminIdInput);
      localStorage.setItem('admin_password', passwordInput);
      setIsAuthenticated(true);
    } else {
      setAuthError(true);
    }
    setVerifying(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_id');
    localStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] font-sans p-4">
        <div className="w-full max-w-md bg-[#252525] rounded-3xl shadow-2xl border border-white/5 overflow-hidden p-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20 rotate-3 hover:rotate-0 transition-transform">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Access Gate</h1>
            <p className="text-white/40 font-medium">Please enter the admin credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Admin ID</label>
                <input
                  type="text"
                  placeholder="admin-identifier"
                  value={adminIdInput}
                  onChange={(e) => setAdminIdInput(e.target.value)}
                  className={`w-full bg-[#1a1a1a] border ${authError ? 'border-rose-500 ring-rose-500/10' : 'border-white/5 focus:border-indigo-500 ring-indigo-500/10'} rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-4 transition-all placeholder:text-white/10`}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Security Key</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full bg-[#1a1a1a] border ${authError ? 'border-rose-500 ring-rose-500/10' : 'border-white/5 focus:border-indigo-500 ring-indigo-500/10'} rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-4 transition-all placeholder:text-white/10`}
                />
              </div>

              {authError && (
                <p className="text-rose-500 text-xs font-bold mt-2 text-center animate-bounce">
                  Verification failed. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {verifying ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authorizing...
                </>
              ) : (
                'Verify & Enter'
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
            Protected Environment &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] selection:bg-indigo-500/30">
      {/* Premium Navbar */}
      <nav className="border-b border-white/5 bg-[#1a1a1a]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all active:scale-95 group">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Penguine <span className="text-indigo-400">Analytics</span></span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-1 bg-[#252525] p-1 rounded-2xl border border-white/5">
              <NavLink to="/" className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink to="/users" className={navClass}>
                <UsersIcon className="w-4 h-4" />
                Users
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                <Settings className="w-4 h-4" />
                Settings
              </NavLink>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all group scale-90 md:scale-100"
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route 
          path="/settings" 
          element={
            <div className="max-w-7xl mx-auto p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Settings Page</h2>
              <p className="text-white/40">Routing is now implemented! This page is a placeholder.</p>
              <Link to="/" className="mt-8 inline-block text-indigo-400 font-bold hover:underline">← Back to Dashboard</Link>
            </div>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
