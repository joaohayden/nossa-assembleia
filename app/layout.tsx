import type { Metadata, Viewport } from 'next';
import { Nunito, Fredoka } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://nossaassembleia.vercel.app'),
  title: 'Nossa Assembleia · Mural de Pautas',
  description: 'Participe, vote nas ideias dos vizinhos e sugira melhorias para o condomínio.',
  icons: {
    icon: '/thumb.png',
    apple: '/thumb.png'
  },
  openGraph: {
    title: 'Nossa Assembleia · Mural de Pautas',
    description: 'Participe, vote nas ideias dos vizinhos e sugira melhorias para o condomínio.',
    url: 'https://nossaassembleia.vercel.app',
    siteName: 'Nossa Assembleia',
    images: [
      {
        url: '/thumb.png',
        width: 300,
        height: 300,
        alt: 'Nossa Assembleia Ícone'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Nossa Assembleia · Mural de Pautas',
    description: 'Participe, vote nas ideias dos vizinhos e sugira melhorias para o condomínio.',
    images: ['/thumb.png']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8faf7'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/thumb.png" sizes="any" />
        <link rel="apple-touch-icon" href="/thumb.png" />
      </head>
      <body className={`${nunito.variable} ${fredoka.variable}`}>
        {children}
      </body>
    </html>
  );
}
