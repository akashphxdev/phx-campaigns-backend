// Path: app/api/campaigns/route.ts
// GET  → fetch all campaigns
// POST → create new campaign

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

export async function GET() {
  try {
    const [rows] = await db.query<Campaign[]>(
      `SELECT id, name, created_by, created_at
       FROM campaigns
       ORDER BY created_at DESC`
    )
    return NextResponse.json({ success: true, campaigns: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Campaigns GET Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json() as { name: string }

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      )
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO campaigns (name, created_by) VALUES (?, ?)`,
      [name.trim(), user.name]
    )

    const [rows] = await db.query<Campaign[]>(
      `SELECT id, name, created_by, created_at FROM campaigns WHERE id = ?`,
      [result.insertId]
    )

    // ✅ Activity log
    await logActivity(user.id, `Created campaign: ${name.trim()}`)

    return NextResponse.json({
      success:  true,
      message:  'Campaign created successfully',
      campaign: rows[0],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Campaigns POST Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}