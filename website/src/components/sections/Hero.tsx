import React from 'react';

export const Hero: React.FC = () => (
  <section id="experience" style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',paddingTop:'5rem',paddingBottom:'3rem',position:'relative',overflow:'hidden' }}>
    {/* Ambient glow */}
    <div style={{ position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:'60vw',height:'60vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(190,255,0,0.06) 0%,transparent 70%)',pointerEvents:'none' }} />

    <div className="wrap relative" style={{ zIndex:1 }}>
      <div className="pill mx-auto mb-6"><span className="dot" /> Fitness & Wellness Platform</div>

      <h1 className="t-mega">MOVE.</h1>
      <h1 className="t-mega t-lime">TRAIN.</h1>
      <h1 className="t-mega">EVOLVE.</h1>

      <p className="t-body-lg mt-6 mx-auto" style={{ maxWidth:560 }}>
        Your personal fitness and wellness companion — built around the way you move, recover and live.
      </p>

      <div className="flex justify-center gap-4 mt-8" style={{ flexWrap:'wrap' }}>
        <a href="#download" className="btn btn-lime">Download ROVR</a>
        <a href="#features" className="btn btn-outline">Explore ROVR ↓</a>
      </div>
    </div>
  </section>
);
