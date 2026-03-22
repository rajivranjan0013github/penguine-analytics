import { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Crown,
  Calendar,
  X
} from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const limit = 10;

    useEffect(() => {
        fetchUsers();
    }, [page, activeSearch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = `/api/analytics/users?page=${page}&limit=${limit}&search=${encodeURIComponent(activeSearch)}`;
            const res = await fetch(url);
            const data = await res.json();
            setUsers(data.users || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalUsers(data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

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
        const now = new Date();
        const date = new Date(dateString);
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

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <UsersIcon className="w-8 h-8 text-indigo-500" />
                        User Management
                    </h1>
                    <p className="text-white/40 mt-1 font-medium">
                        {totalUsers} registered users found in the system
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="relative group w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#2a2a2a] border border-white/5 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-white/30"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">User Profile</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Email</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Partner Code</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: limit }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-white/5 rounded w-full"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    {user.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-semibold text-white/90">{user.name || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/50">{user.email || 'No email provided'}</td>
                                        <td className="px-6 py-4">
                                            {user.isPremium ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    <Crown className="w-3 h-3" />
                                                    Premium
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-white/40 border border-white/5">
                                                    Free Tier
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/50">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {timeAgo(user.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 font-mono">
                                                {user.partnerCode || '---'}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-white/20 italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination bar */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/5 flex items-center justify-between">
                    <p className="text-sm text-white/40">
                        Page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-30 transition-all text-white/60"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).slice(Math.max(0, page - 3), page + 2).map((_, i) => {
                                const pageNum = i + Math.max(1, page - 2);
                                if (pageNum > totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                            page === pageNum 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                                : 'text-white/40 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-30 transition-all text-white/60"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Users;
