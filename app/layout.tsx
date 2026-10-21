import type { Metadata, Viewport } from 'next';
import { Nunito, Fredoka } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Nossa Assembleia · Vote nas pautas',
  description: 'Sugira pautas, vote e escolha as prioridades do nosso condomínio.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png'
  },
  openGraph: {
    title: 'Nossa Assembleia · Vote nas pautas',
    description: 'Sugira pautas, vote e escolha as prioridades do nosso condomínio.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nossa Assembleia'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nossa Assembleia · Vote nas pautas',
    description: 'Sugira pautas, vote e escolha as prioridades do nosso condomínio.',
    images: ['/og-image.png']
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
        <link rel="icon" href="/icon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={`${nunito.variable} ${fredoka.variable}`}>
        {children}
      </body>
    </html>
  );
}
