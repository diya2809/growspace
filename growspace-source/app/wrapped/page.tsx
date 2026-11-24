import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { loadGarden } from '@/lib/actions';
import { Wrapped } from '@/components/Wrapped';

export const dynamic = 'force-dynamic';
export default async function WrappedPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return <Wrapped gd={await loadGarden(user)} />;
}
