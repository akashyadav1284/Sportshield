/** SportShield AI — Scheduled Scans Page */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, RefreshCw, CheckCircle2, AlertTriangle, Globe, Search, Zap, Calendar } from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import api from '../lib/api';

type ScanFrequency = 'real-time' | 'hourly' | 'daily' | 'weekly';
type ScanStatus = 'active' | 'paused' | 'running';

interface ScheduledScan {
  id: string;
  assetName: string;
  frequency: ScanFrequency;
  status: ScanStatus;
  platforms: string[];
  lastScan: string;
  nextScan: string;
  violationsFound: number;
  totalScans: number;
}

interface ScanHistoryEntry {
  id: string;
  assetName: string;
  timestamp: string;
  duration: string;
  urlsScanned: number;
  violationsFound: number;
  status: 'completed' | 'failed' | 'partial';
}

const FREQ_COLORS: Record<ScanFrequency, string> = {
  'real-time': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  hourly: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  daily: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  weekly: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
};

const DEMO_SCANS: ScheduledScan[] = [
  { id: 'SC-001', assetName: 'Champions League Final Highlights', frequency: 'real-time', status: 'active', platforms: ['youtube', 'twitter', 'web'], lastScan: '2 min ago', nextScan: 'Continuous', violationsFound: 12, totalScans: 847 },
  { id: 'SC-002', assetName: 'Premier League Goal Compilation', frequency: 'hourly', status: 'active', platforms: ['youtube', 'tiktok'], lastScan: '23 min ago', nextScan: '37 min', violationsFound: 5, totalScans: 234 },
  { id: 'SC-003', assetName: 'Team Logo - Official Badge', frequency: 'daily', status: 'active', platforms: ['web', 'instagram'], lastScan: '6 hours ago', nextScan: '18 hours', violationsFound: 3, totalScans: 45 },
  { id: 'SC-004', assetName: 'Match Day Promo Video', frequency: 'weekly', status: 'paused', platforms: ['youtube'], lastScan: '3 days ago', nextScan: 'Paused', violationsFound: 1, totalScans: 8 },
  { id: 'SC-005', assetName: 'Exclusive Interview Clip', frequency: 'daily', status: 'running', platforms: ['youtube', 'twitter', 'web'], lastScan: 'Running now...', nextScan: '24 hours', violationsFound: 0, totalScans: 31 },
];

const DEMO_HISTORY: ScanHistoryEntry[] = [
  { id: 'H-001', assetName: 'Champions League Final', timestamp: '2 min ago', duration: '12s', urlsScanned: 1247, violationsFound: 2, status: 'completed' },
  { id: 'H-002', assetName: 'Premier League Goals', timestamp: '23 min ago', duration: '8s', urlsScanned: 856, violationsFound: 0, status: 'completed' },
  { id: 'H-003', assetName: 'Team Logo', timestamp: '6 hours ago', duration: '45s', urlsScanned: 3421, violationsFound: 1, status: 'completed' },
  { id: 'H-004', assetName: 'Exclusive Interview', timestamp: '12 hours ago', duration: '—', urlsScanned: 0, violationsFound: 0, status: 'failed' },
  { id: 'H-005', assetName: 'Match Day Promo', timestamp: '3 days ago', duration: '5s', urlsScanned: 412, violationsFound: 1, status: 'completed' },
];

