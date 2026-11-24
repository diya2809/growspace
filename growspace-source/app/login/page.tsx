import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { AuthForm } from '@/components/AuthForm';

export default async function Login({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  if (await currentUser()) redirect('/garden');
  return <AuthForm start={(await searchParams).new !== undefined ? 'signup' : 'login'} />;
}
