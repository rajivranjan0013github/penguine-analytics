import { useCallback, useEffect, useState } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { fetchDemographyData } from './api';
import GlobalReach from './GlobalReach.jsx';

const Demography = ({ navigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const demoData = await fetchDemographyData(timeRange);
      setData(demoData);
    } catch (err) {
      console.error('Failed to load demography data:', err);
      setError('Failed to load demography data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const countryData = data?.countries || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Page Header matching analytics-front */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Demography</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-block text-left">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:border-indigo-500 transition-colors">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <select
                aria-label="Analytics period"
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
                className="appearance-none bg-transparent pr-8 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="0">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="28">Last 28 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="custom">Custom Range...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Custom Date Pickers for Global Reach */}
          {(isCustomMode || typeof timeRange === 'object') && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={loadData}
            aria-label="Refresh demography"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs font-medium text-slate-500">Loading global demography statistics...</p>
          </div>
        </div>
      ) : (
        <GlobalReach
          countryData={countryData}
          totalRegisteredUsers={data?.totalUsers || 0}
          totalPremiumUsers={data?.premiumUsers || 0}
          timeRange={timeRange}
          loading={loading}
          onCountryClick={(countryName) => (
            navigate
              ? navigate(`/global-reach/country/${encodeURIComponent(countryName)}`)
              : undefined
          )}
        />
      )}
    </div>
  );
};

export default Demography;
