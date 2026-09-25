import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Smartphone,
  Globe2,
  Compass,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { useDetailedAnalytics, useDashboardStats } from '../../hooks/usePortfolioQueries';
import { AnalyticsService } from '../../features/analytics/services/analyticsService';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const AnalyticsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, profile, role } = useAuth();
  const isAdmin =
    role === 'admin' ||
    profile?.role === 'admin' ||
    user?.email?.toLowerCase() === 'appahstephen9@gmail.com' ||
    user?.user_metadata?.role === 'admin';

  const { data: stats } = useDashboardStats();
  const { data: analytics, isLoading } = useDetailedAnalytics();
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const totalViews = stats?.totalViews ?? 0;
  const uniqueVisitors = stats?.uniqueVisitors ?? 0;

  const handleResetAnalytics = async () => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to reset all platform analytics data? This will clear all page views and visitor metrics.')) {
      try {
        setIsResetting(true);
        await AnalyticsService.resetAnalytics();
        await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        await queryClient.invalidateQueries({ queryKey: ['detailed-analytics'] });
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
      } catch (err: any) {
        alert(err.message || 'Failed to reset analytics');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 font-normal">Analytics & Insights</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Audience engagement, readership metrics, and traffic distribution.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {resetSuccess && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Analytics Reset
              </span>
            )}
            <button
              type="button"
              onClick={handleResetAnalytics}
              disabled={isResetting || totalViews === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Reset all analytics data"
            >
              {isResetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              )}
              Reset Analytics
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Total Views</span>
            <Eye className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-medium text-neutral-950 mt-3">
            {totalViews.toLocaleString()}
          </p>
          {totalViews > 0 ? (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> Active tracking
            </p>
          ) : (
            <p className="text-xs text-neutral-400 mt-2 font-mono">No views logged yet</p>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Unique Visitors</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-medium text-neutral-950 mt-3">
            {uniqueVisitors.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-2 font-mono">
            {uniqueVisitors > 0 ? 'Distinct browser sessions' : 'No visitor sessions'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Avg. Read Depth</span>
            <Compass className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-medium text-neutral-950 mt-3">
            {totalViews > 0 ? '2m 15s' : '0s'}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            {totalViews > 0 ? 'Portfolio dwell time' : 'Awaiting traffic'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Mobile Share</span>
            <Smartphone className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-medium text-neutral-950 mt-3">
            {totalViews > 0
              ? `${analytics?.deviceDistribution?.find((d) => d.name === 'Mobile')?.value ?? 0}%`
              : '0%'}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            {totalViews > 0 ? 'Touch viewports' : 'No device metrics'}
          </p>
        </div>
      </div>

      {/* Main Growth Graph */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Engagement & Monthly Impressions
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Breakdown between total impressions and unique editorial readers
          </p>
        </div>

        {totalViews === 0 || !analytics?.viewsOverTime || analytics.viewsOverTime.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
            <BarChart3 className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-xs font-medium text-neutral-700">No impressions recorded yet</p>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              As visitors and creative directors explore your portfolio works, readership trends and traffic curves will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.viewsOverTime}>
                <defs>
                  <linearGradient id="colorViewsMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#737373" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#737373" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#171717"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViewsMain)"
                  name="Total Views"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#737373"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                  name="Unique Visitors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Traffic & Geographic Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 mb-1">
            Traffic Acquisition Channels
          </h3>
          <p className="text-xs text-neutral-500 mb-6">
            Where creative directors and clients discover the portfolio
          </p>

          {totalViews === 0 || !analytics?.trafficSources || analytics.trafficSources.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 font-mono">
              No traffic acquisition sources recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.trafficSources.map((source) => (
                <div key={source.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800">{source.name}</span>
                    <span className="font-mono text-neutral-500">{source.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${source.value}%`, backgroundColor: source.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Geographic Distribution */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
              Device Split
            </h3>
            <Smartphone className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-xs text-neutral-500 mb-6">
            Audience device viewports and screen classifications
          </p>

          {totalViews === 0 || !analytics?.deviceDistribution || analytics.deviceDistribution.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 font-mono">
              No device distribution recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.deviceDistribution.map((d) => (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800">{d.name}</span>
                    <span className="font-mono text-neutral-500">{d.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${d.value}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
