import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Camera,
  Package,
  Tag,
  Image as ImageIcon,
  BarChart3,
  ExternalLink,
  LogOut,
  Plus,
  ChevronDown,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { DeonLogo } from '../DeonLogo';
import { SEOHead } from '../SEOHead';

export type AdminTab =
  | 'overview'
  | 'projects'
  | 'portfolio'
  | 'products'
  | 'categories'
  | 'media'
  | 'analytics'
  | 'profile';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onNavigateTab: (tab: AdminTab) => void;
  onNavigateToNewProject: () => void;
  onNavigateToNewPortfolio?: () => void;
  onNavigateToNewProduct?: () => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onNavigateTab,
  onNavigateToNewProject,
  onNavigateToNewPortfolio,
  onNavigateToNewProduct,
  onExitAdmin,
  children,
}) => {
  const { logout } = useAuth();
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Camera className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
    { id: 'media', label: 'Media', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const handlePrimaryNew = () => {
    if (currentTab === 'portfolio' && onNavigateToNewPortfolio) {
      onNavigateToNewPortfolio();
    } else if (currentTab === 'products' && onNavigateToNewProduct) {
      onNavigateToNewProduct();
    } else {
      onNavigateToNewProject();
    }
  };

  const getPrimaryNewLabel = () => {
    if (currentTab === 'portfolio') return 'New Portrait';
    if (currentTab === 'products') return 'New Product';
    return 'New Project';
  };

  const handleTabClick = (tab: AdminTab) => {
    onNavigateTab(tab);
    setSidebarOpen(false);
  };

  const tabTitles: Record<AdminTab, string> = {
    overview: 'Dashboard Overview',
    projects: 'Projects Manager',
    portfolio: 'Portraits & Editorial Shoots',
    products: 'Product Imagery',
    categories: 'Categories Manager',
    media: 'Media Asset Library',
    analytics: 'Performance Analytics',
    profile: 'Profile & Account Settings',
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-neutral-900 font-sans flex antialiased">
      <SEOHead
        title={`${tabTitles[currentTab] || 'CMS Admin'} | Deon Studios`}
        description="Secure administrative control center for Deon Studios portfolio management."
        noindex={true}
        canonicalUrl="/#admin"
      />
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-neutral-200 flex items-center justify-between">
          <button type="button" onClick={() => handleTabClick('overview')}
            className="flex items-center gap-3 focus:outline-hidden group"
            title="Overview"
          >
            <DeonLogo size={24} fillColor="#171717" />
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-neutral-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4">
          <button
            type="button"
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Site</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper (Header + Content) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar: Clean & Uncluttered */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between gap-4">
              {/* Left Side: Mobile Menu Button & Active Page Name */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition focus:outline-hidden"
                  aria-label="Open sidebar"
                  title="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="lg:hidden flex items-center">
                  <DeonLogo size={20} fillColor="#171717" />
                </div>

                <div className="hidden sm:block">
                {' '}
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                    {navItems.find((n) => n.id === currentTab)?.label || 'Dashboard'}
                  </span>
                </div>
              </div>

              {/* Right Side: Quick Add, Public View, Human Icon, Logout */}
              <div className="flex items-center gap-2.5">
                {/* Human Icon (Profile & Password update) */}
                <button
                  type="button"
                  onClick={() => onNavigateTab('profile')}
                  className={`p-2 rounded-full border transition flex items-center justify-center ${
                    currentTab === 'profile'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 hover:border-neutral-300 shadow-2xs'
                  }`}
                  title="Admin Profile & Password"
                  aria-label="Admin Profile & Password"
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-full border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 hover:border-neutral-300 transition shadow-2xs"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
