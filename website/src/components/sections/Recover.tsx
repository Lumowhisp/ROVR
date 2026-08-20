import React from 'react';

export const Recover: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <p className="t-label mb-4">Recovery</p>
      <h2 className="t-display mb-4">TRAIN HARD. RECOVER SMART.</h2>
      <p className="t-body mb-8 mx-auto" style={{ maxWidth:560 }}>
        ROVR helps you understand your recovery by considering important wellness signals.
      </p>

      <div className="grid-3" style={{ maxWidth:900,margin:'0 auto' }}>
        {/* Sleep */}
        <div className="card text-center">
          <div style={{ fontSize:'2rem',marginBottom:'0.5rem' }}>🌙</div>
          <div style={{ fontFamily:'var(--font)',fontSize:'2rem',fontWeight:700 }}>7h 42m</div>
          <div className="t-label mt-2">Sleep</div>
        </div>
        {/* Resting HR */}
        <div className="card text-center">
          <div style={{ fontSize:'2rem',marginBottom:'0.5rem' }}>❤️</div>
          <div style={{ fontFamily:'var(--font)',fontSize:'2rem',fontWeight:700 }}>61 BPM</div>
          <div className="t-label mt-2">Resting HR</div>
        </div>
        {/* Recovery */}
        <div className="card text-center">
          <div className="flex justify-center mb-2">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#BEFF00" strokeWidth="5"
                strokeDasharray="201" strokeDashoffset="36" strokeLinecap="round"
                transform="rotate(-90 40 40)" />
              <text x="40" y="44" textAnchor="middle" fill="white" fontSize="16" fontFamily="var(--font)" fontWeight="700">82%</text>
            </svg>
          </div>
          <div className="t-label">Recovery</div>
        </div>
      </div>
    </div>
  </section>
);
