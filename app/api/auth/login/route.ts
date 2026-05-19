// Path: app/api/auth/login/route.ts
// POST → validate email + password, check is_active, return JWT token

import db               from '@/lib/db'
import bcrypt           from 'bcryptjs'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { RowDataPacket } from 'mysql2'
import { logActivity }  from '@/lib/logActivity'   // ✅ import

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface Admin extends RowDataPacket {
  id:        number
  name:      string
  email:     string
  role:      'superadmin' | 'datauploader' | 'viewer'
  password:  string
  is_active: boolean
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json() as { email: string; password: string }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const [rows] = await db.query<Admin[]>(
      `SELECT id, name, email, role, password, is_active FROM admins WHERE email = ? LIMIT 1`,
      [email.trim().toLowerCase()]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const admin = rows[0]

    // Password check
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // is_active check
    if (!admin.is_active) {
      return NextResponse.json(
        { success: false, error: 'ACCOUNT_BLOCKED' },
        { status: 403 }
      )
    }

    // JWT token generate karo (8 hours)
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    // ✅ Login activity log karo
    await logActivity(admin.id, 'Logged in')

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 8,
      path:     '/',
    })

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Login Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}