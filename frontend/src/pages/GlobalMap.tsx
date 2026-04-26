/** SportShield AI — Global Violation Map Page */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, AlertTriangle, Shield, Eye, ExternalLink, Clock, Zap, Plus, Minus } from 'lucide-react';
import { GlassCard } from '../components/shared/GlassCard';
import { PageTransition } from '../components/shared/PageTransition';

interface ViolationPoint {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  platform: string;
  severity: 'high' | 'medium' | 'low';
  assetName: string;
  detectedAt: string;
  url: string;
  confidence: number;
}

const DEMO_VIOLATIONS: ViolationPoint[] = [
  { id: 'V-001', lat: 40.7, lng: -74.0, city: 'New York', country: 'USA', platform: 'YouTube', severity: 'high', assetName: 'Champions League Final', detectedAt: '2 min ago', url: 'youtube.com/watch?v=abc', confidence: 94 },
  { id: 'V-002', lat: 51.5, lng: -0.1, city: 'London', country: 'UK', platform: 'Twitter', severity: 'high', assetName: 'Premier League Highlights', detectedAt: '8 min ago', url: 'twitter.com/status/123', confidence: 91 },
  { id: 'V-003', lat: 48.9, lng: 2.3, city: 'Paris', country: 'France', platform: 'Instagram', severity: 'medium', assetName: 'Team Logo', detectedAt: '15 min ago', url: 'instagram.com/p/xyz', confidence: 78 },
  { id: 'V-004', lat: 35.7, lng: 139.7, city: 'Tokyo', country: 'Japan', platform: 'TikTok', severity: 'low', assetName: 'Match Day Promo', detectedAt: '22 min ago', url: 'tiktok.com/@user/789', confidence: 65 },
  { id: 'V-005', lat: 19.1, lng: 72.9, city: 'Mumbai', country: 'India', platform: 'YouTube', severity: 'high', assetName: 'IPL Highlights', detectedAt: '5 min ago', url: 'youtube.com/watch?v=ipl', confidence: 96 },
  { id: 'V-006', lat: -23.5, lng: -46.6, city: 'São Paulo', country: 'Brazil', platform: 'Web', severity: 'medium', assetName: 'Copa Libertadores', detectedAt: '30 min ago', url: 'sportspirate.com/copa', confidence: 82 },
  { id: 'V-007', lat: 55.8, lng: 37.6, city: 'Moscow', country: 'Russia', platform: 'Telegram', severity: 'medium', assetName: 'World Cup Archive', detectedAt: '1 hr ago', url: 't.me/sportschannel', confidence: 74 },
  { id: 'V-008', lat: 1.3, lng: 103.8, city: 'Singapore', country: 'Singapore', platform: 'YouTube', severity: 'low', assetName: 'F1 Highlights', detectedAt: '45 min ago', url: 'youtube.com/watch?v=f1', confidence: 68 },
  { id: 'V-009', lat: -33.9, lng: 18.4, city: 'Cape Town', country: 'South Africa', platform: 'Twitter', severity: 'high', assetName: 'Rugby World Cup', detectedAt: '12 min ago', url: 'twitter.com/status/rwc', confidence: 89 },
  { id: 'V-010', lat: 25.2, lng: 55.3, city: 'Dubai', country: 'UAE', platform: 'Instagram', severity: 'low', assetName: 'Cricket Highlights', detectedAt: '2 hr ago', url: 'instagram.com/p/cricket', confidence: 61 },
  { id: 'V-011', lat: 37.6, lng: 127.0, city: 'Seoul', country: 'South Korea', platform: 'Web', severity: 'medium', assetName: 'Esports Finals', detectedAt: '18 min ago', url: 'gameclips.kr/esports', confidence: 77 },
  { id: 'V-012', lat: 52.5, lng: 13.4, city: 'Berlin', country: 'Germany', platform: 'YouTube', severity: 'high', assetName: 'Bundesliga Goals', detectedAt: '3 min ago', url: 'youtube.com/watch?v=bun', confidence: 93 },
];

const SEVERITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#3B82F6' };
const PLATFORM_COLORS: Record<string, string> = { YouTube: '#EF4444', Twitter: '#0EA5E9', Instagram: '#E879F9', TikTok: '#A1A1AA', Web: '#71717A', Telegram: '#38BDF8' };

// Convert lat/lng to SVG x/y coordinates (Mercator-like projection)
function toSvgCoords(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - (Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI)) * 250;
  return { x, y };
}

