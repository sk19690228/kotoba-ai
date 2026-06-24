import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'こころの縁側',
  description: '伝説の尼僧の波乱万丈な生涯と仏の智慧を再現。人間の業や弱さを丸ごと包み込む法話室。',
  keywords: '人生相談, AI, カウンセリング, 悩み相談, こころの縁側, 法話',
  openGraph: {
    title: 'こころの縁側',
    description: '伝説の尼僧の波乱万丈な生涯と仏の智慧を再現。まるで本人が語りかけているような法話室。',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSans.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
