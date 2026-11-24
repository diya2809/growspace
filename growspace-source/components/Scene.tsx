'use client';
import { useEffect, useState } from 'react';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
const phaseOf = (h: number): Phase => (h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 19.5 ? 'dusk' : 'night');

export function usePhase(fixed?: Phase): Phase {
  const [phase, setPhase] = useState<Phase>(fixed ?? 'day');
  useEffect(() => {
    if (fixed) return;
    const tick = () => { const d = new Date(); setPhase(phaseOf(d.getHours() + d.getMinutes() / 60)); };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [fixed]);
  return phase;
}

const STARS = Array.from({ length: 34 }, (_, i) => ({ x: (i * 37.7) % 100, y: (i * 53.3) % 58, s: 1 + ((i * 7) % 3) * 0.6, d: (i % 7) * 0.6 }));
const FLIES = Array.from({ length: 7 }, (_, i) => ({ x: 8 + ((i * 13.7) % 84), y: 46 + ((i * 17) % 30), d: i * 0.9 }));

export function Scene({ phase, children, className = '' }: { phase: Phase; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`scene ${phase} ${className}`}>
      <div className="sky" />
      {phase === 'night' && <div className="stars">{STARS.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}</div>}
      <div className="orb" />
      <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
      <svg className="hills" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden>
        <path className="h3" d="M0,190 C180,110 330,150 520,170 C720,190 860,90 1200,150 V400 H0Z" />
        <path className="h2" d="M0,250 C200,170 420,260 640,220 C860,180 1000,230 1200,200 V400 H0Z" />
        <path className="h1" d="M0,300 C260,250 520,300 760,280 C960,264 1080,290 1200,276 V400 H0Z" />
      </svg>
      {phase === 'night' && <div className="flies">{FLIES.map((f, i) => <i key={i} style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.d}s` }} />)}</div>}
      {children}
    </div>
  );
}
