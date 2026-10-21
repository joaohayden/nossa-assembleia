import type { Metadata, Viewport } from 'next';
import { Nunito, Fredoka } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://nossaassembleia.vercel.app'),
  title: 'Realize Ajuricaba · Mural de Ideias',
  description: 'Sua ideia pode ajudar a construir um condomínio melhor. Compartilhe e apoie melhorias para o condomínio.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png'
  },
  openGraph: {
    title: 'Realize Ajuricaba · Mural de Ideias',
    description: 'Sua ideia pode ajudar a construir um condomínio melhor. Compartilhe e apoie melhorias para o condomínio.',
    url: 'https://nossaassembleia.vercel.app',
    siteName: 'Realize Ajuricaba',
    images: [
      {
        url: '/icon.png',
        width: 180,
        height: 180,
        alt: 'Mascote Realize Ajuricaba'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Realize Ajuricaba · Mural de Ideias',
    description: 'Sua ideia pode ajudar a construir um condomínio melhor. Compartilhe e apoie melhorias para o condomínio.',
    images: ['/icon.png']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#83c144'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/png" sizes="180x180" href="/icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={`${nunito.variable} ${fredoka.variable}`}>
        {children}
      </body>
    </html>
  );
}
