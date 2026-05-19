// import { NextRequest, NextResponse } from 'next/server'
// import db from '@/lib/db'

// // GET - all systems or by campaign_id
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const campaign_id = searchParams.get('campaign_id')

//     let query = `
//       SELECT s.*, c.name as campaign_name, a.name as created_by_name
//       FROM systems s
//       LEFT JOIN campaigns c ON s.campaign_id = c.id
//       LEFT JOIN admins a ON s.created_by = a.id
//     `
//     const params: any[] = []

//     if (campaign_id) {
//       query += ` WHERE s.campaign_id = ?`
//       params.push(campaign_id)
//     }

//     query += ` ORDER BY s.created_at DESC`

//     const [rows] = await db.query(query, params)
//     return NextResponse.json({ success: true, systems: rows })
//   } catch (err) {
//     return NextResponse.json({ success: false, error: 'Failed to fetch systems' }, { status: 500 })
//   }
// }

// // POST - create new system
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const { system_name, campaign_id, avg_time, start_datetime, end_datetime, created_by } = body

//     if (!system_name?.trim())       return NextResponse.json({ success: false, error: 'System name is required' },  { status: 400 })
//     if (!campaign_id)               return NextResponse.json({ success: false, error: 'Campaign is required' },     { status: 400 })
//     if (!avg_time || avg_time <= 0) return NextResponse.json({ success: false, error: 'Avg time is required' },     { status: 400 })
//     if (!created_by)                return NextResponse.json({ success: false, error: 'Admin ID is required' },     { status: 400 })

//     if (start_datetime && new Date(start_datetime) < new Date()) {
//       return NextResponse.json({ success: false, error: 'Start date/time cannot be in the past' }, { status: 400 })
//     }
//     if (end_datetime && start_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
//       return NextResponse.json({ success: false, error: 'End date/time must be after start date/time' }, { status: 400 })
//     }

//     const [result]: any = await db.query(
//       `INSERT INTO systems (system_name, campaign_id, avg_time, start_datetime, end_datetime, created_by)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [system_name.trim(), campaign_id, avg_time, start_datetime || null, end_datetime || null, created_by]
//     )

//     const [rows]: any = await db.query(
//       `SELECT s.*, c.name as campaign_name, a.name as created_by_name
//        FROM systems s
//        LEFT JOIN campaigns c ON s.campaign_id = c.id
//        LEFT JOIN admins a ON s.created_by = a.id
//        WHERE s.id = ?`,
//       [result.insertId]
//     )

//     return NextResponse.json({ success: true, system: rows[0] })
//   } catch (err) {
//     return NextResponse.json({ success: false, error: 'Failed to create system' }, { status: 500 })
//   }
// }

// // PUT - update system
// export async function PUT(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const id = searchParams.get('id')
//     if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

//     const body = await req.json()

//     // Toggle only
//     if (typeof body.is_active === 'boolean') {
//       await db.query(`UPDATE systems SET is_active = ? WHERE id = ?`, [body.is_active, id])
//       return NextResponse.json({ success: true })
//     }

//     // Full edit
//     const { system_name, avg_time, start_datetime, end_datetime } = body
//     if (!system_name?.trim())       return NextResponse.json({ success: false, error: 'System name is required' }, { status: 400 })
//     if (!avg_time || avg_time <= 0) return NextResponse.json({ success: false, error: 'Avg time is required' },    { status: 400 })

//     if (start_datetime && new Date(start_datetime) < new Date()) {
//       return NextResponse.json({ success: false, error: 'Start date/time cannot be in the past' }, { status: 400 })
//     }
//     if (end_datetime && start_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
//       return NextResponse.json({ success: false, error: 'End date/time must be after start date/time' }, { status: 400 })
//     }

//     await db.query(
//       `UPDATE systems SET system_name = ?, avg_time = ?, start_datetime = ?, end_datetime = ? WHERE id = ?`,
//       [system_name.trim(), avg_time, start_datetime || null, end_datetime || null, id]
//     )
//     return NextResponse.json({ success: true })
//   } catch {
//     return NextResponse.json({ success: false, error: 'Failed to update system' }, { status: 500 })
//   }
// }

// // DELETE
// export async function DELETE(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const id = searchParams.get('id')
//     if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

//     await db.query(`DELETE FROM systems WHERE id = ?`, [id])
//     return NextResponse.json({ success: true })
//   } catch (err) {
//     return NextResponse.json({ success: false, error: 'Failed to delete system' }, { status: 500 })
//   }
// }


// Path: app/api/systems/route.ts

import { NextRequest, NextResponse } from 'next/server'
import db              from '@/lib/db'
import jwt             from 'jsonwebtoken'
import { cookies }     from 'next/headers'
import { logActivity } from '@/lib/logActivity'
import { RowDataPacket } from 'mysql2'

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload {
  id:   number
  name: string
  role: string
}

