import React from 'react';

export const Footer: React.FC = () => (
  <footer style={{ background:'var(--bg)',borderTop:'1px solid var(--w05)',padding:'4rem 0 2rem' }}>
    <div className="wrap text-center">
      <div style={{ fontFamily:'var(--font)',fontSize:'clamp(4rem,15vw,10rem)',fontWeight:900,textTransform:'uppercase',letterSpacing:'-0.05em',color:'transparent',WebkitTextStroke:'1px rgba(255,255,255,0.04)',lineHeight:0.85,userSelect:'none' }}>ROVR</div>
      <p className="t-label mt-6">Move. Train. Evolve.</p>
      <div className="flex justify-center gap-6 mt-6" style={{ flexWrap:'wrap' }}>
        {['Experience','Features','Privacy','Terms','Contact'].map(l => (
          <a key={l} href="#" style={{ color:'var(--w30)',fontSize:'0.85rem' }}>{l}</a>
        ))}
      </div>
      <div className="divider mt-8 mb-4" />
      <p style={{ color:'var(--w30)',fontSize:'0.75rem' }}>© 2026 ROVR. All rights reserved.</p>
    </div>
  </footer>
);
