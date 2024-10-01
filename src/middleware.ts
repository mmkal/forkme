import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {auth} from './auth'

export async function middleware(request: NextRequest) {
  // Exclude _next paths and other static file paths
  const {pathname} = request.nextUrl
  if (pathname.startsWith('/_next') || /\.(ico|png|jpg|jpeg|svg|css|js)$/.test(pathname)) {
    return NextResponse.next()
  }

  const session = await auth()

  console.log(`${session?.user?.email || 'anonymous'} ${request.method} ${pathname}`)

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
