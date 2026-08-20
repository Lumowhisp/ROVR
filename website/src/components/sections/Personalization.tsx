import React from 'react';

export const Personalization: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <h2 className="t-display mb-4">NO TWO BODIES MOVE THE SAME.</h2>
      <p className="t-body mb-8 mx-auto" style={{ maxWidth:560 }}>
        ROVR is designed around the individual. Your activity. Your habits. Your recovery. Your goals. Your journey.
      </p>

      {/* Node diagram */}
      <div className="flex justify-center mb-8">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Lines to center */}
          {[[150,30],[280,115],[230,270],[70,270],[20,115]].map(([x,y],i) => (
            <line key={i} x1={150} y1={150} x2={x} y2={y} stroke="rgba(190,255,0,0.15)" strokeWidth="1" />
          ))}
          {/* Center node */}
          <circle cx="150" cy="150" r="30" fill="rgba(190,255,0,0.08)" stroke="#BEFF00" strokeWidth="2" />
          <text x="150" y="154" textAnchor="middle" fill="#BEFF00" fontSize="12" fontFamily="var(--font)" fontWeight="700">ROVR</text>
          {/* Outer nodes */}
          {[
            [150,30,'Activity'],[280,115,'Habits'],[230,270,'Recovery'],[70,270,'Goals'],[20,115,'Journey']
          ].map(([x,y,label],i) => (
            <g key={i}>
              <circle cx={x as number} cy={y as number} r="22" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x={x as number} y={(y as number)+4} textAnchor="middle" fill="var(--w70)" fontSize="8" fontFamily="var(--font-mono)" fontWeight="500">{label as string}</text>
            </g>
          ))}
        </svg>
      </div>

      <p className="t-body-lg mx-auto" style={{ maxWidth:500 }}>
        ROVR turns these signals into a more personal fitness experience.
      </p>
    </div>
  </section>
);