export default function GlobalMap() {
  const [selectedViolation, setSelectedViolation] = useState<ViolationPoint | null>(null);
  const [liveCount, setLiveCount] = useState(DEMO_VIOLATIONS.length);
  const [pulseKey, setPulseKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Auto-zoom to city when selected
  useEffect(() => {
    if (selectedViolation) {
      setZoom(6); // Deep zoom into the city
    } else {
      setZoom(1); // Reset map
    }
  }, [selectedViolation]);

  // Compute transform origin based on selected city coordinates
  const mapOrigin = selectedViolation 
    ? `${(toSvgCoords(selectedViolation.lat, selectedViolation.lng).x / 1000) * 100}% ${(toSvgCoords(selectedViolation.lat, selectedViolation.lng).y / 500) * 100}%`
    : 'center center';

  // Simulate live detection pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCount(c => c + Math.floor(Math.random() * 2));
      setPulseKey(k => k + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const stats = {
    total: DEMO_VIOLATIONS.length,
    high: DEMO_VIOLATIONS.filter(v => v.severity === 'high').length,
    medium: DEMO_VIOLATIONS.filter(v => v.severity === 'medium').length,
    low: DEMO_VIOLATIONS.filter(v => v.severity === 'low').length,
    countries: new Set(DEMO_VIOLATIONS.map(v => v.country)).size,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            Global Threat Map
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </h1>
          <p className="text-zinc-400">Real-time global visualization of IP violation detection across all platforms.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span><strong className="text-white">{liveCount}</strong> violations tracked globally</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Detected', value: stats.total, color: 'text-white' },
          { label: 'High Severity', value: stats.high, color: 'text-red-400' },
          { label: 'Medium', value: stats.medium, color: 'text-amber-400' },
          { label: 'Low', value: stats.low, color: 'text-blue-400' },
          { label: 'Countries', value: stats.countries, color: 'text-cyan-400' },
        ].map((s, i) => (
          <div key={i} className="px-4 py-3 rounded-xl bg-[#111827] border border-[#1F2937]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Map + Detail Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Card */}
        <GlassCard noPadding className="xl:col-span-2 overflow-hidden h-full">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Violation Heatmap</h3>
            </div>
            <div className="flex items-center gap-3">
              {(['high', 'medium', 'low'] as const).map(sev => (
                <div key={sev} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
                  <span className="capitalize">{sev}</span>
                </div>
              ))}
            </div>
          </div>
          <div ref={mapContainerRef} className="relative bg-[#0B0F19] overflow-hidden flex-1 w-full min-h-[420px]">
            {/* Zoomable Container */}
            <motion.div 
              drag={zoom > 1}
              dragConstraints={{ top: -200 * zoom, bottom: 200 * zoom, left: -500 * zoom, right: 500 * zoom }}
              dragElastic={0.1}
              className={`absolute inset-0 w-full h-full ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              animate={{ scale: zoom }}
              style={{ transformOrigin: mapOrigin }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
                {/* Grid lines */}
                {Array.from({ length: 19 }, (_, i) => (
                  <line key={`vl-${i}`} x1={i * 55.5} y1={0} x2={i * 55.5} y2={500} stroke="#1F2937" strokeWidth={0.5} strokeDasharray="4 8" />
                ))}
                {Array.from({ length: 10 }, (_, i) => (
                  <line key={`hl-${i}`} x1={0} y1={i * 55.5} x2={1000} y2={i * 55.5} stroke="#1F2937" strokeWidth={0.5} strokeDasharray="4 8" />
                ))}

              {/* Faint World Map Background */}
              <image 
                href="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" 
                x="0" 
                y="-20" 
                width="1000" 
                height="540" 
                opacity="0.1" 
                className="grayscale invert opacity-20"
                preserveAspectRatio="none" 
              />

              {/* Violation Points */}
              {DEMO_VIOLATIONS.map((v, i) => {
                const { x, y } = toSvgCoords(v.lat, v.lng);
                const isSelected = selectedViolation?.id === v.id;
                return (
                  <g key={v.id} onClick={() => setSelectedViolation(v)} className="cursor-pointer">
                    {/* Pulse ring */}
                    <circle cx={x} cy={y} r={isSelected ? 25 : 18} fill={SEVERITY_COLORS[v.severity]} opacity={0.08}>
                      <animate attributeName="r" values={isSelected ? "20;30;20" : "14;22;14"} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0.03;0.15" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Outer glow */}
                    <circle cx={x} cy={y} r={isSelected ? 12 : 8} fill={SEVERITY_COLORS[v.severity]} opacity={0.2} />
                    {/* Core dot */}
                    <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={SEVERITY_COLORS[v.severity]} stroke="#0B0F19" strokeWidth={1.5}>
                      <animate attributeName="r" values={isSelected ? "5;7;5" : "3;5;3"} dur="3s" repeatCount="indefinite" />
                    </circle>
                    {/* Label on hover */}
                    {isSelected && (
                      <>
                        <line x1={x} y1={y - 8} x2={x} y2={y - 25} stroke={SEVERITY_COLORS[v.severity]} strokeWidth={1} opacity={0.5} />
                        <rect x={x - 50} y={y - 45} width={100} height={20} rx={4} fill="#111827" stroke="#1F2937" strokeWidth={1} />
                        <text x={x} y={y - 32} textAnchor="middle" fill="white" fontSize={9} fontWeight={600}>{v.city}</text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
            </motion.div>
          </div>
          {/* Map Footer Controls */}
          <div className="px-6 py-3 border-t border-[#1F2937] bg-[#111827] flex items-center justify-between shrink-0 mt-auto">
            <span className="text-xs text-zinc-500 font-medium">Interactive Map Controls</span>
            <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-lg border border-[#1F2937]">
              <button 
                onClick={() => setZoom(z => Math.max(1, z - 0.5))} 
                className="p-1.5 hover:bg-[#1F2937] rounded-md text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
                aria-label="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-zinc-300 w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(8, z + 0.5))} 
                className="p-1.5 hover:bg-[#1F2937] rounded-md text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
                aria-label="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        </GlassCard>

        {/* Live Feed */}
        <GlassCard noPadding className="xl:col-span-1 flex flex-col max-h-[600px]">
          <div className="px-4 py-3 border-b border-[#1F2937] flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
            </div>
            <h3 className="text-sm font-semibold text-white">Live Detection Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#1F2937]/50">
            <AnimatePresence>
              {DEMO_VIOLATIONS.map((v, i) => (
                <motion.button
                  key={v.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedViolation(v)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#1F2937]/50 transition-all ${selectedViolation?.id === v.id ? 'bg-[#1F2937]/80 border-l-2' : ''}`}
                  style={{ borderLeftColor: selectedViolation?.id === v.id ? SEVERITY_COLORS[v.severity] : 'transparent' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEVERITY_COLORS[v.severity] }} />
                    <span className="text-xs font-semibold text-white truncate">{v.city}, {v.country}</span>
                    <span className="text-[10px] text-zinc-500 ml-auto flex-shrink-0">{v.detectedAt}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">{v.assetName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ color: PLATFORM_COLORS[v.platform] || '#71717A', borderColor: `${PLATFORM_COLORS[v.platform] || '#71717A'}30`, backgroundColor: `${PLATFORM_COLORS[v.platform] || '#71717A'}10` }}>
                      {v.platform}
                    </span>
                    <span className="text-[10px] text-zinc-500">{v.confidence}% match</span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>

      {/* Selected Violation Detail Panel */}
      <AnimatePresence>
        {selectedViolation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <GlassCard className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${SEVERITY_COLORS[selectedViolation.severity]}15`, border: `1px solid ${SEVERITY_COLORS[selectedViolation.severity]}30` }}>
                  <MapPin className="w-6 h-6" style={{ color: SEVERITY_COLORS[selectedViolation.severity] }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{selectedViolation.city}, {selectedViolation.country}</h3>
                  <p className="text-sm text-zinc-400">{selectedViolation.assetName}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">Platform</p>
                  <p className="font-semibold" style={{ color: PLATFORM_COLORS[selectedViolation.platform] }}>{selectedViolation.platform}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">Confidence</p>
                  <p className="font-bold text-white">{selectedViolation.confidence}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">Severity</p>
                  <p className="font-semibold capitalize" style={{ color: SEVERITY_COLORS[selectedViolation.severity] }}>{selectedViolation.severity}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">Detected</p>
                  <p className="font-medium text-zinc-300">{selectedViolation.detectedAt}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedViolation(null)}
                className="px-4 py-2 rounded-lg bg-[#0B0F19] border border-[#1F2937] text-zinc-400 hover:text-white text-xs transition-colors flex-shrink-0"
              >
                Dismiss
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
