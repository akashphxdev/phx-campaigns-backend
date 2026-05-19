// import { NextRequest, NextResponse } from 'next/server'
// import db from '@/lib/db'

// // ── Helper: system_logs mein entry save karo ──────────────────────────────────
// async function saveLog(system_name: string, description: string, status: string) {
//   try {
//     const now  = new Date()
//     const date = now.toISOString().slice(0, 10)   // YYYY-MM-DD
//     const time = now.toTimeString().slice(0, 8)   // HH:MM:SS
//     await db.query(
//       `INSERT INTO system_logs (system_name, description, status, date, time) VALUES (?, ?, ?, ?, ?)`,
//       [system_name, description, status, date, time]
//     )
//   } catch { }
// }

// // ── GET ───────────────────────────────────────────────────────────────────────
// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const system_id_raw = searchParams.get('id')

//     if (!system_id_raw) {
//       return NextResponse.json({ error: 'id is required' }, { status: 400 })
//     }

//     // ✅ FIX: String → Integer cast (type mismatch prevent)
//     const system_id = parseInt(system_id_raw, 10)
//     if (isNaN(system_id)) {
//       return NextResponse.json({ error: 'id must be a valid number' }, { status: 400 })
//     }

//     // 1. System fetch
//     const [systems] = await db.query(
//       `SELECT s.id, s.system_name, s.campaign_id, s.start_datetime, s.end_datetime,
//               s.is_active, s.avg_time, s.success,
//               c.name as campaign_name
//        FROM systems s
//        LEFT JOIN campaigns c ON c.id = s.campaign_id
//        WHERE s.id = ? LIMIT 1`,
//       [system_id]
//     ) as [any[], any]

//     if (!systems.length) {
//       return NextResponse.json({ error: 'System not found' }, { status: 404 })
//     }

//     const system = systems[0]

//     // 2. is_active check
//     if (!system.is_active) {
//       await saveLog(system.system_name, `Request rejected — system is inactive`, 'failed')
//       return NextResponse.json({ error: 'System is inactive' }, { status: 403 })
//     }

//     // 3. Datetime range check
//     if (system.start_datetime || system.end_datetime) {
//       const now = new Date()
//       if (system.start_datetime && now < new Date(system.start_datetime)) {
//         await saveLog(system.system_name, `Request rejected — system has not started yet`, 'failed')
//         return NextResponse.json({ error: 'System has not started yet' }, { status: 403 })
//       }
//       if (system.end_datetime && now > new Date(system.end_datetime)) {
//         await saveLog(system.system_name, `Request rejected — system schedule has ended`, 'failed')
//         return NextResponse.json({ error: 'System schedule has ended' }, { status: 403 })
//       }
//     }

//     // 4. Settings fetch — agar nahi hai to defaults
//     const [settingRows] = await db.query(
//       `SELECT data_mode, sort_order, success_limit FROM settings WHERE system_id = ? LIMIT 1`,
//       [system_id]
//     ) as [any[], any]

//     const setting = settingRows[0] ?? {
//       data_mode:     'pending',
//       sort_order:    'asc',
//       success_limit: null,
//     }

//     // 5. Success limit check
//     if (setting.success_limit !== null && setting.success_limit !== undefined) {
//       const currentSuccess = system.success ?? 0
//       if (currentSuccess >= setting.success_limit) {
//         await saveLog(
//           system.system_name,
//           `Request rejected — success limit reached (${currentSuccess}/${setting.success_limit})`,
//           'failed'
//         )
//         return NextResponse.json(
//           { error: `Success limit reached (${currentSuccess}/${setting.success_limit})` },
//           { status: 403 }
//         )
//       }
//     }

//     // 6. Pehle se processing mein padi rows — failed mark karo
//     const [stuckRows] = await db.query(
//       `SELECT COUNT(*) as cnt FROM csv_rows
//        WHERE system_id = ? AND status = 'processing'`,
//       [system_id]
//     ) as [any[], any]

