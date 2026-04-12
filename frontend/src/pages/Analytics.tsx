/** SportShield AI — Premium Analytics Page */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../lib/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { ShieldAlert, TrendingDown, Target, Award } from 'lucide-react';
import type { DashboardStats, TrendsResponse, PlatformResponse, SeverityResponse } from '../types';

const PLATFORM_COLORS: Record<string, string> = { google: '#EF4444', bing: '#3B82F6', twitter: '#0EA5E9', youtube: '#DC2626', web: '#A1A1AA', unknown: '#71717A' };

export default function Analytics() {
  const [days, setDays] = useState(30);
  const { data: stats } = useQuery({ queryKey: ['analytics', 'stats'], queryFn: async () => { const { data } = await api.get<DashboardStats>('/analytics/stats'); return data; }, refetchInterval: 15000 });
  const { data: trends, isLoading } = useQuery({ queryKey: ['analytics', 'trends', days], queryFn: async () => { const { data } = await api.get<TrendsResponse>('/analytics/trends', { params: { days } }); return data; }, refetchInterval: 15000 });
  const { data: platforms } = useQuery({ queryKey: ['analytics', 'platforms'], queryFn: async () => { const { data } = await api.get<PlatformResponse>('/analytics/platforms'); return data; }, refetchInterval: 15000 });
  const { data: severity } = useQuery({ queryKey: ['analytics', 'severity'], queryFn: async () => { const { data } = await api.get<SeverityResponse>('/analytics/severity'); return data; }, refetchInterval: 15000 });

  const statCards = [
    { label: 'Total Violations', value: stats?.total_violations ?? 0, icon: ShieldAlert, glow: 'red' as const },
    { label: 'Resolved Rate', value: stats?.total_violations ? `${Math.round(((stats.resolved_this_week || 0) / Math.max(stats.total_violations, 1)) * 100)}%` : '0%', icon: TrendingDown, glow: 'emerald' as const },
    { label: 'Avg Confidence', value: '88%', icon: Target, glow: 'cyan' as const },
    { label: 'Active Threats', value: stats?.active_violations ?? 0, icon: Award, glow: 'amber' as const },
  ];

  if (isLoading) return <div className="py-20 flex justify-center"><LoadingSpinner text="Loading premium analytics..." /></div>;

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Deep Analytics</h1>
          <p className="text-zinc-400">Historical threat intelligence and platform distribution.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <GlassCard key={i} glowColor={c.glow}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-${c.glow}-500/10 border border-${c.glow}-500/20`}>
                <c.icon className={`w-5 h-5 text-${c.glow}-400`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400 mb-1">{c.label}</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{c.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Violations over time */}
      <GlassCard className="flex flex-col h-[350px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Violations Over Time</h3>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm border ${days === d ? 'bg-[#0B0F19] text-white border-[#374151]' : 'bg-[#111827] text-zinc-400 border-transparent hover:text-white hover:bg-[#1F2937]'}`}>{d} Days</button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-[250px] -ml-4">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trends?.data || []}>
              <defs>
                <linearGradient id="colorCountAnalytic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717A' }} tickFormatter={(d: string) => d.slice(5)} stroke="#1F2937" />
              <YAxis tick={{ fontSize: 10, fill: '#71717A' }} stroke="#1F2937" allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1F2937', color: '#fff' }} 
                itemStyle={{ color: '#fff' }} 
              />
              <Area type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={3} fill="url(#colorCountAnalytic)" dot={{ fill: '#06B6D4', r: 3, strokeWidth: 2, stroke: '#111827' }} activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform bar chart */}
        <GlassCard className="flex flex-col h-[320px]">
          <h3 className="text-base font-semibold text-white mb-6">Top Platforms</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platforms?.data || []} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={true} vertical={true} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#71717A' }} stroke="#1F2937" allowDecimals={false} />
                <YAxis dataKey="platform" type="category" tick={{ fontSize: 11, fill: '#A1A1AA' }} stroke="#1F2937" width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1F2937', color: '#fff' }} cursor={{ fill: '#1F2937', opacity: 0.4 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {(platforms?.data || []).map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={PLATFORM_COLORS[entry.platform] || '#71717A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Severity breakdown */}
        <GlassCard className="flex flex-col h-[320px]">
          <h3 className="text-base font-semibold text-white mb-6">Severity Breakdown</h3>
          <div className="space-y-6 flex-1 flex flex-col justify-center pb-4 px-2">
            {(severity?.data || []).map((s, i) => {
              const total = severity?.data.reduce((a, b) => a + b.count, 0) || 1;
              const pct = (s.count / total) * 100;
              const colors: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#3B82F6' };
              return (
                <div key={i} className="group">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium capitalize text-zinc-400 group-hover:text-zinc-200 transition-colors">{s.severity}</span>
                    <span className="text-sm font-bold text-white bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1F2937]">{s.count}</span>
                  </div>
                  <div className="h-2.5 bg-[#0B0F19] rounded-full overflow-hidden shadow-inner border border-[#1F2937]/50">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: colors[s.severity] || '#71717A', boxShadow: `0 0 10px ${colors[s.severity]}40` }} />
                  </div>
                </div>
              );
            })}
            {!severity?.data?.length && <p className="text-sm text-zinc-600 text-center py-8">No incident severity data registered yet.</p>}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
