import React from 'react';

export const Navbar: React.FC = () => (
  <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(8,8,12,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
    <div className="wrap flex items-center justify-between" style={{ height:64 }}>
      <a href="#" className="flex items-center gap-2">
        <img src="/logo.png" alt="ROVR" style={{ width:28,height:28,borderRadius:6 }} />
        <span style={{ fontFamily:'var(--font)',fontWeight:700,fontSize:'1.1rem' }}>ROVR</span>
      </a>
      <div className="flex gap-6 hide-sm">
        {['Experience','Features','Why ROVR','Download'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s/g,'-')}`} style={{ color:'var(--w50)',fontSize:'0.85rem',fontWeight:500 }}>{l}</a>
        ))}
      </div>
      <a href="#download" className="btn btn-lime" style={{ padding:'0.5rem 1.2rem',fontSize:'0.7rem' }}>Download ROVR</a>
    </div>
  </nav>
);
