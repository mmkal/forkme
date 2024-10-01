import {Metadata, Viewport} from 'next'
import '../styles/globals.css'
import {Alegreya as MainFont} from 'next/font/google'
// import {Suspense} from 'react'
// import {Header} from '../components/Header'
// import {PostHogPageview} from './providers'
// import {Toaster} from '~/components/ui/toaster'

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
    images: ['/logo.webp'], // Add your Open Graph image path here
  },
  twitter: {
    card: 'summary_large_image',
    title: 'forkme ⑂',
    description: 'Fork yourself and get funded faster',
    images: ['/logo.webp'], // Add your Twitter card image path here
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
      {/* <Suspense>
        <PostHogPageview />
      </Suspense> */}
      <body className="forkmeBody bg-[#f0ebe0]">
        {/* <Header /> */}
        <main className="">{children}</main>
        {/* <Toaster /> */}
      </body>
    </html>
  )
}