//     if (stuckRows[0].cnt > 0) {
//       await db.query(
//         `UPDATE csv_rows
//          SET status = 'failed', completed_at = NOW()
//          WHERE system_id = ? AND status = 'processing'`,
//         [system_id]
//       )
//       await db.query(
//         `UPDATE systems SET failed = failed + ? WHERE id = ?`,
//         [stuckRows[0].cnt, system_id]
//       )
//       await saveLog(
//         system.system_name,
//         `${stuckRows[0].cnt} stuck processing row(s) auto-marked as failed before new request`,
//         'failed'
//       )
//     }

//     // 7. Pending/failed row fetch — setting ke hisaab se
//     const orderDir = setting.sort_order === 'desc' ? 'DESC' : 'ASC'
//     const dataMode = ['pending', 'failed', 'processing'].includes(setting.data_mode)
//       ? setting.data_mode
//       : 'pending'

//     const [rows] = await db.query(
//       `SELECT cr.id, cr.data, cr.row_number,
//               cu.filename, cu.campaign_id,
//               c.name as campaign_name
//        FROM csv_rows cr
//        INNER JOIN csv_uploads cu ON cr.upload_id = cu.id
//        INNER JOIN campaigns c ON c.id = cu.campaign_id
//        WHERE cu.campaign_id = ? AND cr.status = ?
//        ORDER BY cr.id ${orderDir}
//        LIMIT 1`,
//       [system.campaign_id, dataMode]
//     ) as [any[], any]

//     if (!rows.length) {
//       await saveLog(
//         system.system_name,
//         `No ${dataMode} data found for campaign: ${system.campaign_name ?? system.campaign_id}`,
//         'failed'
//       )
//       return NextResponse.json({ error: `No ${dataMode} data` }, { status: 404 })
//     }

//     const row  = rows[0]
//     const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data

//     // 8. Row ko processing mark karo + system_id properly set karo
//     await db.query(
//       `UPDATE csv_rows
//        SET status = 'processing', system_id = ?, started_at = NOW()
//        WHERE id = ?`,
//       [system_id, row.id]
//     )

//     // ✅ FIX: last_req AND last_get_at — explicit NOW() with integer system_id
//     await db.query(
//       `UPDATE systems
//        SET last_req = NOW(), last_get_at = NOW()
//        WHERE id = ?`,
//       [system_id]
//     )

//     // 10. Log
//     await saveLog(
//       system.system_name,
//       `Getting data from ${system.system_name} — row #${row.row_number} (mode: ${dataMode}, order: ${orderDir})`,
//       'processing'
//     )

//     return NextResponse.json({
//       row_id      : row.id,
//       row_number  : row.row_number,
//       campaign_id : row.campaign_id,
//       campaign    : row.campaign_name,
//       filename    : row.filename,
//       ...data,
//     })

//   } catch (err: unknown) {
//     const e = err as { message?: string; code?: string }
//     console.error('GET /api/run error:', err)
//     return NextResponse.json(
//       { error: 'Server error', message: e?.message ?? String(err), code: e?.code ?? null },
//       { status: 500 }
//     )
//   }
// }

// // ── POST ──────────────────────────────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const { row_id, status, ip: bodyIp } = body

//     if (!row_id) {
//       return NextResponse.json({ error: 'row_id is required' }, { status: 400 })
//     }
//     if (!['success', 'failed'].includes(status)) {
//       return NextResponse.json({ error: 'status must be success or failed' }, { status: 400 })
//     }

//     // ✅ FIX: Integer cast for row_id
//     const rowId = parseInt(row_id, 10)
//     if (isNaN(rowId)) {
//       return NextResponse.json({ error: 'row_id must be a valid number' }, { status: 400 })
//     }

//     const [rows] = await db.query(
//       `SELECT id, system_id, started_at FROM csv_rows WHERE id = ? LIMIT 1`,
//       [rowId]
//     ) as [any[], any]

//     if (!rows.length) {
//       return NextResponse.json({ error: 'Row not found' }, { status: 404 })
//     }

//     const row = rows[0]

