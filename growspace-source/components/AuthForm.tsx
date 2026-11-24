'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Plant } from './Plant';
import { Logo, post } from './ui';

export function AuthForm({ start }: { start: 'login' | 'signup' }) {
  const [mode, setMode] = useState(start);
  const [f, setF] = useState({ name: '', handle: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const go = async (body = f, action = mode) => {
    setBusy(true); setErr('');
    const r = await post('/api/auth', { action, ...body, tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
    if (r.error) { setErr(r.error); setBusy(false); } else location.href = '/garden';
  };
  return (
    <main className="auth">
      <motion.form className="card" onSubmit={(e) => { e.preventDefault(); go(); }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
        <Logo />
        <div style={{ height: 120, display: 'grid', placeItems: 'end center', marginTop: 8 }}>
          <Plant look={{ kind: 'grow', species: mode === 'signup' ? 'sunflower' : 'tulip', stage: mode === 'signup' ? 1 : 3, level: 0, wilted: false }} width={96} />
        </div>
        <h1>{mode === 'signup' ? 'Start your garden' : 'Welcome back'}</h1>
        <p>{mode === 'signup' ? 'Takes ten seconds.' : 'Your plants missed you.'}</p>
        {mode === 'signup' && <input className="field" placeholder="Your name" value={f.name} onChange={set('name')} autoComplete="name" required />}
        <input className="field" placeholder="Username" value={f.handle} onChange={set('handle')} autoComplete="username" autoCapitalize="none" required />
        <input className="field" type="password" placeholder="Password" value={f.password} onChange={set('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
        {err && <div className="err">{err}</div>}
        <button className="btn leaf wide" disabled={busy}>{busy ? 'One moment' : mode === 'signup' ? 'Create garden' : 'Sign in'}</button>
        <button type="button" className="link" style={{ marginTop: 16 }} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr(''); }}>
          {mode === 'signup' ? 'I already have a garden' : 'Create a new garden'}
        </button>
        <button type="button" className="link" style={{ display: 'block', margin: '8px auto 0' }} onClick={() => go({ name: '', handle: 'demo', password: 'growspace' }, 'login')}>Look around the demo garden</button>
      </motion.form>
    </main>
  );
}
