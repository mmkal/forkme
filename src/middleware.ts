import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import {auth} from './auth'

export async function middleware(request: NextRequest) {
  const session = await auth()

  console.log(`${session?.user?.email || ''} ${request.method} ${request.nextUrl.pathname} authed: ${!!session}`)

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     * - images (image files)
     */
    '/((?!_next|static|favicon\\.ico|images|logos|videos).*)',
  ],
}
