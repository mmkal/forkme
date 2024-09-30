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
      <body className="verbalistBody">
        {/* <Header /> */}
        <main className="opacity-50">{children}</main>
        {/* <Toaster /> */}
      </body>
    </html>
  )
}
