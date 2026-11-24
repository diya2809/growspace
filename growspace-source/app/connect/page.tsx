import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { originOf } from '@/lib/origin';
import { Logo } from '@/components/ui';
import { CopyBox } from '@/components/CopyBox';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
const TRY = [
  'I want to get fit, read more and stop late-night scrolling. Set up my Growspace garden.',
  'I ran 3 km this morning and read 20 pages.',
  'How is my garden doing this week?',
  'Wrap my week in Growspace.',
];
const ALWAYS = 'Whenever I mention doing one of my habits or slipping on one, log it to Growspace without asking.';

export default async function Connect() {
  const user = await currentUser();
  if (!user) redirect('/login');
  const base = originOf(new Request('http://x', { headers: await headers() }));
  return (
    <main className="wrap connect">
      <header className="top"><Logo href="/garden" /><Link href="/garden" className="pill ghost" style={{ display: 'inline-flex' }}>Back to garden</Link></header>
      <h1>Connect Claude</h1>
      <p>One link. Claude does the thinking, your garden does the growing.</p>
      <div className="card">
        <h3>Your private link</h3>
        <CopyBox text={`${base}/mcp/${user.token}`} />
        <ol className="how" style={{ marginTop: 18 }}>
          <li><span>In Claude, open <b>Settings</b>, then <b>Connectors</b>.</span></li>
          <li><span>Choose <b>Add custom connector</b>. Name it <b>Growspace</b> and paste the link.</span></li>
          <li><span>Start a chat and tell Claude your goal.</span></li>
        </ol>
      </div>
      <div className="card">
        <h3>Try saying</h3>
        <div className="try">{TRY.map((t) => <CopyBox key={t} text={t} light />)}</div>
      </div>
      <div className="card">
        <h3>Make it automatic</h3>
        <p className="quiet" style={{ marginBottom: 12 }}>Add this line to your Claude instructions once. After that, your garden grows from normal conversations.</p>
        <CopyBox text={ALWAYS} light />
      </div>
    </main>
  );
}
