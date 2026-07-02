import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KBO 야구 감독 게임',
  description: '포스트시즌 와일드카드부터 한국시리즈까지, 감독이 되어 팀을 우승으로 이끌어라!',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
