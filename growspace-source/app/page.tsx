import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { Landing } from '@/components/Landing';

export default async function Home() {
  if (await currentUser()) redirect('/garden');
  return <Landing />;
}
