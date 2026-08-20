import React from 'react';

export const Hydration: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <p className="t-label mb-4">Hydration</p>
      <h2 className="t-display mb-4">HYDRATION, MADE PERSONAL.</h2>
      <p className="t-body mb-8 mx-auto" style={{ maxWidth:560 }}>
        Your hydration needs change with your activity. ROVR helps you stay aware of what your body needs.
      </p>

      {/* Water drop visual */}
      <div className="flex justify-center mb-8">
        <div style={{ position:'relative',width:160,height:210 }}>
          {/* Drop shape */}
          <div style={{ width:160,height:210,borderRadius:'50% 50% 50% 50% / 30% 30% 70% 70%',border:'2px solid rgba(190,255,0,0.3)',position:'relative',overflow:'hidden' }}>
            {/* Water fill */}
            <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'67%',background:'linear-gradient(180deg, rgba(190,255,0,0.08) 0%, rgba(190,255,0,0.2) 100%)',borderTop:'2px solid rgba(190,255,0,0.4)' }} />
          </div>
        </div>
      </div>

      <div style={{ fontFamily:'var(--font)',fontSize:'clamp(1.5rem,3vw,2.5rem)',fontWeight:700 }}>
        <span className="t-lime">1.8 L</span>
        <span style={{ color:'var(--w30)',margin:'0 0.5rem' }}>/</span>
        <span>2.7 L</span>
      </div>
      <p className="t-body mt-4">Adapts to your activity and daily context.</p>
    </div>
  </section>
);
