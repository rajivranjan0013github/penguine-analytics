import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  User as UserIcon, 
  Crown, 
  Smartphone, 
  Heart, 
  X,
  Activity,
  MessageSquare,
  Gamepad2,
  Loader2,
  Copy,
  Check,
  Flame,
  Trophy,
  Calendar,
  Sparkles,
  Smile,
  Camera,
  Puzzle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  HelpCircle,
  Award
} from 'lucide-react';

import { fetchUserDetails } from './api';
import { getUserCountry } from './countryMapper.js';

const UserModal = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('all');
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Fetch user details on userId change
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const handleFetchUserDetails = async () => {
      setLoading(true);
      try {
        const data = await fetchUserDetails(userId);
        if (isMounted) setUser(data);
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    handleFetchUserDetails();
    return () => { isMounted = false; };
  }, [userId]);

  // Keyboard Escape listener & body scroll lock
  useEffect(() => {
    if (!userId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [userId, onClose]);

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Human-readable relative time
  const timeAgo = (date) => {
    if (!date) return 'Never';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Never';
    const seconds = Math.floor((new Date() - parsed) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Combine and normalize activities for chronological rendering
  const combinedActivities = useMemo(() => {
    if (!user) return [];
    const list = [];
    (user.activities?.answers || []).forEach((a, idx) => {
      list.push({
        ...a,
        _id: a._id || `ans-${idx}`,
        _filterCat: 'answers',
        _time: new Date(a.createdAt || a.completedAt || a.answeredAt || 0)
      });
    });
    (user.activities?.games || []).forEach((g, idx) => {
      const isMoodOrMemory = g.type === 'Mood Update' || g.type === 'Memory';
      list.push({
        ...g,
        _id: g._id || `game-${idx}`,
        _filterCat: isMoodOrMemory ? 'moods' : 'games',
        _time: new Date(g.createdAt || g.completedAt || g.answeredAt || g.solvedAt || g.updatedAt || 0)
      });
    });
    return list.sort((a, b) => b._time - a._time);
  }, [user]);

  // Filter activities based on tab
  const filteredActivities = useMemo(() => {
    if (activeFilterTab === 'all') return combinedActivities;
    return combinedActivities.filter((item) => item._filterCat === activeFilterTab);
  }, [combinedActivities, activeFilterTab]);

  const activityCounts = useMemo(() => {
    const all = combinedActivities.length;
    const answers = combinedActivities.filter(a => a._filterCat === 'answers').length;
    const games = combinedActivities.filter(a => a._filterCat === 'games').length;
    const moods = combinedActivities.filter(a => a._filterCat === 'moods').length;
    return { all, answers, games, moods };
  }, [combinedActivities]);

  // Calculate paired days if partner connected
  const pairedDays = useMemo(() => {
    if (!user?.partnerData) return null;
    const connDate = user.couple?.connectionDate || user.connectionDate || user.partnerData.createdAt;
    if (!connDate) return null;
    const days = Math.floor((new Date() - new Date(connDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }, [user]);

  // Is user recently active (under 30 minutes)
  const isRecentlyActive = useMemo(() => {
    if (!user?.lastSeen) return false;
    const diffMs = new Date() - new Date(user.lastSeen);
    return diffMs < 30 * 60 * 1000;
  }, [user]);

  if (!userId) return null;

  const countryInfo = user ? getUserCountry(user) : { flag: '🌐', country: 'Unknown' };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden text-slate-800"
    >
      {/* Floating Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all z-30 cursor-pointer shadow-sm border border-slate-200/80 active:scale-95"
        title="Close (Esc)"
        aria-label="Close user details"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Full-Screen Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pt-6 sm:pt-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-3">
              <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
              <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                Loading User Intelligence...
              </p>
            </div>
          ) : user ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Profile Card, Partner Info & KPI Totals */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                
                {/* Primary Identity Card */}
                <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  {/* Top ID & Status row */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                    <button
                      onClick={() => handleCopy(user?._id || userId, 'id')}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/70 rounded-lg text-xs font-mono text-slate-600 border border-slate-200/70 transition-colors cursor-pointer group"
                      title="Click to copy User ID"
                    >
                      <span>#{(user?._id || userId).substring(0, 14)}</span>
                      {copiedKey === 'id' ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-3 h-3 text-emerald-600" /> Copied
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      )}
                    </button>

                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      isRecentlyActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        : 'bg-slate-100 text-slate-600 border-slate-200/60'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isRecentlyActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isRecentlyActive ? 'Active now' : `Active ${timeAgo(user.lastSeen)}`}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white items-center justify-center text-xl font-bold shadow-md shadow-indigo-500/20"
                        style={{ display: user.avatar ? 'none' : 'flex' }}
                      >
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      {/* Platform pill overlaid on avatar */}
                      <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-0.5 ${
                        user.platform === 'android'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        <Smartphone className="w-2.5 h-2.5" />
                        {user.platform === 'android' ? 'Android' : user.platform === 'ios' ? 'iOS' : 'Other'}
                      </span>
                    </div>

                    {/* User Primary Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          {user.name || 'Anonymous User'}
                        </h2>
                        {user.nickname && (
                          <span className="text-xs text-slate-400 font-medium">({user.nickname})</span>
                        )}
                      </div>

                      {user.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                          <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {user.premiumPlan ? `${user.premiumPlan} Premium` : 'Premium Member'}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 mb-2">
                          Free Tier
                        </span>
                      )}

                      {/* Email with copy button */}
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs text-slate-500 font-mono truncate">{user.email || 'No email associated'}</p>
                        {user.email && (
                          <button
                            onClick={() => handleCopy(user.email, 'email')}
                            className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedKey === 'email' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Demographic & Meta Pills */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium flex items-center gap-1.5">
                      <span className="text-sm leading-none">{countryInfo.flag}</span>
                      <span>{countryInfo.country}</span>
                    </span>

                    {(user.age || user.gender) && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                        {user.gender ? `${user.gender}` : ''}
                        {user.gender && user.age ? ' • ' : ''}
                        {user.age ? `${user.age} yrs` : ''}
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                      {user.appVersion ? `v${user.appVersion}` : 'Unknown App'}
                      {user.appBuildNumber ? <span className="text-slate-400 font-mono text-[11px] ml-1">({user.appBuildNumber})</span> : ''}
                    </span>

                    {user.preferredLanguage && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium uppercase font-mono text-[11px]">
                        Lang: {user.preferredLanguage}
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>
                </section>

                {/* Linked Partner & Relationship Section */}
                <section className="bg-rose-50/50 rounded-2xl border border-rose-200/80 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      </div>
                      <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                        Relationship & Partner Link
                      </h3>
                    </div>
                    {pairedDays !== null && (
                      <span className="text-xs font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Paired {pairedDays} days
                      </span>
                    )}
                  </div>

                  {user.partnerData ? (
                    <div className="space-y-3.5">
                      {/* Partner Info Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-rose-100 flex items-center gap-3 shadow-2xs">
                        {user.partnerData.avatar ? (
                          <img
                            src={user.partnerData.avatar}
                            alt={user.partnerData.name || 'Partner'}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold border border-rose-200">
                            {user.partnerData.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {user.partnerData.name || 'Partner Account'}
                            </p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {user.partnerData.platform || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono truncate">{user.partnerData.email || 'No email'}</p>
                        </div>
                      </div>

                      {/* Streak Counters */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white p-3 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Streak</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                            <span className="text-lg font-bold text-rose-600 tabular-nums">
                              {user.streak?.current || 0}d
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Record</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-lg font-bold text-amber-600 tabular-nums">
                              {user.streak?.longest || 0}d
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/80 p-4 rounded-xl border border-dashed border-rose-200 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Heart className="w-4 h-4 text-slate-300" />
                      <span>Single Account • No active partner linked yet</span>
                    </div>
                  )}
                </section>

                {/* Engagement Metrics (6 KPI Grid) */}
                <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Lifetime Engagement
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Aggregated totals</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500">Conversations</span>
                        <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                          <MessageSquare className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {user.totals?.conversations || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500">Q&A Answers</span>
                        <span className="p-1 rounded-md bg-sky-50 text-sky-600">
                          <HelpCircle className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {user.totals?.questionAnswers || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500">Rituals Done</span>
                        <span className="p-1 rounded-md bg-rose-50 text-rose-600">
                          <Flame className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {user.totals?.completedRituals || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500">Games Won</span>
                        <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                          <Gamepad2 className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {user.totals?.completedGames || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500">Mood Updates</span>
                        <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                          <Smile className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {user.totals?.moodUpdates || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500">Memories</span>
                        <span className="p-1 rounded-md bg-purple-50 text-purple-600">
                          <Camera className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {user.totals?.memories || 0}
                      </p>
                    </div>
                  </div>
                </section>

              </div>

              {/* Right Column: Activity Intelligence Timeline Feed */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                
                {/* Section Header with Category Tabs */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Activity Intelligence Timeline
                    </h3>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
                    <button
                      onClick={() => setActiveFilterTab('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeFilterTab === 'all'
                          ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({activityCounts.all})
                    </button>
                    <button
                      onClick={() => setActiveFilterTab('answers')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeFilterTab === 'answers'
                          ? 'bg-white shadow-2xs text-indigo-700 font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Q&A ({activityCounts.answers})
                    </button>
                    <button
                      onClick={() => setActiveFilterTab('games')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeFilterTab === 'games'
                          ? 'bg-white shadow-2xs text-purple-700 font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Games ({activityCounts.games})
                    </button>
                    <button
                      onClick={() => setActiveFilterTab('moods')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeFilterTab === 'moods'
                          ? 'bg-white shadow-2xs text-emerald-700 font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Moods ({activityCounts.moods})
                    </button>
                  </div>
                </div>

                {/* Activity Feed List */}
                <div className="space-y-3">
                  {filteredActivities.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-xs">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm font-semibold">
                        No activity records found in this category
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Try selecting another tab or check back after the user interacts with the app.
                      </p>
                    </div>
                  ) : (
                    filteredActivities.map((act) => {
                      const isExpanded = expandedActivityId === act._id;
                      const hasMessages = Array.isArray(act.messages) && act.messages.length > 0;

                      // Badge styling by activity type
                      let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                      let icon = <Layers className="w-3.5 h-3.5" />;
                      if (act.type === 'Answer Session') {
                        badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                        icon = <MessageSquare className="w-3.5 h-3.5" />;
                      } else if (act.type === 'Question V2') {
                        badgeBg = 'bg-sky-50 text-sky-700 border-sky-200';
                        icon = <HelpCircle className="w-3.5 h-3.5" />;
                      } else if (act.type === 'Wordle') {
                        badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                        icon = <Sparkles className="w-3.5 h-3.5" />;
                      } else if (act.type === 'TicTacToe') {
                        badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                        icon = <Gamepad2 className="w-3.5 h-3.5" />;
                      } else if (act.type === 'Jigsaw') {
                        badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                        icon = <Puzzle className="w-3.5 h-3.5" />;
                      } else if (act.type === 'Daily Challenge') {
                        badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
                        icon = <Flame className="w-3.5 h-3.5" />;
                      } else if (act.type === 'Mood Update') {
                        badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        icon = <Smile className="w-3.5 h-3.5" />;
                      } else if (act.type === 'Memory') {
                        badgeBg = 'bg-violet-50 text-violet-700 border-violet-200';
                        icon = <Camera className="w-3.5 h-3.5" />;
                      }

                      return (
                        <div
                          key={act._id}
                          className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all ${
                            hasMessages ? 'cursor-pointer' : ''
                          }`}
                          onClick={() => {
                            if (hasMessages) {
                              setExpandedActivityId(isExpanded ? null : act._id);
                            }
                          }}
                        >
                          {/* Item Top Row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${badgeBg}`}>
                                {icon}
                                {act.type}
                              </span>
                              {act.questionCategory && (
                                <span className="text-xs font-semibold text-slate-600 truncate max-w-sm">
                                  {act.questionCategory}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-medium tabular-nums" title={act._time.toLocaleString()}>
                              {timeAgo(act._time)}
                            </span>
                          </div>

                          {/* Primary Content / Text */}
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {act.text || act.prompt || 'Activity recorded'}
                          </p>

                          {/* Answer Quote Block */}
                          {act.answer && (
                            <div className="mt-3 bg-slate-50 rounded-xl p-3.5 border-l-3 border-indigo-500 text-xs text-slate-700 leading-relaxed italic">
                              &ldquo;{act.answer}&rdquo;
                            </div>
                          )}

                          {/* Message count toggle chip */}
                          {hasMessages && (
                            <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                              <span className="font-semibold text-indigo-600">
                                {act.messages.length} message{act.messages.length === 1 ? '' : 's'} exchanged
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                {isExpanded ? 'Hide conversation thread' : 'View conversation thread'}
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                          )}

                          {/* Expandable Chat Conversation Thread */}
                          {isExpanded && hasMessages && (
                            <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
                              {act.messages.map((m, mIdx) => {
                                const isFromUser = m.senderId?.toString() === userId.toString();
                                return (
                                  <div
                                    key={mIdx}
                                    className={`flex flex-col ${isFromUser ? 'items-end' : 'items-start'}`}
                                  >
                                    <div
                                      className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                        isFromUser
                                          ? 'bg-indigo-600 text-white rounded-tr-none'
                                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80'
                                      }`}
                                    >
                                      {m.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium mt-1">
                                      {isFromUser ? user.name || 'User' : user.partnerData?.name || 'Partner'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-lg mx-auto">
              <p className="text-slate-600 font-semibold text-base mb-2">Could not load user profile details</p>
              <p className="text-slate-400 text-xs mb-6">The user record could not be retrieved from the server.</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Back to User List
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserModal;