//     // ✅ FIX: system_id NULL check — agar null hai to error return karo
//     if (!row.system_id) {
//       return NextResponse.json(
//         { error: 'Row has no system_id — GET request se pehle row assign nahi hua' },
//         { status: 400 }
//       )
//     }

//     // ✅ FIX: Integer cast for system_id
//     const sysId = parseInt(row.system_id, 10)

//     let process_time = null
//     if (row.started_at) {
//       const diff = new Date().getTime() - new Date(row.started_at).getTime()
//       process_time = Math.round(diff / 1000)
//     }

//     const ip =
//       bodyIp ||
//       req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
//       req.headers.get('x-real-ip') ||
//       'unknown'

//     // Update csv_rows status
//     await db.query(
//       `UPDATE csv_rows
//        SET status = ?, completed_at = NOW(), process_time = ?, ip = ?
//        WHERE id = ?`,
//       [status, process_time, ip, rowId]
//     )

//     if (status === 'success') {
//       // ✅ FIX: last_success_at explicitly update — sysId integer se
//       await db.query(
//         `UPDATE systems
//          SET success = success + 1,
//              last_success_at = NOW(),
//              avg_time = (
//                SELECT COALESCE(AVG(process_time), avg_time)
//                FROM csv_rows
//                WHERE system_id = ? AND status = 'success' AND process_time IS NOT NULL
//              )
//          WHERE id = ?`,
//         [sysId, sysId]
//       )
//     } else {
//       await db.query(
//         `UPDATE systems SET failed = failed + 1 WHERE id = ?`,
//         [sysId]
//       )
//     }

//     // System name fetch for log
//     const [sysRows] = await db.query(
//       `SELECT system_name FROM systems WHERE id = ? LIMIT 1`,
//       [sysId]
//     ) as [any[], any]
//     const system_name = sysRows[0]?.system_name ?? `System #${sysId}`

//     await saveLog(
//       system_name,
//       `Row #${rowId} processed in ${process_time ?? '?'}s`,
//       status
//     )

//     return NextResponse.json({ ok: true })

//   } catch (err: unknown) {
//     const e = err as { message?: string; code?: string }
//     console.error('POST /api/run error:', err)
//     return NextResponse.json(
//       { error: 'Server error', message: e?.message ?? String(err), code: e?.code ?? null },
//       { status: 500 }
//     )
//   }
// }



