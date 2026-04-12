/** SportShield AI — ⌘K Command Palette */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Library, ShieldAlert, Bell, BarChart3,
  Settings, FileWarning, Clock, Activity, Bot, ArrowRight, Command, Hash, Globe, CreditCard
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const go = (path: string) => { navigate(path); onClose(); };

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Overview', description: 'Main dashboard with metrics', icon: LayoutDashboard, action: () => go('/'), category: 'Navigate', keywords: ['home', 'dashboard', 'overview'] },
    { id: 'nav-assets', label: 'Go to Asset Database', description: 'Manage protected assets', icon: Library, action: () => go('/assets'), category: 'Navigate', keywords: ['assets', 'library', 'upload'] },
    { id: 'nav-violations', label: 'Go to Incidents', description: 'View detected violations', icon: ShieldAlert, action: () => go('/violations'), category: 'Navigate', keywords: ['violations', 'incidents', 'threats'] },
    { id: 'nav-alerts', label: 'Go to Alerts', description: 'Notification center', icon: Bell, action: () => go('/alerts'), category: 'Navigate', keywords: ['alerts', 'notifications'] },
    { id: 'nav-takedowns', label: 'Go to Takedowns', description: 'DMCA takedown requests', icon: FileWarning, action: () => go('/takedowns'), category: 'Navigate', keywords: ['takedown', 'dmca', 'report'] },
    { id: 'nav-scans', label: 'Go to Scheduled Scans', description: 'Scan configuration', icon: Clock, action: () => go('/scans'), category: 'Navigate', keywords: ['scans', 'schedule', 'crawl'] },
    { id: 'nav-analytics', label: 'Go to Analytics', description: 'Charts and insights', icon: BarChart3, action: () => go('/analytics'), category: 'Navigate', keywords: ['analytics', 'charts', 'stats'] },
    { id: 'nav-globalmap', label: 'Go to Global Map', description: 'Real-time violation map', icon: Globe, action: () => go('/global-map'), category: 'Navigate', keywords: ['map', 'globe', 'world', 'geo'] },
    { id: 'nav-shieldai', label: 'Go to Shield AI', description: 'AI chatbot assistant', icon: Bot, action: () => go('/shield-ai'), category: 'Navigate', keywords: ['ai', 'chat', 'bot', 'assistant'] },
    { id: 'nav-activity', label: 'Go to Activity Log', description: 'Audit trail', icon: Activity, action: () => go('/activity'), category: 'Navigate', keywords: ['activity', 'log', 'audit'] },
    { id: 'nav-pricing', label: 'Go to Pricing', description: 'Subscription plans', icon: CreditCard, action: () => go('/pricing'), category: 'Navigate', keywords: ['pricing', 'plans', 'subscribe', 'billing'] },
    { id: 'nav-settings', label: 'Go to Settings', description: 'Account preferences', icon: Settings, action: () => go('/settings'), category: 'Navigate', keywords: ['settings', 'profile', 'account'] },
    // Quick Actions
    { id: 'action-upload', label: 'Upload New Asset', description: 'Add a new protected asset', icon: Library, action: () => go('/assets'), category: 'Actions', keywords: ['upload', 'new', 'add', 'asset'] },
    { id: 'action-scan', label: 'Run Global Scan', description: 'Trigger a network-wide scan', icon: Search, action: () => go('/scans'), category: 'Actions', keywords: ['scan', 'run', 'detect'] },
    { id: 'action-takedown', label: 'Create Takedown Request', description: 'Generate a DMCA notice', icon: FileWarning, action: () => go('/takedowns'), category: 'Actions', keywords: ['takedown', 'create', 'dmca'] },
    { id: 'action-chat', label: 'Ask Shield AI', description: 'Get AI-powered insights', icon: Bot, action: () => go('/shield-ai'), category: 'Actions', keywords: ['ask', 'ai', 'chat', 'question'] },
  ], []);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.some(k => k.includes(q))
    );
  }, [query, commands]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-[560px] mx-4"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
          >
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1F2937]">
                <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands, pages, actions..."
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-zinc-500 font-mono"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-[#0B0F19] border border-[#1F2937] text-[10px] text-zinc-400 font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2 custom-scrollbar" role="listbox">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Hash className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No results for "{query}"</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{category}</p>
                      {items.map((item) => {
                        const globalIndex = filtered.indexOf(item);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            data-index={globalIndex}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => item.action()}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:bg-[#1F2937]/50 ${
                              isSelected ? 'bg-[#1F2937]' : 'hover:bg-[#1F2937]/50'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-[#0B0F19] border border-[#1F2937]'}`}>
                              <item.icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-zinc-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-zinc-500 truncate">{item.description}</p>
                              )}
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-[#1F2937] bg-[#0B0F19]/50">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] text-zinc-400 font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] text-zinc-400 font-mono">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] text-zinc-400 font-mono">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
