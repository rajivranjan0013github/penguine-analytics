import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Crown,
  Flame,
  Gamepad2,
  Globe2,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Wifi,
  WifiOff,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchSummary } from './api';

const COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#38bdf8', '#f472b6'];

const formatNumber = (value = 0) => new Intl.NumberFormat('en-IN', {
  notation: value > 9999 ? 'compact' : 'standard',
  maximumFractionDigits: 1,
}).format(value);

const titleCase = (value = '') => value
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const shortDate = (value) => {
  if (!value) return '';
  const [, month, day] = value.split('-');
  return `${Number(day)}/${Number(month)}`;
};

const formatMilliseconds = (value = 0) => {
  if (!value) return '—';
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(1)} s`;
};

const Card = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-white/[0.07] bg-[#242424] shadow-xl shadow-black/10 ${className}`}>
    {children}
  </section>
);

const SectionTitle = ({ icon: Icon, title, subtitle, color = 'text-indigo-400' }) => (
  <div className="flex items-start gap-3">
    <div className="rounded-xl bg-white/[0.04] p-2">
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div>
      <h2 className="text-sm font-black tracking-tight text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[10px] font-medium text-white/70">{subtitle}</p>}
    </div>
  </div>
);

const MetricCard = ({ label, value, helper, icon: Icon, color }) => (
  <Card className="group p-5 transition-colors hover:border-white/15">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-white">{formatNumber(value)}</p>
        <p className="mt-1 text-[10px] font-medium text-white/70">{helper}</p>
      </div>
      <div className={`rounded-xl p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </Card>
);

const RateCard = ({ label, value, helper, color }) => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
    <div className="flex items-end justify-between gap-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-white">{label}</p>
      <p className="text-xl font-black text-white">{value || 0}%</p>
    </div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value || 0, 100)}%` }} />
    </div>
    <p className="mt-2 text-[9px] text-white/70">{helper}</p>
  </div>
);

