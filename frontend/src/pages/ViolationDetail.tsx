/** SportShield AI — Violation Detail Page (Dark Theme) */
import { useParams, Link } from 'react-router-dom';
import { useViolation, useUpdateViolationStatus, useDownloadEvidence } from '../hooks/useViolations';
import { useAsset } from '../hooks/useAssets';
import { generateEvidencePDF } from '../lib/pdf';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SeverityTag } from '../components/shared/SeverityTag';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowingButton } from '../components/shared/GlowingButton';
import { PageTransition } from '../components/shared/PageTransition';
import { ArrowLeft, ExternalLink, Download, CheckCircle2, Flag, XCircle, ShieldAlert, Image, Fingerprint, Film, Database, Calendar } from 'lucide-react';
import { getMediaUrl } from '../lib/utils';

export default function ViolationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: violation, isLoading } = useViolation(id!);
  const { data: asset } = useAsset(violation?.asset_id || '');
  const updateStatus = useUpdateViolationStatus();

  if (isLoading) return (
    <PageTransition>
      <div className="py-20"><LoadingSpinner text="Loading violation details..." /></div>
    </PageTransition>
  );

  if (!violation) return (
    <PageTransition>
      <div className="py-20 text-center text-zinc-500">Violation not found</div>
    </PageTransition>
  );

  const gaugePercent = Math.min(violation.confidence_score, 100);

  const formatSize = (bytes: number) => {
    if (bytes > 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
    if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <PageTransition className="space-y-6">
      <Link to="/violations" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-cyan-400 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Violations
      </Link>

      {/* Compare panel */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Left: Original Asset */}
        <div className="lg:col-span-3">
          <GlassCard className="h-full flex flex-col">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Image className="w-4 h-4 text-cyan-500" /> Original Protected Asset
            </h3>
            
            <div className="aspect-video bg-[#0B0F19] rounded-lg overflow-hidden mb-5 flex items-center justify-center border border-zinc-700/50 relative group">
              {asset?.storage_url ? (
                <>
                  <img src={getMediaUrl(asset.storage_url)} alt={asset.name} className="w-full h-full object-contain" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-white/10">
                    {asset.file_type === 'video' ? <Film className="w-3 h-3 text-cyan-400" /> : <Image className="w-3 h-3 text-cyan-400" />}
                    <span className="text-[10px] font-medium text-white uppercase tracking-wider">{asset.file_type}</span>
                  </div>
                </>
              ) : (
                <Image className="w-12 h-12 text-zinc-700" />
              )}
            </div>
            
            <h4 className="text-lg font-bold text-white mb-3">{asset?.name || violation.asset_name || 'Unknown Asset'}</h4>
            
            {asset && (
              <div className="mt-auto grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                  <Database className="w-3.5 h-3.5 text-zinc-500" />
                  <div>
                    <p className="text-[10px] uppercase text-zinc-500">Size</p>
                    <p className="text-sm font-medium text-zinc-300">{formatSize(asset.file_size_bytes)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <div>
                    <p className="text-[10px] uppercase text-zinc-500">Indexed</p>
                    <p className="text-sm font-medium text-zinc-300">{new Date(asset.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Center: Match Metrics */}
        <div className="lg:col-span-1 flex flex-col justify-center gap-4">
          <GlassCard glowColor={gaugePercent >= 90 ? 'red' : gaugePercent >= 75 ? 'amber' : 'cyan'} className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Fingerprint className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-4 font-medium">Confidence</p>
            
            {/* Visual Gauge */}
            <div className="relative w-24 h-24 mx-auto mb-5 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="2.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                  stroke={gaugePercent >= 90 ? '#ef4444' : gaugePercent >= 75 ? '#f59e0b' : '#06B6D4'}
                  strokeWidth="2.5" strokeDasharray={`${gaugePercent}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white leading-none">{violation.confidence_score.toFixed(0)}<span className="text-sm text-zinc-500">%</span></span>
              </div>
            </div>
            
            <SeverityTag severity={violation.severity} />

            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between items-center p-2 bg-zinc-800/40 rounded border border-zinc-700/30">
                <span className="text-[10px] text-zinc-500 uppercase">pHash Dist</span>
                <span className="text-xs font-mono font-semibold text-cyan-300">{violation.phash_distance ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-zinc-800/40 rounded border border-zinc-700/30">
                <span className="text-[10px] text-zinc-500 uppercase">CNN Sim</span>
                <span className="text-xs font-mono font-semibold text-purple-300">{violation.cnn_similarity?.toFixed(3) ?? 'N/A'}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Detected media */}
        <div className="lg:col-span-3">
          <GlassCard className="h-full flex flex-col" glowColor={violation.status === 'flagged' ? 'red' : 'cyan'}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Detected Violation
            </h3>
            
            <div className="aspect-video bg-[#0B0F19] rounded-lg overflow-hidden mb-5 flex items-center justify-center border border-zinc-700/50">
              {violation.thumbnail_url ? (
                <img src={violation.thumbnail_url} alt="Detected media" className="w-full h-full object-contain" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-zinc-700" />
              )}
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Source URL</p>
                <a href={violation.detected_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-start gap-1.5 break-all text-sm font-medium">
                  {violation.detected_url} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Platform</p>
                  <p className="text-sm font-semibold capitalize text-zinc-200">{violation.platform}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Detected At</p>
                  <p className="text-sm font-semibold text-zinc-200">{new Date(violation.detected_at).toLocaleString()}</p>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 uppercase">Current Status</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    violation.status === 'new' ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20' :
                    violation.status === 'flagged' ? 'text-red-300 bg-red-500/10 border border-red-500/20' :
                    violation.status === 'reviewed' ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20' :
                    'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {violation.status}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Action bar */}
      <GlassCard className="flex flex-wrap items-center gap-4 py-4">
        <GlowingButton
          variant={violation.status === 'reviewed' ? 'primary' : 'outline'}
          className={violation.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30' : ''}
          onClick={() => updateStatus.mutate({ id: violation.id, status: 'reviewed' })}
          disabled={updateStatus.isPending || violation.status === 'reviewed'}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Reviewed
        </GlowingButton>
        
        <GlowingButton
          variant={violation.status === 'flagged' ? 'destructive' : 'outline'}
          className={violation.status === 'flagged' ? '' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'}
          onClick={() => updateStatus.mutate({ id: violation.id, status: 'flagged' })}
          disabled={updateStatus.isPending || violation.status === 'flagged'}
        >
          <Flag className="w-4 h-4 mr-2" /> Flag for Legal
        </GlowingButton>
        
        <GlowingButton
          variant={violation.status === 'dismissed' ? 'primary' : 'outline'}
          className={violation.status === 'dismissed' ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'text-zinc-400 hover:text-white'}
          onClick={() => updateStatus.mutate({ id: violation.id, status: 'dismissed' })}
          disabled={updateStatus.isPending || violation.status === 'dismissed'}
        >
          <XCircle className="w-4 h-4 mr-2" /> Dismiss False Positive
        </GlowingButton>
        
        <div className="flex-1" />
        
        <GlowingButton
          variant="primary"
          onClick={() => generateEvidencePDF(violation, asset || undefined)}
        >
          <Download className="w-4 h-4 mr-2" /> Download Evidence PDF
        </GlowingButton>
      </GlassCard>
    </PageTransition>
  );
}
