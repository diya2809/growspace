import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/store';
import { cleanHandle } from '@/lib/auth';
import { loadGarden } from '@/lib/actions';
import { publicView } from '@/lib/garden';
import { seedDemo } from '@/lib/demo';
import { PublicGarden } from '@/components/PublicGarden';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ handle: string }> };
async function find(handle: string) {
  const h = cleanHandle(decodeURIComponent(handle));
  if (h === 'demo') await seedDemo();
  return (await db.users.find({ handle: h }))[0];
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const user = await find((await params).handle);
  if (!user) return {};
  const title = `${user.name}'s garden · Growspace`;
  return { title, openGraph: { title, images: [`/api/card/${user.handle}`] } };
}
export default async function Public({ params }: P) {
  const user = await find((await params).handle);
  if (!user) notFound();
  return <PublicGarden gd={publicView(await loadGarden(user))} />;
}