const Empty = ({ label = 'No data in this period' }) => (
  <div className="flex h-full items-center justify-center text-xs font-semibold text-white/70">{label}</div>
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

  const callStatusPie = useMemo(() => (
    (data?.calls?.statuses || []).map((item) => ({
      ...item,
      label: titleCase(item.name),
    }))
  ), [data]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center gap-4 bg-[#191919]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-sm font-semibold text-white/70">Building the product picture…</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const rates = data?.rates || {};
  const rituals = data?.rituals || {};
  const maxWidgetInstalls = Math.max(...(data?.widgets || []).map((widget) => widget.installed || 0), 1);
  const questions = data?.questions || {};
  const calls = data?.calls || {};
  const countryData = data?.splits?.timezoneCountries || [];
  const countryTotal = countryData.reduce((sum, item) => sum + (item.value || 0), 0);
  const maxCountryUsers = Math.max(...countryData.map((item) => item.value || 0), 1);
  const maxFunnel = data?.funnel?.[0]?.value || 1;
  const ritualPie = [
    { name: 'Both completed', value: rituals.full || 0 },
    { name: 'One completed', value: rituals.half || 0 },
    { name: 'Neither', value: rituals.empty || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#191919] px-4 py-6 text-white md:px-8 md:py-8">
      <header className="mx-auto mb-7 flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Product intelligence
          </div>
          <h1 className="text-3xl font-black tracking-tight">What people do in Penguine</h1>
          <p className="mt-1 text-sm text-white/70">
            Activation, mutual engagement, feature adoption and product health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#242424] px-4 py-2.5">
            <Calendar className="h-4 w-4 text-white/30" />
            <select
              aria-label="Analytics period"
              value={timeRange}
              onChange={(event) => setTimeRange(Number(event.target.value))}
              className="min-w-32 cursor-pointer bg-transparent pr-6 text-xs font-bold text-white/75 outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <button
            type="button"
            onClick={load}
            aria-label="Refresh analytics"
            className="rounded-xl border border-white/[0.07] bg-[#242424] p-2.5 text-white/50 transition-colors hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total users" value={metrics.totalUsers} helper={`${metrics.mau || 0} active in 30 days`} icon={Users} color="bg-indigo-500/10 text-indigo-400" />
          <MetricCard label="Active couples" value={metrics.activeCouples} helper={`${rates.pairing || 0}% of users currently paired`} icon={Heart} color="bg-rose-500/10 text-rose-400" />
          <MetricCard label="Daily active users" value={metrics.dau} helper={`${metrics.wau || 0} WAU · ${metrics.mau || 0} MAU`} icon={Activity} color="bg-emerald-500/10 text-emerald-400" />
          <MetricCard label="Premium users" value={metrics.premiumUsers} helper={`${rates.premium || 0}% of all users`} icon={Crown} color="bg-amber-500/10 text-amber-400" />
        </div>

        <Card className="p-5">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <SectionTitle icon={TrendingUp} title="Product pulse" subtitle="The conversion rates that best describe product health" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">
              Updated from persisted app activity
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <RateCard label="Paired" value={rates.pairing} helper="Current paired users ÷ registrations" color="bg-rose-400" />
            <RateCard label="Profiles ready" value={rates.profileReady} helper="Users with nickname and profile photo ÷ registrations" color="bg-indigo-400" />
            <RateCard label="Mutual ritual" value={rates.mutualRitual} helper="Full hearts ÷ ritual days" color="bg-emerald-400" />
            <RateCard label="Question answer" value={rates.questionAnswer} helper="V2 answered ÷ seen" color="bg-sky-400" />
            <RateCard label="Set completion" value={rates.questionSetCompletion} helper="Completed V2 sets ÷ started sets" color="bg-purple-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <SectionTitle
              icon={Video}
              title="Video call health"
              subtitle="Calls grouped by call ID from client-reported WebRTC diagnostics"
              color="text-sky-400"
            />
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3 py-2 text-[9px] font-semibold text-amber-200/80">
              Diagnostics are retained for {calls.retentionDays || 30} days
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Reported attempts"
              value={calls.attempts}
              helper={`${calls.diagnosticReports || 0} participant diagnostic reports`}
              icon={Video}
              color="bg-indigo-500/10 text-indigo-400"
            />
            <MetricCard
              label="Connected calls"
              value={calls.connected}
              helper={`${calls.connectionRate || 0}% of reported attempts`}
              icon={Wifi}
              color="bg-sky-500/10 text-sky-400"
            />
            <MetricCard
              label="Successful communication"
              value={calls.successful}
              helper={`${calls.successRate || 0}% exchanged media in both directions`}
              icon={CheckCircle2}
              color="bg-emerald-500/10 text-emerald-400"
            />
            <MetricCard
              label="Not confirmed successful"
              value={calls.unsuccessful}
              helper={`Avg. connection time ${formatMilliseconds(calls.averageConnectionTimeMs)}`}
              icon={WifiOff}
              color="bg-rose-500/10 text-rose-400"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Call trend</p>
                <div className="flex gap-3 text-[9px] font-bold text-white/70">
                  <span className="text-indigo-300">Attempts</span>
                  <span className="text-sky-300">Connected</span>
                  <span className="text-emerald-300">Successful</span>
                </div>
              </div>
              <div className="h-64">
                {calls.attempts > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calls.trend || []}>
                      <CartesianGrid vertical={false} stroke="#ffffff09" />
                      <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} labelFormatter={shortDate} />
                      <Bar dataKey="attempts" name="Attempts" fill="#818cf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="connected" name="Connected" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="successful" name="Successful" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty label="No call diagnostics in this period" />}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-1">
              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white">Final classification</p>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <div className="h-32">
                    {callStatusPie.some((item) => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={callStatusPie} dataKey="value" innerRadius={32} outerRadius={50} paddingAngle={3}>
                            {callStatusPie.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} formatter={(value, name, item) => [value, item.payload.label]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <Empty />}
                  </div>
                  <div className="space-y-1.5">
                    {callStatusPie.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between gap-3 text-[9px]">
                        <span className="flex items-center gap-1.5 font-semibold text-white/70">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                          {item.label}
                        </span>
                        <span className="font-black text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white">Failure reasons</p>
                <div className="space-y-2">
                  {(calls.failures || []).slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-white/[0.025] px-3 py-2 text-[9px]">
                      <span className="font-semibold text-white/70">{titleCase(item.name)}</span>
                      <span className="font-black text-rose-300">{item.value}</span>
                    </div>
                  ))}
                  {!calls.failures?.length && <p className="py-3 text-center text-[10px] font-semibold text-white/70">No failure reasons reported</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 border-t border-white/[0.06] pt-4 text-[9px] font-medium text-white/70 md:grid-cols-2">
            <p><span className="font-black text-white/80">Success definition:</span> {calls.definition}</p>
            <p><span className="font-black text-white/80">Diagnostic coverage:</span> {calls.twoSidedCoverage || 0}% of calls have reports from both participants. {calls.caveat}</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Card className="p-6 xl:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <SectionTitle icon={TrendingUp} title="Acquisition & pairing" subtitle="New registrations, new couples and unpairs in the selected period" />
              <div className="hidden gap-3 text-[9px] font-black uppercase tracking-wider text-white sm:flex">
                <span className="text-indigo-300">Users</span>
                <span className="text-rose-300">Couples</span>
                <span className="text-amber-300">Unpaired</span>
              </div>
            </div>
            <div className="h-72">
              {growthTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthTrend}>
                    <defs>
                      <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="couplesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#ffffff09" />
                    <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} labelFormatter={shortDate} />
                    <Area type="monotone" dataKey="Users" stroke="#818cf8" strokeWidth={2} fill="url(#usersFill)" />
                    <Area type="monotone" dataKey="Couples" stroke="#fb7185" strokeWidth={2} fill="url(#couplesFill)" />
                    <Area type="monotone" dataKey="Unpaired" stroke="#fbbf24" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </Card>

          <Card className="p-6 xl:col-span-2">
            <SectionTitle icon={UserCheck} title="Profile setup" subtitle="All registered users; no onboarding-version filtering" color="text-emerald-400" />
            <div className="mt-6 space-y-4">
              {(data?.funnel || []).map((step, index) => {
                const width = (step.value / maxFunnel) * 100;
                const previous = data.funnel[index - 1]?.value;
                return (
                  <div key={step.name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white">{step.name}</span>
                      <span className="text-[10px] font-black text-white">
                        {formatNumber(step.value)}
                        {index > 0 && previous > 0 && (
                          <span className="ml-1.5 text-white/70">({Math.round((step.value / previous) * 100)}%)</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
                        style={{ width: `${Math.max(width, step.value ? 2 : 0)}%`, opacity: 1 - (index * 0.08) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-rose-500/15 bg-rose-500/[0.06] px-4 py-3.5">
              <div>
                <p className="text-xs font-black text-white">Active couples</p>
                <p className="mt-0.5 text-[9px] text-white/70">Separate from profile setup</p>
              </div>
              <p className="text-2xl font-black text-rose-400">{formatNumber(metrics.activeCouples)}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <SectionTitle
              icon={Activity}
              title="Meaningful product activity"
              subtitle={data?.report?.engagementDefinition}
              color="text-emerald-400"
            />
            <div className="flex gap-5">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-white">Today actions</p>
                <p className="text-xl font-black text-emerald-400">{formatNumber(metrics.todayEngagements)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-white">Game activity</p>
                <p className="text-xl font-black text-amber-400">{formatNumber(metrics.todayGames)}</p>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.trends?.engagementTrend || []}>
                <CartesianGrid vertical={false} stroke="#ffffff09" />
                <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const activity = payload[0].payload;
                    const rows = [
                      ['Messages', activity.messages, '#818cf8'],
                      ['Answers', activity.answers, '#38bdf8'],
                      ['Mood updates', activity.moods, '#f472b6'],
                      ['Memories', activity.memories, '#a78bfa'],
                      ['Scribble-active couples', activity.scribbles, '#fb7185'],
                      ['Game activity', activity.games, '#fbbf24'],
                    ];
                    return (
                      <div className="min-w-52 rounded-xl border border-white/10 bg-[#151515] p-4 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">{shortDate(label)}</span>
                          <span className="text-sm font-black text-emerald-400">{formatNumber(activity.count)} total</span>
                        </div>
                        <div className="space-y-2">
                          {rows.map(([name, value, color]) => (
                            <div key={name} className="flex items-center justify-between gap-6 text-[10px]">
                              <span className="flex items-center gap-2 font-semibold text-white">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                                {name}
                              </span>
                              <span className="font-black text-white">{formatNumber(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name="Actions" fill="#34d399" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[9px] font-medium text-white/70">
            Scribbles count couples whose latest saved canvas changed that day; overwritten Scribble history is not stored.
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <SectionTitle icon={Heart} title="Daily ritual health" subtitle="Whether neither, one, or both partners completed the ritual" color="text-rose-400" />
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-white">Avg. current streak</p>
                <p className="text-2xl font-black text-rose-400">{rituals.averageCurrentStreak || 0}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              <div className="h-52">
                {ritualPie.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ritualPie} dataKey="value" innerRadius={54} outerRadius={78} paddingAngle={5}>
                        {ritualPie.map((item, index) => <Cell key={item.name} fill={['#34d399', '#fbbf24', '#52525b'][index]} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
              <div className="space-y-3">
                {ritualPie.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/[0.025] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: ['#34d399', '#fbbf24', '#52525b'][index] }} />
                      <span className="text-[10px] font-bold text-white">{item.name}</span>
                    </div>
                    <span className="text-sm font-black">{formatNumber(item.value)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl border border-white/[0.05] p-3 text-center">
                    <p className="text-lg font-black text-white">{rituals.couplesWithActiveStreak || 0}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-white">Active streaks</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.05] p-3 text-center">
                    <p className="text-lg font-black text-white">{rituals.longestStreak || 0}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-white">Longest streak</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={MessageSquare} title="Question engagement" subtitle="V2 question discovery, answers and set progress" color="text-sky-400" />
            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                ['Seen', questions.seen],
                ['Answered', questions.answered],
                ['Skipped', questions.skipped],
                ['Sets done', questions.completedSets],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-center">
                  <p className="text-lg font-black text-white">{formatNumber(value)}</p>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-white">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-white">Top topics · selected period</p>
              <div className="space-y-3">
                {(questions.topics || []).slice(0, 6).map((topic, index) => {
                  const max = questions.topics[0]?.value || 1;
                  return (
                    <div key={topic.name}>
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span className="font-bold text-white">{titleCase(topic.name)}</span>
                        <span className="font-black text-white">{formatNumber(topic.value)} <span className="font-medium text-white/70">· {topic.users} users</span></span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div className="h-full rounded-full" style={{ width: `${(topic.value / max) * 100}%`, background: COLORS[index % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
                {!questions.topics?.length && <div className="h-28"><Empty label="No V2 question answers in this period" /></div>}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Card className="p-6 xl:col-span-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <SectionTitle icon={Gamepad2} title="Game activity" subtitle="Tic-Tac-Toe and Wordle completions; puzzles created" color="text-amber-400" />
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-wider text-white">
                {[
                  ['Tic-Tac-Toe', '#fbbf24'],
                  ['Wordle', '#a78bfa'],
                  ['Puzzles created', '#34d399'],
                ].map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gameTrend}>
                  <CartesianGrid vertical={false} stroke="#ffffff09" />
                  <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#ffffffcc', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} labelFormatter={shortDate} />
                  <Area type="monotone" dataKey="Tic-Tac-Toe" stackId="games" stroke="#fbbf24" fill="#fbbf2440" />
                  <Area type="monotone" dataKey="Wordle" stackId="games" stroke="#a78bfa" fill="#a78bfa40" />
                  <Area type="monotone" dataKey="Puzzles created" stackId="games" stroke="#34d399" fill="#34d39940" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 xl:col-span-2">
            <SectionTitle icon={Flame} title="Feature adoption" subtitle={`Persisted usage in the last ${timeRange} days`} color="text-orange-400" />
            <div className="mt-5 space-y-3">
              {(data?.featureAdoption || []).map((feature, index) => {
                const max = Math.max(...data.featureAdoption.map((item) => item.value), 1);
                return (
                  <div key={feature.name}>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="font-bold text-white">{feature.name}</span>
                      <span className="font-black text-white">{formatNumber(feature.value)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: `${(feature.value / max) * 100}%`, background: COLORS[index % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <SectionTitle
              icon={Globe2}
              title="Users by country"
              subtitle="Estimated by grouping each user’s latest stored device timezone"
              color="text-cyan-400"
            />
            <div className="text-left sm:text-right">
              <p className="text-2xl font-black text-cyan-400">{countryData.filter((item) => item.code).length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Countries identified</p>
            </div>
          </div>
          <div className="mt-5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {countryData.length ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                {countryData.map((country, index) => {
                  const share = countryTotal ? Math.round((country.value / countryTotal) * 1000) / 10 : 0;
                  return (
                    <div key={country.code || country.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-[10px]">
                        <span className="truncate font-bold text-white" title={country.name}>
                          {country.name}
                          {country.timezoneCount > 1 && <span className="ml-1.5 font-medium text-white/70">({country.timezoneCount} timezones)</span>}
                        </span>
                        <span className="shrink-0 font-black text-white">
                          {formatNumber(country.value)} users <span className="font-medium text-white/70">· {share}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(country.value / maxCountryUsers) * 100}%`,
                            background: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="h-32"><Empty label="No user timezone data reported" /></div>}
          </div>
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-[9px] font-medium text-white/70">
            Country is inferred from the IANA timezone, not GPS location. “Unknown country” includes missing, UTC-only, or unmapped timezones. This distribution is independent of the date filter.
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="p-6">
            <SectionTitle icon={Smartphone} title="App versions" subtitle="Top installed versions reported by devices" color="text-sky-400" />
            <div className="mt-5 divide-y divide-white/[0.05]">
              {(data?.versions || []).slice(0, 7).map((version) => (
                <div key={`${version.platform}-${version.version}`} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-bold text-white">v{version.version}</p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/70">{version.platform}</p>
                  </div>
                  <span className="text-sm font-black text-white">{formatNumber(version.users)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={Smartphone} title="Users by platform" subtitle="All users grouped by the latest stored device platform" color="text-indigo-400" />
            <div className="mt-4 h-44">
              {platformPie.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformPie} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={4}>
                      {platformPie.map((item) => (
                        <Cell
                          key={item.name}
                          fill={item.name === 'iOS' ? '#818cf8' : item.name === 'Android' ? '#34d399' : '#71717a'}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty label="No platform data reported" />}
            </div>
            <div className="space-y-2">
              {platformPie.map((item) => {
                const total = platformPie.reduce((sum, platform) => sum + platform.value, 0);
                const percentageValue = total ? Math.round((item.value / total) * 1000) / 10 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-[10px] font-bold text-white">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: item.name === 'iOS' ? '#818cf8' : item.name === 'Android' ? '#34d399' : '#71717a' }}
                      />
                      {item.name}
                    </span>
                    <span>{formatNumber(item.value)} · {percentageValue}%</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={CheckCircle2} title="Widget adoption" subtitle="Device-reported installs; setup intent is tracked for Distance only" color="text-emerald-400" />
            <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Location sharing</p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-white/70">Successful server sync, not raw phone permission state</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ['Sharing enabled', data?.locationSharing?.sharingEnabled],
                  ['Location received', data?.locationSharing?.everShared],
                  [`Updated ${timeRange}d`, data?.locationSharing?.updatedInPeriod],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-black/10 px-2 py-2 text-center">
                    <p className="text-lg font-black text-white">{formatNumber(value)}</p>
                    <p className="mt-0.5 text-[8px] font-bold leading-tight text-white">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {(data?.widgets || []).map((widget) => (
                <div key={widget.name}>
                  <div className="mb-1.5 flex justify-between text-[10px]">
                    <span className="font-bold text-white">{titleCase(widget.name)}</span>
                    <span className="font-black text-white">
                      {formatNumber(widget.installed)} installed
                      {widget.name === 'distance' && <span className="font-medium text-white/70"> · {formatNumber(widget.intent)} setup intent</span>}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(widget.installed / maxWidgetInstalls) * 100}%` }} />
                  </div>
                </div>
              ))}
              {!data?.widgets?.length && <div className="h-32"><Empty label="No widget status reported" /></div>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={Crown} title="Subscription health" subtitle="Current subscription lifecycle statuses" color="text-amber-400" />
            <div className="mt-4 h-44">
              {data?.splits?.subscriptions?.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.splits.subscriptions} dataKey="value" innerRadius={46} outerRadius={68} paddingAngle={4}>
                      {data.splits.subscriptions.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#171717', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty label="No subscription records" />}
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {(data?.splits?.subscriptions || []).slice(0, 5).map((item, index) => (
                <span key={item.name} className="flex items-center gap-1.5 text-[9px] font-bold text-white">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  {titleCase(item.name)} {item.value}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