import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// ── Helper: system_logs mein entry save karo ──────────────────────────────────
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

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const system_id_raw = searchParams.get('id')

    if (!system_id_raw) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const system_id = parseInt(system_id_raw, 10)
    if (isNaN(system_id)) {
      return NextResponse.json({ error: 'id must be a valid number' }, { status: 400 })
    }

    // 1. System fetch
    const [systems] = await db.query(
      `SELECT s.id, s.system_name, s.campaign_id, s.start_datetime, s.end_datetime,
              s.is_active, s.avg_time, s.success,
              c.name as campaign_name
       FROM systems s
       LEFT JOIN campaigns c ON c.id = s.campaign_id
       WHERE s.id = ? LIMIT 1`,
      [system_id]
    ) as [any[], any]

    if (!systems.length) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 })
    }

    const system = systems[0]

    // 2. is_active check
    if (!system.is_active) {
      await saveLog(system.system_name, `Request rejected — system is inactive`, 'failed')
      return NextResponse.json({ error: 'System is inactive' }, { status: 403 })
    }

    // 3. Datetime range check
    if (system.start_datetime || system.end_datetime) {
      const now = new Date()
      if (system.start_datetime && now < new Date(system.start_datetime)) {
        await saveLog(system.system_name, `Request rejected — system has not started yet`, 'failed')
        return NextResponse.json({ error: 'System has not started yet' }, { status: 403 })
      }
      if (system.end_datetime && now > new Date(system.end_datetime)) {
        await saveLog(system.system_name, `Request rejected — system schedule has ended`, 'failed')
        return NextResponse.json({ error: 'System schedule has ended' }, { status: 403 })
      }
    }

    // 4. Settings fetch
    const [settingRows] = await db.query(
      `SELECT data_mode, sort_order, success_limit FROM settings WHERE system_id = ? LIMIT 1`,
      [system_id]
    ) as [any[], any]

    const setting = settingRows[0] ?? {
      data_mode:     'pending',
      sort_order:    'asc',
      success_limit: null,
    }

    // 5. Success limit check
    if (setting.success_limit !== null && setting.success_limit !== undefined) {
      const currentSuccess = system.success ?? 0
      if (currentSuccess >= setting.success_limit) {
        await saveLog(
          system.system_name,
          `Request rejected — success limit reached (${currentSuccess}/${setting.success_limit})`,
          'failed'
        )
        return NextResponse.json(
          { error: `Success limit reached (${currentSuccess}/${setting.success_limit})` },
          { status: 403 }
        )
      }
    }

    // 6. Stuck processing rows — failed mark karo
    const [stuckRows] = await db.query(
      `SELECT COUNT(*) as cnt FROM csv_rows
       WHERE system_id = ? AND status = 'processing'`,
      [system_id]
    ) as [any[], any]

    if (stuckRows[0].cnt > 0) {
      await db.query(
        `UPDATE csv_rows
         SET status = 'failed', completed_at = NOW()
         WHERE system_id = ? AND status = 'processing'`,
        [system_id]
      )
      await db.query(
        `UPDATE systems SET failed = failed + ? WHERE id = ?`,
        [stuckRows[0].cnt, system_id]
      )
      await saveLog(
        system.system_name,
        `${stuckRows[0].cnt} stuck processing row(s) auto-marked as failed before new request`,
        'failed'
      )
    }

    // 7. CSV row fetch
    const orderDir = setting.sort_order === 'desc' ? 'DESC' : 'ASC'
    const dataMode = ['pending', 'failed', 'processing'].includes(setting.data_mode)
      ? setting.data_mode
      : 'pending'

    const [rows] = await db.query(
      `SELECT cr.id, cr.data, cr.row_number,
              cu.filename, cu.campaign_id,
              c.name as campaign_name
       FROM csv_rows cr
       INNER JOIN csv_uploads cu ON cr.upload_id = cu.id
       INNER JOIN campaigns c ON c.id = cu.campaign_id
       WHERE cu.campaign_id = ? AND cr.status = ?
       ORDER BY cr.id ${orderDir}
       LIMIT 1`,
      [system.campaign_id, dataMode]
    ) as [any[], any]

    if (!rows.length) {
      await saveLog(
        system.system_name,
        `No ${dataMode} data found for campaign: ${system.campaign_name ?? system.campaign_id}`,
        'failed'
      )
      return NextResponse.json({ error: `No ${dataMode} data` }, { status: 404 })
    }

    const row  = rows[0]
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data

    // 8. CSV row → processing mark karo
    await db.query(
      `UPDATE csv_rows
       SET status = 'processing', system_id = ?, started_at = NOW()
       WHERE id = ?`,
      [system_id, row.id]
    )

    // 9. System last_req update
    await db.query(
      `UPDATE systems SET last_req = NOW(), last_get_at = NOW() WHERE id = ?`,
      [system_id]
    )

    // 10. Campaign image fetch — agar pending image hai to ek do
    let image_id   : number | null = null
    let image_path : string | null = null

    const [imgRows] = await db.query(
      `SELECT id, image_path FROM campaign_images
       WHERE campaign_id = ? AND status = 'pending'
       ORDER BY id ASC
       LIMIT 1`,
      [system.campaign_id]
    ) as [any[], any]

    if (imgRows.length) {
      image_id   = imgRows[0].id
      image_path = imgRows[0].image_path

      // Full URL banao — alag network pe bhi accessible rahe
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? ''
      image_path = `${baseUrl}${image_path}`

      // Image → processing mark karo
      await db.query(
        `UPDATE campaign_images SET status = 'processing' WHERE id = ?`,
        [image_id]
      )

      await saveLog(
        system.system_name,
        `Getting data from ${system.system_name} — row #${row.row_number} + image #${image_id} (mode: ${dataMode}, order: ${orderDir})`,
        'processing'
      )
    } else {
      await saveLog(
        system.system_name,
        `Getting data from ${system.system_name} — row #${row.row_number} (mode: ${dataMode}, order: ${orderDir}) — no image`,
        'processing'
      )
    }

    return NextResponse.json({
      row_id      : row.id,
      row_number  : row.row_number,
      campaign_id : row.campaign_id,
      campaign    : row.campaign_name,
      filename    : row.filename,
      // Image fields — null agar campaign mein koi pending image nahi
      image_id,
      image_path,
      ...data,
    })

  } catch (err: unknown) {
    const e = err as { message?: string; code?: string }
    console.error('GET /api/run error:', err)
    return NextResponse.json(
      { error: 'Server error', message: e?.message ?? String(err), code: e?.code ?? null },
      { status: 500 }
    )
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { row_id, status, ip: bodyIp, image_id } = body

    if (!row_id) {
      return NextResponse.json({ error: 'row_id is required' }, { status: 400 })
    }
    if (!['success', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'status must be success or failed' }, { status: 400 })
    }

    const rowId = parseInt(row_id, 10)
    if (isNaN(rowId)) {
      return NextResponse.json({ error: 'row_id must be a valid number' }, { status: 400 })
    }

    const [rows] = await db.query(
      `SELECT id, system_id, started_at FROM csv_rows WHERE id = ? LIMIT 1`,
      [rowId]
    ) as [any[], any]

    if (!rows.length) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 })
    }

    const row = rows[0]

    if (!row.system_id) {
      return NextResponse.json(
        { error: 'Row has no system_id — GET request se pehle row assign nahi hua' },
        { status: 400 }
      )
    }

    const sysId = parseInt(row.system_id, 10)

    let process_time = null
    if (row.started_at) {
      const diff = new Date().getTime() - new Date(row.started_at).getTime()
      process_time = Math.round(diff / 1000)
    }

    const ip =
      bodyIp ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // CSV row status update
    await db.query(
      `UPDATE csv_rows
       SET status = ?, completed_at = NOW(), process_time = ?, ip = ?
       WHERE id = ?`,
      [status, process_time, ip, rowId]
    )

    // System stats update
    if (status === 'success') {
      await db.query(
        `UPDATE systems
         SET success = success + 1,
             last_success_at = NOW(),
             avg_time = (
               SELECT COALESCE(AVG(process_time), avg_time)
               FROM csv_rows
               WHERE system_id = ? AND status = 'success' AND process_time IS NOT NULL
             )
         WHERE id = ?`,
        [sysId, sysId]
      )
    } else {
      await db.query(
        `UPDATE systems SET failed = failed + 1 WHERE id = ?`,
        [sysId]
      )
    }

    // ── Image status update — agar image_id aaya hai POST mein ──────────────
    if (image_id) {
      const imgId = parseInt(image_id, 10)
      if (!isNaN(imgId)) {
        await db.query(
          `UPDATE campaign_images SET status = ? WHERE id = ? AND status = 'processing'`,
          [status, imgId]
        )
      }
    }

    // System name fetch for log
    const [sysRows] = await db.query(
      `SELECT system_name FROM systems WHERE id = ? LIMIT 1`,
      [sysId]
    ) as [any[], any]
    const system_name = sysRows[0]?.system_name ?? `System #${sysId}`

    const imgLog = image_id ? ` + image #${image_id}` : ''
    await saveLog(
      system_name,
      `Row #${rowId}${imgLog} processed in ${process_time ?? '?'}s`,
      status
    )

    return NextResponse.json({ ok: true })

  } catch (err: unknown) {
    const e = err as { message?: string; code?: string }
    console.error('POST /api/run error:', err)
    return NextResponse.json(
      { error: 'Server error', message: e?.message ?? String(err), code: e?.code ?? null },
      { status: 500 }
    )
  }
}