'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import type { PlantView } from '@/lib/garden';
import { PlantSlot } from './GardenApp';
import { Scene, usePhase } from './Scene';
import { Logo, Spark } from './ui';

const mk = (id: string, name: string, species: string, stage: number, kind: 'grow' | 'weed' = 'grow', level = 0): PlantView => ({
  id, name, kind, species, target: 3, total: 0, week: kind === 'grow' ? Math.min(3, stage) : level, stage, stageName: '', progress: 0, toNext: 0, wilted: false, level, cleanDays: 3, lastDay: null,
});
const START = [mk('run', 'Morning run', 'sunflower', 2), mk('read', 'Read 20 pages', 'tree', 2), mk('calm', 'Meditate', 'lavender', 1), mk('play', 'Badminton', 'tulip', 2), mk('scroll', 'Late scrolling', 'weed', 0, 'weed', 2)];
const SCRIPT: { say: string; id: string; slip?: boolean }[] = [
  { say: 'I ran 3 km this morning', id: 'run' },
  { say: 'Finished chapter four tonight', id: 'read' },
  { say: 'Ten quiet minutes before class', id: 'calm' },
  { say: 'Two hours of doubles at the academy', id: 'play' },
  { say: 'No phone after 11 all week', id: 'scroll', slip: true },
  { say: 'Another run. New best pace', id: 'run' },
  { say: 'Read on the train again', id: 'read' },
];

export function Landing() {
  const phase = usePhase();
  const [plants, setPlants] = useState(START);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState('');
  const [fx, setFx] = useState<Record<string, { type: 'water' | 'bloom' | 'slip'; n: number }>>({});

  useEffect(() => {
    const s = SCRIPT[step % SCRIPT.length];
    if (step > 0 && step % SCRIPT.length === 0) setPlants(START);
    let i = 0;
    const type = setInterval(() => {
      setTyped(s.say.slice(0, ++i));
      if (i < s.say.length) return;
      clearInterval(type);
      setTimeout(() => {
        setPlants((ps) => ps.map((p) => (p.id !== s.id ? p : p.kind === 'weed' ? { ...p, level: Math.max(0, p.level - 2), week: 0 } : { ...p, stage: Math.min(4, p.stage + 1), week: Math.min(3, p.week + 1) })));
        setFx({ [s.id]: { type: s.slip ? 'slip' : 'bloom', n: step } });
      }, 350);
    }, 42);
    const next = setTimeout(() => { setFx({}); setStep((n) => n + 1); }, 4300);
    return () => { clearInterval(type); clearTimeout(next); };
  }, [step]);

  return (
    <main className="wrap land">
      <header className="top"><Logo /><nav><Link href="/login" className="pill ghost" style={{ display: 'inline-flex' }}>Sign in</Link><Link href="/login?new" className="pill wrapped">Start free</Link></nav></header>
      <section className="hero-land">
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>Your goals,<br /><i>grown</i> into a garden.</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>Tell Claude what you did. Your garden grows by itself.</motion.p>
        <motion.div className="row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Link href="/login?new" className="btn leaf big">Start your garden</Link>
          <Link href="/@demo" className="btn soft big">See a live one</Link>
        </motion.div>
      </section>
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 90, damping: 18 }}>
        <Scene phase={phase} className="demo">
          <AnimatePresence mode="wait">
            <motion.div key={step} className="bubble" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <Spark /> <span className="caret">{typed}</span>
            </motion.div>
          </AnimatePresence>
          <div className="plants">{plants.map((p, i) => <PlantSlot key={p.id} p={p} index={i} fx={fx[p.id]} />)}</div>
        </Scene>
      </motion.div>
      <section className="steps">
        {[['Say it', 'Tell Claude your goal. It plants the habits for you.'], ['Live it', 'Mention what you did. Claude waters the right plant.'], ['See it', 'Plants bloom, weeds creep in, and every week gets a Wrapped.']].map(([h, p], i) => (
          <motion.div key={h} className="card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <b>{i + 1}</b><h3>{h}</h3><p>{p}</p>
          </motion.div>
        ))}
      </section>
      <p className="foot">No AI inside. Your own Claude does the thinking. Growspace keeps it alive.</p>
    </main>
  );
}
