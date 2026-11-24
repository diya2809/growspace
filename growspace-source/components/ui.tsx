'use client';
import Link from 'next/link';

export const Logo = ({ href = '/' }: { href?: string }) => (
  <Link href={href} className="logo" aria-label="Growspace home">
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <path d="M13 24V12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 13C13 7 8.5 4 3 4c0 6 4 9.5 10 9Z" fill="#2F9460" />
      <path d="M13 16c0-5 4-8 10-8 0 6-4 8.6-10 8Z" fill="#46B274" />
    </svg>
    <span>growspace</span>
  </Link>
);

export const Flame = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
    <path d="M8 1c.6 2.6 3.8 4 3.8 7.6A3.9 3.9 0 0 1 8 12.6a3.9 3.9 0 0 1-3.8-4c0-1.5.7-2.4 1.5-3.2.2 1 .7 1.6 1.3 1.8C6.6 5 7.2 3 8 1Z" fill="#F2803A" transform="translate(0 2)" />
    <path d="M8 8.4c.4 1 1.5 1.5 1.5 2.9A1.5 1.5 0 0 1 8 12.8a1.5 1.5 0 0 1-1.5-1.5c0-1.4 1.1-1.9 1.5-2.9Z" fill="#FFD76A" transform="translate(0 2)" />
  </svg>
);

export const Spark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden><path d="M7 0l1.7 5.3L14 7l-5.3 1.7L7 14l-1.7-5.3L0 7l5.3-1.7Z" fill="currentColor" /></svg>
);

export async function post<T = any>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

export function ago(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}
