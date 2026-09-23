import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileQuestion,
  Flame,
  Heart,
  HelpCircle,
  Layers,
  Loader2,
  MessageCircle,
  MessageSquare,
  Mic,
  PieChart as PieIcon,
  RefreshCw,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
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
import { fetchQuestionEngagement } from './api';

const COLORS = [
  '#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b',
  '#8b5cf6', '#f43f5e', '#14b8a6', '#3b82f6', '#d946ef', '#84cc16'
];

const FORMAT_ICONS = {
  choice: CheckCircle2,
  slider: Sliders,
  likelyTo: Users,
  neverHaveIEver: Flame,
  deep: Heart,
  takePhoto: Camera,
  voiceRecord: Mic,
  task: Award,
};

const FORMAT_LABELS = {
  choice: 'Multiple Choice',
  slider: 'Slider Scale',
  likelyTo: 'Most Likely To',
  neverHaveIEver: 'Never Have I Ever',
  deep: 'Deep & Intimate',
  takePhoto: 'Take a Photo',
  voiceRecord: 'Voice Note',
  task: 'Couple Task',
};

const formatNumber = (value = 0) => new Intl.NumberFormat('en-IN', {
  notation: value > 9999 ? 'compact' : 'standard',
  maximumFractionDigits: 1,
}).format(value);

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

