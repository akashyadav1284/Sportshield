/** SportShield AI — Premium App Shell layout */
import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useAlerts';
import { useWebSocket } from '../../hooks/useWebSocket';
import { cn } from '../../lib/utils';
import { CommandPalette } from '../shared/CommandPalette';
import { UploadModal } from '../shared/UploadModal';
import { HLSBackground } from '../shared/HLSBackground';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Library, ShieldAlert, Bell, BarChart3,
  Settings, LogOut, Menu, X, Search, ChevronDown, Shield,
  Command, FileWarning, Clock, Bot, Activity, Globe, CreditCard,
  Users, Key, FileText, Upload
} from 'lucide-react';

const navGroups = [
  {
    group: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Safeguard',
    items: [
      { path: '/assets', label: 'Asset DB', icon: Library },
      { path: '/violations', label: 'Incidents', icon: ShieldAlert },
      { path: '/takedowns', label: 'Takedowns', icon: FileWarning },
      { path: '/scans', label: 'Scans', icon: Clock },
    ]
  },
  {
    group: 'Activity',
    items: [
      { path: '/alerts', label: 'Alerts', icon: Bell, hasBadge: true },
      { path: '/activity', label: 'Activity Log', icon: Activity },
    ]
  },
  {
    group: 'Others',
    items: [
      { path: '/shield-ai', label: 'Shield AI', icon: Bot },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/global-map', label: 'Global Map', icon: Globe },
      { path: '/reports', label: 'Reports', icon: FileText },
      { path: '/team', label: 'Support', icon: Users },
      { path: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data: unreadCount } = useUnreadCount();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const queryClient = useQueryClient();

  useWebSocket();

  // Global keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Flatten items for current page lookup
  const navItems = navGroups.flatMap(g => g.items);
  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-zinc-100 font-sans relative">
      {/* Global Animated Background */}
      <HLSBackground />

      {/* Command Palette */}
      <CommandPalette open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden" 
            onClick={() => setMobileOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Futuristic Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-[#0A0D14]/80 backdrop-blur-md border-r border-[#1F232B] transition-all lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-[120%]'
        )}
      >
        {/* Toggle button on right edge of sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3 top-8 hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-[#1F232B] border border-zinc-800 text-zinc-400 hover:text-white transition-colors z-50"
        >
          <ChevronDown className={cn("w-3 h-3 transition-transform", sidebarOpen ? "rotate-90" : "-rotate-90")} />
        </button>

        {/* Logo Section */}
        <div className="flex items-center h-[72px] px-6 mt-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center overflow-hidden grayscale brightness-200 contrast-150">
              <img src="/logo.png" alt="SportShield Logo" className="w-full h-full object-contain" />
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden flex flex-col">
                <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">SportShield</h1>
                <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Enterprise Safeguard</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Welcome Back Section */}
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-4 mt-2">
            <h2 className="text-[22px] font-semibold text-white leading-tight tracking-tight">
              Welcome<br />Back, {user?.full_name?.split(' ')[0] || 'User'}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-2 font-medium">Last login: Just now</p>
          </motion.div>
        )}

        {/* Navigation */}
        <nav aria-label="Main Navigation" className="flex-1 py-4 px-3 space-y-6 overflow-y-auto custom-scrollbar mt-2">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {sidebarOpen && (
                <div className="px-4 mb-2 text-[11px] font-medium text-zinc-600 tracking-wider">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 group relative overflow-hidden focus:outline-none',
                      isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Animated breathing blue background for active item */}
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 z-0 pointer-events-none"
                        animate={{ 
                          backgroundColor: ['rgba(30, 58, 138, 0.3)', 'rgba(56, 189, 248, 0.15)', 'rgba(30, 58, 138, 0.3)'] 
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}

                    {isActive && (
                      <motion.div layoutId="sidebar-active" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-cyan-400 rounded-l-full shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10" />
                    )}
                    
                    <item.icon className={cn('relative z-10 w-[#18px] h-[#18px] flex-shrink-0 transition-colors', isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300')} strokeWidth={isActive ? 2.5 : 2} />
                    
                    {sidebarOpen && <span className="relative z-10 truncate tracking-wide">{item.label}</span>}
                    
                    {item.hasBadge && unreadCount && unreadCount > 0 && (
                      <span className={cn(
                        'relative z-10 flex items-center justify-center min-w-[16px] h-4 rounded bg-cyan-500 text-white text-[10px] font-bold',
                        sidebarOpen ? 'ml-auto' : 'absolute top-1 right-1 w-2 h-2 min-w-0 text-[0px]'
                      )}>
                        {sidebarOpen ? (unreadCount > 99 ? '99+' : unreadCount) : ''}
                      </span>
                    )}
                    
                    {/* Fake Beta Badge for Analytics */}
                    {sidebarOpen && item.label === 'Analytics' && (
                       <span className="relative z-10 ml-auto flex items-center justify-center px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold">
                         Beta
                       </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card / Bottom section (re-styled to match reference's dark minimalism) */}
        <div className="p-4 border-t border-[#1F232B] mt-auto">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1F232B] flex items-center justify-center text-xs font-bold text-white">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-zinc-200">{user?.full_name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            )}
            {sidebarOpen && (
              <button 
                onClick={() => logout()} 
                aria-label="Sign out"
                className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden ml-0 relative z-10">
        
        {/* Top Navbar */}
        <header className="h-[80px] flex items-center justify-between px-6 lg:px-8 border-b border-[#1F232B] bg-[#11141D]/50 backdrop-blur-md z-30">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center text-sm font-medium">
              <span className="text-zinc-500">Overview &nbsp;/&nbsp; </span>
              <span className="text-white ml-1">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Command Palette Trigger */}
            <button 
              onClick={() => setCmdPaletteOpen(true)} 
              className="hidden md:flex items-center group relative focus:outline-none"
            >
              <div className="relative flex items-center bg-[#0A0D14] border border-[#1F232B] rounded-lg px-3 py-1.5 w-64 transition-all hover:border-zinc-700">
                <Search className="w-4 h-4 text-zinc-500" />
                <span className="text-[13px] text-zinc-500 ml-2 flex-1 text-left">Search...</span>
                <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium ml-2">
                  <Command className="w-3 h-3" /> K
                </div>
              </div>
            </button>

            {/* Quick Upload Action */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 text-[13px] font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 custom-scrollbar relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => { 
          setShowUploadModal(false); 
          queryClient.invalidateQueries({ queryKey: ['assets'] }); 
        }} />
      )}
    </div>
  );
}
