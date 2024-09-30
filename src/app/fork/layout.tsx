'use client'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {SessionProvider} from 'next-auth/react'
import {useState} from 'react'
import {Toaster} from 'sonner'

export default function ForkLayout({children}: {children: React.ReactNode}) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}
