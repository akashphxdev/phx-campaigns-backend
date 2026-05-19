import { NextRequest, NextResponse } from 'next/server'
import db              from '@/lib/db'
import jwt             from 'jsonwebtoken'
import { cookies }     from 'next/headers'
import { logActivity } from '@/lib/logActivity'  // ✅

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload { id: number; name: string; role: string }

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

async function saveLog(system_name: string, description: string, status: string) {
  try {
    const now  = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 8)
    await db.query(
      `INSERT INTO system_logs (system_name, description, status, date, time) VALUES (?, ?, ?, ?, ?)`,
      [system_name, description, status, date, time]
    )
  } catch { }
}

export async function GET() {
  try {
    const [systems] = await db.query(`
      SELECT 
        s.id, s.system_name, s.campaign_id,
        st.id         as setting_id,
        st.data_mode,
        st.sort_order,
        st.success_limit,
        st.created_by,
        st.updated_by,
        st.created_at as setting_created_at,
        st.updated_at as setting_updated_at
      FROM systems s
      LEFT JOIN settings st ON st.system_id = s.id
      ORDER BY s.id ASC
    `) as [any[], any]

    return NextResponse.json({ success: true, systems })
  } catch (err: unknown) {
    const e = err as { message?: string }
    return NextResponse.json({ success: false, message: e?.message ?? String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()

    const body = await req.json()
    const { system_id, data_mode, sort_order, success_limit, admin_id } = body

    if (!system_id) {
      return NextResponse.json({ error: 'system_id is required' }, { status: 400 })
    }

    const [sysRows] = await db.query(
      `SELECT system_name FROM systems WHERE id = ? LIMIT 1`,
      [system_id]
    ) as [any[], any]
    const system_name = sysRows[0]?.system_name ?? `System #${system_id}`

    const [existing] = await db.query(
      `SELECT id FROM settings WHERE system_id = ? LIMIT 1`,
      [system_id]
    ) as [any[], any]

    const resolvedAdminId = user?.id ?? admin_id ?? null

    if (existing.length) {
      await db.query(
        `UPDATE settings 
         SET data_mode = ?, sort_order = ?, success_limit = ?, updated_by = ?
         WHERE system_id = ?`,
        [data_mode ?? 'pending', sort_order ?? 'asc', success_limit ?? null, admin_id ?? null, system_id]
      )
      await saveLog(
        system_name,
        `Settings updated — data_mode: ${data_mode ?? 'pending'}, sort_order: ${sort_order ?? 'asc'}, success_limit: ${success_limit ?? 'unlimited'}`,
        'success'
      )
      // ✅ Activity log
      if (resolvedAdminId) {
        await logActivity(resolvedAdminId, `Updated settings for system: "${system_name}" — data_mode: ${data_mode ?? 'pending'}, sort_order: ${sort_order ?? 'asc'}, success_limit: ${success_limit ?? 'unlimited'}`)
      }
    } else {
      await db.query(
        `INSERT INTO settings (system_id, data_mode, sort_order, success_limit, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [system_id, data_mode ?? 'pending', sort_order ?? 'asc', success_limit ?? null, admin_id ?? null, admin_id ?? null]
      )
      await saveLog(
        system_name,
        `Settings created — data_mode: ${data_mode ?? 'pending'}, sort_order: ${sort_order ?? 'asc'}, success_limit: ${success_limit ?? 'unlimited'}`,
        'success'
      )
      // ✅ Activity log
      if (resolvedAdminId) {
        await logActivity(resolvedAdminId, `Created settings for system: "${system_name}" — data_mode: ${data_mode ?? 'pending'}, sort_order: ${sort_order ?? 'asc'}, success_limit: ${success_limit ?? 'unlimited'}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const e = err as { message?: string }
    return NextResponse.json({ success: false, message: e?.message ?? String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()

    const { searchParams } = new URL(req.url)
    const system_id = searchParams.get('system_id')

    if (!system_id) {
      return NextResponse.json({ error: 'system_id is required' }, { status: 400 })
    }

    const [sysRows] = await db.query(
      `SELECT system_name FROM systems WHERE id = ? LIMIT 1`,
      [system_id]
    ) as [any[], any]
    const system_name = sysRows[0]?.system_name ?? `System #${system_id}`

    await db.query(`DELETE FROM settings WHERE system_id = ?`, [system_id])

    await saveLog(system_name, `Settings reset to default`, 'success')

    // ✅ Activity log
    if (user?.id) {
      await logActivity(user.id, `Reset settings to default for system: "${system_name}"`)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const e = err as { message?: string }
    return NextResponse.json({ success: false, message: e?.message ?? String(err) }, { status: 500 })
  }
}