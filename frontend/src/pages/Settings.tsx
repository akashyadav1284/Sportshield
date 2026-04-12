/** SportShield AI — Premium Settings Page */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';
import { cn } from '../lib/utils';
import { User, Building2, Bell, Key, Save, ShieldCheck } from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Identity & Access', icon: User },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'alerts', label: 'Notification Rules', icon: Bell },
  { id: 'apikeys', label: 'Integration Keys', icon: Key },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Framer Motion variants for tab content transition
  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Configuration</h1>
        <p className="text-zinc-400">Manage security settings, access controls, and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Modern Settings Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {tabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden',
                activeTab === t.id 
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
              )}
            >
              {activeTab === t.id && (
                <motion.div layoutId="settings-tab-active" className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              )}
              <t.icon className={cn("w-4 h-4", activeTab === t.id ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300")} /> 
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <GlassCard className="max-w-2xl">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                    <User className="w-5 h-5 text-cyan-400" /> Identity Matrix
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
                        <input type="text" defaultValue={user?.full_name || ''} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Primary Email</label>
                        <input type="email" defaultValue={user?.email || ''} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono" />
                      </div>
                    </div>
                    
                    <div className="h-px w-full bg-zinc-800" />
                    
                    <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-violet-400" /> Security Credentials
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Current Hash</label>
                        <input type="password" placeholder="••••••••••••" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">New Hash</label>
                        <input type="password" placeholder="••••••••••••" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <GlowingButton variant="primary" className="gap-2"><Save className="w-4 h-4" /> Commit Changes</GlowingButton>
                    </div>
                  </div>
                </GlassCard>
              )}

              {activeTab === 'organization' && (
                <GlassCard className="max-w-2xl" glowColor="purple">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                    <Building2 className="w-5 h-5 text-violet-400" /> Organizational Unit
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl mb-2 flex-wrap gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">Current Licensing</p>
                        <p className="text-xs text-zinc-500">Tier determining scan depth and API limits.</p>
                      </div>
                      <span className="px-4 py-1.5 bg-violet-500/20 text-violet-400 text-xs font-bold uppercase rounded-md tracking-wider border border-violet-500/30">
                        Enterprise Pro
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Organization Name</label>
                      <input type="text" defaultValue="Premier FC" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono" />
                    </div>
                    
                    <div className="pt-4">
                      <GlowingButton variant="primary" className="gap-2"><Save className="w-4 h-4" /> Save Configuration</GlowingButton>
                    </div>
                  </div>
                </GlassCard>
              )}

              {activeTab === 'alerts' && (
                <GlassCard className="max-w-2xl" glowColor="amber">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                    <Bell className="w-5 h-5 text-amber-400" /> Routing Rules
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start sm:items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex-col sm:flex-row gap-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-300">Email Routing</p>
                        <p className="text-xs text-zinc-500 mt-1">Push critical violations to registered email handlers.</p>
                      </div>
                      {/* Modern UI Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500/30 peer-checked:border-cyan-500/50 border border-zinc-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-cyan-400 after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Severity Threshold</label>
                        <select className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer transition-colors">
                          <option>CRITICAL / HIGH Only</option>
                          <option>HIGH + MEDIUM</option>
                          <option>All Signals</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Cron Frequency</label>
                        <select className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer transition-colors">
                          <option>Every 5 Minutes</option>
                          <option>Every 15 Minutes</option>
                          <option>Every 30 Minutes</option>
                          <option>Hourly Batch</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <GlowingButton variant="primary" className="gap-2"><Save className="w-4 h-4" /> Save Ruleset</GlowingButton>
                    </div>
                  </div>
                </GlassCard>
              )}

              {activeTab === 'apikeys' && (
                <GlassCard className="max-w-2xl" glowColor="emerald">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                    <Key className="w-5 h-5 text-emerald-400" /> Integration Keys
                  </h3>
                  
                  <div className="space-y-6">
                    <p className="text-sm text-zinc-400 bg-zinc-900/50 p-4 border border-zinc-800/80 rounded-xl">
                      External scanning services integration. Keys are heavily encrypted (AES-256-GCM) at rest and never exposed.
                    </p>
                    
                    <div className="space-y-4">
                      {['Google Vision API', 'Bing Search API', 'SerpAPI Master Key', 'SendGrid Mail Node'].map((k, i) => (
                        <div key={i}>
                          <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">{k}</label>
                          <div className="flex gap-2">
                            <input 
                              type="password" 
                              defaultValue="sk-••••••••••••••••••••••••" 
                              className="flex-1 px-4 py-2 border border-zinc-800 rounded-lg text-sm bg-zinc-950 font-mono text-emerald-400/70 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30" 
                            />
                            <GlowingButton variant="outline" size="sm">Rotate</GlowingButton>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4">
                      <GlowingButton variant="primary" className="gap-2"><Save className="w-4 h-4" /> Update Vault</GlowingButton>
                    </div>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
