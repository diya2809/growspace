import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/wght-italic.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: 'Growspace · Your life garden',
  description: 'Tell Claude what you did. Watch your goals grow into a garden.',
};
export const viewport: Viewport = { themeColor: '#f4efe4', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
