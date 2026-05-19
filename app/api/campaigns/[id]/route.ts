// Path: app/api/campaigns/[id]/route.ts
// PATCH  → edit campaign name
// DELETE → delete campaign

import db               from '@/lib/db'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { cookies }      from 'next/headers'
import { logActivity }  from '@/lib/logActivity'  // ✅ import

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface Campaign extends RowDataPacket {
  id:         number
  name:       string
  created_by: string
  created_at: string
}

interface JwtPayload {
  id:   number
  name: string
  role: string
}

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name } = await req.json() as { name: string }

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      )
    }

    // ✅ Pehle purana naam fetch karo log ke liye
    const [before] = await db.query<Campaign[]>(
      `SELECT name FROM campaigns WHERE id = ?`, [id]
    )
    const oldName = before[0]?.name ?? `ID: ${id}`

    await db.query<ResultSetHeader>(
      `UPDATE campaigns SET name = ? WHERE id = ?`,
      [name.trim(), id]
    )

    const [rows] = await db.query<Campaign[]>(
      `SELECT id, name, created_by, created_at FROM campaigns WHERE id = ?`,
      [id]
    )

    if (!rows[0]) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // ✅ Activity log
    await logActivity(user.id, `Updated campaign: "${oldName}" → "${name.trim()}"`)

    return NextResponse.json({ success: true, campaign: rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Campaigns PATCH Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // ✅ Pehle naam fetch karo delete se pehle
    const [before] = await db.query<Campaign[]>(
      `SELECT name FROM campaigns WHERE id = ?`, [id]
    )
    const campName = before[0]?.name ?? `ID: ${id}`

    await db.query<ResultSetHeader>(
      `DELETE FROM campaigns WHERE id = ?`, [id]
    )

    // ✅ Activity log
    await logActivity(user.id, `Deleted campaign: "${campName}"`)

    return NextResponse.json({ success: true, message: 'Campaign deleted' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Campaigns DELETE Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}