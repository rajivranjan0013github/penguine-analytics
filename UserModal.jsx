import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Crown, 
  Smartphone, 
  Heart, 
  X,
  Activity,
  MessageSquare,
  Gamepad2,
  Clock,
  Loader2
} from 'lucide-react';

import { fetchUserDetails } from './api';

const UserModal = ({ userId, onClose }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedActivity, setExpandedActivity] = useState(null);

    useEffect(() => {
        const handleFetchUserDetails = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const data = await fetchUserDetails(userId);
                setUser(data);
            } catch (err) {
                console.error('Failed to fetch user details:', err);
            } finally {
                setLoading(false);
            }
        };
        handleFetchUserDetails();
    }, [userId]);

    const timeAgo = (date) => {
        if (!date) return 'Never';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return new Date(date).toLocaleDateString();
    };

    if (!userId) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md bg-black/90 animate-in fade-in duration-500"
            onClick={onClose}
        >
            <div 
                className="bg-[#111111] w-full h-full md:h-screen flex flex-col animate-in slide-in-from-bottom duration-500 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Close */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-10 active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Fetching Intel...</p>
                        </div>
                    ) : user ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                {/* Side Profile */}
                                <div className="space-y-6">
                                    <div className="bg-[#242424] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                                        <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                            <UserIcon className="w-32 h-32" />
                                        </div>
                                        <div className="relative flex flex-col items-center text-center">
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-500/20 mb-4 border-b-4 border-black/20">
                                                {user.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <h2 className="text-xl font-black text-white tracking-tight leading-tight">{user.name || 'Anonymous'}</h2>
                                            <p className="text-white/40 text-[11px] font-bold mt-1 break-all uppercase tracking-wider">{user.email}</p>
                                        </div>

                                        <div className="mt-8 space-y-3 pt-3">
                                            <div className="flex flex-col gap-2">
                                                {user.isPremium && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                        <Crown className="w-3.5 h-3.5" /> Premium
                                                    </div>
                                                )}
                                                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border ${
                                                    user.platform === 'ios' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                    <Smartphone className="w-3.5 h-3.5" /> {user.platform || 'Unknown'}
                                                </div>
                                            </div>
                                            
                                            <div className="pt-4 border-t border-white/5 space-y-2">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-white/30 font-bold uppercase tracking-wider">Joined</span>
                                                    <span className="text-white font-black">{new Date(user.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Partner Details */}
                                    {user.partnerData ? (
                                        <div className="bg-rose-500/5 p-8 rounded-[2rem] border border-rose-500/10 relative overflow-hidden animate-in fade-in slide-in-from-left duration-700">
                                            <div className="absolute -top-4 -right-4 opacity-5 text-rose-500">
                                                <Heart className="w-32 h-32" />
                                            </div>
                                            <div className="relative">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500">
                                                        <Heart className="w-4 h-4" />
                                                    </div>
                                                    <h3 className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Linked Intelligence</h3>
                                                </div>
                                                
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-rose-500/20 mb-3 border-b-4 border-black/20">
                                                        {user.partnerData.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <h2 className="text-lg font-black text-white tracking-tight leading-tight">{user.partnerData.name || 'Partner Account'}</h2>
                                                    <p className="text-white/40 text-[10px] font-bold mt-1 break-all uppercase tracking-wider">{user.partnerData.email}</p>
                                                    
                                                    <div className="mt-4 flex gap-2 w-full justify-center">
                                                        <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md text-[9px] font-black text-rose-500 uppercase tracking-widest">Paired</span>
                                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-black text-white/40 uppercase tracking-widest">{user.partnerData.platform || 'Unknown'} Status</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center opacity-40">
                                            <Heart className="w-8 h-8 text-white/10 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">No Active Link</p>
                                        </div>
                                    )}

                                    <div className="bg-[#242424] p-6 rounded-[2rem] border border-white/5 grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Engagements</p>
                                            <p className="text-2xl font-black text-indigo-500 leading-none">{user.activities?.answers?.length || 0}</p>
                                        </div>
                                        <div className="text-center ml-2">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Sessions</p>
                                            <p className="text-2xl font-black text-purple-500 leading-none">{user.activities?.games?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Feed Column */}
                                <div className="md:col-span-2 space-y-6 flex flex-col">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-white/40" />
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Activity Intelligence</h3>
                                    </div>
                                    
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                        {(!user.activities?.answers?.length && !user.activities?.games?.length) ? (
                                            <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/5">
                                                <p className="text-white/20 font-bold text-sm italic">Ghost status. No activities yet.</p>
                                            </div>
                                        ) : (
                                            (() => {
                                                const allActivities = [...(user.activities?.answers || []), ...(user.activities?.games || [])];
                                                const grouped = allActivities.reduce((acc, act) => {
                                                    const cat = act.type || 'Generic Activity';
                                                    if (!acc[cat]) acc[cat] = [];
                                                    acc[cat].push(act);
                                                    return acc;
                                                }, {});

                                                return Object.entries(grouped).map(([category, items], idx) => (
                                                    <div key={idx} className="space-y-3">
                                                        {/* Category Header */}
                                                        <div 
                                                            onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                                            className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group/cat ${
                                                                expandedCategory === category 
                                                                    ? 'bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                                                                    : 'bg-[#242424] border-white/5 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-2.5 rounded-2xl ${
                                                                    category === 'Answer Session' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'
                                                                }`}>
                                                                    {category === 'Answer Session' ? <MessageSquare className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{category}</h4>
                                                                    <p className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest">{items.length} Volume Record</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                                    {category === 'TicTacToe' ? `Total Matches: ${items.length}` : 'Click to Audit'}
                                                                </div>
                                                                <Activity className={`w-4 h-4 text-white/10 group-hover/cat:text-white/30 transition-all ${expandedCategory === category ? 'rotate-180 text-indigo-500/50' : ''}`} />
                                                            </div>
                                                        </div>

                                                        {/* Expanded Items */}
                                                        {expandedCategory === category && (
                                                            <div className="pl-6 space-y-3 border-l-2 border-indigo-500/20 ml-8 animate-in slide-in-from-top-4 duration-300">
                                                                {items
                                                                    .sort((a, b) => new Date(b.createdAt || b.completedAt || b.answeredAt || b.solvedAt) - new Date(a.createdAt || a.completedAt || a.answeredAt || a.solvedAt))
                                                                    .map((activity, sidx) => (
                                                                        <div 
                                                                            key={sidx} 
                                                                            onClick={() => activity.type === 'Answer Session' ? setExpandedActivity(expandedActivity === `${category}-${sidx}` ? null : `${category}-${sidx}`) : null}
                                                                            className={`bg-[#242424]/50 border border-white/5 p-4 rounded-2xl transition-all ${
                                                                                activity.type === 'Answer Session' ? 'cursor-pointer hover:border-white/10' : ''
                                                                            } ${expandedActivity === `${category}-${sidx}` ? 'ring-2 ring-indigo-500/30' : ''}`}
                                                                        >
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                {activity.questionCategory && (
                                                                                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border border-white/5">
                                                                                        {activity.questionCategory}
                                                                                    </span>
                                                                                )}
                                                                                <span className="text-[9px] text-white/20 font-black uppercase tracking-wider ml-auto">
                                                                                    {timeAgo(activity.createdAt || activity.completedAt || activity.answeredAt)}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-col gap-1">
                                                                                <p className={`text-[11px] font-bold leading-tight ${activity.type === 'Answer Session' ? 'text-indigo-400' : 'text-purple-400'}`}>
                                                                                    {activity.text || activity.questionText}
                                                                                </p>
                                                                                {activity.type === 'Answer Session' && (
                                                                                    <p className="text-[10px] text-white/50 leading-relaxed italic border-l border-white/10 pl-2 mt-1">
                                                                                        "{activity.answer || activity.content || 'No content'}"
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            {expandedActivity === `${category}-${sidx}` && activity.messages && (
                                                                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                                                    {activity.messages.map((m, midx) => (
                                                                                        <div key={midx} className={`flex flex-col ${m.senderId.toString() === userId.toString() ? 'items-end' : 'items-start'}`}>
                                                                                            <div className={`max-w-[90%] p-2.5 rounded-xl text-[10px] font-medium leading-relaxed ${
                                                                                                m.senderId.toString() === userId.toString() 
                                                                                                    ? 'bg-indigo-500 text-white rounded-tr-none' 
                                                                                                    : 'bg-white/5 text-white/70 rounded-tl-none border border-white/5'
                                                                                            }`}>
                                                                                                {m.content}
                                                                                            </div>
                                                                                            <p className="text-[8px] text-white/20 font-bold mt-0.5 uppercase tracking-tighter">
                                                                                                {m.senderId.toString() === userId.toString() ? 'User' : 'Partner'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            </p>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ));
                                            })()
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-24 text-center">
                            <p className="text-white font-bold">Signal lost. Could not load user intel.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserModal;
