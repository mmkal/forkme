import {MotionConfig} from 'framer-motion'
import {Metadata, Viewport} from 'next'
import {Alegreya as MainFont} from 'next/font/google'

import '../styles/globals.css'

const mainFont = MainFont({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'forkme ⑂',
  description: 'Fork yourself and get funded faster',
  openGraph: {
    title: 'forkme ⑂',
    description: 'Fork yourself and get funded faster',
    images: ['/logos/logo.webp'], // Add your Open Graph image path here
  },
  twitter: {
    card: 'summary_large_image',
    title: 'forkme ⑂',
    description: 'Fork yourself and get funded faster',
    images: ['/logos/logo.webp'], // Add your Twitter card image path here
  },
}

export const viewport: Viewport = {
  minimumScale: 1,
  maximumScale: 1,
  initialScale: 1,
  width: 'device-width',
  userScalable: false,
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={mainFont.className + ' darkDISABLED'}>
      <body className="forkmeBody bg-[#f0ebe0]">
        <MotionConfig reducedMotion="user">
          <main className="">{children}</main>
        </MotionConfig>
      </body>
    </html>
  )
}
