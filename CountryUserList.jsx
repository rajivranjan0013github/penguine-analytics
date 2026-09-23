import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Users as UsersIcon,
  Crown,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Heart
} from 'lucide-react';
import { fetchUsers } from './api';
import { countryNameToFlag } from './countryMapper.js';
import UserModal from './UserModal.jsx';

const timeAgo = (dateString) => {
  if (!dateString) return 'Never';
  const now = new Date();
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Never';
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const now = new Date();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const CountryUserList = ({ countryName: propCountryName, navigate, onUserClick }) => {
  const routeMatch = typeof window !== 'undefined'
    ? window.location.pathname.match(/^\/global-reach\/country\/(.+)$/)
    : null;
  const countryName = decodeURIComponent(
    propCountryName || (routeMatch ? routeMatch[1].split('?')[0] : '')
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const limit = 15;

  const handleFetchCountryUsers = useCallback(async () => {
    if (!countryName) return;
    setLoading(true);
    try {
      const data = await fetchUsers(page, limit, activeSearch, countryName);
      setUsers(data.users || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.pagination?.total || 0) / limit) || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch country users:', err);
    } finally {
      setLoading(false);
    }
  }, [countryName, page, activeSearch]);

  useEffect(() => {
    handleFetchCountryUsers();
  }, [handleFetchCountryUsers]);

  const handleBack = () => {
    if (navigate) {
      navigate('/global-reach');
    } else {
      window.history.pushState({}, '', '/global-reach');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(search);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setActiveSearch('');
    setPage(1);
  };

  const flag = countryNameToFlag[countryName]
    || (users[0]?.flag && users[0]?.flag !== '🌐' ? users[0]?.flag : '🌐');

  const totalAndroid = stats ? stats.android : users.filter((u) => u.platform === 'android').length;
  const totaliOS = stats ? stats.ios : users.filter((u) => u.platform === 'ios').length;
  const totalPremium = stats ? stats.premium : users.filter((u) => u.isPremium).length;
  const totalPremiumAndroid = stats ? stats.premiumAndroid : users.filter((u) => u.isPremium && u.platform === 'android').length;
  const totalPremiumIos = stats ? stats.premiumIos : users.filter((u) => u.isPremium && u.platform === 'ios').length;

  const androidPct = total > 0 ? ((totalAndroid / total) * 100).toFixed(1) : '0';
  const iosPct = total > 0 ? ((totaliOS / total) * 100).toFixed(1) : '0';
  const premAndroidPct = totalPremium > 0 ? ((totalPremiumAndroid / totalPremium) * 100).toFixed(1) : '0';
  const premIosPct = totalPremium > 0 ? ((totalPremiumIos / totalPremium) * 100).toFixed(1) : '0';
  const convRate = total > 0 ? ((totalPremium / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar matching analytics-front */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            title="Back to Demography"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{flag}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {countryName} Users
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                  {total.toLocaleString()} Registered
                </span>
              </h2>
              <p className="text-xs text-slate-400">Demography breakdown for {countryName}</p>
            </div>
          </div>
        </div>

        {/* Search Input matching analytics-front */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Summary Stat Cards for Country matching analytics-front */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold mb-0.5">Total Registered</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-800">{total.toLocaleString()}</h3>
              <div className="text-xs font-semibold bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-2">
                <span className="text-emerald-600 font-bold">Android: {totalAndroid.toLocaleString()} ({androidPct}%)</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-600 font-bold">iOS: {totaliOS.toLocaleString()} ({iosPct}%)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Platform breakdown for {countryName}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white">
            <UsersIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Premium Subscribers */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold mb-0.5">Premium Subscribers</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                {totalPremium.toLocaleString()}
              </h3>
              <div className="text-xs font-semibold bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-lg flex items-center gap-2">
                <span className="text-emerald-700 font-bold">Android: {totalPremiumAndroid.toLocaleString()} ({premAndroidPct}%)</span>
                <span className="text-amber-300">•</span>
                <span className="text-blue-700 font-bold">iOS: {totalPremiumIos.toLocaleString()} ({premIosPct}%)</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              {convRate}% country conversion rate
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500 text-white">
            <Crown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Card matching analytics-front */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading {countryName} user list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No users found from {countryName}{activeSearch ? ` matching "${activeSearch}"` : ''}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Platform</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Couple Status</th>
                  <th className="text-left py-3 px-4">Last Active</th>
                  <th className="text-left py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelected = selectedUserId === user._id;
                  return (
                    <tr
                      key={user._id}
                      onClick={() => {
                        if (onUserClick) {
                          onUserClick(user._id);
                        } else {
                          setSelectedUserId(user._id);
                        }
                      }}
                      className={`border-b transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-200'
                          : 'border-slate-50 hover:bg-indigo-50/60'
                      }`}
                    >
                      {/* User Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || 'User'}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 items-center justify-center text-xs font-bold"
                            style={{ display: user.avatar ? 'none' : 'flex' }}
                          >
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{user.name || 'Anonymous'}</span>
                        </div>
                      </td>

                      {/* Platform Column */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                            user.platform === 'android'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {user.platform === 'android' ? 'Android' : (user.platform === 'ios' ? 'iOS' : 'Other')}
                        </span>
                      </td>

                      {/* Premium Status */}
                      <td className="py-3 px-4">
                        {user.isPremium ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Premium
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Free</span>
                        )}
                      </td>

                      {/* Couple Status */}
                      <td className="py-3 px-4">
                        {user.partnerId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> Connected
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Unpaired</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-4 text-xs font-medium text-slate-500 tabular-nums">
                        {user.lastSeen ? timeAgo(user.lastSeen) : 'Never'}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium tabular-nums" title={user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}>
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination matching analytics-front */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{total > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-700">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-slate-700">{total.toLocaleString()}</span> users (15 per page)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default CountryUserList;
