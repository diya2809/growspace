import { currentUser } from '@/lib/auth';
import { loadGarden } from '@/lib/actions';

export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Signed out' }, { status: 401 });
  return Response.json(await loadGarden(user), { headers: { 'Cache-Control': 'no-store' } });
}
