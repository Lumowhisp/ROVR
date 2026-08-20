import React from 'react';

export const WhyRovr: React.FC = () => (
  <section id="why-rovr" className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <h2 className="t-display mb-8">ONE JOURNEY. ONE EXPERIENCE.</h2>

      <div className="flex flex-col items-center gap-3" style={{ maxWidth:400,margin:'0 auto' }}>
        {['MOVE','RECOVER','HYDRATE','UNDERSTAND','EVOLVE'].map((word, i, arr) => (
          <React.Fragment key={word}>
            <div className="t-headline">{word}</div>
            {i < arr.length - 1 && <div className="t-headline t-lime" style={{ fontSize:'1.5rem' }}>+</div>}
          </React.Fragment>
        ))}
      </div>

      <div className="divider mt-8 mb-8 mx-auto" style={{ maxWidth:120 }} />
      <h3 className="t-display t-lime">All in one place.</h3>
    </div>
  </section>
);
