/** SportShield AI — Premium Login Page */
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Shield, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { GlowingButton } from '../components/shared/GlowingButton';

export default function Login() {
  const { login, isLoggedIn, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (isLoggedIn) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 font-sans overflow-hidden">
      
      {/* Left panel — High-tech 3D/Particle illusion */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-black items-center justify-center">
        
        {/* Animated Background Gradients & Orbs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] opacity-70 animate-pulse-glow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[150px]" />
          
          {/* Cyber Grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02MCAwaC0xdjYwaDFWem0wIDYwaC02MHYtMWg2MHZ6IiBmaWxsPSJyZ2JhKDM5LCAzOSwgNDIsIDAuMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPgo8L3N2Zz4=')] opacity-30" />
        </div>

        {/* Floating AI Elements */}
        <div className="relative z-10 w-full max-w-lg px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700/50 flex items-center justify-center p-[2px]">
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-zinc-900" />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-zinc-400 tracking-tight">SportShield</h1>
                <p className="text-xs text-cyan-400 font-bold tracking-[0.3em] uppercase mt-1">Enterprise AI Platform</p>
              </div>
            </div>

            <p className="text-lg text-zinc-300 font-light leading-relaxed mb-10">
              Advanced neural network perimeter. Safeguard your digital media assets against unlicensed distribution and automated scrapers in real-time.
            </p>

            <div className="space-y-6">
              {[
                'Perceptual hashing & CNN embeddings', 'Continuous internet-wide deep scanning', 'Zero-latency WebHook alerts'
              ].map((f, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{f}</span>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </div>
      </div>

      {/* Right panel — Glassmorphic Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full overflow-hidden">
        {/* Mobile Background Elements */}
        <div className="absolute inset-0 lg:hidden bg-zinc-950 overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 p-[1px]">
              <div className="w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SportShield<span className="text-cyan-400">.ai</span></span>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/80 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Inner Glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-30" />
            
            <h2 className="text-2xl font-bold text-white mb-2">Secure Gateway</h2>
            <p className="text-sm text-zinc-400 mb-8 font-mono">Initiate session handshake to proceed.</p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">Network ID (Email)</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="demo@sportshield.ai"
                    className="relative w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pb-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">Access Key</label>
                  <a href="#" className="text-xs text-cyan-500 hover:text-cyan-400 font-medium">Forgot key?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="relative w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors z-10"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <GlowingButton
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full py-3.5 mt-2 text-sm uppercase tracking-wider justify-between px-6 font-bold"
                isLoading={loading}
              >
                {loading ? 'Authenticating...' : 'Establish Connection'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </GlowingButton>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-500">
              Unregistered node?{' '}
              <Link to="/register" className="text-cyan-500 font-semibold hover:text-cyan-400 transition-colors">Request Access</Link>
            </p>

          </div>

          <div className="mt-6 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
            <p className="text-xs font-bold text-cyan-400 mb-2 tracking-widest uppercase">System Evaluation Node</p>
            <div className="text-xs text-zinc-400 font-mono flex flex-col gap-1">
              <span>ID: <code className="text-zinc-200">demo@sportshield.ai</code></span>
              <span>KEY: <code className="text-zinc-200">Demo1234!</code></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
