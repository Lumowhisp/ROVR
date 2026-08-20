import React from 'react';

export const CycleAware: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <p className="t-label mb-4">Wellness</p>
      <h2 className="t-display mb-4">UNDERSTAND YOUR RHYTHM.</h2>
      <p className="t-body mb-8 mx-auto" style={{ maxWidth:560 }}>
        ROVR can help you understand how different stages of your cycle may relate to training, recovery, nutrition and daily wellness.
      </p>

      {/* Cycle visualization */}
      <div className="flex justify-center mb-8">
        <svg width="280" height="280" viewBox="0 0 280 280">
          {/* Background circle */}
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="20" />
          {/* 4 phase arcs */}
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(190,255,0,0.25)" strokeWidth="20"
            strokeDasharray="173 518" strokeDashoffset="0" transform="rotate(-90 140 140)" />
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(0,210,255,0.25)" strokeWidth="20"
            strokeDasharray="173 518" strokeDashoffset="-173" transform="rotate(-90 140 140)" />
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="20"
            strokeDasharray="173 518" strokeDashoffset="-346" transform="rotate(-90 140 140)" />
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20"
            strokeDasharray="173 518" strokeDashoffset="-519" transform="rotate(-90 140 140)" />
          {/* Center text */}
          <text x="140" y="135" textAnchor="middle" fill="white" fontSize="13" fontFamily="var(--font)" fontWeight="700">YOUR</text>
          <text x="140" y="155" textAnchor="middle" fill="white" fontSize="13" fontFamily="var(--font)" fontWeight="700">CYCLE</text>
          {/* Labels */}
          <text x="140" y="20" textAnchor="middle" fill="rgba(190,255,0,0.8)" fontSize="10" fontFamily="var(--font-mono)">TRAINING</text>
          <text x="265" y="145" textAnchor="middle" fill="rgba(0,210,255,0.8)" fontSize="10" fontFamily="var(--font-mono)">RECOVERY</text>
          <text x="140" y="275" textAnchor="middle" fill="rgba(168,85,247,0.8)" fontSize="10" fontFamily="var(--font-mono)">NUTRITION</text>
          <text x="15" y="145" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="var(--font-mono)">WELLNESS</text>
        </svg>
      </div>

      <p className="t-label">Private. Empowering. Personalized.</p>
    </div>
  </section>
);
