// Path: app/api/auth/me/route.ts
// GET → cookie se JWT verify karke logged-in user info return karo

import { cookies }      from 'next/headers'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload {
  id:    number
  name:  string
  email: string
  role:  string
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const user = jwt.verify(token, JWT_SECRET) as JwtPayload

    return NextResponse.json({
      success: true,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }
}