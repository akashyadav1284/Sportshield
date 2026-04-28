/** SportShield AI — Premium Asset Library */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssets, useDeleteAsset, useTriggerScan } from '../hooks/useAssets';
import { useUpload } from '../hooks/useUpload';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { AssetCardSkeleton } from '../components/shared/Skeletons';
import { EmptyState } from '../components/shared/EmptyState';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import { GradientBadge } from '../components/shared/GradientBadge';
import { UploadModal } from '../components/shared/UploadModal';
import { ConfirmationModal } from '../components/shared/ConfirmationModal';
import { cn, getMediaUrl } from '../lib/utils';
import {
  Upload, Search, Image as ImageIcon, Film, ScanSearch, Trash2, MoreVertical, X,
  CheckCircle2, Clock, AlertCircle, Loader2, FileImage, FileVideo, Shield, ShieldAlert
} from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'zinc' | 'amber' | 'emerald' | 'red'; icon: any }> = {
  pending: { label: 'Pending', variant: 'zinc', icon: Clock },
  processing: { label: 'Processing', variant: 'amber', icon: Loader2 },
  indexed: { label: 'Indexed', variant: 'emerald', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'red', icon: AlertCircle },
};

/**
 * Intellectual Property Vault (Asset Library)
 *
 * Centralized interface for managing protected source material. 
 * Allows users to ingest content via the headless UploadModal intercept,
 * trigger on-demand FAISS index scans, and safely purge digital assets 
 * with protected Confirmation barriers.
 *
 * @returns {JSX.Element} The media management interface.
 */
export default function AssetLibrary() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const { data, isLoading } = useAssets({ page, limit: 12, search: search || undefined, file_type: fileType || undefined, sort_by: sortBy });
  const deleteAsset = useDeleteAsset();
  const triggerScan = useTriggerScan();
  const queryClient = useQueryClient();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Asset Library</h1>
          <p className="text-zinc-400">Manage and monitor your digital media inventory.</p>
        </div>
        <GlowingButton onClick={() => setShowUploadModal(true)} variant="primary" className="gap-2">
          <Upload className="w-4 h-4" /> Secure Upload
        </GlowingButton>
      </div>

      {/* Futuristic Filter Bar */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl pointer-events-none" />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
          <input 
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search fingerprints..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono placeholder:text-zinc-600" 
          />
        </div>

        <div className="flex gap-2">
          {[{ value: '', label: 'All', icon: null }, { value: 'image', label: 'Images', icon: ImageIcon }, { value: 'video', label: 'Videos', icon: Film }].map(ft => (
            <button 
              key={ft.value} 
              onClick={() => { setFileType(ft.value); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                fileType === ft.value 
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:text-zinc-300 hover:bg-zinc-900'
              )}
            >
              {ft.icon && <ft.icon className="w-4 h-4" />} {ft.label}
            </button>
          ))}
        </div>

        <select 
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none min-w-[140px] cursor-pointer transition-colors" 
        >
          <option value="created_at">Latest Registration</option>
          <option value="violation_count">Highest Threat</option>
          <option value="last_scan_at">Recently Scanned</option>
        </select>
      </div>

      {/* Grid Layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AssetCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <EmptyState type="assets" title="Vault is Empty" description="Register your first digital asset to generate a perceptual fingerprint."
          action={<GlowingButton onClick={() => setShowUploadModal(true)}>Upload Asset</GlowingButton>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {data.items.map((asset, index) => {
              const status = statusConfig[asset.fingerprint_status] || statusConfig.pending;
              return (
                <GlassCard 
                  key={asset.id} 
                  noPadding 
                  glowColor={asset.violation_count > 0 ? 'red' : 'cyan'}
                  className="group flex flex-col"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Media Preview Area */}
                  <Link to={`/assets/${asset.id}`} className="block relative aspect-video bg-zinc-950 overflow-hidden border-b border-zinc-800">
                    {/* Media Render */}
                    {asset.storage_url ? (
                      asset.file_type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950/80 group-hover:bg-zinc-900 transition-colors">
                          <Film className="w-10 h-10 text-cyan-500/50 mb-2" />
                          <span className="text-xs font-mono text-zinc-500">VIDEO_DATA</span>
                        </div>
                      ) : (
                        <img src={getMediaUrl(asset.storage_url)} alt={asset.name} className="w-full h-full object-cover group-hover:scale-[1.03] opacity-80 group-hover:opacity-100 transition-all duration-700" loading="lazy" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-950/80">
                        <ImageIcon className="w-10 h-10 text-zinc-700" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Tags */}
                    <div className="absolute top-3 left-3">
                      <GradientBadge variant={status.variant} dot={true}>
                        {status.label}
                      </GradientBadge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-900/80 border border-zinc-700/50 text-zinc-300 backdrop-blur-md">
                        {asset.file_type}
                      </span>
                    </div>
                  </Link>

                  {/* Asset Info */}
                  <div className="p-4 flex-1 flex flex-col bg-zinc-900/50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <Link to={`/assets/${asset.id}`} className="text-sm font-semibold text-zinc-100 truncate block group-hover:text-cyan-400 transition-colors">{asset.name}</Link>
                        <p className="text-xs text-zinc-500 font-mono mt-1">{formatSize(asset.file_size_bytes)}</p>
                      </div>

                      {/* Dropdown Menu */}
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === asset.id ? null : asset.id)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" aria-label="Asset actions">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === asset.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 mt-1 w-40 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl py-1 z-20 overflow-hidden">
                              <button onClick={() => { triggerScan.mutate(asset.id); setMenuOpen(null); }}
                                disabled={asset.fingerprint_status !== 'indexed'}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-400 disabled:opacity-40 disabled:hover:bg-transparent">
                                <ScanSearch className="w-4 h-4" /> Deep Scan
                              </button>
                              <div className="h-px bg-zinc-800 my-1" />
                              <button onClick={() => { setAssetToDelete(asset.id); setMenuOpen(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" /> Purge
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {asset.last_scan_at ? new Date(asset.last_scan_at).toLocaleDateString() : 'Unscanned'}
                      </div>
                      {asset.violation_count > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]">
                          <ShieldAlert className="w-3 h-3" />
                          {asset.violation_count} Alert{asset.violation_count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="flex justify-center gap-2 pt-4">
          <GlowingButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</GlowingButton>
          <div className="flex items-center justify-center px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400">
            Page {page} of {Math.ceil(data.total / data.limit)}
          </div>
          <GlowingButton variant="outline" size="sm" disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)}>Next</GlowingButton>
        </div>
      )}

      {/* Drag & Drop Upload Modal */}
      {showUploadModal && <UploadModal onClose={() => { setShowUploadModal(false); queryClient.invalidateQueries({ queryKey: ['assets'] }); }} />}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {assetToDelete && (
          <ConfirmationModal
            title="Purge Asset"
            description="Are you sure you want to permanently delete this asset from the Enterprise Vault? This action cannot be undone and will remove it from all FAISS indexes."
            confirmText="Shred Asset"
            isLoading={deleteAsset.isPending}
            onConfirm={async () => {
              await deleteAsset.mutateAsync(assetToDelete);
              setAssetToDelete(null);
            }}
            onCancel={() => setAssetToDelete(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
