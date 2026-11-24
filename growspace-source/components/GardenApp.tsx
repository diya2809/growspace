'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import type { Garden, PlantView } from '@/lib/garden';
import { SPECIES } from '@/lib/garden';
import { Plant } from './Plant';
import { Scene, usePhase } from './Scene';
import { Flame, Logo, Spark, ago, post } from './ui';

type FxType = 'water' | 'bloom' | 'slip';
type Fx = Record<string, { type: FxType; n: number }>;
const DAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ---------- effects that play on a plant ---------- */
function Effect({ type }: { type: FxType }) {
  if (type === 'slip') {
    return (
      <div className="fx">
        {Array.from({ length: 8 }, (_, i) => (
          <motion.i key={i} className="puff" initial={{ x: 0, y: 0, scale: 0.4, opacity: 0.9 }} animate={{ x: Math.cos(i * 0.8) * 46, y: -20 - Math.abs(Math.sin(i * 0.8)) * 44, scale: 1.6, opacity: 0 }} transition={{ duration: 1, ease: 'easeOut', delay: i * 0.03 }} />
        ))}
      </div>
    );
  }
  return (
    <div className="fx">
      {Array.from({ length: 7 }, (_, i) => (
        <motion.i key={i} className="drop" style={{ left: `${22 + i * 9.5}%` }} initial={{ y: -150, opacity: 0 }} animate={{ y: [-150, -10], opacity: [0, 1, 1, 0] }} transition={{ duration: 0.65, delay: i * 0.07, ease: 'easeIn' }} />
      ))}
      <motion.b className="plus" initial={{ y: -40, opacity: 0, scale: 0.6 }} animate={{ y: -120, opacity: [0, 1, 1, 0], scale: 1 }} transition={{ duration: 1.3, delay: 0.45 }}>+1</motion.b>
      {type === 'bloom' && (
        <>
          <motion.i className="ring" initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 1, delay: 0.55, ease: 'easeOut' }} />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <motion.i key={i} className={`bit b${i % 3}`} initial={{ x: 0, y: -60, scale: 0, opacity: 1 }} animate={{ x: Math.cos(a) * 84, y: -60 + Math.sin(a) * 84, scale: 1, opacity: 0, rotate: 200 }} transition={{ duration: 1.1, delay: 0.55, ease: 'easeOut' }} />;
          })}
        </>
      )}
    </div>
  );
}

export function PlantSlot({ p, fx, onOpen, index }: { p: PlantView; fx?: { type: FxType; n: number }; onOpen?: () => void; index: number }) {
  const dots = p.kind === 'grow' ? Array.from({ length: p.target }, (_, i) => i < p.week) : [];
  return (
    <motion.button layout className={`slot ${p.kind}`} onClick={onOpen} disabled={!onOpen} whileHover={onOpen ? { y: -7 } : undefined} whileTap={onOpen ? { scale: 0.95 } : undefined} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
      <div className="art">
        <Plant look={p} delay={index * 0.07} />
        <AnimatePresence>{fx && <Effect key={fx.n} type={fx.type} />}</AnimatePresence>
      </div>
      <div className="tag">
        <b>{p.name}</b>
        {p.kind === 'grow'
          ? <span className="dots">{dots.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}{p.week > p.target && <em>+{p.week - p.target}</em>}</span>
          : <span className="clean">{p.level ? `${p.total > p.week ? p.level : p.week} slip${p.level === 1 ? '' : 's'}` : p.cleanDays ? `${p.cleanDays}d clean` : 'Clear'}</span>}
      </div>
    </motion.button>
  );
}

/* ---------- bottom sheet ---------- */
function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <motion.div className="veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" role="dialog" aria-modal initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        {children}
      </motion.div>
    </motion.div>
  );
}

