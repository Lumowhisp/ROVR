import React from 'react';

export const FinalCTA: React.FC = () => (
  <section id="download" className="section" style={{ borderTop:'1px solid var(--w05)',position:'relative',overflow:'hidden' }}>
    {/* Ambient glow */}
    <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'50vw',height:'50vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(190,255,0,0.06) 0%,transparent 70%)',pointerEvents:'none' }} />

    <div className="wrap text-center relative" style={{ zIndex:1 }}>
      <h2 className="t-mega mb-6">READY TO EVOLVE?</h2>
      <p className="t-body-lg mb-8 mx-auto" style={{ maxWidth:480 }}>Your next step starts with ROVR.</p>

      <div className="flex justify-center gap-4 mb-8" style={{ flexWrap:'wrap' }}>
        <a href="#" className="btn btn-lime" style={{ padding:'1rem 2.5rem' }}>Download ROVR</a>
      </div>

      {/* Store buttons */}
      <div className="flex justify-center gap-4 mb-8" style={{ flexWrap:'wrap' }}>
        <a href="#" className="store-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div>
            <div style={{ fontSize:'0.55rem',opacity:0.6,lineHeight:1 }}>Download on the</div>
            <div style={{ fontSize:'1rem',fontWeight:600,lineHeight:1.2 }}>App Store</div>
          </div>
        </a>
        <a href="#" className="store-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 1.33-2.928 1.696-2.302-2.302 2.928-0.724zM5.864 2.658L16.8 8.99l-2.302 2.303L5.864 2.658z"/>
          </svg>
          <div>
            <div style={{ fontSize:'0.55rem',opacity:0.6,lineHeight:1 }}>Get it on</div>
            <div style={{ fontSize:'1rem',fontWeight:600,lineHeight:1.2 }}>Google Play</div>
          </div>
        </a>
      </div>

      <p className="t-label">Available on iOS and Android</p>
    </div>
  </section>
);
