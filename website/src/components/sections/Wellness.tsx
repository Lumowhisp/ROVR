import React from 'react';

export const Wellness: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <h2 className="t-display mb-4">FITNESS IS MORE THAN FITNESS.</h2>
      <p className="t-body mb-8 mx-auto" style={{ maxWidth:600 }}>
        ROVR brings movement, sleep, recovery, hydration and daily habits together so you can understand your overall fitness journey.
      </p>

      <div className="grid-5" style={{ maxWidth:1000,margin:'0 auto' }}>
        {[
          ['🏃','Movement','Track your activity'],
          ['🌙','Sleep','Monitor rest quality'],
          ['❤️','Recovery','Understand readiness'],
          ['💧','Hydration','Stay aware of intake'],
          ['🔥','Daily Habits','Build consistency'],
        ].map(([icon,title,desc]) => (
          <div key={title as string} className="card text-center" style={{ padding:'1.5rem 1rem' }}>
            <div style={{ fontSize:'1.5rem',marginBottom:'0.75rem' }}>{icon}</div>
            <div className="t-title mb-2">{title}</div>
            <div style={{ fontSize:'0.8rem',color:'var(--w50)' }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
