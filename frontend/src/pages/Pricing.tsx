/** SportShield AI — Subscription & Pricing Page */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Crown, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';
import { GlowingButton } from '../components/shared/GlowingButton';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  features: PlanFeature[];
  popular?: boolean;
  glowColor: 'cyan' | 'purple' | 'emerald';
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For individual creators protecting their content.',
    icon: Shield,
    glowColor: 'cyan',
    cta: 'Start Free Trial',
    features: [
      { text: '100 Protected Assets', included: true },
      { text: '500 Scans / Day', included: true },
      { text: 'YouTube + Web Scanning', included: true },
      { text: 'pHash Fingerprinting', included: true },
      { text: 'Email Alerts', included: true },
      { text: 'DMCA Template Generator', included: true },
      { text: '1 User', included: true },
      { text: 'CNN + CLIP AI Models', included: false },
      { text: 'Slack / SMS Alerts', included: false },
      { text: 'One-Click Platform Reports', included: false },
      { text: 'API Access', included: false },
      { text: 'Blockchain Ownership Proof', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/month',
    description: 'For teams and agencies managing multiple brands.',
    icon: Crown,
    glowColor: 'purple',
    popular: true,
    cta: 'Start Pro Trial',
    features: [
      { text: '1,000 Protected Assets', included: true },
      { text: '5,000 Scans / Day', included: true },
      { text: 'All Platforms (YT, IG, X, TikTok)', included: true },
      { text: 'CNN + CLIP AI Models', included: true },
      { text: 'Email + Slack + SMS Alerts', included: true },
      { text: 'One-Click Platform Reports', included: true },
      { text: '5 Team Members', included: true },
      { text: 'Shield AI Chatbot', included: true },
      { text: 'Blockchain Ownership Proof', included: true },
      { text: 'Read-Only API Access', included: true },
      { text: 'Custom AI Model Training', included: false },
      { text: 'Dedicated Account Manager', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For leagues, broadcasters, and large organizations.',
    icon: Building2,
    glowColor: 'emerald',
    cta: 'Contact Sales',
    features: [
      { text: 'Unlimited Assets', included: true },
      { text: 'Unlimited Scans', included: true },
      { text: 'All Platforms + Custom Crawlers', included: true },
      { text: 'Custom Fine-Tuned AI Models', included: true },
      { text: 'All Channels + Webhooks', included: true },
      { text: 'Auto-Submit Takedowns + Legal', included: true },
      { text: 'Unlimited Team Members', included: true },
      { text: 'Full CRUD API Access', included: true },
      { text: 'Blockchain Ownership Proof', included: true },
      { text: 'White-Label Solution', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'SOC 2 Compliance', included: true },
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <PageTransition className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Pricing</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Choose Your Protection Level</h1>
        <p className="text-zinc-400">Scale your IP protection from individual creator to enterprise broadcaster.</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-cyan-500' : 'bg-[#1F2937]'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-zinc-500'}`}>
            Annual
            <span className="ml-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            <GlassCard
              glowColor={plan.glowColor}
              className={`flex flex-col h-full ${plan.popular ? 'ring-1 ring-violet-500/30' : ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-${plan.glowColor}-500/10 border border-${plan.glowColor}-500/20`}>
                  <plan.icon className={`w-5 h-5 text-${plan.glowColor}-400`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 'Custom' ? 'Custom' : annual ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}` : plan.price}
                  </span>
                  {plan.period && <span className="text-sm text-zinc-400">{plan.period}</span>}
                </div>
                <p className="text-xs text-zinc-400 mt-2">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${f.included ? 'text-zinc-300' : 'text-zinc-600'}`}>{f.text}</span>
                  </div>
                ))}
              </div>

              <GlowingButton
                variant={plan.popular ? 'primary' : 'secondary'}
                size="sm"
                className="w-full justify-center gap-2"
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </GlowingButton>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* FAQ-like note */}
      <div className="text-center text-xs text-zinc-500 max-w-lg mx-auto pt-4">
        All plans include a 14-day free trial. No credit card required. Cancel anytime.
        Enterprise plans include custom SLA and dedicated onboarding.
      </div>
    </PageTransition>
  );
}
