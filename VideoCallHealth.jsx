import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Video,
  CheckCircle2,
  Calendar,
  ChevronDown,
  RefreshCw,
  Loader2,
  Clock,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  Search,
  PhoneMissed,
  PhoneOff,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchCallHealth } from './api';

const STATUS_COLORS = {
  successful: '#10b981',
  connected_no_media: '#0ea5e9',
  missed: '#f59e0b',
  rejected: '#8b5cf6',
  failed: '#ef4444',
  cancelled: '#64748b',
  ended_unconfirmed: '#94a3b8',
};

const STATUS_LABELS = {
  successful: 'Successful (Media)',
  connected_no_media: 'Connected (No Media)',
  missed: 'Unanswered / Missed',
  rejected: 'Declined by Partner',
  failed: 'Technical Failure',
  cancelled: 'Cancelled by Caller',
  ended_unconfirmed: 'Ended Unconfirmed',
};

const formatStatusLabel = (value = '') => STATUS_LABELS[value] || titleCase(value);

const titleCase = (value = '') =>
  String(value)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatMilliseconds = (value = 0) => {
  if (!value && value !== 0) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${value}ms`;
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, color = 'text-indigo-600' }) => (
  <div className="flex items-center gap-2.5">
    <div className={`rounded-xl p-2.5 ${color} bg-opacity-10`} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

const StatsCard = ({ title, value, subText, icon: Icon, color, badge }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between gap-3 hover:shadow-md transition-all">
    <div className="min-w-0 flex-1">
      <p className="text-slate-500 text-sm font-medium mb-1 truncate">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value ?? 0}</h3>
        {badge && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
            {badge}
          </span>
        )}
      </div>
      {subText && (
        <p className="text-xs mt-1 text-slate-400 font-normal truncate">{subText}</p>
      )}
    </div>
    <div className={`p-3.5 rounded-xl ${color} text-white shadow-sm flex-shrink-0`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const Empty = ({ label = 'No data in this period' }) => (
  <div className="flex h-full min-h-32 items-center justify-center text-xs font-semibold text-slate-400">
    {label}
  </div>
);

export default function VideoCallHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(28);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const callData = await fetchCallHealth(timeRange);
      setData(callData);
    } catch (err) {
      console.error('Failed to load call health diagnostics:', err);
      setError('Failed to load call health diagnostics. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const callStatusPie = useMemo(() => {
    const statuses = data?.statuses || [];
    return statuses.map((item) => ({
      ...item,
      label: formatStatusLabel(item.name),
      color: STATUS_COLORS[item.name] || '#94a3b8',
    }));
  }, [data]);

  const processedTrend = useMemo(() => {
    return (data?.trend || []).map((d) => {
      const successful = d.successful || 0;
      const connectedNoMedia = d.connectedNoMedia ?? Math.max((d.connected || 0) - successful, 0);
      const missed = d.missed || 0;
      const rejected = d.rejected || 0;
      const failed = d.failed || 0;
      const cancelled = d.cancelled || 0;
      const uniqueUsers = d.uniqueUsers || 0;
      const attempts = d.attempts || 0;
      const successRate = attempts > 0 ? Math.round((successful / attempts) * 100) : 0;

      return {
        ...d,
        successful,
        connectedNoMedia,
        missed,
        rejected,
        failed,
        cancelled,
        uniqueUsers,
        attempts,
        successRate,
      };
    });
  }, [data]);

  const filteredRecentCalls = useMemo(() => {
    let calls = data?.recentCalls || [];
    if (sessionFilter !== 'all') {
      calls = calls.filter((c) => {
        if (sessionFilter === 'successful') return c.status === 'successful';
        if (sessionFilter === 'missed') return c.status === 'missed' || (c.outcomes || []).includes('missed');
        if (sessionFilter === 'rejected') return c.status === 'rejected' || (c.outcomes || []).includes('rejected');
        if (sessionFilter === 'failed') return c.status === 'failed' || (c.outcomes || []).includes('failed');
        if (sessionFilter === 'connected_no_media') return c.status === 'connected_no_media';
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      calls = calls.filter((c) =>
        c.callId?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q) ||
        (c.failureCodes || []).some((code) => code?.toLowerCase().includes(q))
      );
    }

    return calls;
  }, [data, sessionFilter, searchQuery]);

  const totalFailures = useMemo(() => {
    return (data?.failures || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [data]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Video Call Health</h2>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            Retained for {data?.retentionDays || 30} days
          </div>

          {/* Time Range Selector */}
          <div className="relative inline-block text-left">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs hover:border-indigo-500 transition-colors">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <select
                aria-label="Call health period"
                value={typeof timeRange === 'object' ? 'custom' : String(timeRange)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setIsCustomMode(true);
                  } else {
                    setIsCustomMode(false);
                    setTimeRange(Number(val));
                  }
                }}
                className="appearance-none bg-transparent pr-7 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="7">Last 7 Days</option>
                <option value="14">Last 14 Days</option>
                <option value="28">Last 28 Days</option>
                <option value="30">Last 30 Days (Max TTL)</option>
                <option value="custom">Custom Range...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Custom Date Pickers */}
          {(isCustomMode || typeof timeRange === 'object') && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs animate-in fade-in zoom-in-95 duration-200">
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customStart && customEnd) {
                    setTimeRange({ startDate: customStart, endDate: customEnd });
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-indigo-500 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Call Diagnostics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Loading video call diagnostics…</p>
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Reported Attempts"
              value={data?.attempts ?? 0}
              subText={`${data?.uniqueUsers || 0} unique users · ${data?.diagnosticReports || 0} reports`}
              icon={Video}
              color="bg-indigo-600"
            />
            <StatsCard
              title="Successful (Media)"
              value={data?.successful ?? 0}
              subText={`${data?.successRate || 0}% bi-directional media`}
              icon={CheckCircle2}
              color="bg-emerald-500"
              badge={`${data?.successRate || 0}%`}
            />
            <StatsCard
              title="Unanswered / Missed"
              value={data?.missed ?? 0}
              subText={`${data?.missedRate || 0}% ring timed out`}
              icon={PhoneMissed}
              color="bg-amber-500"
              badge={`${data?.missedRate || 0}%`}
            />
            <StatsCard
              title="Declined by Partner"
              value={data?.rejected ?? 0}
              subText={`${data?.rejectedRate || 0}% rejected by recipient`}
              icon={PhoneOff}
              color="bg-purple-600"
              badge={`${data?.rejectedRate || 0}%`}
            />
            <StatsCard
              title="Technical Failures"
              value={data?.failed ?? 0}
              subText={`${data?.failedRate || 0}% ICE / network / socket drops`}
              icon={AlertTriangle}
              color="bg-rose-500"
              badge={`${data?.failedRate || 0}%`}
            />
            <StatsCard
              title="Avg. Connect Latency"
              value={formatMilliseconds(data?.averageConnectionTimeMs)}
              subText={`${data?.twoSidedCalls || 0} paired reports (${data?.twoSidedCoverage || 0}% cov)`}
              icon={Clock}
              color="bg-sky-500"
            />
          </div>

          {/* Full Width: Call Volume & Delivery Outcomes Trend Chart */}
          <Card className="p-6 w-full">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <SectionTitle
                icon={Video}
                title="Call Volume & Delivery Outcomes"
                subtitle="Daily attempts segmented by real delivery and failure reasons"
                color="text-indigo-600"
              />
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" /> Successful
                </span>
                <span className="flex items-center gap-1.5 text-amber-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" /> Unanswered
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-purple-600" /> Declined
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" /> Tech Failure
                </span>
                <span className="flex items-center gap-1.5 text-sky-600">
                  <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" /> No Media
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-xs bg-slate-400" /> Cancelled
                </span>
              </div>
            </div>

            <div className="h-72">
              {processedTrend.length > 0 && data?.attempts > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val?.split('-')?.slice(2)?.join('') || val}
                      minTickGap={20}
                    />
                    <YAxis
                      width={35}
                      stroke="#94a3b8"
                      fontSize={10}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]?.payload;
                          if (!item) return null;
                          return (
                            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs space-y-2 min-w-56">
                              <div className="border-b border-slate-100 pb-2">
                                <div className="flex items-center justify-between font-bold text-slate-800">
                                  <span>{label}</span>
                                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                    {item.successRate}% Success
                                  </span>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between bg-indigo-50/70 border border-indigo-100/60 rounded-lg px-2 py-1">
                                  <span className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    Total Unique Users
                                  </span>
                                  <span className="font-extrabold text-indigo-900 text-xs">
                                    {item.uniqueUsers ?? 0}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1.5 pt-0.5">
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Successful (Media)
                                  </span>
                                  <span className="font-bold text-slate-800">{item.successful}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Unanswered / Missed
                                  </span>
                                  <span className="font-bold text-slate-800">{item.missed}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-purple-600" />
                                    Declined by Partner
                                  </span>
                                  <span className="font-bold text-slate-800">{item.rejected}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    Technical Failure
                                  </span>
                                  <span className="font-bold text-rose-600">{item.failed}</span>
                                </div>
                                {item.connectedNoMedia > 0 && (
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                                      Connected (No Media)
                                    </span>
                                    <span className="font-bold text-slate-800">{item.connectedNoMedia}</span>
                                  </div>
                                )}
                                {item.cancelled > 0 && (
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                                      Cancelled by Caller
                                    </span>
                                    <span className="font-bold text-slate-800">{item.cancelled}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 font-black text-slate-800">
                                  <span>Total Attempts</span>
                                  <span>{item.attempts}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="successful" name="Successful" stackId="callOutcome" fill="#10b981" />
                    <Bar dataKey="missed" name="Unanswered" stackId="callOutcome" fill="#f59e0b" />
                    <Bar dataKey="rejected" name="Declined" stackId="callOutcome" fill="#8b5cf6" />
                    <Bar dataKey="failed" name="Technical Failure" stackId="callOutcome" fill="#ef4444" />
                    <Bar dataKey="connectedNoMedia" name="No Media" stackId="callOutcome" fill="#0ea5e9" />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="callOutcome" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty label="No call diagnostic events recorded in this period" />
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              <span>Peak attempts: {processedTrend.reduce((max, d) => (d.attempts > (max?.attempts || 0) ? d : max), null)?.attempts || 0} calls ({processedTrend.reduce((max, d) => (d.attempts > (max?.attempts || 0) ? d : max), null)?.date || '—'})</span>
              <span>Timezone: Asia/Kolkata (UTC+05:30)</span>
            </div>
          </Card>

          {/* Breakdown & Telemetry Row: 3 columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Column 1: Outcome Classification Donut */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <SectionTitle
                  icon={ShieldCheck}
                  title="Outcome Classification"
                  subtitle="End state grouped per unique call session"
                  color="text-emerald-600"
                />

                <div className="mt-4">
                  <div className="h-44">
                    {callStatusPie.some((item) => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={callStatusPie}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={42}
                            outerRadius={65}
                            paddingAngle={3}
                          >
                            {callStatusPie.map((item) => (
                              <Cell key={item.name} fill={item.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              fontSize: '11px',
                            }}
                            formatter={(value, name) => [value, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty label="No outcomes recorded" />
                    )}
                  </div>

                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {callStatusPie.map((item) => {
                      const percent = data?.attempts > 0 ? Math.round((item.value / data.attempts) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-2 font-medium text-slate-700 truncate">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                            <span className="truncate">{item.label}</span>
                          </span>
                          <div className="flex items-center gap-2 font-bold text-slate-800 flex-shrink-0">
                            <span>{item.value}</span>
                            <span className="text-[10px] text-slate-400 font-normal w-8 text-right">({percent}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Column 2: Failure Reasons Breakdown */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <SectionTitle
                    icon={AlertTriangle}
                    title="Reported Failure Reasons"
                    subtitle="Diagnosed client & signaling failure codes"
                    color="text-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-500">
                    {totalFailures} {totalFailures === 1 ? 'failure' : 'failures'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {(data?.failures || []).length > 0 ? (
                    data.failures.map((item) => {
                      const percent = totalFailures > 0 ? Math.round((item.value / totalFailures) * 100) : 0;
                      return (
                        <div
                          key={item.name}
                          className="flex flex-col gap-1.5 rounded-xl bg-slate-50/80 border border-slate-100 p-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{titleCase(item.name)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-rose-600">{item.value}</span>
                              <span className="text-[10px] font-medium text-slate-400">({percent}%)</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-rose-500 transition-all duration-300"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs font-medium text-slate-400">
                      No failure codes reported in this period
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Platform & Telemetry Coverage */}
            <div className="space-y-6">
              {/* Platform breakdown */}
              <Card className="p-6">
                <SectionTitle
                  icon={Smartphone}
                  title="Platform Diagnostics"
                  subtitle="Client devices reporting WebRTC telemetry"
                  color="text-indigo-600"
                />
                <div className="mt-4 space-y-3">
                  {(data?.platforms || []).length > 0 ? (
                    data.platforms.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-slate-500" />
                          <span className="font-bold text-slate-700">{p.name?.toUpperCase()}</span>
                        </div>
                        <span className="font-black text-slate-800">{p.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400 font-medium">
                      No platform data available
                    </div>
                  )}
                </div>
              </Card>

              {/* Success Criteria Card */}
              <Card className="p-5 border-l-4 border-l-indigo-500">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Diagnostic Criteria & Policies
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Success Criteria: </span>
                    {data?.definition || 'Connected with audio and video media bytes exchanged in at least one report.'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Diagnostic Coverage: </span>
                    {data?.twoSidedCoverage || 0}% of calls include reports from both participants. {data?.caveat}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Call Sessions Log Table */}
          <Card className="p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <SectionTitle
                  icon={Video}
                  title="Recent Call Sessions Telemetry"
                  subtitle="Latest call sessions with WebRTC connection status and latency"
                  color="text-sky-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search call ID or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSessionFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      sessionFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionFilter('successful')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      sessionFilter === 'successful' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Successful
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionFilter('missed')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      sessionFilter === 'missed' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Missed
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionFilter('rejected')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      sessionFilter === 'rejected' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Declined
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionFilter('failed')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      sessionFilter === 'failed' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Tech Failed
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Call ID</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Outcome Status</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Reports</th>
                    <th className="py-3 px-3">Connect Latency</th>
                    <th className="py-3 px-3">Failure Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecentCalls.length > 0 ? (
                    filteredRecentCalls.map((call) => {
                      const isSuccess = call.status === 'successful';
                      const isConnected = call.connected === 1;
                      const isFailed = call.status === 'failed';
                      const isMissed = call.status === 'missed';
                      const isRejected = call.status === 'rejected';
                      const dateObj = call.date ? new Date(call.date) : null;
                      const formattedDate = dateObj
                        ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                          ' ' +
                          dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                        : '—';

                      return (
                        <tr key={call.callId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-700 font-bold">
                            <span title={call.callId}>
                              {call.callId?.length > 18 ? `${call.callId.slice(0, 18)}…` : call.callId}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isSuccess
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isMissed
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isRejected
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : isConnected
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : isFailed
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {formatStatusLabel(call.status)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            <div className="flex items-center gap-1">
                              {(call.platforms || []).map((p) => (
                                <span
                                  key={p}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase"
                                >
                                  {p}
                                </span>
                              ))}
                              {(!call.platforms || call.platforms.length === 0) && (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                call.twoSided === 1
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {call.reports} {call.reports === 1 ? 'report' : 'reports'}
                              {call.twoSided === 1 && ' (2-sided)'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {formatMilliseconds(call.connectionTimeMs)}
                          </td>
                          <td className="py-3 px-3">
                            {(call.failureCodes || []).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {call.failureCodes.map((fc) => (
                                  <span
                                    key={fc}
                                    className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-medium text-rose-700"
                                  >
                                    {fc}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs font-medium text-slate-400">
                        No call sessions matching the current filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
