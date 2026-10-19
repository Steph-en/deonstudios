import React from 'react';
import {
  FolderKanban,
  Eye,
  Camera,
  Package,
  Tag,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Mail,
  MessageSquare,
  Check,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Copy,
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
import {
  useDashboardStats,
  useDetailedAnalytics,
  useInquiries,
  useUpdateInquiryStatus,
  useDeleteInquiry,
} from '../../hooks/usePortfolioQueries';
import { useConfirm, useToast } from '../../context/AdminUIContext';
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
  const toast = useToast();
  const { confirm } = useConfirm();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: analytics } = useDetailedAnalytics();
  const {
    data: inquiries = [],
    isLoading: inquiriesLoading,
    refetch: refetchInquiries,
  } = useInquiries();
  const updateStatus = useUpdateInquiryStatus();
  const deleteInquiry = useDeleteInquiry();

  const totalViews = stats?.totalViews ?? 0;
  const uniqueVisitors = stats?.uniqueVisitors ?? 0;
  const unreadCount = inquiries.filter((inq: any) => inq.status !== 'read').length;

  const [inquiryFilter, setInquiryFilter] = React.useState<'all' | 'unread' | 'read'>('all');
  const [isRefreshingInquiries, setIsRefreshingInquiries] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshingInquiries(true);
    try {
      await refetchInquiries();
      toast.success('Inquiries updated from studio server.', 'REFRESHED');
    } catch {
      toast.error('Failed to reload inquiries', 'ERROR');
    } finally {
      setIsRefreshingInquiries(false);
    }
  };

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info(`${label} copied to clipboard.`, 'COPIED');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteInquiry = async (inq: any) => {
    const ok = await confirm({
      title: 'DELETE CLIENT INQUIRY',
      subtitle: 'PERMANENT REMOVAL',
      message: `Are you sure you want to permanently delete the inquiry from "${inq.name || 'Client'}" (${inq.email})? This action cannot be undone.`,
      confirmText: 'DELETE INQUIRY',
      cancelText: 'CANCEL',
      variant: 'danger',
    });

    if (ok) {
      try {
        await deleteInquiry.mutateAsync(inq.id);
        toast.success(`Inquiry from ${inq.name || 'Client'} has been removed.`, 'INQUIRY DELETED');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete inquiry', 'ERROR');
      }
    }
  };

  const handleToggleRead = async (inq: any) => {
    const isUnread = inq.status !== 'read';
    const nextStatus = isUnread ? 'read' : 'unread';
    try {
      await updateStatus.mutateAsync({
        id: inq.id,
        status: nextStatus,
      });
      toast.info(
        isUnread ? `Inquiry from ${inq.name || 'Client'} marked as read.` : `Inquiry marked as unread.`,
        'STATUS UPDATED'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update inquiry status', 'ERROR');
    }
  };

  const filteredInquiries = React.useMemo(() => {
    if (inquiryFilter === 'unread') return inquiries.filter((inq: any) => inq.status !== 'read');
    if (inquiryFilter === 'read') return inquiries.filter((inq: any) => inq.status === 'read');
    return inquiries;
  }, [inquiries, inquiryFilter]);

  const [testingEmail, setTestingEmail] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    provider?: string;
    message?: string;
    error?: string;
    hint?: string;
  } | null>(null);
  const [emailStatus, setEmailStatus] = React.useState<{
    destination: string;
    deliveryProvider: string;
    resendConfigured: boolean;
    smtpConfigured: boolean;
    smtpHost?: string;
  } | null>(null);
  const [showConfigGuide, setShowConfigGuide] = React.useState(false);

  const fetchEmailStatus = React.useCallback(() => {
    fetch('/api/contact/status')
      .then((res) => res.json())
      .then((data) => setEmailStatus(data))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchEmailStatus();
  }, [fetchEmailStatus]);

  const handleTestEmailDispatch = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/contact/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResult(data);
      fetchEmailStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || 'Failed connecting to server contact test endpoint',
        hint: 'Check server network connection or dev server logs.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

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
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 truncate">
            Active taxonomies
          </div>
        </div>
      </div>

      {/* CMS Quick Management Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTab('hero')}
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-900 transition cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-neutral-900 text-white rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-900">
                Hero Section CMS
              </h4>
            </div>
            <p className="text-xs text-neutral-500">
              Update landing cover background with dynamic video or full-bleed responsive photo.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition shrink-0 ml-4" />
        </div>

        <div
          onClick={() => onNavigateTab('about')}
          className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-neutral-900 transition cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-neutral-900 text-white rounded-md">
                <Users className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-900">
                About Section CMS
              </h4>
            </div>
            <p className="text-xs text-neutral-500">
              Manage artist portrait/video, biography, social links, bookings link, and clients roster.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition shrink-0 ml-4" />
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

      {/* Studio Client Inquiries & Briefs */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                  Client Inquiries & Briefs
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-amber-100 text-amber-900 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-time messages dispatched from the website contact and booking forms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setInquiryFilter('all')}
                className={`px-2.5 py-1 rounded transition ${
                  inquiryFilter === 'all'
                    ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All ({inquiries.length})
              </button>
              <button
                type="button"
                onClick={() => setInquiryFilter('unread')}
                className={`px-2.5 py-1 rounded transition ${
                  inquiryFilter === 'unread'
                    ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setInquiryFilter('read')}
                className={`px-2.5 py-1 rounded transition ${
                  inquiryFilter === 'read'
                    ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Read ({inquiries.length - unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshingInquiries}
              className="px-2.5 py-1.5 text-xs text-neutral-700 hover:text-neutral-950 border border-neutral-300 hover:border-neutral-400 bg-white rounded transition flex items-center gap-1.5 cursor-pointer font-medium"
              title="Refresh from studio server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingInquiries ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Email Dispatcher Status & Live Diagnostics Card */}
        <div className="p-4 bg-neutral-50/80 border border-neutral-200 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                  Email Dispatcher
                </span>
                <span className="text-[11px] font-mono text-neutral-600 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                  to: {emailStatus?.destination || 'studio@gideonboadi.com'}
                </span>
                {emailStatus?.resendConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Resend Active
                  </span>
                ) : emailStatus?.smtpConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    SMTP Connected ({emailStatus.smtpHost})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Stored to Studio DB (Awaiting .env credentials)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                All inquiries are permanently saved here. Automated email delivery requires SMTP or Resend credentials in <code className="font-mono text-neutral-700 bg-neutral-200/60 px-1 py-0.5 rounded">.env</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfigGuide(!showConfigGuide)}
                className="px-2.5 py-1.5 text-xs text-neutral-700 hover:text-neutral-950 border border-neutral-300 hover:border-neutral-400 bg-white rounded transition flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Key className="w-3.5 h-3.5 text-neutral-500" />
                <span>{showConfigGuide ? 'Hide Secrets' : 'View Secrets Setup'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestEmailDispatch}
                disabled={testingEmail}
                className="px-3 py-1.5 text-xs bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded transition flex items-center gap-1.5 cursor-pointer font-medium shadow-xs"
              >
                {testingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Dispatch Result Feedback */}
          {testResult && (
            <div
              className={`p-3 text-xs rounded border transition-all ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-medium">
                    {testResult.message || testResult.error}
                  </p>
                  {testResult.hint && (
                    <p className="text-[11px] opacity-90">{testResult.hint}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Secrets & Configuration Reference */}
          {showConfigGuide && (
            <div className="mt-3 p-3.5 bg-white border border-neutral-200 rounded text-xs space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">
                  Required Variables in .env / Hosting Secrets
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Target: studio@gideonboadi.com</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3 bg-neutral-50 rounded border border-neutral-200/80">
                  <span className="font-semibold text-neutral-900 block text-[11px]">Option A: Resend API (Recommended)</span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Create a free account at <strong>resend.com</strong>, copy API key, and set in <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono">.env</code>:
                  </p>
                  <pre className="p-2 bg-neutral-900 text-neutral-100 font-mono text-[10px] rounded overflow-x-auto">
{`RESEND_API_KEY=re_your_api_key
RESEND_FROM=Deon Studios <onboarding@resend.dev>
CONTACT_DESTINATION_EMAIL=studio@gideonboadi.com`}
                  </pre>
                </div>

                <div className="space-y-1.5 p-3 bg-neutral-50 rounded border border-neutral-200/80">
                  <span className="font-semibold text-neutral-900 block text-[11px]">Option B: SMTP (Gmail / Titan / cPanel)</span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Use your mail provider's SMTP credentials. For Gmail, generate a 16-digit App Password at <em>myaccount.google.com/apppasswords</em>:
                  </p>
                  <pre className="p-2 bg-neutral-900 text-neutral-100 font-mono text-[10px] rounded overflow-x-auto">
{`SMTP_HOST=smtp.gmail.com (or smtp.titan.email)
SMTP_PORT=587 (or 465)
SMTP_USER=studio@gideonboadi.com
SMTP_PASS=your_16_digit_app_password
SMTP_FROM="Deon Studios" <studio@gideonboadi.com>
CONTACT_DESTINATION_EMAIL=studio@gideonboadi.com`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {inquiriesLoading ? (
          <div className="py-12 text-center text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
            <span>Loading studio inquiries...</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
            <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs font-semibold text-neutral-800">No client inquiries received yet</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Inquiries submitted through the studio contact form will appear here dynamically in real-time and route to studio@gideonboadi.com.
            </p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-10 text-center space-y-1.5 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
            <CheckCircle2 className="w-6 h-6 text-neutral-300 mx-auto" />
            <p className="text-xs font-medium text-neutral-700">No {inquiryFilter} inquiries found</p>
            <button
              type="button"
              onClick={() => setInquiryFilter('all')}
              className="text-[11px] text-neutral-900 underline font-medium cursor-pointer"
            >
              Show all inquiries ({inquiries.length})
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg overflow-hidden">
            {filteredInquiries.map((inq: any) => {
              const isUnread = inq.status !== 'read';
              return (
                <div
                  key={inq.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    isUnread ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'bg-white hover:bg-neutral-50/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" title="Unread Inquiry" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 shrink-0" title="Read" />
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                          {inq.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                          {inq.projectType || 'General Inquiry'}
                        </span>
                        {isUnread && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-medium">
                            UNREAD
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                        <a
                          href={`mailto:${inq.email}?subject=Re: Studio Inquiry — Gideon Boadi`}
                          className="underline hover:text-black font-medium"
                          title="Click to write email"
                        >
                          {inq.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(inq.email, `email-${inq.id}`, 'Email')}
                          className="text-[10px] text-neutral-400 hover:text-neutral-700 flex items-center gap-0.5 font-mono cursor-pointer"
                          title="Copy email to clipboard"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>{copiedId === `email-${inq.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                        {inq.phone && (
                          <span>
                            • Tel:{' '}
                            <a href={`tel:${inq.phone}`} className="underline hover:text-black">
                              {inq.phone}
                            </a>
                          </span>
                        )}
                        <span>
                          • {inq.created_at ? new Date(inq.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <a
                        href={`mailto:${inq.email}?subject=Re: Studio Inquiry — Gideon Boadi`}
                        className="px-2.5 py-1 text-[11px] rounded bg-neutral-900 text-white hover:bg-black transition flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Reply</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleToggleRead(inq)}
                        className={`px-2.5 py-1 text-[11px] rounded border transition cursor-pointer flex items-center gap-1 font-medium ${
                          isUnread
                            ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                        title={isUnread ? 'Mark inquiry as read' : 'Mark inquiry as unread'}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isUnread ? 'Mark Read' : 'Mark Unread'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(inq)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer rounded border border-transparent hover:border-rose-200"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-neutral-50 rounded text-xs text-neutral-800 leading-relaxed font-sans whitespace-pre-wrap border border-neutral-100">
                    {inq.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
