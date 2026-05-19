// Path: app/api/upload-csv/rows/route.ts
// GET → fetch all rows for a specific upload_id

import db               from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies }      from 'next/headers'
import jwt              from 'jsonwebtoken'
import { RowDataPacket } from 'mysql2'

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload { id: number; name: string; email: string; role: string }

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

interface CsvRowRecord extends RowDataPacket {
  id:         number
  row_number: number
  data:       Record<string, string>
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const uploadId = searchParams.get('upload_id')
    if (!uploadId) return NextResponse.json({ success: false, error: 'upload_id required' }, { status: 400 })

    const [rows] = await db.query<CsvRowRecord[]>(
      `SELECT id, \`row_number\`, data FROM csv_rows WHERE upload_id = ? ORDER BY \`row_number\``,
      [Number(uploadId)]
    )

    return NextResponse.json({ success: true, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[CSV Rows GET Error]', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}