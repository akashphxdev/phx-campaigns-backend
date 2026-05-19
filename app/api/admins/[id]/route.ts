// // Path: app/api/admins/[id]/route.ts
// // PATCH → edit admin  |  DELETE → delete admin

// import db               from '@/lib/db'
// import bcrypt           from 'bcryptjs'
// import jwt              from 'jsonwebtoken'
// import { NextResponse } from 'next/server'
// import { RowDataPacket, ResultSetHeader } from 'mysql2'
// import { cookies }      from 'next/headers'

// const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

// interface Admin extends RowDataPacket {
//   id: number; name: string; email: string
//   role: string; is_active: boolean; created_at: string
// }
// interface JwtPayload { id: number; name: string; email: string; role: string }

// async function getAuthUser(): Promise<JwtPayload | null> {
//   try {
//     const cookieStore = await cookies()
//     const token = cookieStore.get('auth_token')?.value
//     if (!token) return null
//     return jwt.verify(token, JWT_SECRET) as JwtPayload
//   } catch { return null }
// }

// export async function PATCH(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const user = await getAuthUser()
//     if (!user || user.role !== 'superadmin')
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

//     const { id } = await params
//     const { name, email, role, password } = await req.json()

//     if (!name?.trim())  return NextResponse.json({ success: false, error: 'Name is required'  }, { status: 400 })
//     if (!email?.trim()) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })

//     const validRoles = ['superadmin', 'datauploader', 'viewer']
//     if (!validRoles.includes(role))
//       return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })

//     if (password?.trim()) {
//       const hashed = await bcrypt.hash(password, 10)
//       await db.query<ResultSetHeader>(
//         `UPDATE admins SET name=?, email=?, role=?, password=? WHERE id=?`,
//         [name.trim(), email.trim().toLowerCase(), role, hashed, id]
//       )
//     } else {
//       await db.query<ResultSetHeader>(
//         `UPDATE admins SET name=?, email=?, role=? WHERE id=?`,
//         [name.trim(), email.trim().toLowerCase(), role, id]
//       )
//     }

//     const [rows] = await db.query<Admin[]>(
//       `SELECT id, name, email, role, is_active, created_at FROM admins WHERE id=?`, [id]
//     )
//     if (!rows[0]) return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 })

//     return NextResponse.json({ success: true, admin: rows[0] })
//   } catch (err: unknown) {
//     if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY')
//       return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
//     return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
//   }
// }

// export async function DELETE(
//   _req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const user = await getAuthUser()
//     if (!user || user.role !== 'superadmin')
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

//     const { id } = await params
//     // Prevent self-delete
//     if (String(user.id) === String(id))
//       return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })

//     await db.query<ResultSetHeader>(`DELETE FROM admins WHERE id=?`, [id])
//     return NextResponse.json({ success: true })
//   } catch {
//     return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
//   }
// }





// Path: app/api/admins/[id]/route.ts
// PATCH → edit admin  |  DELETE → delete admin

import db               from '@/lib/db'
import bcrypt           from 'bcryptjs'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { cookies }      from 'next/headers'
import { logActivity }  from '@/lib/logActivity'  // ✅

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface Admin extends RowDataPacket {
  id: number; name: string; email: string
  role: string; is_active: boolean; created_at: string
}
interface JwtPayload { id: number; name: string; email: string; role: string }

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'superadmin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    const { name, email, role, password, is_active } = await req.json()

    // ✅ Pehle purana data fetch karo log ke liye
    const [before] = await db.query<Admin[]>(
      `SELECT name, email, role FROM admins WHERE id = ?`, [id]
    )
    if (!before[0])
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 })

    const oldAdmin = before[0]

    // ── Toggle is_active only ─────────────────────────────────────────────
    if (typeof is_active === 'boolean') {
      await db.query<ResultSetHeader>(
        `UPDATE admins SET is_active = ? WHERE id = ?`, [is_active, id]
      )

      // ✅ Activity log
      await logActivity(user.id, `${is_active ? 'Activated' : 'Deactivated'} admin: "${oldAdmin.name}"`)

      const [rows] = await db.query<Admin[]>(
        `SELECT id, name, email, role, is_active, created_at FROM admins WHERE id=?`, [id]
      )
      return NextResponse.json({ success: true, admin: rows[0] })
    }

    // ── Full edit ─────────────────────────────────────────────────────────
    if (!name?.trim())  return NextResponse.json({ success: false, error: 'Name is required'  }, { status: 400 })
    if (!email?.trim()) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })

    const validRoles = ['superadmin', 'datauploader', 'viewer']
    if (!validRoles.includes(role))
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })

    if (password?.trim()) {
      const hashed = await bcrypt.hash(password, 10)
      await db.query<ResultSetHeader>(
        `UPDATE admins SET name=?, email=?, role=?, password=? WHERE id=?`,
        [name.trim(), email.trim().toLowerCase(), role, hashed, id]
      )
    } else {
      await db.query<ResultSetHeader>(
        `UPDATE admins SET name=?, email=?, role=? WHERE id=?`,
        [name.trim(), email.trim().toLowerCase(), role, id]
      )
    }

    const [rows] = await db.query<Admin[]>(
      `SELECT id, name, email, role, is_active, created_at FROM admins WHERE id=?`, [id]
    )

    // ✅ Activity log — kya kya change hua
    const changes: string[] = []
    if (oldAdmin.name  !== name.trim())                    changes.push(`name: "${oldAdmin.name}" → "${name.trim()}"`)
    if (oldAdmin.email !== email.trim().toLowerCase())     changes.push(`email: "${oldAdmin.email}" → "${email.trim().toLowerCase()}"`)
    if (oldAdmin.role  !== role)                           changes.push(`role: "${oldAdmin.role}" → "${role}"`)
    if (password?.trim())                                  changes.push('password changed')

    const changeStr = changes.length > 0 ? changes.join(', ') : 'no changes'
    await logActivity(user.id, `Updated admin: "${oldAdmin.name}" (${changeStr})`)

    return NextResponse.json({ success: true, admin: rows[0] })
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY')
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
    console.error('[Admins PATCH Error]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'superadmin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    const { id } = await params

    // Prevent self-delete
    if (String(user.id) === String(id))
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })

    // ✅ Pehle naam fetch karo delete se pehle
    const [before] = await db.query<Admin[]>(
      `SELECT name, role FROM admins WHERE id = ?`, [id]
    )
    const adminName = before[0]?.name ?? `ID: ${id}`
    const adminRole = before[0]?.role ?? ''

    await db.query<ResultSetHeader>(`DELETE FROM admins WHERE id=?`, [id])

    // ✅ Activity log
    await logActivity(user.id, `Deleted admin: "${adminName}" (${adminRole})`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Admins DELETE Error]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}