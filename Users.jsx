import { useCallback, useEffect, useState } from 'react';
import UserModal from './UserModal.jsx';
import { 
  List,
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Crown,
  X,
  Heart
} from 'lucide-react';

import { fetchUsers } from './api';
import { getUserCountry } from './countryMapper.js';

const Users = () => {
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const limit = 15;

    const handleFetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchUsers(page, limit, activeSearch);
            setUsers(data.users || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalUsers(data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [activeSearch, page]);

    useEffect(() => {
        handleFetchUsers();
    }, [handleFetchUsers]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setActiveSearch(search);
    };

    const clearSearch = () => {
        setSearch('');
        setActiveSearch('');
        setPage(1);
    };

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
        const diffInMs = now.getTime() - date.getTime();
        if (diffInMs >= 0 && diffInMs < 24 * 60 * 60 * 1000) {
            const diffInSeconds = Math.floor(diffInMs / 1000);
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInSeconds < 60) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            return `${diffInHours}h ago`;
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <List className="w-5 h-5 text-indigo-500" />
                            All Users
                        </h3>
                        <p className="text-xs text-slate-400 border-l border-slate-200 pl-2 ml-2">
                            {loading ? 'Loading...' : `${totalUsers} users`}
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Country</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Platform</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Connectivity</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Last Active</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-slate-50">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="py-3 px-4">
                                                <div className="h-4 bg-slate-100 rounded w-full"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : users.length > 0 ? (
                                users.map((user) => {
                                    const countryInfo = getUserCountry(user);
                                    const isSelected = selectedUserId === user._id;
                                    return (
                                    <tr 
                                        key={user._id} 
                                        onClick={() => setSelectedUserId(user._id)}
                                        className={`border-b transition-colors cursor-pointer ${
                                            isSelected 
                                                ? 'bg-indigo-50/70 border-indigo-200' 
                                                : 'border-slate-50 hover:bg-slate-50/80'
                                        }`}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name || 'User'}
                                                        className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-600 items-center justify-center text-xs font-bold border border-indigo-200/60"
                                                    style={{ display: user.avatar ? 'none' : 'flex' }}
                                                >
                                                    {user.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900 truncate">{user.name || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base leading-none">{countryInfo.flag}</span>
                                                <span className="text-xs font-medium text-slate-700">
                                                    {countryInfo.country}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                                user.platform === 'android' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                                            }`}>
                                                {user.platform === 'android' ? 'Android' : (user.platform === 'ios' ? 'iOS' : (user.platform || 'Other'))}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.isPremium ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" /> Premium
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Free</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.partnerId ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> Connected
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Unpaired</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-medium text-slate-500 tabular-nums">
                                            {user.lastSeen ? timeAgo(user.lastSeen) : 'Never'}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-medium text-slate-500 tabular-nums">
                                            {formatDate(user.createdAt)}
                                        </td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400 italic text-sm">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-bold text-slate-700">{(page - 1) * limit + 1}</span> to{' '}
                        <span className="font-bold text-slate-700">{Math.min(page * limit, totalUsers)}</span> of{' '}
                        <span className="font-bold text-slate-700">{totalUsers}</span> users
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                            page === pageNum
                                                ? 'bg-indigo-600 text-white'
                                                : 'hover:bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-600" />
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

export default Users;
