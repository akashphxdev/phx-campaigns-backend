import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const campaign_id  = searchParams.get('campaign_id')
    const status       = searchParams.get('status')       // success | failed | processing | all
    const date_from    = searchParams.get('date_from')
    const date_to      = searchParams.get('date_to')
    const show_ip      = searchParams.get('show_ip')      // true | false
    const show_date    = searchParams.get('show_date')    // true | false
    const show_started = searchParams.get('show_started') // true | false
    const show_completed = searchParams.get('show_completed') // true | false

    // 1. All campaigns
    if (!campaign_id) {
      const [campaigns] = await db.query(
        `SELECT c.id, c.name, c.created_by, c.created_at,
                COUNT(cr.id)                                      as total_rows,
                SUM(cr.status = 'success')                        as success,
                SUM(cr.status = 'failed')                         as failed,
                SUM(cr.status = 'processing')                     as processing,
                SUM(cr.status = 'pending')                        as pending
         FROM campaigns c
         LEFT JOIN csv_uploads cu ON cu.campaign_id = c.id
         LEFT JOIN csv_rows cr    ON cr.upload_id   = cu.id
         GROUP BY c.id
         ORDER BY c.created_at DESC`
      ) as [any[], any]

      return NextResponse.json({ success: true, campaigns })
    }

    // 2. Single campaign detail with filters
    let query = `
      SELECT
        cr.id,
        cr.row_number,
        cr.data,
        cr.status,
        cr.process_time,
        cr.started_at,
        cr.completed_at,
        cr.ip,
        cu.filename,
        s.system_name
      FROM csv_rows cr
      INNER JOIN csv_uploads cu ON cr.upload_id   = cu.id
      LEFT JOIN  systems s      ON cr.system_id   = s.id
      WHERE cu.campaign_id = ?
    `
    const params: any[] = [campaign_id]

    if (status && status !== 'all') {
      query += ` AND cr.status = ?`
      params.push(status)
    }

    if (date_from) {
      query += ` AND DATE(cr.started_at) >= ?`
      params.push(date_from)
    }

    if (date_to) {
      query += ` AND DATE(cr.started_at) <= ?`
      params.push(date_to)
    }

    query += ` ORDER BY cr.id ASC`

    const [rows] = await db.query(query, params) as [any[], any]

    // Campaign info
    const [campRows] = await db.query(
      `SELECT id, name, created_by, created_at FROM campaigns WHERE id = ? LIMIT 1`,
      [campaign_id]
    ) as [any[], any]

    return NextResponse.json({
      success:  true,
      campaign: campRows[0] ?? null,
      rows,
    })

  } catch (err: unknown) {
    const e = err as { message?: string }
    return NextResponse.json({ success: false, message: e?.message ?? String(err) }, { status: 500 })
  }
}