import React from 'react';

export function HLSBackground() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#050B14]">
      
      {/* Local Video Background */}
      <div className="absolute inset-0 w-full h-full opacity-60 flex items-center justify-center">
        <video 
          src="/videos/dashboard-bg.mp4"
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* Night Sky Gradient Overlays to preserve text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0F19]/60 to-[#0B0F19] opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-transparent to-[#0B0F19]/50 opacity-90 pointer-events-none" />

      {/* Grid Lines (25%, 50%, 75%) */}
      <div className="hidden lg:block absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute left-2/4 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/5" />
      </div>
    </div>
  );
}
