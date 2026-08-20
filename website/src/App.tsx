import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { Problem } from './components/sections/Problem';
import { WhatIsRovr } from './components/sections/WhatIsRovr';
import { Move } from './components/sections/Move';
import { Recover } from './components/sections/Recover';
import { Hydration } from './components/sections/Hydration';
import { Wellness } from './components/sections/Wellness';
import { CycleAware } from './components/sections/CycleAware';
import { Gamification } from './components/sections/Gamification';
import { Personalization } from './components/sections/Personalization';
import { AppShowcase } from './components/sections/AppShowcase';
import { WhyRovr } from './components/sections/WhyRovr';
import { FinalCTA } from './components/sections/FinalCTA';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <WhatIsRovr />
        <Move />
        <Recover />
        <Hydration />
        <Wellness />
        <CycleAware />
        <Gamification />
        <Personalization />
        <AppShowcase />
        <WhyRovr />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
