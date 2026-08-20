import React from 'react';

export const Move: React.FC = () => (
  <section id="features" className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap">
      <p className="t-label mb-4">Activity Tracking</p>
      <h2 className="t-display mb-4">MOVE WITH PURPOSE.</h2>
      <p className="t-body mb-8" style={{ maxWidth:560 }}>Track your movement and turn every journey into measurable progress.</p>

      {/* Route Visual */}
      <div style={{ background:'var(--card)',borderRadius:'1rem',padding:'2rem',position:'relative',overflow:'hidden',border:'1px solid var(--card-border)' }}>
        <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <polyline points="40,160 120,120 200,140 300,60 400,90 500,40 600,80 700,50 760,70"
            fill="none" stroke="#BEFF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
          {/* Route dots */}
          {[[40,160],[300,60],[500,40],[760,70]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="#BEFF00" />
          ))}
        </svg>
      </div>

      {/* Metrics */}
      <div className="grid-4 mt-6">
        {[['7.42','KM'],['42:18','Duration'],['5:41','Pace /km'],['+240','XP Earned']].map(([v,l]) => (
          <div key={l} className="card text-center">
            <div style={{ fontFamily:'var(--font)',fontSize:'clamp(1.5rem,3vw,2.2rem)',fontWeight:700 }}>{v}</div>
            <div className="t-label mt-2">{l}</div>
          </div>
        ))}
      </div>

      {/* Activity types */}
      <div className="flex justify-center gap-8 mt-8" style={{ flexWrap:'wrap' }}>
        {['Running','Walking','Cycling','Outdoor'].map(a => (
          <div key={a} className="text-center">
            <div style={{ width:48,height:48,borderRadius:'50%',background:'var(--w05)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 0.5rem' }}>
              <span style={{ fontSize:'1.2rem' }}>{a === 'Running' ? '🏃' : a === 'Walking' ? '🚶' : a === 'Cycling' ? '🚴' : '⛰️'}</span>
            </div>
            <span className="t-label">{a}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);
