import { cookies } from 'next/headers';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { db, uid, type User } from './store';
import { seedDemo } from './demo';

const secret = () => process.env.SECRET || 'dev-secret';
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('hex').slice(0, 32);

export function hash(pw: string, salt = randomBytes(8).toString('hex')) {
  return `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`;
}
function verify(pw: string, stored: string) {
  const [salt] = stored.split(':');
  const a = Buffer.from(hash(pw, salt));
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const cleanHandle = (h: string) => h.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

export async function signup(name: string, handleRaw: string, pw: string, tz: string): Promise<User | string> {
  const handle = cleanHandle(handleRaw);
  if (handle.length < 3) return 'Username needs at least 3 letters or numbers.';
  if (pw.length < 6) return 'Password needs at least 6 characters.';
  if ((await db.users.find({ handle })).length) return 'That username is taken.';
  const user: User = {
    id: uid(), handle, name: name.trim().slice(0, 40) || handle, pass: hash(pw),
    token: randomBytes(18).toString('base64url'), tz: validTz(tz), createdAt: Date.now(),
  };
  await db.users.insert(user);
  return user;
}

export async function login(handleRaw: string, pw: string): Promise<User | string> {
  const handle = cleanHandle(handleRaw);
  if (handle === 'demo') await seedDemo();
  const [user] = await db.users.find({ handle });
  if (!user || !verify(pw, user.pass)) return 'Wrong username or password.';
  return user;
}

export async function startSession(user: User) {
  (await cookies()).set('gs', `${user.id}.${sign(user.id)}`, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 90,
    secure: process.env.NODE_ENV === 'production' && !process.env.INSECURE_COOKIE,
  });
}
export async function endSession() {
  (await cookies()).delete('gs');
}
export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get('gs')?.value;
  if (!raw) return null;
  const [id, sig] = raw.split('.');
  if (!id || sig !== sign(id)) return null;
  return (await db.users.find({ id }))[0] ?? null;
}

export function validTz(tz: string) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch { return 'Asia/Kolkata'; }
}
