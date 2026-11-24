import { endSession, login, signup, startSession } from '@/lib/auth';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.action === 'logout') { await endSession(); return Response.json({ ok: true }); }
  const res = b.action === 'signup'
    ? await signup(String(b.name ?? ''), String(b.handle ?? ''), String(b.password ?? ''), String(b.tz ?? ''))
    : await login(String(b.handle ?? ''), String(b.password ?? ''));
  if (typeof res === 'string') return Response.json({ error: res }, { status: 400 });
  await startSession(res);
  return Response.json({ ok: true });
}
