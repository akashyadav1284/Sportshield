/** SportShield AI — Premium Dashboard Page */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, ScanSearch, ShieldAlert, CheckCircle2, ExternalLink, Eye, Clock, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../lib/api';
import { SeverityTag } from '../components/shared/SeverityTag';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import { AnimatedAreaChart } from '../components/shared/AnimatedAreaChart';
import { ListItemSkeleton } from '../components/shared/Skeletons';

import type { DashboardStats, Violation, ViolationListResponse, TrendsResponse, PlatformResponse } from '../types';

const PLATFORM_COLORS: Record<string, string> = {
  google: '#EF4444', bing: '#3B82F6', twitter: '#0EA5E9', youtube: '#DC2626', web: '#A1A1AA', unknown: '#71717A',
};

export default function Dashboard() {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/scan/trigger');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Global Scan Initiated', {
        description: `Scanning ${data.asset_count} indexed assets across all networks.`,
      });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
    onError: () => {
      toast.error('Scan Failed', {
        description: 'Could not trigger the global scan. Please try again.',
      });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: async () => { const { data } = await api.get<DashboardStats>('/analytics/stats'); return data; },
    refetchInterval: 15000,
  });

  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ['violations', { limit: 10, severity: severityFilter !== 'all' ? severityFilter : undefined }],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 10 };
      if (severityFilter !== 'all') params.severity = severityFilter;
      const { data } = await api.get<ViolationListResponse>('/violations/', { params });
      return data;
    },
    // Polling simulation for live feed effect
    refetchInterval: 15000,
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics', 'trends', 7],
    queryFn: async () => { const { data } = await api.get<TrendsResponse>('/analytics/trends', { params: { days: 7 } }); return data; },
    refetchInterval: 15000,
  });

  const { data: platforms } = useQuery({
    queryKey: ['analytics', 'platforms'],
    queryFn: async () => { const { data } = await api.get<PlatformResponse>('/analytics/platforms'); return data; },
    refetchInterval: 15000,
  });

  const statCards = [
    { label: 'Total Protected Assets', value: stats?.total_assets ?? 0, icon: Shield, glow: 'cyan' as const, trend: '+12% this week' },
    { label: 'Daily Deep Scans', value: stats?.scans_today ?? 0, icon: ScanSearch, glow: 'purple' as const, trend: 'Network active' },
    { label: 'Active Critical Alerts', value: stats?.active_violations ?? 0, icon: ShieldAlert, glow: 'red' as const, trend: 'Needs review immediately' },
    { label: 'Resolved This Week', value: stats?.resolved_this_week ?? 0, icon: CheckCircle2, glow: 'emerald' as const, trend: 'Good progress' },
  ];

  const filterTabs = ['all', 'high', 'medium', 'low'];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <PageTransition className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Overview Dashboard</h1>
          <p className="text-zinc-400">Real-time network monitoring and IP threat detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <GlowingButton variant="secondary" size="sm">Download Report</GlowingButton>
          <GlowingButton
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
          >
            <ScanSearch className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            {scanMutation.isPending ? 'Scanning...' : 'Global Scan'}
          </GlowingButton>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <GlassCard key={i} glowColor={card.glow} className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl bg-${card.glow}-500/10 border border-${card.glow}-500/20`}>
                <card.icon className={`w-5 h-5 text-${card.glow}-400`} />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-zinc-800/50 rounded-full text-zinc-400 border border-zinc-700/50">
                {card.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400 mb-1">{card.label}</p>
              {statsLoading ? (
                <div className="h-10 w-24 rounded-lg bg-zinc-800/50 animate-pulse mt-1" />
              ) : (
                <h3 className="text-4xl font-bold text-white tracking-tight">
                  {card.value.toLocaleString()}
                </h3>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2): Live Feed */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <GlassCard noPadding className="flex-1 flex flex-col min-h-[500px]">
            {/* Feed Header */}
            <div className="px-6 py-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                </div>
                <h2 className="text-lg font-semibold text-white">Live Violation Network</h2>
              </div>
              <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5" role="tablist" aria-label="Severity Filters">
                {filterTabs.map(tab => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={severityFilter === tab}
                    onClick={() => setSeverityFilter(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      severityFilter === tab
                        ? 'bg-white/10 text-white shadow-md border border-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2" aria-live="polite" aria-atomic="false">
              {violationsLoading ? (
                <div className="flex flex-col h-full space-y-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0F19]/50 z-10 pointer-events-none" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ListItemSkeleton key={i} />
                  ))}
                </div>
              ) : !violations?.items?.length ? (
                <div className="h-full flex items-center justify-center p-8">
                  <EmptyState type="violations" title="Network Secure" description="No active IP violations currently detected." />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {violations.items.map((v: Violation, index: number) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative px-4 py-4 mb-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-300"
                    >
                      {/* Left glow accent on hover based on severity */}
                      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity bg-${v.severity === 'high' ? 'red' : v.severity === 'medium' ? 'amber' : 'cyan'}-500 shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                      
                      <div className="flex items-start gap-4">
                        {/* Avatar / Thumbnail */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/20 border border-white/5 shadow-inner flex-shrink-0">
                          {v.thumbnail_url ? (
                            <img src={v.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ShieldAlert className="w-6 h-6 text-zinc-500" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </div>

                        {/* Middle Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <SeverityTag severity={v.severity} />
                            <span className="text-xs text-zinc-500">•</span>
                            <span className="text-xs font-mono text-zinc-400 truncate">{v.asset_name || 'Unidentified Asset'}</span>
                          </div>
                          <p className="text-sm font-medium text-zinc-200 truncate pr-4">{v.detected_url}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <ConfidenceBadge score={v.confidence_score} />
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-800/50">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[v.platform] }} />
                              <span className="capitalize">{v.platform}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 ml-2">
                              <Clock className="w-3 h-3" />
                              {timeAgo(v.detected_at)}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                          <Link to={`/violations/${v.id}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 transition-all shadow-lg hover:shadow-cyan-500/20">
                            <ArrowUpRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column (Span 1): Analytics */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Trend Chart */}
          <GlassCard className="flex flex-col">
            <h3 className="text-base font-semibold text-white mb-1">Threat Frequency</h3>
            <p className="text-xs text-zinc-400 mb-4">7-day rolling window detection volume.</p>
            <div style={{ width: '100%', height: 180 }}>
              {trends?.data?.length ? (
                <AnimatedAreaChart 
                  data={trends.data.slice(-7).map(d => ({ ...d, dateFormatted: d.date.slice(5) }))} 
                  xKey="dateFormatted" 
                  yKey="count" 
                  gradientFrom="#06B6D4" 
                  gradientTo="#8B5CF6"
                />
              ) : (
                <div className="h-full flex items-center justify-center"><p className="text-sm text-zinc-600">No chart data</p></div>
              )}
            </div>
          </GlassCard>

          {/* Platform Distribution */}
          <GlassCard className="flex-1 flex flex-col">
            <h3 className="text-base font-semibold text-white mb-6">Attack Vectors</h3>
            
            {platforms?.data?.length ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie 
                      data={platforms.data} 
                      dataKey="count" 
                      nameKey="platform" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55} 
                      outerRadius={75} 
                      paddingAngle={4}
                      stroke="transparent"
                      cornerRadius={4}
                    >
                      {platforms.data.map((entry, i) => (
                        <Cell key={i} fill={PLATFORM_COLORS[entry.platform] || '#71717A'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [value, 'Incidents']} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="w-full space-y-3 px-2">
                  {platforms.data.map((p, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-md shadow-sm opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: PLATFORM_COLORS[p.platform] || '#71717A' }} />
                        <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors capitalize">{p.platform}</span>
                      </div>
                      <span className="text-sm font-semibold text-white bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
                        {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center"><p className="text-sm text-zinc-600">No data available</p></div>
            )}
          </GlassCard>
        </div>

      </div>
    </PageTransition>
  );
}
