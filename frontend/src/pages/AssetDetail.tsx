/** SportShield AI — Asset Detail Page (Dark Theme) */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAsset, useDeleteAsset } from '../hooks/useAssets';
import { useViolations } from '../hooks/useViolations';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SeverityTag } from '../components/shared/SeverityTag';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { GlassCard } from '../components/shared/GlassCard';
import { GlowingButton } from '../components/shared/GlowingButton';
import { PageTransition } from '../components/shared/PageTransition';
import {
  ArrowLeft, ScanSearch, Trash2, Image, Film, Fingerprint,
  Hash, Database, Clock, ShieldAlert, ExternalLink, Shield,
  Activity, Eye, Calendar, HardDrive, Cpu, ArrowUpRight
} from 'lucide-react';
import api from '../lib/api';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: asset, isLoading } = useAsset(id!);
  const { data: violations } = useViolations({ asset_id: id, limit: 50 });
  const deleteAsset = useDeleteAsset();

  const scanMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { data } = await api.post(`/assets/${assetId}/scan`);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Scan Queued', {
        description: `Asset scan has been dispatched. Results will appear shortly.`,
      });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
    onError: (err: any) => {
      toast.error('Scan Failed', {
        description: err?.response?.data?.detail || 'Could not trigger scan for this asset.',
      });
    },
  });

  if (isLoading) return (
    <PageTransition>
      <div className="py-20"><LoadingSpinner text="Loading asset intelligence..." /></div>
    </PageTransition>
  );

  if (!asset) return (
    <PageTransition>
      <div className="py-20 text-center text-zinc-500">Asset not found</div>
    </PageTransition>
  );

  const formatSize = (bytes: number) => {
    if (bytes > 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
    if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const statusColor = {
    indexed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    processing: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    failed: 'text-red-400 bg-red-500/10 border-red-500/20',
  }[asset.fingerprint_status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';

  const metaItems = [
    { label: 'File Type', value: asset.file_type.toUpperCase(), icon: asset.file_type === 'video' ? Film : Image },
    { label: 'Size', value: formatSize(asset.file_size_bytes), icon: HardDrive },
    { label: 'MIME Type', value: asset.mime_type, icon: Hash },
    { label: 'Upload Date', value: new Date(asset.created_at).toLocaleDateString(), icon: Calendar },
    { label: 'Last Scanned', value: asset.last_scan_at ? new Date(asset.last_scan_at).toLocaleDateString() : 'Never', icon: ScanSearch },
    { label: 'Scan Count', value: asset.scan_count.toString(), icon: Activity },
  ];

  return (
    <PageTransition className="space-y-6">
      {/* Back navigation */}
      <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-cyan-400 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Asset Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Media Preview */}
        <div className="lg:col-span-2">
          <GlassCard className="overflow-hidden p-0">
            <div className="aspect-square bg-[#0B0F19] flex items-center justify-center relative">
              {asset.file_type === 'video' ? (
                <div className="text-center">
                  <Film className="w-20 h-20 text-zinc-600 mx-auto mb-3" />
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Video Asset</span>
                </div>
              ) : asset.storage_url ? (
                <img src={asset.storage_url} alt={asset.name} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <Image className="w-20 h-20 text-zinc-600 mx-auto mb-3" />
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Image Asset</span>
                </div>
              )}
              {/* Type badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
                {asset.file_type === 'video' ? <Film className="w-3 h-3 text-cyan-400" /> : <Image className="w-3 h-3 text-cyan-400" />}
                <span className="text-xs font-medium text-white uppercase">{asset.file_type}</span>
              </div>
              {/* Violation count badge */}
              {(asset.violation_count ?? 0) > 0 && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span className="text-xs font-semibold text-red-300">{asset.violation_count} violations</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right — Metadata & Actions */}
        <div className="lg:col-span-3 space-y-5">
          {/* Asset Info Card */}
          <GlassCard>
            <h1 className="text-2xl font-bold text-white mb-2">{asset.name}</h1>
            {asset.description && <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{asset.description}</p>}

            {asset.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {asset.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-lg border border-cyan-500/20">{tag}</span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {metaItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                  <div className="p-1.5 rounded-md bg-zinc-700/40">
                    <item.icon className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{item.label}</p>
                    <p className="text-sm font-semibold text-zinc-200">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Fingerprint Info Card */}
          <GlassCard glowColor="cyan">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" /> Fingerprint Intelligence
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                <span className="text-sm text-zinc-400">Status</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor} uppercase tracking-wider`}>
                  {asset.fingerprint_status}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                <span className="text-sm text-zinc-400">Perceptual Hash</span>
                <code className="text-xs bg-zinc-800 text-cyan-300 px-3 py-1.5 rounded-lg font-mono border border-zinc-700/50">{asset.phash || 'N/A'}</code>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                <span className="text-sm text-zinc-400">FAISS Vector ID</span>
                <span className="text-sm font-mono font-semibold text-zinc-200">{asset.faiss_index_id ?? 'N/A'}</span>
              </div>
            </div>
          </GlassCard>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <GlowingButton
              variant="primary"
              size="lg"
              className="flex-1 gap-2"
              onClick={() => scanMutation.mutate(asset.id)}
              disabled={asset.fingerprint_status !== 'indexed' || scanMutation.isPending}
              isLoading={scanMutation.isPending}
            >
              <ScanSearch className="w-4 h-4" />
              {scanMutation.isPending ? 'Scanning...' : 'Scan Now'}
            </GlowingButton>
            <GlowingButton
              variant="destructive"
              size="lg"
              className="gap-2"
              onClick={() => {
                if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
                  deleteAsset.mutate(asset.id);
                  navigate('/assets');
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </GlowingButton>
          </div>
        </div>
      </div>

      {/* Violation History Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Violation History
            <span className="text-sm font-normal text-zinc-500 ml-1">({violations?.total ?? 0})</span>
          </h3>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-700/50">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Platform</th>
                <th className="px-5 py-3 text-left font-medium">Detected URL</th>
                <th className="px-5 py-3 text-left font-medium">Confidence</th>
                <th className="px-5 py-3 text-left font-medium">Severity</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Detected</th>
                <th className="px-5 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {violations?.items?.map(v => (
                <tr key={v.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="capitalize font-medium text-zinc-200">{v.platform}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[250px]">
                    <span className="text-zinc-400 truncate block font-mono text-xs">{v.detected_url}</span>
                  </td>
                  <td className="px-5 py-3.5"><ConfidenceBadge score={v.confidence_score} /></td>
                  <td className="px-5 py-3.5"><SeverityTag severity={v.severity} /></td>
                  <td className="px-5 py-3.5">
                    <span className={`capitalize text-xs font-medium px-2 py-1 rounded-full border ${
                      v.status === 'new' ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' :
                      v.status === 'flagged' ? 'text-red-300 bg-red-500/10 border-red-500/20' :
                      v.status === 'reviewed' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' :
                      'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 text-xs">{new Date(v.detected_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/violations/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Details <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!violations?.items?.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No violations detected for this asset</p>
                    <p className="text-zinc-600 text-xs mt-1">Run a scan to check for unauthorized usage</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </PageTransition>
  );
}
