/** SportShield AI — Team Management Page */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Shield, Eye, Edit3, Trash2, Mail, CheckCircle2, Clock, Crown, X } from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';

type Role = 'admin' | 'analyst' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'pending';
  joinedAt: string;
  lastActive: string;
  avatar?: string;
  violationsReviewed: number;
  takedownsFiled: number;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: React.ElementType; description: string }> = {
  admin: { label: 'Admin', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: Crown, description: 'Full access — manage users, settings, billing, and all content' },
  analyst: { label: 'Analyst', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: Edit3, description: 'Review violations, file takedowns, manage scans' },
  viewer: { label: 'Viewer', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', icon: Eye, description: 'View dashboards and reports only' },
};

const DEMO_TEAM: TeamMember[] = [
  { id: 'U-001', name: 'Alex Morgan', email: 'alex@sportshield.ai', role: 'admin', status: 'active', joinedAt: '2025-01-15', lastActive: '2 min ago', violationsReviewed: 234, takedownsFiled: 89 },
  { id: 'U-002', name: 'Sarah Chen', email: 'sarah@sportshield.ai', role: 'analyst', status: 'active', joinedAt: '2025-03-20', lastActive: '1 hr ago', violationsReviewed: 156, takedownsFiled: 45 },
  { id: 'U-003', name: 'Marcus Williams', email: 'marcus@sportshield.ai', role: 'analyst', status: 'active', joinedAt: '2025-06-10', lastActive: '3 hrs ago', violationsReviewed: 98, takedownsFiled: 32 },
  { id: 'U-004', name: 'Priya Patel', email: 'priya@sportshield.ai', role: 'viewer', status: 'active', joinedAt: '2025-08-05', lastActive: '1 day ago', violationsReviewed: 0, takedownsFiled: 0 },
  { id: 'U-005', name: 'James Foster', email: 'james@sportshield.ai', role: 'analyst', status: 'pending', joinedAt: '2026-04-08', lastActive: 'Never', violationsReviewed: 0, takedownsFiled: 0 },
];

export default function TeamManagement() {
  const [team] = useState(DEMO_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('analyst');

  const stats = {
    total: team.length,
    admins: team.filter(m => m.role === 'admin').length,
    analysts: team.filter(m => m.role === 'analyst').length,
    viewers: team.filter(m => m.role === 'viewer').length,
    pending: team.filter(m => m.status === 'pending').length,
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Team Management</h1>
          <p className="text-zinc-400">Manage team members, roles, and access permissions.</p>
        </div>
        <GlowingButton variant="primary" size="sm" className="gap-2" onClick={() => setShowInvite(!showInvite)}>
          <UserPlus className="w-4 h-4" /> Invite Member
        </GlowingButton>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Invite New Team Member</h3>
                <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg hover:bg-[#1F2937] text-zinc-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 px-4 py-2.5 bg-[#0B0F19] border border-[#1F2937] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500/30"
                />
                <div className="flex gap-2">
                  {(['admin', 'analyst', 'viewer'] as Role[]).map(role => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                      <button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          inviteRole === role ? cfg.color : 'text-zinc-500 border-[#1F2937] hover:border-[#374151]'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <GlowingButton variant="primary" size="sm" className="gap-2">
                  <Mail className="w-4 h-4" /> Send Invite
                </GlowingButton>
              </div>
              <p className="text-[10px] text-zinc-500 mt-3">
                {ROLE_CONFIG[inviteRole].description}
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Members', value: stats.total, color: 'text-white' },
          { label: 'Admins', value: stats.admins, color: 'text-violet-400' },
          { label: 'Analysts', value: stats.analysts, color: 'text-cyan-400' },
          { label: 'Viewers', value: stats.viewers, color: 'text-zinc-400' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="px-4 py-3 rounded-xl bg-[#111827] border border-[#1F2937]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* RBAC Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['admin', 'analyst', 'viewer'] as Role[]).map(role => {
          const cfg = ROLE_CONFIG[role];
          return (
            <div key={role} className={`px-4 py-3 rounded-xl bg-[#111827] border border-[#1F2937] flex items-start gap-3`}>
              <div className={`p-2 rounded-lg border ${cfg.color} flex-shrink-0`}>
                <cfg.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{cfg.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{cfg.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team List */}
      <GlassCard noPadding>
        <div className="px-6 py-4 border-b border-[#1F2937]">
          <h3 className="text-sm font-semibold text-white">Team Members</h3>
        </div>
        <div className="divide-y divide-[#1F2937]">
          {team.map((member, i) => {
            const roleCfg = ROLE_CONFIG[member.role];
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-4 flex items-center gap-4 hover:bg-[#1F2937]/30 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getInitials(member.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    {member.status === 'pending' && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 border border-amber-500/20">Pending</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{member.email}</p>
                </div>

                {/* Role Badge */}
                <span className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${roleCfg.color}`}>
                  <roleCfg.icon className="w-3 h-3" />
                  {roleCfg.label}
                </span>

                {/* Stats */}
                <div className="hidden lg:flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] text-zinc-500">Reviewed</p>
                    <p className="text-xs font-bold text-zinc-300">{member.violationsReviewed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">Takedowns</p>
                    <p className="text-xs font-bold text-zinc-300">{member.takedownsFiled}</p>
                  </div>
                </div>

                {/* Last Active */}
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-zinc-500">Last active</p>
                  <p className={`text-xs ${member.lastActive === 'Never' ? 'text-zinc-600' : 'text-zinc-300'}`}>{member.lastActive}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1F2937] transition-colors" title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </PageTransition>
  );
}
