import React from 'react';
import {
  FolderKanban,
  Eye,
  Camera,
  Package,
  Tag,
  Users,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
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
import { useDashboardStats, useDetailedAnalytics } from '../../hooks/usePortfolioQueries';
import { AdminTab } from '../../components/layouts/AdminLayout';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTab) => void;
  onNavigateToNewProject: () => void;
  onNavigateToNewPortfolio?: () => void;
  onNavigateToNewProduct?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
}) => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: analytics } = useDetailedAnalytics();

  const totalViews = stats?.totalViews ?? 0;
  const uniqueVisitors = stats?.uniqueVisitors ?? 0;

  return (
    <div className="space-y-8">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Projects */}
        <div
          onClick={() => onNavigateTab('projects')}
          className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-neutral-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Projects</span>
            <FolderKanban className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-950 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              {statsLoading ? '—' : stats?.totalProjects ?? 0}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">case studies</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium truncate">
            {stats?.publishedProjects ?? 0} published
          </div>
        </div>

        {/* Portfolio (Portraits) */}
        <div
          onClick={() => onNavigateTab('portfolio')}
          className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-neutral-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Portraits</span>
            <Camera className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-950 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              {statsLoading ? '—' : stats?.totalPortfolioShots ?? 0}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">plates</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 truncate">
            Editorial portraiture
          </div>
        </div>

        {/* Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-neutral-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Products</span>
            <Package className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-950 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              {statsLoading ? '—' : stats?.totalProductShots ?? 0}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">commercial</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 truncate">
            Still life & beauty
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Views</span>
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              {statsLoading ? '—' : totalViews.toLocaleString()}
            </span>
            {totalViews > 0 && (
              <span className="text-[10px] text-emerald-600 font-mono flex items-center">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Live
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 truncate">
            {totalViews > 0 ? 'Audience reach' : 'No views yet'}
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Visitors</span>
            <Users className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              {statsLoading ? '—' : uniqueVisitors.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">sessions</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 truncate">
            {uniqueVisitors > 0 ? 'Unique engagements' : 'No visitors yet'}
          </div>
        </div>

        {/* Categories */}
        <div
          onClick={() => onNavigateTab('categories')}
          className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-neutral-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-400">Categories</span>
            <Tag className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-950 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              {statsLoading ? '—' : stats?.totalCategories ?? 0}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">taxonomies</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 truncate">
            Active taxonomies
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Growth Chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                Portfolio Views & Traffic
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Monthly audience engagement over time
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-neutral-600 hover:text-neutral-950 font-medium flex items-center gap-1 cursor-pointer"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalViews === 0 || !analytics?.viewsOverTime || analytics.viewsOverTime.length === 0 ? (
            <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-center p-6 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
              <BarChart3 className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-medium text-neutral-700">No views recorded yet</p>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                When visitors browse your published works, monthly engagement graphs will populate here.
              </p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.viewsOverTime}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#171717" stopOpacity={0} />
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
                    fill="url(#colorViews)"
                    name="Page Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Device & Traffic Distribution */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 mb-1">
              Device Breakdown
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Visitor viewport split across devices
            </p>

            {totalViews === 0 || !analytics?.deviceDistribution || analytics.deviceDistribution.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
                <PieChartIcon className="w-6 h-6 text-neutral-300 mb-1.5" />
                <p className="text-xs text-neutral-500">No device telemetry yet</p>
              </div>
            ) : (
              <>
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deviceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analytics.deviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4">
                  {analytics.deviceDistribution.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-neutral-700">{d.name}</span>
                      </div>
                      <span className="font-mono font-medium text-neutral-900">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => onNavigateTab('projects')}
              className="w-full py-2 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Manage All Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