export default function ScheduledScans() {
  const [scans] = useState(DEMO_SCANS);
  const [history] = useState(DEMO_HISTORY);
  const queryClient = useQueryClient();

  const scanAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/scan/trigger');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Scans Initiated', {
        description: `Triggered scanning for ${data.asset_count || 'all active'} assets.`,
      });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
    onError: () => {
      toast.error('Scan Failed', {
        description: 'Could not trigger the scans. Please try again.',
      });
    },
  });

  const stats = {
    activeScans: scans.filter(s => s.status === 'active').length,
    totalScansToday: 156,
    violationsToday: 4,
    avgScanTime: '9.2s',
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Scheduled Scans</h1>
          <p className="text-zinc-400">Configure automated scanning frequency per asset.</p>
        </div>
        <GlowingButton 
          variant="primary" 
          size="sm" 
          className="gap-2"
          onClick={() => scanAllMutation.mutate()}
          disabled={scanAllMutation.isPending}
        >
          <Zap className={`w-4 h-4 ${scanAllMutation.isPending ? 'animate-pulse text-yellow-400' : ''}`} /> 
          {scanAllMutation.isPending ? 'Starting...' : 'Run All Now'}
        </GlowingButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Schedules', value: stats.activeScans, icon: Calendar, glow: 'cyan' as const },
          { label: 'Scans Today', value: stats.totalScansToday, icon: Search, glow: 'purple' as const },
          { label: 'Violations Found Today', value: stats.violationsToday, icon: AlertTriangle, glow: 'red' as const },
          { label: 'Avg Scan Duration', value: stats.avgScanTime, icon: Clock, glow: 'emerald' as const },
        ].map((s, i) => (
          <GlassCard key={i} glowColor={s.glow}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${s.glow}-500/10 border border-${s.glow}-500/20`}>
                <s.icon className={`w-4 h-4 text-${s.glow}-400`} />
              </div>
              <div>
                <p className="text-xs text-zinc-400">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Scan Schedules */}
      <GlassCard noPadding>
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Active Scan Schedules</h3>
          <span className="text-xs text-zinc-500">{scans.length} configured</span>
        </div>
        <div className="divide-y divide-[#1F2937]">
          {scans.map((scan, i) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-6 py-4 flex items-center gap-4 hover:bg-[#1F2937]/50 transition-colors group"
            >
              <div className={`relative p-2 rounded-lg border ${
                scan.status === 'running' ? 'bg-cyan-500/10 border-cyan-500/30' :
                scan.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20' :
                'bg-zinc-500/10 border-zinc-500/20'
              }`}>
                {scan.status === 'running' ? (
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : scan.status === 'active' ? (
                  <Play className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Pause className="w-4 h-4 text-zinc-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{scan.assetName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${FREQ_COLORS[scan.frequency]}`}>
                    {scan.frequency}
                  </span>
                  <div className="flex items-center gap-1">
                    {scan.platforms.map(p => (
                      <span key={p} className="text-[10px] text-zinc-500 capitalize bg-[#0B0F19] px-1.5 py-0.5 rounded border border-[#1F2937]">{p}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-6 text-right">
                <div>
                  <p className="text-xs text-zinc-400">Last Scan</p>
                  <p className={`text-xs font-medium ${scan.status === 'running' ? 'text-cyan-400' : 'text-zinc-200'}`}>{scan.lastScan}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Next</p>
                  <p className="text-xs font-medium text-zinc-200">{scan.nextScan}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Found</p>
                  <p className={`text-xs font-bold ${scan.violationsFound > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{scan.violationsFound}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Total</p>
                  <p className="text-xs font-medium text-zinc-300">{scan.totalScans}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Scan History */}
      <GlassCard noPadding>
        <div className="px-6 py-4 border-b border-[#1F2937]">
          <h3 className="text-sm font-semibold text-white">Recent Scan History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937]">
                <th className="text-left text-xs text-zinc-500 font-medium px-6 py-3">Asset</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Time</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Duration</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">URLs</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Violations</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {history.map((h, i) => (
                <motion.tr
                  key={h.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-[#1F2937]/30 transition-colors"
                >
                  <td className="px-6 py-3 text-zinc-200 font-medium">{h.assetName}</td>
                  <td className="px-4 py-3 text-zinc-400">{h.timestamp}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono">{h.duration}</td>
                  <td className="px-4 py-3 text-zinc-300">{h.urlsScanned.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${h.violationsFound > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{h.violationsFound}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                      h.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      h.status === 'failed' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </PageTransition>
  );
}
