/** SportShield AI — API Keys Management Page */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Copy, Check, Eye, EyeOff, Trash2, RefreshCw, Shield, Clock, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKeySecret, setCreatedKeySecret] = useState<{ id: string; secret: string } | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await api.get('/api-keys');
      return data;
    }
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/api-keys', { name });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKeySecret({ id: data.id, secret: data.key });
      setNewKeyName('');
      setShowCreate(false);
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const toggleVisible = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => key.slice(0, 8) + '•'.repeat(24) + key.slice(-4);

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">API Keys</h1>
          <p className="text-zinc-400">Manage programmatic access to the SportShield API.</p>
        </div>
        <GlowingButton variant="primary" size="sm" className="gap-2" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> Generate Key
        </GlowingButton>
      </div>

      {/* Create Key Panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Create New API Key</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-[#1F2937] text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production Backend)"
                  className="flex-1 px-4 py-2.5 bg-[#0B0F19] border border-[#1F2937] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500/30"
                />
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-violet-400 bg-violet-500/10 border-violet-500/20">
                    Full Access
                  </button>
                </div>
                <GlowingButton 
                  variant="primary" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    if (newKeyName.trim()) createKeyMutation.mutate(newKeyName);
                  }}
                  disabled={createKeyMutation.isPending || !newKeyName.trim()}
                >
                  {createKeyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Generate
                </GlowingButton>
              </div>
              <p className="text-[10px] text-zinc-500 mt-3">Full Access API Key will be generated.</p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {createdKeySecret && (
        <GlassCard glowColor="emerald" className="border-emerald-500/30 bg-emerald-950/20">
          <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
            <Check className="w-5 h-5" /> API Key Created Successfully
          </h3>
          <p className="text-zinc-300 text-sm mb-4">Please copy this key now. For your security, it will not be shown again.</p>
          <div className="flex items-center gap-2 bg-[#0B0F19] rounded-lg border border-emerald-500/20 px-4 py-3">
            <code className="flex-1 text-sm font-mono text-white select-all">
              {createdKeySecret.secret}
            </code>
            <button onClick={() => copyKey('secret', createdKeySecret.secret)} className="p-2 rounded hover:bg-white/10 text-zinc-300">
              {copiedKey === 'secret' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setCreatedKeySecret(null)} className="text-xs text-zinc-400 hover:text-white">Dismiss</button>
          </div>
        </GlassCard>
      )}

      {/* Usage Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Keys', value: keys.filter((k: any) => k.status === 'active').length, icon: Key, color: 'cyan' as const },
          { label: 'Requests Today', value: keys.reduce((a: number, k: any) => a + (k.requestsToday || 0), 0).toLocaleString(), icon: RefreshCw, color: 'purple' as const },
          { label: 'Rate Limit / Day', value: '20K', icon: Shield, color: 'emerald' as const },
          { label: 'Avg Latency', value: '45ms', icon: Clock, color: 'amber' as const },
        ].map((s, i) => (
          <GlassCard key={i} glowColor={s.color}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${s.color}-500/10 border border-${s.color}-500/20`}>
                <s.icon className={`w-4 h-4 text-${s.color}-400`} />
              </div>
              <div>
                <p className="text-xs text-zinc-400">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* API Key List */}
      <GlassCard noPadding>
        <div className="px-6 py-4 border-b border-[#1F2937]">
          <h3 className="text-sm font-semibold text-white">Your API Keys</h3>
        </div>
        <div className="divide-y divide-[#1F2937]">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <p>Loading API Keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p>No API keys found. Generate one to get started.</p>
            </div>
          ) : keys.map((apiKey: any, i: number) => {
            const isVisible = visibleKeys.has(apiKey.id);
            return (
              <motion.div
                key={apiKey.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`px-6 py-4 hover:bg-[#1F2937]/30 transition-colors group ${apiKey.status === 'revoked' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 rounded-lg bg-[#0B0F19] border border-[#1F2937]">
                    <Key className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{apiKey.name}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border text-violet-400 bg-violet-500/10 border-violet-500/20">Full Access</span>
                      {apiKey.status === 'revoked' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-red-400 bg-red-500/10 border border-red-500/20">Revoked</span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] text-zinc-500">Created At</p>
                    <p className="text-xs text-zinc-300">{new Date(apiKey.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Key display */}
                <div className="flex items-center gap-2 bg-[#0B0F19] rounded-lg border border-[#1F2937] px-3 py-2">
                  <code className="flex-1 text-xs font-mono text-zinc-400 select-all truncate">
                    {apiKey.key_prefix}
                  </code>
                  {apiKey.status === 'active' && (
                    <button 
                      onClick={() => revokeKeyMutation.mutate(apiKey.id)}
                      disabled={revokeKeyMutation.isPending}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors" 
                      title="Revoke"
                    >
                      {revokeKeyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Usage bar */}
                {apiKey.status === 'active' && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#0B0F19] rounded-full overflow-hidden border border-[#1F2937]/50">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${((apiKey.requestsToday || 0) / (apiKey.rateLimit || 10000)) * 100}%`,
                          backgroundColor: ((apiKey.requestsToday || 0) / (apiKey.rateLimit || 10000)) > 0.8 ? '#EF4444' : '#06B6D4',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {(apiKey.requestsToday || 0).toLocaleString()} / {(apiKey.rateLimit || 10000).toLocaleString()} requests
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* API Docs Quick Reference */}
      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-3">Quick Reference</h3>
        <div className="bg-[#0B0F19] rounded-lg border border-[#1F2937] p-4 font-mono text-xs">
          <p className="text-zinc-500 mb-2"># Authenticate with your API key</p>
          <p className="text-cyan-400">curl <span className="text-zinc-300">-H</span> <span className="text-emerald-400">"Authorization: Bearer sk_live_..."</span> \</p>
          <p className="text-zinc-300 ml-4">https://api.sportshield.ai/v1/violations</p>
          <p className="text-zinc-500 mt-3 mb-2"># Trigger a scan</p>
          <p className="text-cyan-400">curl <span className="text-zinc-300">-X POST -H</span> <span className="text-emerald-400">"Authorization: Bearer sk_live_..."</span> \</p>
          <p className="text-zinc-300 ml-4">https://api.sportshield.ai/v1/scans/trigger \</p>
          <p className="text-zinc-300 ml-4"><span className="text-zinc-500">-d</span> <span className="text-amber-400">{`'{"asset_id": "A-001"}'`}</span></p>
        </div>
      </GlassCard>
    </PageTransition>
  );
}
