import type { Metadata, Viewport } from 'next';
import { Nunito, Fredoka } from 'next/font/google';
import './globals.css';
const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
export const metadata: Metadata = { title: 'Nossa Assembleia · Vote nas pautas', description: 'Sugira pautas, vote e escolha as prioridades do seu condomínio.', icons: { icon: '/icon.svg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8faf7' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body className={`${nunito.variable} ${fredoka.variable}`}>{children}</body></html>; }
