import React from 'react';

export const Gamification: React.FC = () => (
  <section className="section" style={{ borderTop:'1px solid var(--w05)' }}>
    <div className="wrap text-center">
      <p className="t-label mb-4">Progression</p>
      <h2 className="t-display mb-4">MAKE PROGRESS FEEL LIKE PROGRESS.</h2>
      <p className="t-body mb-8 mx-auto" style={{ maxWidth:560 }}>
        ROVR turns consistency into a rewarding progression system.
      </p>

      {/* Game UI Card */}
      <div className="card mx-auto" style={{ maxWidth:480,textAlign:'left' }}>
        {/* Level */}
        <div className="flex items-center justify-between mb-6">
          <span className="t-title">LEVEL 07</span>
          <span className="t-lime" style={{ fontFamily:'var(--font)',fontWeight:700 }}>2,840 XP</span>
        </div>

        {/* XP Bar */}
        <div className="progress-track mb-6">
          <div className="progress-fill" style={{ width:'70%' }} />
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3 mb-6" style={{ padding:'0.75rem 1rem',background:'rgba(255,255,255,0.03)',borderRadius:'0.6rem' }}>
          <span style={{ fontSize:'1.2rem' }}>🔥</span>
          <span className="t-title" style={{ fontSize:'1rem' }}>12 Day Streak</span>
        </div>

        {/* Quests */}
        <p className="t-label mb-4">Quests</p>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem' }}>
          {[
            ['Morning Run','✓',false],
            ['Hydration Goal','✓',false],
            ['Recovery Day','✓',false],
            ['Weekly Challenge','→',true],
          ].map(([name,icon,active]) => (
            <div key={name as string} style={{
              padding:'0.75rem',borderRadius:'0.6rem',
              background: active ? 'rgba(190,255,0,0.06)' : 'rgba(255,255,255,0.03)',
              border: active ? '1px solid rgba(190,255,0,0.2)' : '1px solid transparent',
            }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize:'0.8rem',color:'var(--w70)' }}>{name}</span>
                <span style={{ color: active ? 'var(--lime)' : 'var(--w30)' }}>{icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="flex justify-center gap-6 mt-6">
          {['🏆','🥇','⭐'].map((e,i) => (
            <div key={i} style={{ width:40,height:40,borderRadius:'50%',background:'var(--w05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem' }}>{e}</div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
