// // Path: app/api/admins/[id]/toggle-active/route.ts

// import db               from '@/lib/db'
// import jwt              from 'jsonwebtoken'
// import { NextResponse } from 'next/server'
// import { RowDataPacket, ResultSetHeader } from 'mysql2'
// import { cookies }      from 'next/headers'

// const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

// interface AdminRow extends RowDataPacket { id: number; is_active: boolean }
// interface JwtPayload  { id: number; role: string }

// async function getAuthUser(): Promise<JwtPayload | null> {
//   try {
//     const cookieStore = await cookies()
//     const token = cookieStore.get('auth_token')?.value
//     if (!token) return null
//     return jwt.verify(token, JWT_SECRET) as JwtPayload
//   } catch { return null }
// }

// export async function PATCH(
//   _req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const user = await getAuthUser()
//     if (!user || user.role !== 'superadmin')
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

//     const { id } = await params

//     const [rows] = await db.query<AdminRow[]>(
//       `SELECT id, is_active FROM admins WHERE id = ?`, [id]
//     )
//     if (!rows[0])
//       return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 })

//     const newStatus = !rows[0].is_active
//     await db.query<ResultSetHeader>(
//       `UPDATE admins SET is_active = ? WHERE id = ?`, [newStatus, id]
//     )

//     return NextResponse.json({ success: true, is_active: newStatus })
//   } catch {
//     return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
//   }
// }



// Path: app/api/admins/[id]/toggle-active/route.ts

import db               from '@/lib/db'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { cookies }      from 'next/headers'
import { logActivity }  from '@/lib/logActivity'  // ✅

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface AdminRow extends RowDataPacket { id: number; name: string; is_active: boolean }
interface JwtPayload  { id: number; role: string }

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'superadmin')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    const { id } = await params

    // ✅ name bhi fetch karo log ke liye
    const [rows] = await db.query<AdminRow[]>(
      `SELECT id, name, is_active FROM admins WHERE id = ?`, [id]
    )
    if (!rows[0])
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 })

    const newStatus = !rows[0].is_active
    await db.query<ResultSetHeader>(
      `UPDATE admins SET is_active = ? WHERE id = ?`, [newStatus, id]
    )

    // ✅ Activity log
    await logActivity(user.id, `${newStatus ? 'Activated' : 'Deactivated'} admin: "${rows[0].name}"`)

    return NextResponse.json({ success: true, is_active: newStatus })
  } catch (err) {
    console.error('[Toggle Active Error]', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}