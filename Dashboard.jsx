import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Crown,
  Flame,
  Gamepad2,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchSummary } from './api';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e'];

const formatNumber = (value = 0) => new Intl.NumberFormat('en-IN', {
  notation: value > 9999 ? 'compact' : 'standard',
  maximumFractionDigits: 1,
}).format(value);

const titleCase = (value = '') => value
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, color = 'text-indigo-500' }) => (
  <div className="flex items-center gap-2">
    <Icon className={`w-5 h-5 ${color}`} />
    <div>
      <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 font-normal">{subtitle}</p>}
    </div>
  </div>
);

const StatsCard = ({ title, value, icon: Icon, trend, color, subText }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
    <div className="min-w-0 flex-1">
      <p className="text-slate-500 text-sm font-medium mb-1 truncate">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
            String(trend).startsWith('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}>
            {trend}
          </span>
        )}
      </div>
      {subText && (
        <p className="text-xs mt-1 text-slate-400 font-normal">{subText}</p>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  </div>
);

const Empty = ({ label = 'No data in this period' }) => (
  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">{label}</div>
);

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(28);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchSummary(timeRange));
    } catch (err) {
      if (err.message !== 'Unauthorized') setError('Analytics could not be loaded. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    load();
  }, [load]);

  const growthTrend = useMemo(() => (
    data?.trends?.userTrend?.map((item, index) => ({
      date: item.date,
      Users: item.count,
      Couples: data.trends.coupleTrend[index]?.count || 0,
      Unpaired: data.trends.unpairTrend[index]?.count || 0,
    })) || []
  ), [data]);

  const gameTrend = useMemo(() => (
    data?.trends?.gameTrends?.tictactoe?.map((item, index) => ({
      date: item.date,
      'Tic-Tac-Toe': item.count,
      Wordle: data.trends.gameTrends.wordle[index]?.count || 0,
      'Puzzles created': data.trends.gameTrends.jigsaw[index]?.count || 0,
    })) || []
  ), [data]);

  const platformPie = useMemo(() => {
    const totals = { iOS: 0, Android: 0, Unknown: 0 };
    (data?.splits?.platform || []).forEach((item) => {
      const platform = String(item.name || '').toLowerCase();
      if (platform === 'ios') totals.iOS += item.value || 0;
      else if (platform === 'android') totals.Android += item.value || 0;
      else totals.Unknown += item.value || 0;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Building the product picture…</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const rates = data?.rates || {};
  const rituals = data?.rituals || {};
  const maxWidgetInstalls = Math.max(...(data?.widgets || []).map((widget) => widget.installed || 0), 1);
  const maxFunnel = data?.funnel?.[0]?.value || 1;
  const ritualPie = [
    { name: 'Both completed', value: rituals.full || 0 },
    { name: 'One completed', value: rituals.half || 0 },
    { name: 'Neither', value: rituals.empty || 0 },
  ];
  const rangeUsers = metrics.rangeUsers ?? growthTrend.reduce((sum, d) => sum + (d.Users || 0), 0);
  const rangeCouples = metrics.rangeCouples ?? growthTrend.reduce((sum, d) => sum + (d.Couples || 0), 0);
  const rangePremiumUsers = metrics.rangePremiumUsers ?? 0;

  const journeySteps = [
    {
      step: 1,
      title: 'Account Created',
      shortDesc: 'New signups',
      value: metrics.totalUsers || data?.funnel?.[0]?.value || 0,
      icon: UserPlus,
      bgColor: 'bg-indigo-50 border-indigo-200 text-indigo-600',
      activeBg: 'bg-indigo-600 text-white',
      lineGradient: 'from-indigo-500 to-sky-500',
    },
    {
      step: 2,
      title: 'Nickname Added',
      shortDesc: 'Identity set',
      value: data?.onboarding?.usersWithNickname || data?.funnel?.[1]?.value || 0,
      icon: Sparkles,
      bgColor: 'bg-sky-50 border-sky-200 text-sky-600',
      activeBg: 'bg-sky-600 text-white',
      lineGradient: 'from-sky-500 to-purple-500',
    },
    {
      step: 3,
      title: 'Profile Photo',
      shortDesc: 'Avatar ready',
      value: data?.onboarding?.profileWithPhoto || data?.funnel?.[2]?.value || 0,
      icon: Camera,
      bgColor: 'bg-purple-50 border-purple-200 text-purple-600',
      activeBg: 'bg-purple-600 text-white',
      lineGradient: 'from-purple-500 to-rose-500',
    },
    {
      step: 4,
      title: 'Paired with Partner',
      shortDesc: 'Active & connected',
      value: data?.onboarding?.currentlyPaired ?? (data?.funnel?.[3]?.value || (metrics.activeCouples ? metrics.activeCouples * 2 : 0)),
      icon: Heart,
      bgColor: 'bg-rose-50 border-rose-200 text-rose-600',
      activeBg: 'bg-rose-600 text-white',
      lineGradient: 'from-rose-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Penguin Couple Analytics</h2>
          <p className="text-slate-500 text-sm">Monitoring couple activity cycles and feature adoption across {timeRange} days</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-indigo-500 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select
              aria-label="Analytics period"
              value={timeRange}
              onChange={(event) => setTimeRange(Number(event.target.value))}
              className="appearance-none bg-transparent pr-8 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={28}>Last 28 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          <button
            type="button"
            onClick={load}
            aria-label="Refresh analytics"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Core Top Stats Cards matching analytics-front */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={formatNumber(metrics.totalUsers)}
          trend={`+${formatNumber(rangeUsers)}`}
          icon={Users}
          color="bg-indigo-600"
        />
        <StatsCard
          title="Active Couples"
          value={formatNumber(metrics.activeCouples)}
          trend={`+${formatNumber(rangeCouples)}`}
          icon={Heart}
          color="bg-rose-500"
        />
        <StatsCard
          title="Daily Active Users"
          value={formatNumber(metrics.dau)}
          subText={`${formatNumber(metrics.wau || 0)} WAU · ${formatNumber(metrics.mau || 0)} MAU`}
          icon={Activity}
          color="bg-emerald-500"
        />
        <StatsCard
          title="Premium Users"
          value={formatNumber(metrics.premiumUsers)}
          trend={`+${formatNumber(rangePremiumUsers)}`}
          subText={`${rates.premium || 0}% of all users`}
          icon={Crown}
          color="bg-amber-500"
        />
      </div>

      {(() => {
        const totalUsers = rangeUsers;
        const totalCouples = rangeCouples;
        const avgUsers = growthTrend.length ? parseFloat((totalUsers / growthTrend.length).toFixed(1)) : 0;
        const avgCouples = growthTrend.length ? parseFloat((totalCouples / growthTrend.length).toFixed(1)) : 0;

        return (
          <Card className="p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
              <SectionTitle icon={TrendingUp} title="Acquisition &amp; Pairing" subtitle="New registrations, new couples and unpairs" />
              <div className="flex flex-wrap items-center gap-2">
                {avgUsers > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span>Avg Users:</span>
                    <span className="text-amber-800 font-extrabold">{avgUsers}/day</span>
                  </span>
                )}
                {avgCouples > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span>Avg Couples:</span>
                    <span className="text-rose-800 font-extrabold">{avgCouples}/day</span>
                  </span>
                )}
                <div className="hidden gap-3 text-xs font-bold uppercase sm:flex ml-2">
                  <span className="text-indigo-600">Users</span>
                  <span className="text-rose-500">Couples</span>
                  <span className="text-amber-500">Unpaired</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              {growthTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="couplesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val?.split('-')?.slice(2)?.join('/') || val}
                      minTickGap={timeRange > 30 ? 40 : 20}
                    />
                    <YAxis width={35} stroke="#94a3b8" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelClassName="font-bold text-slate-800 text-xs"
                    />
                    {avgUsers > 0 && (
                      <ReferenceLine y={avgUsers} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} />
                    )}
                    {avgCouples > 0 && (
                      <ReferenceLine y={avgCouples} stroke="#ec4899" strokeDasharray="4 4" strokeWidth={1.5} />
                    )}
                    <Area type="monotone" dataKey="Users" stroke="#6366f1" strokeWidth={2} fill="url(#usersFill)" />
                    <Area type="monotone" dataKey="Couples" stroke="#ec4899" strokeWidth={2} fill="url(#couplesFill)" />
                    <Area type="monotone" dataKey="Unpaired" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </Card>
        );
      })()}

      <Card className="p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <SectionTitle
            icon={Activity}
            title="Meaningful Product Activity"
            subtitle={data?.report?.engagementDefinition}
            color="text-emerald-600"
          />
          <div className="flex gap-5">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">Today actions</p>
              <p className="text-xl font-bold text-emerald-600">{formatNumber(metrics.todayEngagements)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">Game activity</p>
              <p className="text-xl font-bold text-amber-600">{formatNumber(metrics.todayGames)}</p>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.trends?.engagementTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val?.split('-')?.slice(2)?.join('/') || val}
                minTickGap={timeRange > 30 ? 40 : 20}
              />
              <YAxis width={35} stroke="#94a3b8" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const activity = payload[0].payload;
                  const rows = [
                    ['Messages', activity.messages, '#6366f1'],
                    ['Answers', activity.answers, '#0ea5e9'],
                    ['Mood updates', activity.moods, '#ec4899'],
                    ['Memories', activity.memories, '#8b5cf6'],
                    ['Scribble-active couples', activity.scribbles, '#f43f5e'],
                    ['Game activity', activity.games, '#f59e0b'],
                  ];
                  return (
                    <div className="min-w-52 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-500">{label}</span>
                        <span className="text-sm font-bold text-emerald-600">{formatNumber(activity.count)} total</span>
                      </div>
                      <div className="space-y-2">
                        {rows.map(([name, value, color]) => (
                          <div key={name} className="flex items-center justify-between gap-6 text-xs">
                            <span className="flex items-center gap-2 font-medium text-slate-600">
                              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                              {name}
                            </span>
                            <span className="font-bold text-slate-800">{formatNumber(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name="Actions" fill="#10b981" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Scribbles count couples whose latest saved canvas changed that day; overwritten Scribble history is not stored.
        </p>
      </Card>

      <Card className="p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <SectionTitle
            icon={UserCheck}
            title="Profile Setup & Activation Journey"
            subtitle="Stepwise delivery progress from registration to partner pairing"
            color="text-emerald-600"
          />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Activation Rate:</span>
              <span className="font-extrabold">{rates.pairing || 0}%</span>
            </span>
          </div>
        </div>

        {/* Desktop Delivery Stepper */}
        <div className="hidden md:flex items-start justify-between relative py-4 px-2">
          {journeySteps.map((item, index) => {
            const isLast = index === journeySteps.length - 1;
            const nextItem = journeySteps[index + 1];
            const nextHandoff = (!isLast && item.value > 0 && nextItem)
              ? Math.min(Math.round((nextItem.value / item.value) * 100), 100)
              : 0;
            const overallPct = journeySteps[0].value > 0
              ? Math.round((item.value / journeySteps[0].value) * 100)
              : 0;

            return (
              <div key={item.title} className="flex-1 flex items-start last:flex-none">
                {/* Node Milestone */}
                <div className="flex flex-col items-center text-center w-36 flex-shrink-0">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${item.bgColor}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs">
                      {item.step}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-bold text-slate-800 tracking-tight">{item.title}</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{formatNumber(item.value)}</p>

                  <span className={`mt-1.5 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    index === 0
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {index === 0 ? '100% baseline' : `${overallPct}% of signups`}
                  </span>
                </div>

                {/* Delivery Connector Line to next node */}
                {!isLast && (
                  <div className="flex-1 flex flex-col items-center pt-5 px-3 min-w-[70px]">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.lineGradient} transition-all duration-700`}
                        style={{ width: `${Math.max(nextHandoff, item.value ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-xs">
                      <span>{nextHandoff}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </span>
                    {item.value > nextItem.value && (
                      <span className="mt-1 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        -{formatNumber(item.value - nextItem.value)} drop
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Delivery Stepper (Vertical Timeline) */}
        <div className="md:hidden space-y-4 relative pl-6 border-l-2 border-slate-200 ml-4 my-2">
          {journeySteps.map((item, index) => {
            const isLast = index === journeySteps.length - 1;
            const nextItem = journeySteps[index + 1];
            const nextHandoff = (!isLast && item.value > 0 && nextItem)
              ? Math.min(Math.round((nextItem.value / item.value) * 100), 100)
              : 0;
            const overallPct = journeySteps[0].value > 0
              ? Math.round((item.value / journeySteps[0].value) * 100)
              : 0;

            return (
              <div key={item.title} className="relative">
                {/* Node Circle pinned on the vertical line */}
                <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center shadow-xs ${item.bgColor}`}>
                  <item.icon className="w-4 h-4" />
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.step}. {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.shortDesc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-slate-900">{formatNumber(item.value)}</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {index === 0 ? '100%' : `${overallPct}% total`}
                      </span>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Next step conversion:</span>
                      <span className="font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                        <span>{nextHandoff}%</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <SectionTitle icon={Heart} title="Daily Ritual Health" subtitle="Whether neither, one, or both partners completed the ritual" color="text-rose-500" />
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400">Avg. current streak</p>
            <p className="text-2xl font-bold text-rose-500">{rituals.averageCurrentStreak || 0}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div className="h-52">
            {ritualPie.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ritualPie} dataKey="value" innerRadius={54} outerRadius={78} paddingAngle={5}>
                    {ritualPie.map((item, index) => <Cell key={item.name} fill={['#10b981', '#f59e0b', '#cbd5e1'][index]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#1e293b', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
          <div className="space-y-3">
            {ritualPie.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: ['#10b981', '#f59e0b', '#cbd5e1'][index] }} />
                  <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatNumber(item.value)}</span>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{rituals.couplesWithActiveStreak || 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active streaks</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{rituals.longestStreak || 0}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Longest streak</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="p-6 xl:col-span-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <SectionTitle icon={Gamepad2} title="Game Activity" subtitle="Tic-Tac-Toe and Wordle completions; puzzles created" color="text-amber-500" />
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-600">
              {[
                ['Tic-Tac-Toe', '#f59e0b'],
                ['Wordle', '#8b5cf6'],
                ['Puzzles created', '#10b981'],
              ].map(([label, color]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gameTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val?.split('-')?.slice(2)?.join('/') || val}
                  minTickGap={timeRange > 30 ? 40 : 20}
                />
                <YAxis width={35} stroke="#94a3b8" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelClassName="font-bold text-slate-800 text-xs"
                />
                <Area type="monotone" dataKey="Tic-Tac-Toe" stackId="games" stroke="#f59e0b" fill="#f59e0b25" />
                <Area type="monotone" dataKey="Wordle" stackId="games" stroke="#8b5cf6" fill="#8b5cf625" />
                <Area type="monotone" dataKey="Puzzles created" stackId="games" stroke="#10b981" fill="#10b98125" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 xl:col-span-2">
          <SectionTitle icon={Flame} title="Feature Adoption" subtitle={`Persisted usage in the last ${timeRange} days`} color="text-orange-500" />
          <div className="mt-5 space-y-3">
            {(data?.featureAdoption || []).map((feature, index) => {
              const max = Math.max(...data.featureAdoption.map((item) => item.value), 1);
              return (
                <div key={feature.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{feature.name}</span>
                    <span className="font-bold text-slate-800">{formatNumber(feature.value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(feature.value / max) * 100}%`, background: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6">
          <SectionTitle icon={Smartphone} title="App Versions" subtitle="Top installed versions reported by devices" color="text-sky-500" />
          <div className="mt-5 divide-y divide-slate-100">
            {(data?.versions || []).slice(0, 7).map((version) => (
              <div key={`${version.platform}-${version.version}`} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-800">v{version.version}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{version.platform}</p>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatNumber(version.users)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle icon={Smartphone} title="Users by Platform" subtitle="All users grouped by stored device platform" color="text-indigo-500" />
          <div className="mt-4 h-44">
            {platformPie.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformPie} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={4}>
                    {platformPie.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.name === 'iOS' ? '#6366f1' : item.name === 'Android' ? '#10b981' : '#94a3b8'}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#1e293b', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty label="No platform data reported" />}
          </div>
          <div className="space-y-2">
            {platformPie.map((item) => {
              const total = platformPie.reduce((sum, platform) => sum + platform.value, 0);
              const percentageValue = total ? Math.round((item.value / total) * 1000) / 10 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: item.name === 'iOS' ? '#6366f1' : item.name === 'Android' ? '#10b981' : '#94a3b8' }}
                    />
                    {item.name}
                  </span>
                  <span className="font-bold text-slate-800">{formatNumber(item.value)} <span className="font-normal text-slate-400">· {percentageValue}%</span></span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle icon={CheckCircle2} title="Widget Adoption" subtitle="Device-reported installs and intent" color="text-emerald-500" />
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Location sharing</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-emerald-600/80">Successful server sync state</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ['Sharing enabled', data?.locationSharing?.sharingEnabled],
                ['Location received', data?.locationSharing?.everShared],
                [`Updated ${timeRange}d`, data?.locationSharing?.updatedInPeriod],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white border border-emerald-100 px-2 py-2 text-center">
                  <p className="text-base font-bold text-slate-800">{formatNumber(value)}</p>
                  <p className="mt-0.5 text-[8px] font-semibold leading-tight text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {(data?.widgets || []).map((widget) => (
              <div key={widget.name}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{titleCase(widget.name)}</span>
                  <span className="font-bold text-slate-800">
                    {formatNumber(widget.installed)} installed
                    {widget.name === 'distance' && <span className="font-normal text-slate-400"> · {formatNumber(widget.intent)} intent</span>}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(widget.installed / maxWidgetInstalls) * 100}%` }} />
                </div>
              </div>
            ))}
            {!data?.widgets?.length && <div className="h-32"><Empty label="No widget status reported" /></div>}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle icon={Crown} title="Subscription Health" subtitle="Current subscription lifecycle statuses" color="text-amber-500" />
          <div className="mt-4 h-44">
            {data?.splits?.subscriptions?.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.splits.subscriptions} dataKey="value" innerRadius={46} outerRadius={68} paddingAngle={4}>
                    {data.splits.subscriptions.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: '#1e293b', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty label="No subscription records" />}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {(data?.splits?.subscriptions || []).slice(0, 5).map((item, index) => (
              <span key={item.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                {titleCase(item.name)} <span className="font-bold text-slate-800">{item.value}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