interface SystemRow extends RowDataPacket {
  id:              number
  system_name:     string
  campaign_id:     number
  campaign_name:   string
  created_by_name: string
  avg_time:        number
  is_active:       boolean
  start_datetime:  string | null
  end_datetime:    string | null
  created_at:      string
}

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaign_id = searchParams.get('campaign_id')

    let query = `
      SELECT s.*, c.name as campaign_name, a.name as created_by_name
      FROM systems s
      LEFT JOIN campaigns c ON s.campaign_id = c.id
      LEFT JOIN admins    a ON s.created_by  = a.id
    `
    const params: any[] = []

    if (campaign_id) {
      query += ` WHERE s.campaign_id = ?`
      params.push(campaign_id)
    }

    query += ` ORDER BY s.created_at DESC`

    const [rows] = await db.query(query, params)
    return NextResponse.json({ success: true, systems: rows })
  } catch (err) {
    console.error('[Systems GET Error]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch systems' }, { status: 500 })
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { system_name, campaign_id, avg_time, start_datetime, end_datetime } = body

    if (!system_name?.trim())       return NextResponse.json({ success: false, error: 'System name is required' }, { status: 400 })
    if (!campaign_id)               return NextResponse.json({ success: false, error: 'Campaign is required' },    { status: 400 })
    if (!avg_time || avg_time <= 0) return NextResponse.json({ success: false, error: 'Avg time is required' },    { status: 400 })

    if (start_datetime && new Date(start_datetime) < new Date()) {
      return NextResponse.json({ success: false, error: 'Start date/time cannot be in the past' }, { status: 400 })
    }
    if (end_datetime && start_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
      return NextResponse.json({ success: false, error: 'End date/time must be after start date/time' }, { status: 400 })
    }

    const [result]: any = await db.query(
      `INSERT INTO systems (system_name, campaign_id, avg_time, start_datetime, end_datetime, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [system_name.trim(), campaign_id, avg_time, start_datetime || null, end_datetime || null, user.id]
    )

    const [rows] = await db.query<SystemRow[]>(
      `SELECT s.*, c.name as campaign_name, a.name as created_by_name
       FROM systems s
       LEFT JOIN campaigns c ON s.campaign_id = c.id
       LEFT JOIN admins    a ON s.created_by  = a.id
       WHERE s.id = ?`,
      [result.insertId]
    )

    // ✅ Activity log
    await logActivity(user.id, `Created system: "${system_name.trim()}"`)

    return NextResponse.json({ success: true, system: rows[0] })
  } catch (err) {
    console.error('[Systems POST Error]', err)
    return NextResponse.json({ success: false, error: 'Failed to create system' }, { status: 500 })
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    // Pehle purana naam fetch karo log ke liye
    const [before] = await db.query<SystemRow[]>(
      `SELECT system_name FROM systems WHERE id = ?`, [id]
    )
    const oldName = before[0]?.system_name ?? `ID: ${id}`

    const body = await req.json()

    // Toggle only (is_active)
    if (typeof body.is_active === 'boolean') {
      await db.query(`UPDATE systems SET is_active = ? WHERE id = ?`, [body.is_active, id])

      // ✅ Activity log
      await logActivity(user.id, `${body.is_active ? 'Activated' : 'Deactivated'} system: "${oldName}"`)

      return NextResponse.json({ success: true })
    }

    // Full edit
    const { system_name, avg_time, start_datetime, end_datetime } = body
    if (!system_name?.trim())       return NextResponse.json({ success: false, error: 'System name is required' }, { status: 400 })
    if (!avg_time || avg_time <= 0) return NextResponse.json({ success: false, error: 'Avg time is required' },    { status: 400 })

    if (start_datetime && new Date(start_datetime) < new Date()) {
      return NextResponse.json({ success: false, error: 'Start date/time cannot be in the past' }, { status: 400 })
    }
    if (end_datetime && start_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
      return NextResponse.json({ success: false, error: 'End date/time must be after start date/time' }, { status: 400 })
    }

    await db.query(
      `UPDATE systems SET system_name = ?, avg_time = ?, start_datetime = ?, end_datetime = ? WHERE id = ?`,
      [system_name.trim(), avg_time, start_datetime || null, end_datetime || null, id]
    )

    // ✅ Activity log
    await logActivity(user.id, `Updated system: "${oldName}" → "${system_name.trim()}"`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Systems PUT Error]', err)
    return NextResponse.json({ success: false, error: 'Failed to update system' }, { status: 500 })
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })

    // Pehle naam fetch karo delete se pehle
    const [before] = await db.query<SystemRow[]>(
      `SELECT system_name FROM systems WHERE id = ?`, [id]
    )
    const sysName = before[0]?.system_name ?? `ID: ${id}`

    await db.query(`DELETE FROM systems WHERE id = ?`, [id])

    // ✅ Activity log
    await logActivity(user.id, `Deleted system: "${sysName}"`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Systems DELETE Error]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete system' }, { status: 500 })
  }
}