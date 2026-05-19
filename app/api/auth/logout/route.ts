// Path: app/api/auth/logout/route.ts
// POST → log activity, then clear auth cookie

import { NextResponse } from 'next/server'
import { cookies }      from 'next/headers'
import jwt              from 'jsonwebtoken'
import { logActivity }  from '@/lib/logActivity'

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload {
  id:   number
  name: string
  role: string
}

export async function POST() {
  try {
    // ✅ Pehle cookie se user identify karo
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (token) {
      try {
        const user = jwt.verify(token, JWT_SECRET) as JwtPayload
        // ✅ Phir activity log karo
        await logActivity(user.id, 'Logged out')
      } catch {
        // Token invalid ho toh silently ignore — logout anyway
      }
    }
  } catch {
    // Cookie read fail ho toh bhi logout continue karo
  }

  // ✅ Ab cookie clear karo
  const response = NextResponse.json({ success: true, message: 'Logged out' })

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    maxAge:   0,
    path:     '/',
  })

  return response
}