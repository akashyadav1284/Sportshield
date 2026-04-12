/** SportShield AI — Skeleton Loaders */
import { cn } from '../../lib/utils';
import { GlassCard } from './GlassCard';

export function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-zinc-500/10 to-transparent" />
  );
}

export function AssetCardSkeleton() {
  return (
    <GlassCard noPadding className="flex flex-col relative overflow-hidden h-full">
      <div className="relative aspect-video bg-zinc-900 overflow-hidden border-b border-zinc-800">
        <Shimmer />
        {/* Mock Badge */}
        <div className="absolute top-3 left-3 w-16 h-5 rounded-full bg-zinc-800" />
        <div className="absolute top-3 right-3 w-12 h-5 rounded-full bg-zinc-800" />
      </div>
      <div className="p-4 flex-col flex-1 space-y-4">
        <div>
          <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2 relative overflow-hidden"><Shimmer /></div>
          <div className="h-3 bg-zinc-800/50 rounded w-1/4 relative overflow-hidden"><Shimmer /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div>
            <div className="h-3 bg-zinc-800/50 rounded w-1/3 mb-1" />
            <div className="h-4 bg-zinc-800 rounded w-1/2 relative overflow-hidden"><Shimmer /></div>
          </div>
          <div>
            <div className="h-3 bg-zinc-800/50 rounded w-1/3 mb-1" />
            <div className="h-4 bg-zinc-800 rounded w-1/2 relative overflow-hidden"><Shimmer /></div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50 relative overflow-hidden">
      <Shimmer />
      <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-3 bg-zinc-800/50 rounded w-1/4" />
      </div>
      <div className="w-20 h-6 rounded-full bg-zinc-800" />
      <div className="w-8 h-8 rounded-md bg-zinc-800" />
    </div>
  );
}
