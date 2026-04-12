import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useUpload } from '../../hooks/useUpload';
import { GlowingButton } from './GlowingButton';
import { cn } from '../../lib/utils';
import { Upload, X, CheckCircle2, FileImage, FileVideo, Shield } from 'lucide-react';

export function UploadModal({ onClose }: { onClose: () => void }) {
  const { upload, progress, status: uploadStatus, error } = useUpload();
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'video/mp4': [], 'video/quicktime': [] },
    maxSize: 500 * 1024 * 1024,
    maxFiles: 10,
  });

  const handleUpload = async () => {
    if (!files.length) return;
    try {
      await upload(files);
      setTimeout(onClose, 1500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Ingest Assets</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cyberpunk Dropzone */}
          <div {...getRootProps()} className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group',
            isDragActive ? 'border-cyan-400 bg-cyan-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
          )}>
            <input {...getInputProps()} aria-label="Drop files here or click to browse" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className={cn("p-4 rounded-full mb-4 transition-colors", isDragActive ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-300")}>
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-zinc-200">Drag & drop files to encrypt and hash</p>
              <p className="text-[11px] font-mono text-zinc-500 mt-2">JPEG, PNG, WEBP, MP4 (MAX 500MB)</p>
            </div>

            {/* Ambient drag glow */}
            {isDragActive && <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 pointer-events-none animate-pulse" />}
          </div>

          {/* Staging List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl group/item">
                  {f.type.startsWith('video') ? <FileVideo className="w-5 h-5 text-violet-400" /> : <FileImage className="w-5 h-5 text-cyan-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{f.name}</p>
                    <p className="text-[10px] font-mono text-zinc-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, j) => j !== i)); }} className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-md transition-colors opacity-0 group-hover/item:opacity-100 relative z-20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 w-full animate-shimmer" style={{ width: `${Math.max(10, progress)}%` }} />
              </div>
              <p className="text-[11px] font-mono text-cyan-400 text-right">{progress}% TRANSMITTING</p>
            </div>
          )}
          {uploadStatus === 'done' && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
                <CheckCircle2 className="w-4 h-4" /> Signatures generated!
              </div>
            </div>
          )}
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 font-medium">{error}</div>}

          <GlowingButton 
            onClick={handleUpload} 
            disabled={!files.length || uploadStatus === 'uploading' || uploadStatus === 'done'}
            className="w-full"
            isLoading={uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? 'Encrypting & Uploading...' : `Commit ${files.length} File${files.length !== 1 ? 's' : ''} to Vault`}
          </GlowingButton>
        </div>
      </motion.div>
    </div>
  );
}
