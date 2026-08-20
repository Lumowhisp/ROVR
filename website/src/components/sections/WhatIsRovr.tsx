import React from 'react';

export const WhatIsRovr: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap">
      <div className="row gap-12">
        {/* Text */}
        <div style={{ flex:1 }}>
          <p className="t-label mb-4">The ROVR Experience</p>
          <h2 className="t-display mb-6">Your body. Your data. Your journey.</h2>
          <p className="t-body">
            ROVR brings the important parts of your fitness journey into one personalized experience.
            It helps you understand your activity, monitor your wellness, stay hydrated, build consistency
            and make better decisions about your fitness.
          </p>
        </div>

        {/* Phone */}
        <div className="flex justify-center" style={{ flex:1 }}>
          <div className="phone">
            <div className="phone-inner">
              <p className="t-label mb-4" style={{ textAlign:'center' }}>ROVR</p>
              {/* Progress ring */}
              <div className="flex justify-center mb-6">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#BEFF00" strokeWidth="6"
                    strokeDasharray="314" strokeDashoffset="80" strokeLinecap="round"
                    transform="rotate(-90 60 60)" />
                  <text x="60" y="56" textAnchor="middle" fill="white" fontSize="18" fontFamily="var(--font)" fontWeight="700">74%</text>
                  <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="var(--font-mono)">DAILY GOAL</text>
                </svg>
              </div>
              {/* Stats */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem' }}>
                {[['8,247','Steps'],['5.2 km','Distance'],['342','Calories'],['82%','Recovery']].map(([v,l]) => (
                  <div key={l} style={{ background:'rgba(255,255,255,0.04)',borderRadius:'0.6rem',padding:'0.6rem',textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:'0.95rem' }}>{v}</div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.55rem',color:'var(--w50)',letterSpacing:'0.1em',textTransform:'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
