// Path: app/api/admins-activity/route.ts

import db                from '@/lib/db'
import jwt               from 'jsonwebtoken'
import { NextResponse }  from 'next/server'
import { RowDataPacket } from 'mysql2'
import { cookies }       from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface ActivityRow extends RowDataPacket {
  id:          number
  admin_id:    number
  admin_name:  string
  admin_email: string
  role:        string
  action:      string
  created_at:  string
}

interface JwtPayload {
  id:   number
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

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const role   = searchParams.get('role')   || ''
    const offset = (page - 1) * limit

    let where        = 'WHERE 1=1'
    const params: any[] = []

    if (search) {
      where += ' AND (a.name LIKE ? OR a.email LIKE ? OR aa.action LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (role && role !== 'all') {
      where += ' AND a.role = ?'
      params.push(role)
    }

    // Total count
    const [[{ total }]]: any = await db.query(
      `SELECT COUNT(*) as total
       FROM admin_activity aa
       JOIN admins a ON a.id = aa.admin_id
       ${where}`,
      params
    )

    // Paginated rows
    const [rows] = await db.query<ActivityRow[]>(
      `SELECT
         aa.id,
         aa.admin_id,
         aa.action,
         aa.created_at,
         a.name  AS admin_name,
         a.email AS admin_email,
         a.role  AS role
       FROM admin_activity aa
       JOIN admins a ON a.id = aa.admin_id
       ${where}
       ORDER BY aa.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    // Distinct roles for filter dropdown
    const [roleRows]: any = await db.query(
      `SELECT DISTINCT a.role FROM admins a ORDER BY a.role ASC`
    )

    return NextResponse.json({
      success:    true,
      activities: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      roles:      roleRows.map((r: any) => r.role),
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Activity GET Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}