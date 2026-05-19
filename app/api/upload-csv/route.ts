// Path: app/api/upload-csv/route.ts
// POST → upload CSV, link to campaign + admin, save every row to csv_rows table
// GET  → fetch all uploads with campaign name + admin name
// DELETE → delete an upload by id (csv_rows cascade deleted automatically)

import db               from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies }      from 'next/headers'
import jwt              from 'jsonwebtoken'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { logActivity }  from '@/lib/logActivity'  // ✅

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload {
  id:    number
  name:  string
  email: string
  role:  string
}

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData   = await req.formData()
    const file       = formData.get('file')        as File   | null
    const campaignId = formData.get('campaign_id') as string | null
    const campaignName = formData.get('campaign_name') as string | null  // ✅ log ke liye

    if (!file)       return NextResponse.json({ success: false, error: 'No file uploaded' },     { status: 400 })
    if (!campaignId) return NextResponse.json({ success: false, error: 'Campaign is required' }, { status: 400 })
    if (!file.name.endsWith('.csv'))         return NextResponse.json({ success: false, error: 'Only .csv files are allowed' },    { status: 400 })
    if (file.size > 10 * 1024 * 1024)       return NextResponse.json({ success: false, error: 'File size must be under 10MB' },   { status: 400 })

    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'CSV is empty or has no data rows' }, { status: 400 })
    }

    const [uploadResult] = await db.query<ResultSetHeader>(
      `INSERT INTO csv_uploads (filename, campaign_id, admin_id, row_count, status)
       VALUES (?, ?, ?, ?, 'success')`,
      [file.name, Number(campaignId), user.id, rows.length]
    )
    const uploadId = uploadResult.insertId

    for (let i = 0; i < rows.length; i++) {
      await db.query<ResultSetHeader>(
        `INSERT INTO csv_rows (upload_id, \`row_number\`, data) VALUES (?, ?, ?)`,
        [uploadId, i + 1, JSON.stringify(rows[i])]
      )
    }

    // ✅ Activity log
    await logActivity(user.id, `Uploaded CSV "${file.name}" (${rows.length} rows) to campaign: ${campaignName ?? campaignId}`)

    return NextResponse.json({
      success:   true,
      message:   `${rows.length} rows uploaded successfully`,
      upload_id: uploadId,
      row_count: rows.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[CSV Upload Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    interface UploadRow extends RowDataPacket {
      id:            number
      filename:      string
      campaign_name: string
      admin_name:    string
      admin_email:   string
      row_count:     number
      status:        string
      uploaded_at:   string
    }

    const [rows] = await db.query<UploadRow[]>(
      `SELECT
         u.id,
         u.filename,
         c.name  AS campaign_name,
         a.name  AS admin_name,
         a.email AS admin_email,
         u.row_count,
         u.status,
         u.uploaded_at
       FROM csv_uploads u
       JOIN campaigns c ON c.id = u.campaign_id
       JOIN admins    a ON a.id = u.admin_id
       ORDER BY u.uploaded_at DESC
       LIMIT 200`
    )

    return NextResponse.json({ success: true, uploads: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[CSV Uploads GET Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('id')
    if (!uploadId) {
      return NextResponse.json({ success: false, error: 'Upload ID required' }, { status: 400 })
    }

    // ✅ Pehle filename fetch karo log ke liye
    interface UploadMeta extends RowDataPacket { filename: string; campaign_name: string }
    const [meta] = await db.query<UploadMeta[]>(
      `SELECT u.filename, c.name AS campaign_name
       FROM csv_uploads u
       JOIN campaigns c ON c.id = u.campaign_id
       WHERE u.id = ?`,
      [Number(uploadId)]
    )

    await db.query(`DELETE FROM csv_uploads WHERE id = ?`, [Number(uploadId)])

    // ✅ Activity log
    if (meta[0]) {
      await logActivity(user.id, `Deleted CSV "${meta[0].filename}" from campaign: ${meta[0].campaign_name}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[CSV Delete Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}