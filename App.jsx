import { lazy, Suspense, useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Globe2,
  Settings, 
  LogOut, 
  Shield,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Video,
  MessageSquare
} from 'lucide-react';
import { logout, verifyCredentials, verifySession } from './api';

const Dashboard = lazy(() => import('./Dashboard.jsx'));
const Users = lazy(() => import('./Users.jsx'));
const Demography = lazy(() => import('./Demography.jsx'));
const CountryUserList = lazy(() => import('./CountryUserList.jsx'));
const VideoCallHealth = lazy(() => import('./VideoCallHealth.jsx'));
const QuestionEngagement = lazy(() => import('./QuestionEngagement.jsx'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminIdInput, setAdminIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setAuthError(true);
    };
    window.addEventListener('admin-unauthorized', handleUnauthorized);
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    verifySession().then((valid) => {
      setIsAuthenticated(valid);
      setAuthChecking(false);
    });

    return () => {
      window.removeEventListener('admin-unauthorized', handleUnauthorized);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (destination) => {
    window.history.pushState({}, '', destination);
    setPathname(destination);
    setIsMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminIdInput.trim() || !passwordInput.trim()) return;

    setVerifying(true);
    setAuthError(false);

    const isValid = await verifyCredentials(adminIdInput, passwordInput);

    if (isValid) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      setAuthError(true);
    }
    setVerifying(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  if (authChecking) {
    return <div className="min-h-screen bg-slate-50" aria-label="Checking authentication" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20 rotate-3 hover:rotate-0 transition-transform">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Access Gate</h1>
            <p className="text-slate-500 font-medium">Please enter the admin credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin ID</label>
                <input
                  type="text"
                  placeholder="admin-identifier"
                  value={adminIdInput}
                  onChange={(e) => setAdminIdInput(e.target.value)}
                  className={`w-full bg-slate-50 border ${authError ? 'border-rose-500 ring-rose-500/10' : 'border-slate-200 focus:border-indigo-500 ring-indigo-500/10'} rounded-2xl px-5 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400`}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Key</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full bg-slate-50 border ${authError ? 'border-rose-500 ring-rose-500/10' : 'border-slate-200 focus:border-indigo-500 ring-indigo-500/10'} rounded-2xl px-5 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400`}
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
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
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

          <p className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Protected Environment &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Analytics Hub' },
    { path: '/users', icon: UsersIcon, label: 'User List' },
    { path: '/question-engagement', icon: MessageSquare, label: 'Questions' },
    { path: '/global-reach', icon: Globe2, label: 'Demography' },
    { path: '/call-health', icon: Video, label: 'Call Health' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row selection:bg-indigo-500/30 font-sans">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-white text-base tracking-tight">
            Penguin
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Navigation Drawer Backdrop & Menu (smooth slide in and out) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Slide-out Drawer */}
        <div
          className={`relative w-4/5 max-w-xs bg-slate-900 text-white h-full flex flex-col justify-between p-4 shadow-2xl z-10 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white tracking-tight">
                Penguin
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = item.path === '/global-reach'
                  ? pathname.startsWith('/global-reach')
                  : (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-semibold cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Collapsible Sidebar (matching analytics-front) */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-48'
        } bg-slate-900 text-white hidden lg:flex flex-col justify-between fixed h-full border-r border-slate-800 transition-all duration-300 ease-in-out overflow-x-hidden z-40`}
      >
        <div className="p-3">
          {/* Header Row */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-6 h-9 px-1`}>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap text-left ${
                isSidebarCollapsed
                  ? 'max-w-0 opacity-0 -translate-x-2'
                  : 'max-w-28 opacity-100 translate-x-0'
              }`}
            >
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                Penguin
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isSidebarCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-300 cursor-pointer flex-shrink-0"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === '/global-reach'
                ? pathname.startsWith('/global-reach')
                : (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`w-full flex items-center h-9 px-2 rounded-xl transition-all duration-200 cursor-pointer text-xs font-semibold ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                      isSidebarCollapsed
                        ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                        : 'max-w-28 opacity-100 translate-x-0 ml-2.5'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Bottom Action (Logout) */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Logout' : undefined}
            aria-label="Logout"
            className="w-full flex items-center h-9 px-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                isSidebarCollapsed
                  ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                  : 'max-w-28 opacity-100 translate-x-0 ml-2.5'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-48'
        } p-3 md:p-5 transition-all duration-300 ease-in-out min-w-0 bg-slate-50`}
      >
        <Suspense fallback={<div className="min-h-[calc(100vh-70px)] bg-slate-50" aria-label="Loading page" />}>
          {pathname === '/call-health' && <VideoCallHealth />}
          {pathname === '/question-engagement' && <QuestionEngagement />}
          {pathname === '/users' && <Users />}
          {pathname.startsWith('/global-reach/country/') && (
            <CountryUserList
              countryName={decodeURIComponent(pathname.replace(/^\/global-reach\/country\/?/, '').split('?')[0])}
              navigate={navigate}
            />
          )}
          {pathname === '/global-reach' && <Demography navigate={navigate} />}
          {pathname === '/settings' && (
            <div className="max-w-7xl mx-auto p-12 text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Settings Page</h2>
              <p className="text-slate-500">Settings will be available here.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-8 inline-block text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
          )}
          {!['/call-health', '/question-engagement', '/users', '/global-reach', '/settings'].includes(pathname) && !pathname.startsWith('/global-reach/country/') && <Dashboard />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
