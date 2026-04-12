import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface GlowingButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function GlowingButton({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ...props
}: GlowingButtonProps) {
  
  const baseStyles = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] disabled:opacity-50 disabled:pointer-events-none overflow-hidden group';
  
  const variants = {
    primary: 'bg-zinc-900 border border-zinc-700 text-white shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:border-cyan-500/50',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
    outline: 'border border-zinc-700 bg-transparent text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent',
    destructive: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Glow element for primary button */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />
      )}
      
      {/* Primary button border glow */}
      {variant === 'primary' && (
        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
