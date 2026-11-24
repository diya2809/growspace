'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { animate, AnimatePresence, motion } from 'motion/react';
import type { Garden } from '@/lib/garden';
import { Plant } from './Plant';
import { CopyBox } from './CopyBox';
import { Spark } from './ui';

function Count({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => { const c = animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) }); return () => c.stop(); }, [to]);
  return <>{v}</>;
}
const rise = (i: number) => ({ initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + i * 0.16, type: 'spring' as const, stiffness: 120, damping: 18 } });
const Blobs = ({ a, b }: { a: string; b: string }) => (
  <>
    <i className="blob" style={{ width: 260, height: 260, background: a, top: -60, right: -80 }} />
    <i className="blob" style={{ width: 220, height: 220, background: b, bottom: -40, left: -70, animationDelay: '-4s' }} />
  </>
);
const fmt = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function Wrapped({ gd }: { gd: Garden }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const grows = gd.plants.filter((p) => p.kind === 'grow');
  const weeds = gd.plants.filter((p) => p.kind === 'weed');
  const star = [...grows].sort((a, b) => b.week - a.week || b.total - a.total)[0];
  const weed = [...weeds].sort((a, b) => b.level - a.level)[0];
  const url = typeof window === 'undefined' ? '' : `${location.origin}/@${gd.handle}`;
  const card = `/api/card/${gd.handle}?v=${gd.recap?.at ?? 0}-${gd.weekLogs}`;

  const slides: React.ReactNode[] = [
    <div className="slide s0" key="0">
      <Blobs a="#46b274" b="#f6b73c" />
      <motion.small {...rise(0)}>Garden Wrapped</motion.small>
      <motion.h2 {...rise(1)}>Your week,<br />{gd.name.split(' ')[0]}.</motion.h2>
      <motion.p {...rise(2)}>{fmt(gd.days[0].day)} to {fmt(gd.days[6].day)}</motion.p>
      <motion.div {...rise(3)} style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
        {grows.slice(0, 3).map((p, k) => <Plant key={p.id} look={p} width={104} delay={0.5 + k * 0.2} />)}
      </motion.div>
    </div>,
    <div className="slide s1" key="1">
      <Blobs a="#ffd76a" b="#ec5b7b" />
      <motion.small {...rise(0)}>You showed up</motion.small>
      <motion.div className="huge" {...rise(1)}><Count to={gd.weekLogs} /></motion.div>
      <motion.h2 {...rise(2)}>{gd.weekLogs === 1 ? 'win' : 'wins'} this week</motion.h2>
      <motion.p {...rise(3)}>{gd.streak > 1 ? `On a ${gd.streak} day streak. Your best is ${gd.best}.` : gd.weekLogs ? 'Every garden starts with one.' : 'A quiet week. The soil is still good.'}</motion.p>
    </div>,
    ...(star ? [
      <div className="slide s2" key="2">
        <Blobs a="#f6e58a" b="#58c286" />
        <motion.small {...rise(0)}>Your star plant</motion.small>
        <motion.div className="plantbig" initial={{ scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 10, delay: 0.25 }}><Plant look={star} width={230} delay={0.3} /></motion.div>
        <motion.h2 {...rise(2)}>{star.name}</motion.h2>
        <motion.p {...rise(3)}>Watered {star.week} {star.week === 1 ? 'time' : 'times'} this week, {star.total} in all. Now {star.stageName.toLowerCase()}.</motion.p>
      </div>] : []),
    ...(weed ? [
      <div className="slide s3" key="3">
        <Blobs a="#c9a6dc" b="#5c4868" />
        <motion.small {...rise(0)}>The weeds</motion.small>
        <motion.div className="plantbig" {...rise(1)}><Plant look={weed} width={190} delay={0.3} /></motion.div>
        <motion.h2 {...rise(2)}>{gd.weekSlips ? `${gd.weekSlips} ${gd.weekSlips === 1 ? 'slip' : 'slips'}` : 'A clean week'}</motion.h2>
        <motion.p {...rise(3)}>{gd.weekSlips ? `${weed.name} crept in. ${weed.cleanDays} clean ${weed.cleanDays === 1 ? 'day' : 'days'} since.` : `Not one slip on ${weed.name}.`}</motion.p>
      </div>] : []),
    <div className="slide s4" key="4">
      <Blobs a="#ffb07a" b="#8e7ce0" />
      {gd.recap ? (
        <>
          <motion.small {...rise(0)}>Claude calls you</motion.small>
          <motion.h2 {...rise(1)}>{gd.recap.persona}</motion.h2>
          <motion.p {...rise(2)}>{gd.recap.headline}</motion.p>
          <ul>{gd.recap.highlights.map((h, k) => <motion.li key={k} {...rise(3 + k)}><Spark size={12} /> {h}</motion.li>)}</ul>
          {gd.recap.nudge && <motion.p {...rise(6)} style={{ fontStyle: 'italic' }}>{gd.recap.nudge}</motion.p>}
        </>
      ) : (
        <>
          <motion.small {...rise(0)}>One thing missing</motion.small>
          <motion.h2 {...rise(1)}>Let Claude name your week</motion.h2>
          <motion.p {...rise(2)}>Say this in Claude, then come back.</motion.p>
          <motion.div className="ask" {...rise(3)}><CopyBox text="Wrap my week in Growspace." /></motion.div>
        </>
      )}
    </div>,
    <div className="slide s5" key="5">
      <motion.small {...rise(0)}>Made to share</motion.small>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img className="sharecard" src={card} alt="Your Garden Wrapped card" initial={{ opacity: 0, scale: 0.85, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 110, damping: 14, delay: 0.2 }} whileHover={{ rotate: 0, scale: 1.03 }} />
      <motion.div className="row" {...rise(2)}>
        <a className="btn leaf" href={card} download={`growspace-${gd.handle}.png`}>Save image</a>
        <ShareLink url={url} />
      </motion.div>
    </div>,
  ];
  const last = slides.length - 1;
  const go = useCallback((d: number) => setI((n) => Math.max(0, Math.min(last, n + d))), [last]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === ' ') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [go]);

  return (
    <div className="story">
      <div className={`frame ${paused ? 'paused' : ''}`}>
        <div className="prog">{slides.map((_, k) => <i key={k} className={k < i ? 'done' : k === i ? 'now' : ''}><b key={`${k}-${i}`} onAnimationEnd={() => k === i && i < last && go(1)} /></i>)}</div>
        <div className="story-top"><span>growspace</span><Link href="/garden" aria-label="Close">×</Link></div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.28 }} style={{ position: 'absolute', inset: 0 }}>{slides[i]}</motion.div>
        </AnimatePresence>
        {i < last && <>
          <button className="tap l" aria-label="Previous" onClick={() => go(-1)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
          <button className="tap r" aria-label="Next" onClick={() => go(1)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        </>}
        {i === last && <button className="tap l" style={{ width: '18%' }} aria-label="Previous" onClick={() => go(-1)} />}
      </div>
    </div>
  );
}

function ShareLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn soft" style={{ color: '#17261d' }} onClick={async () => {
      if (navigator.share) { try { await navigator.share({ title: 'My Growspace garden', url }); return; } catch { /* fall through to copy */ } }
      await navigator.clipboard?.writeText(url); setDone(true); setTimeout(() => setDone(false), 1600);
    }}>{done ? 'Link copied' : 'Share garden'}</button>
  );
}
