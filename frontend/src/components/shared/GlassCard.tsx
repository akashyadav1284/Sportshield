import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'red' | 'amber' | 'emerald';
  noPadding?: boolean;
}

export function GlassCard({ children, className = '', glowColor = 'cyan', noPadding = false, ...props }: GlassCardProps) {
  
  const glowMap = {
    cyan: 'from-cyan-500/10 to-transparent',
    purple: 'from-violet-500/10 to-transparent',
    red: 'from-red-500/10 to-transparent',
    amber: 'from-amber-500/10 to-transparent',
    emerald: 'from-emerald-500/10 to-transparent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`glass-card group ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}
    >
      {/* Background glow base */}
      <div className={`absolute inset-0 bg-gradient-to-br ${glowMap[glowColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0`} />
      
      {/* Top 1px glow border accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 opacity-50" />
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
