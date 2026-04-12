/** SportShield AI — Premium Alerts Page */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts, useMarkAllRead, useMarkAlertRead } from '../hooks/useAlerts';
import { SeverityTag } from '../components/shared/SeverityTag';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import { cn } from '../lib/utils';
import { CheckCheck, Mail, Wifi, Clock, ArrowRight, BellRing } from 'lucide-react';

export default function Alerts() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAlerts({ page, limit: 30 });
  const markAllRead = useMarkAllRead();
  const markRead = useMarkAlertRead();
  
  const timeAgo = (d: string) => { 
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); 
    if (m < 60) return `${m}m ago`; 
    const h = Math.floor(m / 60); 
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; 
  };

  return (
    <PageTransition className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-7 h-7 text-cyan-400" />
            Notification Hub
          </h1>
          <p className="text-zinc-400 mt-1">Real-time alerts for IP violations across {data?.total ?? 0} incidents.</p>
        </div>
        <GlowingButton 
          variant="outline" 
          onClick={() => markAllRead.mutate()} 
          className="gap-2"
          disabled={!data?.items?.some(a => !a.is_read)}
        >
          <CheckCheck className="w-4 h-4" /> Clear Unread Queue
        </GlowingButton>
      </div>

      {isLoading ? (
        <div className="py-20"><LoadingSpinner text="Syncing alerts..." /></div>
      ) : !data?.items?.length ? (
        <EmptyState type="alerts" title="No active signals" description="Your notification feed is empty. Alerts will stream here in real-time." />
      ) : (
        <GlassCard noPadding className="overflow-hidden">
          <div className="divide-y divide-zinc-800/50">
            <AnimatePresence>
              {data.items.map((a, index) => {
                const sev = (a.metadata_json?.severity as 'high'|'medium'|'low') || 'low';
                const isUnread = !a.is_read;
                
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/violations/${a.violation_id}`} 
                      onClick={() => { if (isUnread) markRead.mutate(a.id); }}
                      className={cn(
                        'flex items-start gap-4 p-5 transition-all duration-300 group relative',
                        isUnread ? 'bg-zinc-800/20 hover:bg-zinc-800/40' : 'bg-transparent hover:bg-zinc-800/20 opacity-70 hover:opacity-100'
                      )}
                    >
                      {/* Left Highlight Bar for unread */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                      )}

                      {/* Icon / Status Dot */}
                      <div className="flex-shrink-0 pt-1">
                        <div className="relative flex h-3 w-3">
                          {isUnread && (
                            <span className={cn(
                              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                              sev === 'high' ? 'bg-red-400' : sev === 'medium' ? 'bg-amber-400' : 'bg-cyan-400'
                            )} />
                          )}
                          <span className={cn(
                            "relative inline-flex rounded-full h-3 w-3",
                            sev === 'high' ? 'bg-red-500' : sev === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'
                          )} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <span className={cn("text-base font-semibold truncate", isUnread ? "text-white" : "text-zinc-300")}>
                            {a.metadata_json?.asset_name || 'Unidentified Reference'}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <SeverityTag severity={sev} />
                            {a.metadata_json?.confidence_score && <ConfidenceBadge score={a.metadata_json.confidence_score} />}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                          <span className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
                            {a.alert_type === 'email' ? <Mail className="w-3 h-3 text-violet-400" /> : <Wifi className="w-3 h-3 text-cyan-400" />}
                            <span className="uppercase">{a.alert_type}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {timeAgo(a.sent_at)}
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="flex-shrink-0 flex items-center justify-center pt-2">
                        <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {data.total > data.limit && (
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-center">
              <GlowingButton variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>Load Previous Logs</GlowingButton>
            </div>
          )}
        </GlassCard>
      )}
    </PageTransition>
  );
}
