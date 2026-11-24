import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { loadGarden } from '@/lib/actions';
import { GardenApp } from '@/components/GardenApp';

export const dynamic = 'force-dynamic';
export default async function GardenPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return <GardenApp initial={await loadGarden(user)} />;
}
