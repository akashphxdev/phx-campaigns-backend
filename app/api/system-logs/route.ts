import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search')  || ''
    const status = searchParams.get('status')  || ''
    const system = searchParams.get('system')  || ''
    const offset = (page - 1) * limit

    let where       = 'WHERE 1=1'
    const params: any[] = []

    if (search) {
      where += ' AND (system_name LIKE ? OR description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (status && status !== 'all') {
      where += ' AND status = ?'
      params.push(status)
    }

    if (system && system !== 'all') {
      where += ' AND system_name = ?'
      params.push(system)
    }

    // Total count for pagination
    const [[{ total }]]: any = await db.query(
      `SELECT COUNT(*) as total FROM system_logs ${where}`,
      params
    )

    // Paginated rows
    const [rows]: any = await db.query(
      `SELECT id, system_name, description, status, date, time
       FROM system_logs ${where}
       ORDER BY date DESC, time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    // Distinct system names for dropdown (unfiltered)
    const [systemNames]: any = await db.query(
      `SELECT DISTINCT system_name FROM system_logs ORDER BY system_name ASC`
    )

    return NextResponse.json({
      success:     true,
      data:        rows,
      total,
      page,
      limit,
      totalPages:  Math.ceil(total / limit),
      systemNames: systemNames.map((r: any) => r.system_name),
    })

  } catch (err) {
    console.error('[GET /api/system-logs]', err)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}