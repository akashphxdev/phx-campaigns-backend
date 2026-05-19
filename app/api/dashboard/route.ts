import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    // 1. Har campaign fetch karo
    const [campaigns] = await db.query(
      `SELECT id, name FROM campaigns ORDER BY id ASC`
    ) as [any[], any]

    const result = []

    for (const campaign of campaigns) {
      const cid = campaign.id

      // 2. Is campaign ke saare csv_rows ka status count
      const [counts] = await db.query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN cr.status = 'success'    THEN 1 ELSE 0 END) as success,
           SUM(CASE WHEN cr.status = 'failed'     THEN 1 ELSE 0 END) as failed,
           SUM(CASE WHEN cr.status = 'pending'    THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN cr.status = 'processing' THEN 1 ELSE 0 END) as processing
         FROM csv_rows cr
         INNER JOIN csv_uploads cu ON cr.upload_id = cu.id
         WHERE cu.campaign_id = ?`,
        [cid]
      ) as [any[], any]

      const stats = counts[0]

      // 3. Is campaign ke saare systems fetch karo with per-system avg_time
      const [systems] = await db.query(
        `SELECT
           s.id,
           s.system_name,
           s.is_active,
           s.success,
           s.failed,
           s.avg_time,
           s.last_req,
           s.last_get_at,
           s.last_success_at,
           (
             SELECT COUNT(*) FROM csv_rows
             WHERE system_id = s.id AND status = 'processing'
           ) as processing_count
         FROM systems s
         WHERE s.campaign_id = ?
         ORDER BY s.id ASC`,
        [cid]
      ) as [any[], any]

      // 4. Recent logs for this campaign (system_logs se last 5)
      const systemNames = systems.map((s: any) => s.system_name)
      let logs: any[] = []

      if (systemNames.length > 0) {
        const placeholders = systemNames.map(() => '?').join(',')
        const [logRows] = await db.query(
          `SELECT system_name, description, status, date, time
           FROM system_logs
           WHERE system_name IN (${placeholders})
           ORDER BY date DESC, time DESC
           LIMIT 8`,
          systemNames
        ) as [any[], any]
        logs = logRows
      }

      result.push({
        campaign_id   : cid,
        campaign_name : campaign.name,
        total_rows    : Number(stats.total)      || 0,
        success       : Number(stats.success)    || 0,
        failed        : Number(stats.failed)     || 0,
        pending       : Number(stats.pending)    || 0,
        processing    : Number(stats.processing) || 0,
        systems       : systems.map((s: any) => ({
          id              : s.id,
          system_name     : s.system_name,
          is_active       : !!s.is_active,
          success         : s.success  || 0,
          failed          : s.failed   || 0,
          avg_time        : s.avg_time ? Math.round(Number(s.avg_time)) : null,
          last_req        : s.last_req        ? new Date(s.last_req).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
          last_success_at : s.last_success_at ? new Date(s.last_success_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
          processing_count: Number(s.processing_count) || 0,
        })),
        recent_logs: logs.map((l: any) => ({
          system_name : l.system_name,
          description : l.description,
          status      : l.status,
          datetime    : `${l.date} ${l.time}`,
        })),
      })
    }

    return NextResponse.json({ ok: true, data: result })

  } catch (err: unknown) {
    const e = err as { message?: string }
    console.error('GET /api/dashboard error:', err)
    return NextResponse.json({ ok: false, error: e?.message ?? String(err) }, { status: 500 })
  }
}