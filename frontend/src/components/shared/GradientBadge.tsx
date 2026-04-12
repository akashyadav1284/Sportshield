import React from 'react';

interface GradientBadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'red' | 'amber' | 'emerald' | 'zinc';
  className?: string;
  dot?: boolean;
}

export function GradientBadge({ children, variant = 'cyan', className = '', dot = false }: GradientBadgeProps) {
  const styles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]',
    red: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    zinc: 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50',
  };

  const dotStyles = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    purple: 'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]',
    red: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    zinc: 'bg-zinc-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md ${styles[variant]} ${className}`}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {variant !== 'zinc' && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotStyles[variant]}`}></span>}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotStyles[variant]}`}></span>
        </span>
      )}
      {children}
    </span>
  );
}
