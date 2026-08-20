import React from 'react';

export const Problem: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <h2 className="t-display mb-8">Fitness isn't just about the workout.</h2>
      <div className="grid-3" style={{ maxWidth:800,margin:'0 auto' }}>
        {['Movement','Recovery','Hydration','Sleep','Consistency','Daily Habits'].map(w => (
          <div key={w} className="t-headline t-lime" style={{ padding:'1rem 0' }}>{w}.</div>
        ))}
      </div>
      <div className="divider mt-12 mb-8 mx-auto" style={{ maxWidth:120 }} />
      <h3 className="t-display">ROVR connects the pieces.</h3>
    </div>
  </section>
);
