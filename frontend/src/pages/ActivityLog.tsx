/** SportShield AI — Activity Log / Audit Trail Page */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Upload, ShieldAlert, Send, Bell, Eye, Search, Settings, LogIn, UserPlus, Filter, ScanSearch } from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';

type ActionType = 'asset_uploaded' | 'violation_detected' | 'takedown_sent' | 'alert_acknowledged' | 'scan_completed' | 'user_login' | 'settings_changed' | 'asset_viewed';

interface ActivityEntry {
  id: string;
  action: ActionType;
  user: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

const ACTION_CONFIG: Record<ActionType, { label: string; icon: React.ElementType; color: string }> = {
  asset_uploaded: { label: 'Asset Upload', icon: Upload, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  violation_detected: { label: 'Violation Detected', icon: ShieldAlert, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  takedown_sent: { label: 'Takedown Sent', icon: Send, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  alert_acknowledged: { label: 'Alert Acknowledged', icon: Bell, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  scan_completed: { label: 'Scan Completed', icon: ScanSearch, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  user_login: { label: 'User Login', icon: LogIn, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  settings_changed: { label: 'Settings Changed', icon: Settings, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  asset_viewed: { label: 'Asset Viewed', icon: Eye, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
};

const DEMO_ACTIVITIES: ActivityEntry[] = [
  { id: 'A-001', action: 'violation_detected', user: 'System', description: 'New high-severity violation detected for Champions League Final Highlights on YouTube', timestamp: '2026-04-10T10:32:00Z', metadata: { platform: 'YouTube', confidence: '94%' } },
  { id: 'A-002', action: 'takedown_sent', user: 'Alex Morgan', description: 'DMCA takedown notice sent to YouTube for video ID: pirated123', timestamp: '2026-04-10T10:15:00Z', metadata: { ref: 'TD-001' } },
  { id: 'A-003', action: 'asset_uploaded', user: 'Alex Morgan', description: 'Uploaded "Match Day Promo Video" (video/mp4, 24.5 MB)', timestamp: '2026-04-10T09:45:00Z', metadata: { type: 'video/mp4', size: '24.5 MB' } },
  { id: 'A-004', action: 'scan_completed', user: 'System', description: 'Scheduled scan completed for Premier League Goal Compilation — 856 URLs checked, 0 violations', timestamp: '2026-04-10T09:23:00Z', metadata: { urls: '856', violations: '0' } },
  { id: 'A-005', action: 'alert_acknowledged', user: 'Alex Morgan', description: 'Acknowledged critical alert for Team Logo misuse on Instagram', timestamp: '2026-04-10T08:50:00Z' },
  { id: 'A-006', action: 'user_login', user: 'Alex Morgan', description: 'Logged in from 192.168.1.1 (Chrome, Windows)', timestamp: '2026-04-10T08:30:00Z', metadata: { ip: '192.168.1.1', browser: 'Chrome' } },
  { id: 'A-007', action: 'violation_detected', user: 'System', description: 'Medium-severity violation detected for Team Logo on web domain example.com', timestamp: '2026-04-09T22:10:00Z', metadata: { platform: 'Web', confidence: '78%' } },
  { id: 'A-008', action: 'settings_changed', user: 'Alex Morgan', description: 'Updated notification preferences — enabled SMS alerts for high severity', timestamp: '2026-04-09T18:00:00Z' },
  { id: 'A-009', action: 'scan_completed', user: 'System', description: 'Daily scan completed for Team Logo — 3,421 URLs checked, 1 violation found', timestamp: '2026-04-09T16:00:00Z', metadata: { urls: '3421', violations: '1' } },
  { id: 'A-010', action: 'asset_uploaded', user: 'Alex Morgan', description: 'Uploaded "Exclusive Interview Clip" (video/mp4, 18.2 MB)', timestamp: '2026-04-09T14:00:00Z', metadata: { type: 'video/mp4', size: '18.2 MB' } },
  { id: 'A-011', action: 'takedown_sent', user: 'Alex Morgan', description: 'DMCA takedown notice sent to Twitter for unauthorized highlight repost', timestamp: '2026-04-09T12:30:00Z', metadata: { ref: 'TD-002' } },
  { id: 'A-012', action: 'violation_detected', user: 'System', description: 'Low-severity violation: fan account reposted highlight clip on TikTok', timestamp: '2026-04-09T10:15:00Z', metadata: { platform: 'TikTok', confidence: '65%' } },
];

export default function ActivityLog() {
  const [filterAction, setFilterAction] = useState<ActionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = DEMO_ACTIVITIES
    .filter(a => filterAction === 'all' || a.action === filterAction)
    .filter(a => !searchQuery || a.description.toLowerCase().includes(searchQuery.toLowerCase()) || a.user.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Activity Log</h1>
        <p className="text-zinc-400">Complete audit trail of all platform actions and events.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1F2937] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          {(['all', 'violation_detected', 'takedown_sent', 'scan_completed', 'asset_uploaded'] as const).map(action => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                filterAction === action
                  ? 'bg-[#111827] text-white border-cyan-500/30'
                  : 'bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-[#111827]'
              }`}
            >
              {action === 'all' ? 'All' : ACTION_CONFIG[action as ActionType]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <GlassCard noPadding className="overflow-hidden">
        <div className="divide-y divide-[#1F2937]">
          {filtered.map((entry, i) => {
            const cfg = ACTION_CONFIG[entry.action];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="px-6 py-4 flex items-start gap-4 hover:bg-[#1F2937]/30 transition-colors relative group"
              >
                {/* Timeline dot */}
                {i < filtered.length - 1 && (
                  <div className="absolute left-[39px] top-[52px] bottom-0 w-px bg-[#1F2937] group-last:hidden" />
                )}
                <div className={`p-2 rounded-lg border flex-shrink-0 relative z-10 ${cfg.color}`}>
                  <cfg.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-200">{entry.user}</span>
                    <span className="text-xs text-zinc-600">•</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{entry.description}</p>
                  {entry.metadata && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {Object.entries(entry.metadata).map(([key, val]) => (
                        <span key={key} className="text-[10px] text-zinc-500 bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1F2937] font-mono">
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap flex-shrink-0 pt-1">{formatTime(entry.timestamp)}</span>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Activity className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No activity matching your filters.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </PageTransition>
  );
}
