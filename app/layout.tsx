import type { Metadata } from 'next';
import { Noto_Sans_KR, Outfit } from 'next/font/google';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '암 치료비 보장금액 분석기',
  description: '가입제안서 PDF를 업로드하면 암 치료 보장 내역을 즉시 분석해드립니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
