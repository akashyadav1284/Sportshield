import { motion } from 'framer-motion';
import { GlowingButton } from './GlowingButton';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({ 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  isLoading = false
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" 
        onClick={onCancel} 
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-zinc-900 border border-red-900/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] w-full max-w-md relative z-10 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex flex-shrink-0 items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {description}
              </p>
            </div>
            
            <button 
              onClick={onCancel} 
              className="p-1 -mt-1 -mr-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-950/50 border-t border-zinc-800/50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            {cancelText}
          </button>
          <GlowingButton 
            onClick={onConfirm} 
            isLoading={isLoading}
            className="!bg-red-500 hover:!bg-red-600 !border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] text-white"
          >
            {confirmText}
          </GlowingButton>
        </div>
      </motion.div>
    </div>
  );
}
