import { useMemo, useState } from 'react';
import {
  Globe,
  TrendingUp,
  Users as UsersIcon,
  Crown,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  X,
  Loader2,
} from 'lucide-react';
import { getFlagEmoji, countryNameToFlag } from './countryMapper.js';

const formatNumber = (value = 0) => new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
}).format(value);

const resolveFlag = (country) => {
  if (!country) return '🌐';
  if (country.flag && country.flag !== '🌐') return country.flag;
  if (country.code && country.code.length === 2) return getFlagEmoji(country.code);
  if (country.name && countryNameToFlag[country.name]) return countryNameToFlag[country.name];
  return '🌐';
};

const GlobalReach = ({
  countryData = [],
  totalRegisteredUsers = 0,
  totalPremiumUsers = 0,
  timeRange = 0,
  loading = false,
  onCountryClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('users');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleCountryClick = (countryName) => {
    if (onCountryClick) {
      onCountryClick(countryName);
    } else {
      window.history.pushState({}, '', `/global-reach/country/${encodeURIComponent(countryName)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Country totals
  const totalCountryUsers = useMemo(
    () => countryData.reduce((sum, item) => sum + (item.value || 0), 0),
    [countryData],
  );

  const totalCountryPremium = useMemo(
    () => countryData.reduce((sum, item) => sum + (item.premiumUsers || 0), 0),
    [countryData],
  );

  const totalIosUsers = useMemo(
    () => countryData.reduce((sum, item) => sum + (item.iosUsers || 0), 0),
    [countryData],
  );

  const displayTotalUsers = totalRegisteredUsers || totalCountryUsers;
  const displayPremiumUsers = totalPremiumUsers || totalCountryPremium;

  const overallConvRate = displayTotalUsers > 0
    ? Math.round((displayPremiumUsers / displayTotalUsers) * 1000) / 10
    : 0;

  const topMarket = countryData.length > 0 ? countryData[0] : null;

  const timeLabel = typeof timeRange === 'object'
    ? `${timeRange.startDate} to ${timeRange.endDate}`
    : (timeRange === 0 ? 'All Time' : `Last ${timeRange} Days`);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = countryData.filter((c) => (
      c.name.toLowerCase().includes(term) || (c.code && c.code.toLowerCase().includes(term))
    ));

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'premium') {
        comparison = (b.premiumUsers || 0) - (a.premiumUsers || 0);
      } else if (sortBy === 'conversion') {
        const rateA = a.value > 0 ? (a.premiumUsers || 0) / a.value : 0;
        const rateB = b.value > 0 ? (b.premiumUsers || 0) / b.value : 0;
        comparison = rateB - rateA;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'ios') {
        const rateA = a.value > 0 ? (a.iosUsers || 0) / a.value : 0;
        const rateB = b.value > 0 ? (b.iosUsers || 0) / b.value : 0;
        comparison = rateB - rateA;
      } else {
        comparison = (b.value || 0) - (a.value || 0);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [countryData, searchTerm, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Updating demography statistics...
        </div>
      )}

      {/* 4 Demography KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Countries */}
        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold mb-0.5">Total Countries</p>
            <h3 className="text-lg font-bold text-slate-800">{countryData.length}</h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{timeLabel}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-600">
            <Globe className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Top Market */}
        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold mb-0.5">Top Market</p>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <span>{resolveFlag(topMarket)}</span>
              <span className="truncate max-w-[100px]">{topMarket?.name || 'N/A'}</span>
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {formatNumber(topMarket?.value || 0)} users ({displayTotalUsers > 0 ? (((topMarket?.value || 0) / displayTotalUsers) * 100).toFixed(1) : 0}%)
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold mb-0.5">Total Users</p>
            <h3 className="text-lg font-bold text-slate-800">{formatNumber(displayTotalUsers)}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{timeLabel}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500">
            <UsersIcon className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Premium Subscribers */}
        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold mb-0.5">Premium Subscribers</p>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1">
              <Crown className="w-4 h-4 text-amber-500" />
              {formatNumber(displayPremiumUsers)}
            </h3>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">{overallConvRate}% Conv.</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500">
            <Crown className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Main Full-Page Global Reach Table Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Country Breakdown</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full ml-1.5">
              {countryData.length} Countries
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sort by Premium Quick Toggle */}
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'premium') {
                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                } else {
                  setSortBy('premium');
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                sortBy === 'premium'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Crown className={`w-3 h-3 ${sortBy === 'premium' ? 'text-white' : 'text-amber-500'}`} />
              Sort by Premium
              {sortBy === 'premium' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 ml-0.5" /> : <ArrowUp className="w-3 h-3 ml-0.5" />
              )}
            </button>

            {/* Country Search Bar */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white shadow-xs z-10">
              <tr className="border-b border-slate-100">
                <th
                  onClick={() => handleSort('name')}
                  className="text-left py-2 px-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    Country
                    {sortBy === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('users')}
                  className="text-right py-2 px-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Users
                    {sortBy === 'users' ? (
                      sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600" /> : <ArrowUp className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                    )}
                  </div>
                </th>
                <th className="text-right py-2 px-3 text-[11px] font-bold text-slate-500 uppercase">Share</th>
                <th
                  onClick={() => handleSort('ios')}
                  className="text-right py-2 px-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    iOS Share
                    {sortBy === 'ios' ? (
                      sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-indigo-600" /> : <ArrowUp className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('premium')}
                  className="text-right py-2 px-3 text-[11px] font-bold text-amber-600 uppercase cursor-pointer hover:text-amber-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Premium
                    {sortBy === 'premium' ? (
                      sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-amber-600" /> : <ArrowUp className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('conversion')}
                  className="text-right py-2 px-3 text-[11px] font-bold text-emerald-600 uppercase cursor-pointer hover:text-emerald-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Conv. Rate
                    {sortBy === 'conversion' ? (
                      sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-emerald-600" /> : <ArrowUp className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                    )}
                  </div>
                </th>
                <th className="text-right py-2 px-3 text-[11px] font-bold text-amber-600 uppercase">Premium Share</th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSorted.length ? (
                filteredAndSorted.map((country) => {
                  const userShare = displayTotalUsers > 0
                    ? ((country.value / displayTotalUsers) * 100).toFixed(1)
                    : '0';

                  const convRate = country.value > 0
                    ? (((country.premiumUsers || 0) / country.value) * 100).toFixed(1)
                    : '0';

                  const premiumShare = displayPremiumUsers > 0
                    ? (((country.premiumUsers || 0) / displayPremiumUsers) * 100).toFixed(1)
                    : '0';

                  const iosCount = country.iosUsers || 0;
                  const androidCount = country.androidUsers || 0;
                  const iosPct = country.value > 0 ? Math.round((iosCount / country.value) * 100) : 0;
                  const androidPct = country.value > 0 ? Math.round((androidCount / country.value) * 100) : 0;

                  return (
                    <tr
                      key={country.code || country.name}
                      onClick={() => handleCountryClick(country.name)}
                      className="border-b border-slate-50 hover:bg-indigo-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Country Column */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base flex-shrink-0">{resolveFlag(country)}</span>
                          <span className="text-xs font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {country.name}
                          </span>
                          {country.timezoneCount > 1 && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                              {country.timezoneCount} TZs
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Users */}
                      <td className="py-2 px-3 text-right">
                        <span className="text-xs font-bold text-indigo-600">
                          {formatNumber(country.value)}
                        </span>
                      </td>

                      {/* Share */}
                      <td className="py-2 px-3 text-right">
                        <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {userShare}%
                        </span>
                      </td>

                      {/* iOS Share */}
                      <td className="py-2 px-3 text-right">
                        <span
                          className="inline-flex items-center justify-end px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50/90 text-blue-700 border border-blue-100/80"
                          title={`iOS: ${iosCount} (${iosPct}%) · Android: ${androidCount} (${androidPct}%)`}
                        >
                          {iosPct}%
                        </span>
                      </td>

                      {/* Premium Users */}
                      <td className="py-2 px-3 text-right">
                        {(country.premiumUsers || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            <Crown className="w-3 h-3 text-amber-500" />
                            {formatNumber(country.premiumUsers)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">0</span>
                        )}
                      </td>

                      {/* Conv. Rate */}
                      <td className="py-2 px-3 text-right">
                        {(country.premiumUsers || 0) > 0 ? (
                          <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            {convRate}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">0%</span>
                        )}
                      </td>

                      {/* Premium Share */}
                      <td className="py-2 px-3 text-right">
                        {(country.premiumUsers || 0) > 0 ? (
                          <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100/70 text-amber-800">
                            {premiumShare}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No countries matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>

            {/* Sticky Totals Footer */}
            <tfoot className="sticky bottom-0 bg-slate-100/90 backdrop-blur-xs font-bold text-slate-800 border-t-2 border-slate-200">
              <tr>
                <td className="py-2 px-3 text-[11px] font-bold text-slate-700 uppercase">
                  Total Identified ({filteredAndSorted.length})
                </td>
                <td className="py-2 px-3 text-right text-xs font-bold text-indigo-600">
                  {formatNumber(totalCountryUsers)}
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="text-[11px] font-bold text-slate-700">100%</span>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                    {totalCountryUsers > 0 ? Math.round((totalIosUsers / totalCountryUsers) * 100) : 0}%
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                    <Crown className="w-3 h-3 text-amber-600" />
                    {formatNumber(totalCountryPremium)}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {overallConvRate}%
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <span className="text-[11px] font-bold text-amber-800">100%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer info note */}
      <p className="px-1 text-[11px] font-medium text-slate-400">
        Country is inferred from device IANA timezones mapped to ISO-3166 region codes. &ldquo;Unknown country&rdquo; includes missing or unmapped timezones.
      </p>
    </div>
  );
};

export default GlobalReach;
