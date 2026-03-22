import { useEffect, useState } from 'react';
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Gamepad2, 
  TrendingUp, 
  Activity, 
  PieChart as PieChartIcon, 
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-white/5 shadow-xl flex items-start justify-between hover:border-white/10 transition-all group">
    <div>
      <p className="text-white/50 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white tracking-tight">{value.toLocaleString()}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(28);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/summary?days=${timeRange}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-white/50 font-medium">Aggregating Analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Penguine <span className="text-indigo-400">Analytics</span>
            </h1>
            <p className="text-white/40 text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time igbackend monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#2a2a2a] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-white/40" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-white/80 focus:outline-none cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={28}>Last 28 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          <button 
            onClick={fetchData}
            className="p-2.5 bg-[#2a2a2a] border border-white/5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <RefreshCw className={`w-5 h-5 text-white/60 group-active:rotate-180 transition-transform duration-500`} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Users" value={data?.metrics?.totalUsers || 0} icon={Users} color="bg-indigo-500" />
          <StatsCard title="Active Couples" value={data?.metrics?.activeCouples || 0} icon={Heart} color="bg-rose-500" />
          <StatsCard title="Engagements" value={data?.metrics?.totalAnswers || 0} icon={MessageSquare} color="bg-emerald-500" />
          <StatsCard title="Games Played" value={data?.metrics?.totalGames || 0} icon={Gamepad2} color="bg-amber-500" />
        </div>

        {/* Growth Trend - Full Width */}
        <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Growth Trend
            </h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2 text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-400" /> Users</span>
              <span className="flex items-center gap-2 text-rose-400"><div className="w-2 h-2 rounded-full bg-rose-400" /> Couples</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends?.userTrend}>
                <defs>
                  <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCouple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => {
                    const [y, m, d] = val.split('-');
                    return `${d}/${parseInt(m)}`;
                  }}
                  minTickGap={timeRange > 30 ? 40 : 20}
                />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelFormatter={(label) => {
                    const [y, m, d] = label.split('-');
                    return `${d}/${m}/${y}`;
                  }}
                />
                <Area 
                  type="monotone" 
                  name="Users"
                  dataKey="count" 
                  data={data?.trends?.userTrend}
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUser)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  name="Couples"
                  dataKey="count" 
                  data={data?.trends?.coupleTrend}
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCouple)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row: Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="font-bold text-white flex items-center gap-2 mb-8">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Daily Engagements
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.trends?.answerTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff40" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => {
                      const [y, m, d] = val.split('-');
                      return `${d}/${parseInt(m)}`;
                    }}
                    minTickGap={timeRange > 30 ? 40 : 20}
                  />
                  <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    labelFormatter={(label) => {
                      const [y, m, d] = label.split('-');
                      return `${d}/${m}/${y}`;
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Splits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-white/5 shadow-xl col-span-1">
            <h3 className="font-bold text-white flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-purple-400" />
              Gender Split
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.splits?.genderSplit}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {data?.splits?.genderSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {data?.splits?.genderSplit.map((entry, index) => (
                <div key={entry.name} className="text-center">
                  <div className="text-white text-sm mb-1">{entry.value}</div>
                  <div className="truncate">{entry.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-white/5 shadow-xl col-span-1 md:col-span-2">
            <h3 className="font-bold text-white flex items-center gap-2 mb-8">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              Game Popularity
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.splits?.gameSplit} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff0a" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#fff" fontSize={12} width={100} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
