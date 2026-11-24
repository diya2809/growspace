'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { Garden } from '@/lib/garden';
import { PlantSlot } from './GardenApp';
import { Scene, usePhase } from './Scene';
import { Flame, Logo } from './ui';

export function PublicGarden({ gd }: { gd: Garden }) {
  const phase = usePhase();
  const blooming = gd.plants.filter((p) => p.kind === 'grow' && p.stage >= 3).length;
  return (
    <main className="wrap">
      <header className="top"><Logo /><Link href="/login?new" className="pill wrapped">Grow your own</Link></header>
      <motion.div className="pub-head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1>{gd.name}&rsquo;s garden</h1>
        <p>@{gd.handle}{gd.recap ? ` · ${gd.recap.persona}` : ''}</p>
      </motion.div>
      <Scene phase={phase} className="garden">
        <div className="over"><div /><div className="stats" style={{ marginRight: 0 }}><span className="glass"><Flame /> <b>{gd.streak}</b> day streak</span></div></div>
        <div className="plants">{gd.plants.map((p, i) => <PlantSlot key={p.id} p={p} index={i} />)}</div>
      </Scene>
      <div className="nums">
        <div className="card"><b>{gd.streak}</b><span>day streak</span></div>
        <div className="card"><b>{gd.totalLogs}</b><span>wins logged</span></div>
        <div className="card"><b>{blooming}</b><span>in bloom</span></div>
      </div>
      <div className="cta">
        <h2>Grow your own garden</h2>
        <Link href="/login?new" className="btn leaf big">Start free</Link>
      </div>
    </main>
  );
}