const Stepper = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="stepper">
    <button onClick={() => onChange(Math.max(1, value - 1))} aria-label="Less">−</button>
    <span><b>{value}</b>× a week</span>
    <button onClick={() => onChange(Math.min(7, value + 1))} aria-label="More">+</button>
  </div>
);

const SpeciesPicker = ({ value, onChange }: { value: string; onChange: (s: string) => void }) => (
  <div className="species">
    {SPECIES.map((s) => (
      <button key={s} className={s === value ? 'on' : ''} onClick={() => onChange(s)} aria-label={s} title={s}>
        <Plant look={{ kind: 'grow', species: s, stage: 3, level: 0, wilted: false }} width={46} still />
      </button>
    ))}
  </div>
);

function PlantSheet({ p, gd, act, onClose }: { p: PlantView; gd: Garden; act: (b: object) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(p.name);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const weed = p.kind === 'weed';
  const history = gd.feed.filter((l) => l.plantId === p.id).slice(0, 5);
  const saveName = () => name.trim() && name.trim() !== p.name && act({ op: 'edit', plant: p.id, name });
  return (
    <Sheet onClose={onClose}>
      <div className={`hero ${weed ? 'weed' : ''}`}><Plant look={p} width={170} /></div>
      <input className="title" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} maxLength={40} aria-label="Plant name" />
      {weed ? (
        <p className="sub">{p.level ? `Weed size ${p.level} of 4. It shrinks as slips age out of the last 7 days.` : `Clear for ${p.cleanDays} day${p.cleanDays === 1 ? '' : 's'}. Keep it that way.`}</p>
      ) : (
        <>
          <p className="sub">{p.wilted ? 'Wilting. Water it to bring it back.' : p.stage === 4 ? `Flourishing after ${p.total} wins.` : `${p.stageName}. ${p.toNext} more to ${['', 'sprout', 'grow', 'bloom', 'flourish'][p.stage + 1]}.`}</p>
          <div className="bar"><motion.i animate={{ width: `${Math.max(4, p.progress * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} /></div>
        </>
      )}
      <div className="logrow">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" maxLength={140} onKeyDown={(e) => { if (e.key === 'Enter') { act({ op: 'log', plant: p.id, note }); setNote(''); } }} />
        <motion.button whileTap={{ scale: 0.93 }} className={`btn ${weed ? 'plum' : 'leaf'}`} onClick={() => { act({ op: 'log', plant: p.id, note }); setNote(''); }}>{weed ? 'I slipped' : 'Water'}</motion.button>
      </div>
      {!weed && (
        <div className="settings">
          <Stepper value={p.target} onChange={(n) => act({ op: 'edit', plant: p.id, weekly_target: n })} />
          <SpeciesPicker value={p.species} onChange={(s) => act({ op: 'edit', plant: p.id, species: s })} />
        </div>
      )}
      {history.length > 0 && (
        <ul className="history">
          {history.map((l) => (
            <li key={l.id}>
              <span className={`src ${l.source}`}>{l.source === 'claude' ? <Spark size={11} /> : '•'}</span>
              <span className="what">{l.note || (weed ? 'Slipped' : 'Done')}</span>
              <time>{ago(l.at)}</time>
              <button onClick={() => act({ op: 'undo', id: l.id })} aria-label="Undo">Undo</button>
            </li>
          ))}
        </ul>
      )}
      <button className={`link danger ${confirm ? 'sure' : ''}`} onClick={() => (confirm ? (act({ op: 'edit', plant: p.id, remove: true }), onClose()) : setConfirm(true))}>{confirm ? 'Tap again to remove' : 'Remove'}</button>
    </Sheet>
  );
}

function NewSheet({ act, onClose }: { act: (b: object) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'grow' | 'weed'>('grow');
  const [species, setSpecies] = useState('sunflower');
  const [target, setTarget] = useState(3);
  const create = () => { if (!name.trim()) return; act({ op: 'plant', name, kind, species, weekly_target: target }); onClose(); };
  return (
    <Sheet onClose={onClose}>
      <div className={`hero ${kind === 'weed' ? 'weed' : ''}`}><Plant look={{ kind, species, stage: kind === 'weed' ? 0 : 3, level: kind === 'weed' ? 2 : 0, wilted: false }} width={150} /></div>
      <div className="seg">
        <button className={kind === 'grow' ? 'on' : ''} onClick={() => setKind('grow')}>Grow a habit</button>
        <button className={kind === 'weed' ? 'on' : ''} onClick={() => setKind('weed')}>Pull a weed</button>
      </div>
      <input className="title" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'grow' ? 'Morning run' : 'Late-night scrolling'} maxLength={40} onKeyDown={(e) => e.key === 'Enter' && create()} />
      {kind === 'grow' && <div className="settings"><Stepper value={target} onChange={setTarget} /><SpeciesPicker value={species} onChange={setSpecies} /></div>}
      <motion.button whileTap={{ scale: 0.96 }} className="btn leaf wide" onClick={create} disabled={!name.trim()}>Plant it</motion.button>
    </Sheet>
  );
}

/* ---------- the garden ---------- */
export function GardenApp({ initial }: { initial: Garden }) {
  const [gd, setGd] = useState(initial);
  const [fx, setFx] = useState<Fx>({});
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const prev = useRef(initial);
  const busy = useRef(0);
  const n = useRef(0);
  const phase = usePhase();

  const apply = useCallback((next: Garden, remote: boolean) => {
    const before = new Map(prev.current.plants.map((p) => [p.id, p]));
    const add: Fx = {};
    const news: string[] = [];
    for (const p of next.plants) {
      const q = before.get(p.id);
      if (!q) { news.push(`planted ${p.name}`); continue; }
      if (p.total > q.total) {
        add[p.id] = { type: p.kind === 'weed' ? 'slip' : p.stage > q.stage ? 'bloom' : 'water', n: ++n.current };
        news.push(p.kind === 'weed' ? `logged a slip on ${p.name}` : p.stage > q.stage ? `watered ${p.name}. Now ${p.stageName.toLowerCase()}!` : `watered ${p.name}`);
      }
    }
    prev.current = next;
    setGd(next);
    if (Object.keys(add).length) {
      setFx((f) => ({ ...f, ...add }));
      setTimeout(() => setFx((f) => Object.fromEntries(Object.entries(f).filter(([id, v]) => add[id]?.n !== v.n))), 2000);
    }
    if (remote && news.length) {
      const who = next.feed[0]?.source === 'app' && !news[0].startsWith('planted') ? 'You' : 'Claude';
      setToast({ text: `${who} ${news.length > 2 ? `made ${news.length} changes` : news.join(' and ')}`.replace('! and', ' and'), n: ++n.current });
    }
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);

  // Live: pick up what Claude does while this page is open.
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden || busy.current) return;
      const r = await fetch('/api/garden', { cache: 'no-store' }).catch(() => null);
      if (r?.status === 401) { location.href = '/login'; return; }
      if (r?.ok && !busy.current) {
        const next: Garden = await r.json();
        if (JSON.stringify(next) !== JSON.stringify(prev.current)) apply(next, true);
      }
    }, 2500);
    return () => clearInterval(t);
  }, [apply]);

  const act = useCallback(async (body: object) => {
    busy.current++;
    try { const next = await post<Garden & { error?: string }>('/api/do', body); if (!next.error) apply(next, false); }
    finally { busy.current--; }
  }, [apply]);

  const grows = gd.plants.filter((p) => p.kind === 'grow').length, weeds = gd.plants.length - grows;
  const hour = new Date().getHours();
  const hello = phase === 'night' ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const openPlant = gd.plants.find((p) => p.id === open);

  return (
    <main className="wrap">
      <header className="top">
        <Logo href="/garden" />
        <nav>
          <Link href="/wrapped" className="pill wrapped"><Spark /> Wrapped</Link>
          <Link href="/connect" className="pill ghost">Connect Claude</Link>
          <div className="me">
            <button className="avatar" onClick={() => setMenu((m) => !m)} aria-label="Menu">{gd.name.slice(0, 1).toUpperCase()}</button>
            <AnimatePresence>
              {menu && (
                <motion.div className="menu" initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}>
                  <Link href={`/@${gd.handle}`}>Public page</Link>
                  <Link href="/connect">Connect Claude</Link>
                  <button onClick={async () => { await post('/api/auth', { action: 'logout' }); location.href = '/'; }}>Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      <Scene phase={phase} className="garden">
        <div className="over">
          <div>
            <h1>{hello}, {gd.name.split(' ')[0]}</h1>
            <p>{gd.plants.length ? `${grows} growing${weeds ? ` · ${weeds} weed${weeds === 1 ? '' : 's'}` : ''}` : 'A fresh patch of soil'}</p>
          </div>
          <div className="stats">
            <motion.span key={gd.streak} className="glass" initial={{ scale: 1.25 }} animate={{ scale: 1 }}><Flame /> <b>{gd.streak}</b> day streak</motion.span>
            <span className="glass"><b>{gd.weekLogs}</b> this week</span>
          </div>
        </div>

        {gd.plants.length ? (
          <div className="plants">
            <AnimatePresence>
              {gd.plants.map((p, i) => <PlantSlot key={p.id} p={p} index={i} fx={fx[p.id]} onOpen={() => setOpen(p.id)} />)}
            </AnimatePresence>
            <motion.button layout className="slot add" onClick={() => setAdding(true)} whileHover={{ y: -4 }} whileTap={{ scale: 0.94 }} aria-label="Add a plant"><span>+</span></motion.button>
          </div>
        ) : (
          <motion.div className="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Plant look={{ kind: 'grow', species: 'sunflower', stage: 0, level: 0, wilted: false }} width={120} />
            <h2>Tell Claude your goal</h2>
            <p>It plants the habits. You watch them grow.</p>
            <div className="row"><Link href="/connect" className="btn leaf">Connect Claude</Link><button className="btn soft" onClick={() => setAdding(true)}>Plant by hand</button></div>
          </motion.div>
        )}
      </Scene>

      <section className="below">
        <div className="card week">
          <h3>This week</h3>
          <div className="days">
            {gd.days.map((d, i) => (
              <div key={d.day} className={`day ${d.day === gd.today ? 'today' : ''} ${d.day > gd.today ? 'future' : ''}`}>
                <div className="col"><motion.i className="fill" initial={false} animate={{ height: `${Math.min(100, d.count * 26)}%` }} transition={{ type: 'spring', stiffness: 140, damping: 16 }} />{d.slips > 0 && <u title={`${d.slips} slip${d.slips === 1 ? '' : 's'}`} />}</div>
                <span>{DAY[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card feed">
          <h3>Lately</h3>
          {gd.feed.length ? (
            <ul>
              <AnimatePresence initial={false}>
                {gd.feed.slice(0, 6).map((l) => (
                  <motion.li key={l.id} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <span className={`src ${l.source} ${l.kind}`}>{l.source === 'claude' ? <Spark size={11} /> : '•'}</span>
                    <span className="what"><b>{l.plant}</b>{l.note && <em>{l.note}</em>}</span>
                    <time>{ago(l.at)}</time>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : <p className="quiet">Nothing yet. Water a plant or tell Claude what you did.</p>}
        </div>
      </section>

      <AnimatePresence>
        {openPlant && <PlantSheet key={openPlant.id} p={openPlant} gd={gd} act={act} onClose={() => setOpen(null)} />}
        {adding && <NewSheet key="new" act={act} onClose={() => setAdding(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <motion.div key={toast.n} className="toast" initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}><Spark /> {toast.text}</motion.div>}
      </AnimatePresence>
    </main>
  );
}
