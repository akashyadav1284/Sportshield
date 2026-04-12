/** SportShield AI — Premium Empty State Component */
import { cn } from '../../lib/utils';
import { ShieldOff, FolderOpen, BellOff, BarChart3, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  type?: 'violations' | 'assets' | 'alerts' | 'analytics' | 'default';
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ type = 'default', title, description, action, className }: EmptyStateProps) {
  const icons = {
    violations: ShieldOff,
    assets: Database,
    alerts: BellOff,
    analytics: BarChart3,
    default: FolderOpen,
  };

  const Icon = icons[type];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        'flex flex-col items-center justify-center py-20 px-8 text-center rounded-2xl border border-dashed border-[#1F2937] bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors duration-500',
        className
      )}
    >
      <div className="relative group mb-8">
        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-110 group-hover:bg-cyan-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center relative shadow-2xl z-10">
          <Icon className="w-12 h-12 text-zinc-400 group-hover:text-cyan-400 transition-colors duration-500" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-zinc-500 max-w-md mb-8 leading-relaxed">{description}</p>
      
      {action && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
