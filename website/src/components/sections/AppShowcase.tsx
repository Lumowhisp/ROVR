import React from 'react';

export const AppShowcase: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <p className="t-label mb-4">The Experience</p>
      <h2 className="t-display mb-8">DESIGNED TO MOVE WITH YOU.</h2>

      <div className="flex justify-center gap-6" style={{ flexWrap:'wrap',alignItems:'center' }}>
        {/* Phone 1 — Activity */}
        <div className="phone hide-sm" style={{ transform:'rotate(-4deg)',opacity:0.85 }}>
          <div className="phone-inner">
            <p className="t-label mb-4" style={{ textAlign:'center' }}>Today's Run</p>
            <svg width="100%" height="100" viewBox="0 0 240 100">
              <polyline points="20,80 60,50 100,65 150,25 200,40 220,30" fill="none" stroke="#BEFF00" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',marginTop:'0.75rem' }}>
              {[['5.2 km','Dist'],['28:15','Time'],['+120','XP']].map(([v,l]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:'0.85rem' }}>{v}</div>
                  <div style={{ fontSize:'0.5rem',color:'var(--w50)',fontFamily:'var(--font-mono)',letterSpacing:'0.1em',textTransform:'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phone 2 — Dashboard (main) */}
        <div className="phone" style={{ transform:'scale(1.05)',zIndex:2 }}>
          <div className="phone-inner">
            <p className="t-label mb-4" style={{ textAlign:'center' }}>ROVR</p>
            <div className="flex justify-center mb-4">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#BEFF00" strokeWidth="5"
                  strokeDasharray="251" strokeDashoffset="63" strokeLinecap="round" transform="rotate(-90 50 50)" />
                <text x="50" y="46" textAnchor="middle" fill="white" fontSize="16" fontFamily="var(--font)" fontWeight="700">74%</text>
                <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="var(--font-mono)">DAILY</text>
              </svg>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem' }}>
              {[['8,247','Steps'],['342','Cal'],['1.8L','Water'],['82%','Recovery']].map(([v,l]) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.04)',borderRadius:'0.5rem',padding:'0.5rem',textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:'0.8rem' }}>{v}</div>
                  <div style={{ fontSize:'0.5rem',color:'var(--w50)',fontFamily:'var(--font-mono)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phone 3 — Wellness */}
        <div className="phone hide-sm" style={{ transform:'rotate(4deg)',opacity:0.85 }}>
          <div className="phone-inner">
            <p className="t-label mb-4" style={{ textAlign:'center' }}>Wellness</p>
            {[['Sleep','7h 42m',75],['Heart Rate','61 bpm',55],['Recovery','82%',82]].map(([label,val,pct]) => (
              <div key={label as string} style={{ marginBottom:'0.75rem' }}>
                <div className="flex justify-between" style={{ fontSize:'0.7rem',marginBottom:'0.3rem' }}>
                  <span style={{ color:'var(--w50)',fontFamily:'var(--font-mono)',fontSize:'0.55rem',textTransform:'uppercase',letterSpacing:'0.1em' }}>{label}</span>
                  <span style={{ fontFamily:'var(--font)',fontWeight:600,fontSize:'0.75rem' }}>{val}</span>
                </div>
                <div className="progress-track" style={{ height:4 }}>
                  <div className="progress-fill" style={{ width:`${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
