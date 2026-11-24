// The share image. Drawn from garden data only.
import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/store';
import { cleanHandle } from '@/lib/auth';
import { loadGarden } from '@/lib/actions';

export const dynamic = 'force-dynamic';
const font = (f: string) => readFile(path.join(process.cwd(), 'assets', f));
const STAGE_COLOR = ['#c89b5a', '#9fe0ae', '#58c286', '#f6b73c', '#ec5b7b'];

export async function GET(_: Request, { params }: { params: Promise<{ handle: string }> }) {
  const [user] = await db.users.find({ handle: cleanHandle((await params).handle) });
  if (!user) return new Response('Not found', { status: 404 });
  const gd = await loadGarden(user);
  const grows = gd.plants.filter((p) => p.kind === 'grow').sort((a, b) => b.total - a.total).slice(0, 5);
  const persona = gd.recap?.persona ?? 'The Gardener';
  const [f6, f4] = await Promise.all([font('fraunces-600.woff'), font('fraunces-400.woff')]);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 84, color: '#fdf6e3', fontFamily: 'Fraunces', background: 'linear-gradient(160deg, #2f9460 0%, #14402c 48%, #0d2419 100%)' }}>
        <div style={{ position: 'absolute', top: -160, right: -160, width: 620, height: 620, borderRadius: 620, background: '#f6b73c', opacity: 0.28, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -220, left: -180, width: 700, height: 700, borderRadius: 700, background: '#ec5b7b', opacity: 0.2, display: 'flex' }} />
        <div style={{ display: 'flex', fontSize: 44, letterSpacing: -1 }}>growspace</div>
        <div style={{ display: 'flex', fontSize: 34, opacity: 0.75, marginTop: 110, letterSpacing: 6, fontWeight: 400 }}>GARDEN WRAPPED</div>
        <div style={{ display: 'flex', fontSize: 124, lineHeight: 1, letterSpacing: -4, marginTop: 20 }}>{persona}</div>
        <div style={{ display: 'flex', fontSize: 46, opacity: 0.85, marginTop: 24, fontWeight: 400 }}>{gd.name} · @{gd.handle}</div>
        <div style={{ display: 'flex', marginTop: 90, gap: 70 }}>
          {[[gd.streak, 'day streak'], [gd.weekLogs, 'wins this week'], [gd.totalLogs, 'all time']].map(([n, l]) => (
            <div key={String(l)} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 150, lineHeight: 1, letterSpacing: -6 }}>{n}</div>
              <div style={{ display: 'flex', fontSize: 34, opacity: 0.75, fontWeight: 400 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 100 }}>
          {grows.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.11)', borderRadius: 36, padding: '26px 34px' }}>
              <div style={{ display: 'flex', width: 34, height: 34, borderRadius: 34, background: STAGE_COLOR[p.stage], marginRight: 26 }} />
              <div style={{ display: 'flex', flex: 1, fontSize: 46 }}>{p.name}</div>
              <div style={{ display: 'flex', fontSize: 36, opacity: 0.75, fontWeight: 400 }}>{p.stageName}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 36, opacity: 0.7, fontWeight: 400 }}>Grow your own at growspace</div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: [{ name: 'Fraunces', data: f6, weight: 600, style: 'normal' }, { name: 'Fraunces', data: f4, weight: 400, style: 'normal' }] },
  );
}
