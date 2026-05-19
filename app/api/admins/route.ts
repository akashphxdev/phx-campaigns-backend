// // Path: app/api/admins/route.ts
// // GET  → fetch all admins (superadmin only)
// // POST → create new admin (superadmin only)

// import db               from '@/lib/db'
// import bcrypt           from 'bcryptjs'
// import jwt              from 'jsonwebtoken'
// import { NextResponse } from 'next/server'
// import { RowDataPacket, ResultSetHeader } from 'mysql2'
// import { cookies }      from 'next/headers'

// const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

// interface Admin extends RowDataPacket {
//   id:         number
//   name:       string
//   email:      string
//   role:       'superadmin' | 'datauploader' | 'viewer'
//   created_at: string
// }

// interface JwtPayload {
//   id:    number
//   name:  string
//   email: string
//   role:  string
// }

// // Helper: verify token — await cookies() for Next.js 15
// async function getAuthUser(): Promise<JwtPayload | null> {
//   try {
//     const cookieStore = await cookies()
//     const token = cookieStore.get('auth_token')?.value
//     if (!token) return null
//     return jwt.verify(token, JWT_SECRET) as JwtPayload
//   } catch {
//     return null
//   }
// }

// // Path: app/api/admins/route.ts  — sirf GET query change ki hai

// export async function GET() {
//   try {
//     const user = await getAuthUser()

//     if (!user || user.role !== 'superadmin') {
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
//     }

//     const [rows] = await db.query<Admin[]>(
//       `SELECT id, name, email, role, is_active, created_at
//        FROM admins
//        ORDER BY created_at DESC`   // ← is_active add kiya
//     )

//     return NextResponse.json({ success: true, admins: rows })
//   } catch (err) {
//     const message = err instanceof Error ? err.message : 'Unknown error'
//     console.error('[Admins GET Error]', err)
//     return NextResponse.json({ success: false, error: message }, { status: 500 })
//   }
// }
// export async function POST(req: Request) {
//   try {
//     const user = await getAuthUser()

//     // Only superadmin can create admins
//     if (!user || user.role !== 'superadmin') {
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
//     }

//     const { name, email, role, password } = await req.json() as {
//       name:     string
//       email:    string
//       role:     string
//       password: string
//     }

//     // Validate all fields
//     if (!name?.trim())     return NextResponse.json({ success: false, error: 'Name is required' },     { status: 400 })
//     if (!email?.trim())    return NextResponse.json({ success: false, error: 'Email is required' },    { status: 400 })
//     if (!role?.trim())     return NextResponse.json({ success: false, error: 'Role is required' },     { status: 400 })
//     if (!password?.trim()) return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 })

//     const validRoles = ['superadmin', 'datauploader', 'viewer']
//     if (!validRoles.includes(role)) {
//       return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
//     }

//     // Hash password with bcrypt
//     const hashedPassword = await bcrypt.hash(password, 10)

//     // Insert new admin
//     const [result] = await db.query<ResultSetHeader>(
//       `INSERT INTO admins (name, email, role, password) VALUES (?, ?, ?, ?)`,
//       [name.trim(), email.trim().toLowerCase(), role, hashedPassword]
//     )

//     // Return new admin record (without password)
//     const [rows] = await db.query<Admin[]>(
//       `SELECT id, name, email, role, created_at FROM admins WHERE id = ?`,
//       [result.insertId]
//     )

//     return NextResponse.json({
//       success: true,
//       message: 'Admin created successfully',
//       admin:   rows[0],
//     })
//   } catch (err: unknown) {
//     // Handle duplicate email
//     if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY') {
//       return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
//     }
//     const message = err instanceof Error ? err.message : 'Unknown error'
//     console.error('[Admins POST Error]', err)
//     return NextResponse.json({ success: false, error: message }, { status: 500 })
//   }
// }




// Path: app/api/admins/route.ts
// GET  → fetch all admins (superadmin only)
// POST → create new admin (superadmin only)

import db               from '@/lib/db'
import bcrypt           from 'bcryptjs'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { cookies }      from 'next/headers'
import { logActivity }  from '@/lib/logActivity'  // ✅

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface Admin extends RowDataPacket {
  id:         number
  name:       string
  email:      string
  role:       'superadmin' | 'datauploader' | 'viewer'
  created_at: string
}

interface JwtPayload {
  id:    number
  name:  string
  email: string
  role:  string
}

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const [rows] = await db.query<Admin[]>(
      `SELECT id, name, email, role, is_active, created_at
       FROM admins
       ORDER BY created_at DESC`
    )

    return NextResponse.json({ success: true, admins: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Admins GET Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { name, email, role, password } = await req.json() as {
      name:     string
      email:    string
      role:     string
      password: string
    }

    if (!name?.trim())     return NextResponse.json({ success: false, error: 'Name is required' },     { status: 400 })
    if (!email?.trim())    return NextResponse.json({ success: false, error: 'Email is required' },    { status: 400 })
    if (!role?.trim())     return NextResponse.json({ success: false, error: 'Role is required' },     { status: 400 })
    if (!password?.trim()) return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 })

    const validRoles = ['superadmin', 'datauploader', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO admins (name, email, role, password) VALUES (?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), role, hashedPassword]
    )

    const [rows] = await db.query<Admin[]>(
      `SELECT id, name, email, role, created_at FROM admins WHERE id = ?`,
      [result.insertId]
    )

    // ✅ Activity log
    await logActivity(user.id, `Created admin: "${name.trim()}" (${role})`)

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin:   rows[0],
    })
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Admins POST Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}