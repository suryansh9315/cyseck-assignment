import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/api/:path*'],
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const isApiRoute = pathname.startsWith('/api/')
  const token = req.cookies.get('token')?.value
  const payload = token ? await verifyJWT(token) : null

  if (!payload) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/employee') && payload.role !== 'employee') {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}