const StatsCard = ({ title, value, icon: Icon, color, subText, badge, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
    <div className="min-w-0 flex-1">
      <p className="text-slate-500 text-sm font-medium mb-1 truncate">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {(badge || trend) && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
            badge
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : String(trend).startsWith('+')
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}>
            {badge || trend}
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
  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400 py-12">
    {label}
  </div>
);

function QuestionEngagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(28);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchQuestionEngagement(timeRange));
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        setError('Question analytics could not be loaded. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = data?.metrics || {};
  const trend = data?.trend || [];
  const topics = data?.topics || [];
  const formats = data?.formats || [];
  const recentAnswers = data?.recentAnswers || [];

  const maxTopicAnswers = Math.max(...topics.map((t) => t.count || 0), 1);
  const totalFormatCount = formats.reduce((acc, f) => acc + (f.count || 0), 0);

  const avgDailyAnswers = trend.length
    ? parseFloat((metrics.totalAnswers / trend.length).toFixed(1))
    : 0;

  if (loading && !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Loading question engagement analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Question Cards Engagement</h2>
          <p className="text-slate-500 text-sm">
            Couples answering V2 question decks, topic discovery, format interest & deck completions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-indigo-500 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select
              aria-label="Time period"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
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

      {/* 4 Core Question KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Questions Answered"
          value={formatNumber(metrics.totalAnswers)}
          badge={`${metrics.answerRate || 0}% rate`}
          subText={`${formatNumber(metrics.totalSeen)} impressions seen`}
          icon={CheckCircle2}
          color="bg-indigo-600"
        />
        <StatsCard
          title="Engaged Couples"
          value={formatNumber(metrics.uniqueCouples)}
          subText={`${formatNumber(metrics.uniqueUsers)} users participating`}
          icon={Heart}
          color="bg-rose-500"
        />
        <StatsCard
          title="Deck Completion Rate"
          value={`${metrics.completionRate || 0}%`}
          subText={`${formatNumber(metrics.completedSets)} of ${formatNumber(metrics.startedSets)} decks finished`}
          icon={Award}
          color="bg-emerald-500"
        />
        <StatsCard
          title="Card Discussions"
          value={formatNumber(metrics.chatMessages)}
          subText={`${formatNumber(metrics.totalSkipped)} cards skipped`}
          icon={MessageSquare}
          color="bg-sky-500"
        />
      </div>

      {/* Daily Answers Trend Chart */}
      <Card className="p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <SectionTitle
            icon={TrendingUp}
            title="Daily Answers Velocity"
            subtitle={`Submitted answers per day across all question formats (${timeRange} days)`}
            color="text-indigo-600"
          />
          <div className="flex items-center gap-3">
            {avgDailyAnswers > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>Daily Avg:</span>
                <span className="text-indigo-900 font-extrabold">{avgDailyAnswers}/day</span>
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Answers Submitted
            </span>
          </div>
        </div>

        <div className="h-64">
          {trend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="answersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
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
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  labelClassName="font-bold text-slate-800 text-xs"
                />
                {avgDailyAnswers > 0 && (
                  <ReferenceLine y={avgDailyAnswers} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                )}
                <Area type="monotone" dataKey="count" name="Answers" stroke="#6366f1" strokeWidth={2} fill="url(#answersFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty label="No question answers recorded in this period" />
          )}
        </div>
      </Card>

      {/* Two Column Section: Topic Leaderboard & Format Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Breakdown (2 Columns) */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle
              icon={Layers}
              title="Topics Popularity & Engagement"
              subtitle="All 11 relationship categories ranked by answer volume"
              color="text-purple-600"
            />
            <span className="text-xs text-slate-400 font-semibold">{topics.length} Categories</span>
          </div>

          <div className="space-y-3 mt-4">
            {topics.map((topic, index) => {
              const width = (topic.count / maxTopicAnswers) * 100;
              const color = COLORS[index % COLORS.length];

              return (
                <div key={topic.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: color }}
                      >
                        {index + 1}
                      </span>
                      <span className="font-semibold text-slate-700 truncate">{topic.name}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({formatNumber(topic.uniqueCouples)} couples)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-slate-800">{formatNumber(topic.count)}</span>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {topic.share}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(width, topic.count ? 3 : 0)}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
            {!topics.length && <Empty label="No topic activity in this period" />}
          </div>
        </Card>

        {/* Format Breakdown (1 Column) */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <SectionTitle
              icon={PieIcon}
              title="Question Formats"
              subtitle="Distribution by interaction style"
              color="text-sky-500"
            />

            <div className="mt-4 h-44">
              {formats.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formats}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={4}
                    >
                      {formats.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(val, name) => [`${formatNumber(val)} answers`, FORMAT_LABELS[name] || name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty label="No format activity" />
              )}
            </div>

            <div className="space-y-2 mt-3">
              {formats.map((fmt, index) => {
                const IconComponent = FORMAT_ICONS[fmt.name] || FileQuestion;
                const label = FORMAT_LABELS[fmt.name] || fmt.name;
                const color = COLORS[index % COLORS.length];

                return (
                  <div key={fmt.name} className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <IconComponent className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{label}</span>
                    </span>
                    <span className="font-bold text-slate-800 flex-shrink-0">
                      {formatNumber(fmt.count)}
                      <span className="font-normal text-slate-400 ml-1">({fmt.share}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total Answers</span>
            <span className="font-bold text-slate-800">{formatNumber(totalFormatCount)}</span>
          </div>
        </Card>
      </div>

      {/* Deck Completion Progress Funnel & Recent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deck Completion Insights */}
        <Card className="p-6">
          <SectionTitle
            icon={Compass}
            title="Card Deck Completion Funnel"
            subtitle="How couples start and finish themed question sets"
            color="text-amber-500"
          />

          <div className="mt-4 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">Decks Started</span>
                <span className="text-sm font-bold text-slate-800">{formatNumber(metrics.startedSets)}</span>
              </div>
              <p className="text-[11px] text-slate-400">Total card decks opened by couples</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 w-full" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">Decks Finished (100%)</span>
                <span className="text-sm font-bold text-emerald-600">
                  {formatNumber(metrics.completedSets)}
                  <span className="text-xs font-normal text-slate-400 ml-1">({metrics.completionRate || 0}%)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Couples who reached the final question and report</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(metrics.completionRate || 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-900">Card Discussions</p>
                <p className="text-[11px] text-indigo-700/80">Messages couples exchanged inside question chat threads</p>
              </div>
              <span className="text-lg font-bold text-indigo-700">{formatNumber(metrics.chatMessages)}</span>
            </div>
          </div>
        </Card>

        {/* Recent Answers Stream */}
        <Card className="p-6">
          <SectionTitle
            icon={Clock}
            title="Recent Activity Log"
            subtitle="Latest submitted question answers in real-time"
            color="text-slate-600"
          />

          <div className="mt-4 space-y-2">
            {recentAnswers.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">{item.topicName}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{item.format || 'Card Answer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {!recentAnswers.length && <Empty label="No recent answers" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default QuestionEngagement;
