import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DeviceType } from '../../../types/database';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('deon_analytics_sid');
  if (!sid) {
    sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    sessionStorage.setItem('deon_analytics_sid', sid);
  }
  return sid;
}

function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function detectTrafficSource(): string {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const ref = new URL(document.referrer);
    if (ref.hostname.includes('google')) return 'google';
    if (ref.hostname.includes('instagram')) return 'instagram';
    if (ref.hostname.includes('twitter') || ref.hostname.includes('x.com')) return 'twitter';
    if (ref.hostname.includes('linkedin')) return 'linkedin';
    if (ref.hostname.includes('pinterest')) return 'pinterest';
    return ref.hostname;
  } catch {
    return 'direct';
  }
}

const LOCAL_ANALYTICS_KEY = 'deon_cms_analytics_views';
const recentViews = new Set<string>();

export interface AnalyticsRecord {
  id?: string;
  project_id?: string | null;
  page_url: string;
  device: DeviceType;
  traffic_source: string;
  user_session_id: string;
  country: string;
  created_at?: string;
}

export class AnalyticsService {
  /**
   * Log a view event with anonymous metadata in database & local tracking
   */
  static async trackView(pageUrl: string, projectId?: string | null) {
    const sid = getSessionId();
    const cacheKey = `${sid}_${pageUrl}`;

    if (recentViews.has(cacheKey)) {
      return;
    }
    recentViews.add(cacheKey);

    const device = detectDevice();
    const traffic_source = detectTrafficSource();

    const record: AnalyticsRecord = {
      project_id: projectId || null,
      page_url: pageUrl,
      device,
      traffic_source,
      user_session_id: sid,
      country: 'Global',
      created_at: new Date().toISOString(),
    };

    // 1. Log to local storage
    try {
      const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
      const views: AnalyticsRecord[] = raw ? JSON.parse(raw) : [];
      views.push(record);
      // Keep up to 2,000 recent views
      if (views.length > 2000) views.splice(0, views.length - 2000);
      localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(views));
    } catch {
      // ignore
    }

