/** SportShield AI — Premium Violations Page */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useViolations, useUpdateViolationStatus, useBulkUpdateViolationStatus } from '../hooks/useViolations';
import { SeverityTag } from '../components/shared/SeverityTag';
import { ListItemSkeleton } from '../components/shared/Skeletons';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import { cn } from '../lib/utils';
import { 
  Search, Eye, Flag, CheckCircle2, XCircle, ExternalLink, 
  ShieldAlert, MoreVertical, Filter, ArrowUpRight 
} from 'lucide-react';

const PLATFORM_COLORS: Record<string, string> = {
  google: '#EF4444', bing: '#3B82F6', twitter: '#0EA5E9', youtube: '#DC2626', web: '#A1A1AA', unknown: '#71717A',
};

/**
 * Premium Violations Dashboard Component
 *
 * Renders the primary threat feed interface for analysts to triage detected
 * intellectual property infringements. It features:
 * - Real-time filtering via global layout inputs.
 * - Skeleton loaders optimized via Framer Motion to hit 0 CLS.
 * - Multi-select tracking for batch triage actions.
 * - Deep-link routing to individual incident dossiers.
 *
 * @returns {JSX.Element} The Violations dashboard page.
 */
export default function Violations() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useViolations({
    page, limit: 15,
    search: search || undefined, severity: severity || undefined,
    status: status || undefined, platform: platform || undefined,
  });
  const updateStatus = useUpdateViolationStatus();
  const bulkUpdateStatus = useBulkUpdateViolationStatus();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.items) {
      setSelectedIds(new Set(data.items.map(v => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    await bulkUpdateStatus.mutateAsync({ violation_ids: Array.from(selectedIds), status: newStatus });
    setSelectedIds(new Set());
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Threat Incidents</h1>
          <p className="text-zinc-400">Review, flag, and remediate detected IP violations.</p>
        </div>
        <div className="flex items-center gap-3">
          <GlowingButton variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Export Log
          </GlowingButton>
        </div>
      </div>

      {/* Futuristic Filter Bar */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-[240px] relative group">
          <div className="absolute inset-0 bg-violet-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl pointer-events-none" />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
          <input 
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search by detected URL..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono placeholder:text-zinc-600" 
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          {[
            { value: severity, setter: setSeverity, label: 'Severity', options: ['', 'high', 'medium', 'low'] },
            { value: status, setter: setStatus, label: 'Status', options: ['', 'new', 'reviewed', 'flagged', 'dismissed'] },
            { value: platform, setter: setPlatform, label: 'Platform', options: ['', 'google', 'bing', 'twitter', 'youtube', 'web'] },
          ].map(filter => (
            <select 
              key={filter.label} 
              value={filter.value} 
              onChange={e => { filter.setter(e.target.value); setPage(1); }}
              className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none min-w-[140px] cursor-pointer transition-colors capitalize"
            >
              <option value="">All {filter.label}s</option>
              {filter.options.filter(Boolean).map(opt => (
                <option key={opt} value={opt} className="capitalize">{opt}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Main Table Area */}
      {isLoading ? (
        <GlassCard noPadding className="overflow-hidden flex flex-col divide-y divide-zinc-800/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </GlassCard>
      ) : !data?.items?.length ? (
        <EmptyState type="violations" title="No violations found" description="No violations match your current filters. Try adjusting your search criteria." />
      ) : (
        <GlassCard noPadding className="overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                      checked={!!data?.items?.length && selectedIds.size === data.items.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 font-semibold w-[25%]">Detected Asset</th>
                  <th className="px-6 py-4 font-semibold w-[15%]">Platform Info</th>
                  <th className="px-6 py-4 font-semibold w-[30%]">Detection URL</th>
                  <th className="px-6 py-4 font-semibold w-[10%]">Status</th>
                  <th className="px-6 py-4 font-semibold text-right w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <AnimatePresence>
                  {data.items.map((v) => (
                    <motion.tr 
                      key={v.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="group hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                          checked={selectedIds.has(v.id)}
                          onChange={(e) => handleSelect(v.id, e.target.checked)}
                        />
                      </td>
                      {/* Asset Col */}
                      <td className="px-4 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700/50 overflow-hidden flex-shrink-0">
                            {v.thumbnail_url ? (
                              <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <ShieldAlert className="w-5 h-5 text-zinc-600 m-2.5" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm text-zinc-200 truncate pr-4">{v.asset_name || 'Unknown Reference'}</span>
                            <div className="mt-1 flex items-center gap-2">
                              <SeverityTag severity={v.severity} />
                              <ConfidenceBadge score={v.confidence_score} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Platform Col */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[v.platform] || '#71717A' }} />
                          <span className="capitalize font-semibold text-zinc-300">{v.platform}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500">{new Date(v.detected_at).toLocaleDateString()}</p>
                      </td>

                      {/* URL Col */}
                      <td className="px-6 py-4 block">
                        <div className="bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 flex items-center justify-between group/url w-full max-w-sm">
                          <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[280px]">
                            {v.detected_url}
                          </span>
                          <a href={v.detected_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Status Col */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                          v.status === 'new' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          v.status === 'flagged' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          v.status === 'reviewed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-zinc-800 text-zinc-500 border-zinc-700'
                        )}>
                          {v.status}
                        </span>
                      </td>

                      {/* Actions Col */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          
                          {/* Resolve */}
                          <button onClick={() => updateStatus.mutate({ id: v.id, status: 'reviewed' })} title="Mark Resolved"
                            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          
                          {/* Flag */}
                          <button onClick={() => updateStatus.mutate({ id: v.id, status: 'flagged' })} title="Flag for Takedown"
                            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors">
                            <Flag className="w-4 h-4" />
                          </button>
                          
                          {/* Dismiss */}
                          <button onClick={() => updateStatus.mutate({ id: v.id, status: 'dismissed' })} title="False Positive"
                            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>

                          <div className="w-px h-5 bg-zinc-700 mx-1" />

                          {/* Inspect */}
                          <Link to={`/violations/${v.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                            <span className="text-xs font-semibold">Inspect</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Table Footer Pagination */}
          {data.total > data.limit && (
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 font-mono">
                Log {((page - 1) * data.limit) + 1} — {Math.min(page * data.limit, data.total)} of {data.total} items
              </p>
              <div className="flex gap-2">
                <GlowingButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev Block</GlowingButton>
                <GlowingButton variant="outline" size="sm" disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)}>Next Block</GlowingButton>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 shadow-2xl rounded-2xl"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-zinc-700">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                {selectedIds.size}
              </div>
              <span className="text-sm font-medium text-white">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('flagged')}
                disabled={bulkUpdateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Flag className="w-4 h-4" /> Flag All
              </button>
              <button
                onClick={() => handleBulkAction('dismissed')}
                disabled={bulkUpdateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Dismiss All
              </button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
