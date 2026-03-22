import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, Settings } from 'lucide-react';
import Dashboard from './Dashboard.jsx';
import Users from './Users.jsx';

function App() {
  const navClass = ({ isActive }) => 
    `px-4 py-2 flex items-center gap-2 text-sm font-bold transition-all rounded-xl ${
      isActive 
        ? 'bg-indigo-600/10 text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] border border-indigo-500/20' 
        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

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
          
          <div className="flex gap-1 bg-[#252525] p-1 rounded-2xl border border-white/5">
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
