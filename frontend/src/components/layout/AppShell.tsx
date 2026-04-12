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
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Library, ShieldAlert, Bell, BarChart3,
  Settings, LogOut, Menu, X, Search, ChevronDown, Shield,
  Command, FileWarning, Clock, Bot, Activity, Globe, CreditCard,
  Users, Key, FileText, Upload
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/assets', label: 'Asset DB', icon: Library },
  { path: '/violations', label: 'Incidents', icon: ShieldAlert },
  { path: '/alerts', label: 'Alerts', icon: Bell, hasBadge: true },
  { path: '/takedowns', label: 'Takedowns', icon: FileWarning },
  { path: '/scans', label: 'Scans', icon: Clock },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/global-map', label: 'Global Map', icon: Globe },
  { path: '/shield-ai', label: 'Shield AI', icon: Bot },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/activity', label: 'Activity', icon: Activity },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/pricing', label: 'Pricing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
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

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'Overview';

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-zinc-100">
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
        animate={{ width: sidebarOpen ? 240 : 80 }}
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 flex flex-col my-4 ml-4 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-2xl transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-[120%]'
        )}
      >
        {/* Decorative top glow */}
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />

        {/* Logo Section */}
        <div className="flex items-center h-[72px] px-5 border-b border-zinc-800/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 p-[1px]">
              <div className="w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">SportShield</h1>
                <p className="text-[10px] text-cyan-400/80 font-bold tracking-[0.2em] uppercase">Enterprise</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Main Navigation" className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]',
                  isActive ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                )}
                
                <item.icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400/50')} />
                
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                
                {item.hasBadge && unreadCount && unreadCount > 0 && (
                  <span className={cn(
                    'flex items-center justify-center min-w-[20px] h-5 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]',
                    sidebarOpen ? 'ml-auto' : 'absolute top-1 right-1 w-3 h-3 min-w-0 text-[0px]'
                  )}>
                    {sidebarOpen ? (unreadCount > 99 ? '99+' : unreadCount) : ''}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card / Collapse */}
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center justify-center mb-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="hidden lg:flex items-center justify-center w-full py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          
          <div className="relative group rounded-xl p-[1px] bg-gradient-to-b from-zinc-700/50 to-zinc-900/50 overflow-hidden">
            <div className="bg-zinc-900 rounded-xl p-3 flex items-center justify-center lg:justify-start gap-3 relative z-10">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-cyan-400 border border-zinc-700">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 opacity-100 transition-opacity">
                  <p className="text-sm font-semibold truncate text-zinc-200">{user?.full_name}</p>
                  <p className="text-[10px] font-medium text-cyan-500 uppercase tracking-widest">{user?.role}</p>
                </div>
              )}
            </div>
            {/* Hover ambient light */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden ml-0 lg:ml-4">
        
        {/* Top Navbar */}
        <header className="h-[88px] flex items-center justify-between px-4 lg:px-8 mt-2 mx-4 lg:mx-0 z-30">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              className="lg:hidden p-2 rounded-lg bg-[#111827] border border-[#1F2937] text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="hidden lg:block">
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Current view</p>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                {currentPage}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Command Palette Trigger */}
            <button 
              onClick={() => setCmdPaletteOpen(true)} 
              aria-label="Open command palette (Ctrl+K)"
              className="hidden md:flex items-center group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2 w-72 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Search className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-500 ml-2 flex-1 font-mono">Search commands...</span>
                <div className="flex items-center gap-1 bg-[#0B0F19] border border-[#1F2937] px-1.5 py-0.5 rounded text-[10px] text-zinc-300 font-medium ml-2">
                  <Command className="w-3 h-3" /> K
                </div>
              </div>
            </button>

            {/* Quick Upload Action */}
            <button
              onClick={() => setShowUploadModal(true)}
              aria-label="Quick Upload Asset"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:block text-xs font-bold uppercase tracking-wider">Quick Add</span>
            </button>

            {/* Notification Node */}
            <Link 
              to="/alerts" 
              aria-label="View alerts"
              className="relative p-2.5 rounded-xl bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Bell className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" aria-hidden="true" />
              {unreadCount && unreadCount > 0 && (
                <span className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Link>

            {/* Topbar User Action */}
            <button 
              onClick={() => logout()} 
              aria-label="Sign out"
              title="Disconnect Session"
              className="hidden sm:flex items-center justify-center p-2.5 rounded-xl bg-[#111827] border border-[#1F2937] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-zinc-300 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
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