    // 2. Log to Supabase if available
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('analytics').insert({
          project_id: projectId || null,
          page_url: pageUrl,
          device,
          traffic_source,
          user_session_id: sid,
          country: 'Global',
        });
      } catch (err) {
        console.debug('Analytics logging skipped:', err);
      }
    }
  }

  /**
   * Fetch aggregate statistics strictly reflecting actual database/platform data.
   * If there are no items or no views, returns 0 with zero hardcoded mock values.
   */
  static async getDashboardStats() {
    let localProjectsCount = 0;
    let localPublishedCount = 0;
    let localDraftCount = 0;
    let localArchivedCount = 0;
    let localPortCount = 0;
    let localProdCount = 0;
    let localCategoriesCount = 0;
    let localViewsCount = 0;
    let localUniqueVisitors = 0;

    // Read actual local counts
    try {
      const projRaw = localStorage.getItem('deon_cms_local_projects');
      if (projRaw) {
        const parsed = JSON.parse(projRaw);
        if (Array.isArray(parsed)) {
          const active = parsed.filter((p: any) => !p.deleted_at);
          localProjectsCount = active.length;
          localPublishedCount = active.filter((p: any) => p.status === 'published').length;
          localDraftCount = active.filter((p: any) => p.status === 'draft').length;
          localArchivedCount = active.filter((p: any) => p.status === 'archived').length;
        }
      }

      const portRaw = localStorage.getItem('deon_cms_local_portfolio_shots');
      if (portRaw) {
        const parsed = JSON.parse(portRaw);
        if (Array.isArray(parsed)) {
          localPortCount = parsed.filter((s: any) => !s.deleted_at).length;
        }
      }

      const prodRaw = localStorage.getItem('deon_cms_local_product_shots');
      if (prodRaw) {
        const parsed = JSON.parse(prodRaw);
        if (Array.isArray(parsed)) {
          localProdCount = parsed.filter((s: any) => !s.deleted_at).length;
        }
      }

      const catRaw = localStorage.getItem('deon_cms_local_categories');
      if (catRaw) {
        const parsed = JSON.parse(catRaw);
        if (Array.isArray(parsed)) localCategoriesCount = parsed.length;
      }

      const viewsRaw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
      if (viewsRaw) {
        const parsed = JSON.parse(viewsRaw);
        if (Array.isArray(parsed)) {
          localViewsCount = parsed.length;
          localUniqueVisitors = new Set(parsed.map((v: any) => v.user_session_id)).size;
        }
      }
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured()) {
      return {
        totalProjects: localProjectsCount,
        publishedProjects: localPublishedCount,
        draftProjects: localDraftCount,
        archivedProjects: localArchivedCount,
        totalPortfolioShots: localPortCount,
        totalProductShots: localProdCount,
        totalCategories: localCategoriesCount,
        totalViews: localViewsCount,
        uniqueVisitors: localUniqueVisitors,
      };
    }

    // When Supabase is configured, query actual database rows
    try {
      const [pRes, pubRes, draftRes, archRes, catRes, viewRes, portRes, prodRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'published').is('deleted_at', null),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'draft').is('deleted_at', null),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'archived').is('deleted_at', null),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('analytics').select('id, user_session_id'),
        supabase.from('portfolio_shots').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('product_shots').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      ]);

      const dbViewsCount = viewRes.data?.length ?? 0;
      const dbUniqueVisitors = new Set(viewRes.data?.map((d) => d.user_session_id)).size || 0;

      return {
        totalProjects: pRes.count ?? localProjectsCount,
        publishedProjects: pubRes.count ?? localPublishedCount,
        draftProjects: draftRes.count ?? localDraftCount,
        archivedProjects: archRes.count ?? localArchivedCount,
        totalPortfolioShots: portRes.count ?? localPortCount,
        totalProductShots: prodRes.count ?? localProdCount,
        totalCategories: catRes.count ?? localCategoriesCount,
        totalViews: dbViewsCount > 0 ? dbViewsCount : localViewsCount,
        uniqueVisitors: dbUniqueVisitors > 0 ? dbUniqueVisitors : localUniqueVisitors,
      };
    } catch (err) {
      console.warn('Supabase stats fetch error, falling back to local counts:', err);
      return {
        totalProjects: localProjectsCount,
        publishedProjects: localPublishedCount,
        draftProjects: localDraftCount,
        archivedProjects: localArchivedCount,
        totalPortfolioShots: localPortCount,
        totalProductShots: localProdCount,
        totalCategories: localCategoriesCount,
        totalViews: localViewsCount,
        uniqueVisitors: localUniqueVisitors,
      };
    }
  }

  /**
   * Fetch detailed analytics breakdown calculated from real logged events.
   * If there are 0 logged views, returns empty arrays.
   */
  static async getDetailedAnalytics() {
    let rawViews: AnalyticsRecord[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!error && data && data.length > 0) {
          rawViews = data as AnalyticsRecord[];
        }
      } catch (err) {
        console.warn('Error fetching Supabase analytics:', err);
      }
    }

    if (rawViews.length === 0) {
      try {
        const local = localStorage.getItem(LOCAL_ANALYTICS_KEY);
        if (local) rawViews = JSON.parse(local);
      } catch {
        // ignore
      }
    }

    // If zero views recorded, return empty analytics data
    if (!rawViews || rawViews.length === 0) {
      return {
        viewsOverTime: [],
        deviceDistribution: [],
        trafficSources: [],
        topProjects: [],
        geographicDistribution: [],
      };
    }

    // 1. Device distribution
    const deviceCounts: Record<string, number> = {};
    rawViews.forEach((v) => {
      const d = v.device || 'desktop';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });
    const totalDevices = rawViews.length;
    const deviceColors: Record<string, string> = {
      mobile: '#171717',
      desktop: '#525252',
      tablet: '#a3a3a3',
    };
    const deviceDistribution = Object.entries(deviceCounts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((count / totalDevices) * 100),
      color: deviceColors[name.toLowerCase()] || '#737373',
    }));

    // 2. Traffic sources
    const sourceCounts: Record<string, number> = {};
    rawViews.forEach((v) => {
      const s = v.traffic_source || 'direct';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    const trafficColors: Record<string, string> = {
      direct: '#171717',
      instagram: '#404040',
      google: '#737373',
      twitter: '#8c8c8c',
      linkedin: '#a3a3a3',
    };
    const trafficSources = Object.entries(sourceCounts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((count / totalDevices) * 100),
      color: trafficColors[name.toLowerCase()] || '#a3a3a3',
    }));

    // 3. Views over time (grouped by date/month)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthViews: Record<string, { views: number; sessions: Set<string> }> = {};

    rawViews.forEach((v) => {
      const date = v.created_at ? new Date(v.created_at) : new Date();
      const month = monthNames[date.getMonth()];
      if (!monthViews[month]) {
        monthViews[month] = { views: 0, sessions: new Set() };
      }
      monthViews[month].views += 1;
      monthViews[month].sessions.add(v.user_session_id);
    });

    const viewsOverTime = Object.entries(monthViews).map(([name, data]) => ({
      name,
      views: data.views,
      visitors: data.sessions.size,
    }));

    return {
      viewsOverTime,
      deviceDistribution,
      trafficSources,
      topProjects: [],
      geographicDistribution: [],
    };
  }

  /**
   * Reset all analytics tracking data across database and local storage
   */
  static async resetAnalytics(): Promise<void> {
    // 1. Clear in-memory cache
    recentViews.clear();

    // 2. Clear local storage
    try {
      localStorage.removeItem(LOCAL_ANALYTICS_KEY);
      localStorage.setItem(LOCAL_ANALYTICS_KEY, '[]');
      sessionStorage.removeItem('deon_analytics_sid');
    } catch {
      // ignore
    }

    // 3. Clear database records if Supabase is active
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('analytics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Could not reset Supabase analytics:', err);
      }
    }
  }
}
