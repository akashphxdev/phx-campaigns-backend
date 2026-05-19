// api/live-pcs/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id,
        s.system_name,
        s.campaign_id,
        s.is_active,
        s.start_datetime,
        s.end_datetime,
        s.success,
        s.failed,
        s.avg_time,
        s.last_req,
        s.created_by,
        s.created_at,
        s.updated_at,
        s.last_get_at,
        s.last_success_at,
        COALESCE(
          (
            SELECT AVG(cr.process_time)
            FROM (
              SELECT process_time
              FROM csv_rows
              WHERE system_id = s.id
                AND status = 'success'
                AND process_time IS NOT NULL
              ORDER BY id DESC
              LIMIT 5
            ) cr
          ),
          NULL
        ) as recent_avg_seconds
      FROM systems s
      WHERE s.is_active = 1
      ORDER BY s.id ASC
    `) as [any[], any]

    return NextResponse.json({ success: true, systems: rows })
  } catch (err: unknown) {
    const e = err as { message?: string }
    console.error('Live PCs error:', err)
    return NextResponse.json(
      { success: false, message: e?.message ?? String(err) },
      { status: 500 }
    )
  }
}