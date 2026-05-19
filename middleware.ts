// // Path: middleware.ts  (root of project, next to package.json)
// // If not logged in  → redirect to /login
// // If logged in and on /login → redirect to /dashboard

// import { NextRequest, NextResponse } from 'next/server'
// import { jwtVerify } from 'jose'

// const JWT_SECRET = new TextEncoder().encode(
//   process.env.JWT_SECRET ?? 'changeme_secret_key'
// )

// // Routes that do NOT need authentication
// const PUBLIC_ROUTES = ['/login']

// // Routes that should be skipped entirely (API, static files, etc.)
// const SKIP_PREFIXES = [
//   '/api/',
//   '/_next/',
//   '/favicon.ico',
// ]

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl

//   // Skip API routes and Next.js internals
//   if (SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
//     return NextResponse.next()
//   }

//   const token = req.cookies.get('auth_token')?.value

//   const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

//   // Verify JWT token
//   let isValidToken = false
//   if (token) {
//     try {
//       await jwtVerify(token, JWT_SECRET)
//       isValidToken = true
//     } catch {
//       // Token expired or invalid
//       isValidToken = false
//     }
//   }

//   // Not logged in + trying to access protected route → send to /login
//   if (!isValidToken && !isPublicRoute) {
//     const loginUrl = new URL('/login', req.url)
//     return NextResponse.redirect(loginUrl)
//   }

//   // Already logged in + on /login → send to /dashboard
//   if (isValidToken && isPublicRoute) {
//     const dashboardUrl = new URL('/', req.url)
//     return NextResponse.redirect(dashboardUrl)
//   }

//   return NextResponse.next()
// }

// export const config = {
//   // Run middleware on all routes except static files
//   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
// }




// Path: middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify }                 from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'changeme_secret_key'
)

const PUBLIC_ROUTES  = ['/login']
const SKIP_PREFIXES  = ['/api/', '/_next/', '/favicon.ico']

// ── Role-based route access ────────────────────────────────────────────────
// Routes only superadmin can access
const SUPERADMIN_ONLY = [
  '/admins',
  '/admins-activity',
  '/settings',
]

// Routes datauploader & superadmin can access (viewer cannot — or viewer is read-only, handled in UI)
// All other routes are accessible by all roles (dashboard, live-pcs, campaigns, csv-upload, images, systems, system-logs, automation-apis)

interface JwtPayload {
  id:    number
  name:  string
  email: string
  role:  'superadmin' | 'datauploader' | 'viewer'
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip API routes and Next.js internals
  if (SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const token       = req.cookies.get('auth_token')?.value
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // Verify JWT token
  let payload: JwtPayload | null = null
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, JWT_SECRET)
      payload = p as unknown as JwtPayload
    } catch {
      payload = null
    }
  }

  const isValidToken = payload !== null

  // Not logged in → /login
  if (!isValidToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Already logged in + on /login → /dashboard
  if (isValidToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // ── Role-based protection ──────────────────────────────────────────────
  if (isValidToken && payload) {
    const role = payload.role

    // superadmin-only routes
    const isSuperAdminOnly = SUPERADMIN_ONLY.some(r => pathname.startsWith(r))
    if (isSuperAdminOnly && role !== 'superadmin') {
      // Redirect to dashboard with unauthorized flag
      return NextResponse.redirect(new URL('/?unauthorized=1', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}