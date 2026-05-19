// import db               from '@/lib/db'
// import jwt              from 'jsonwebtoken'
// import { NextResponse } from 'next/server'
// import { ResultSetHeader, RowDataPacket } from 'mysql2'
// import { cookies }      from 'next/headers'
// import { writeFile, mkdir, unlink } from 'fs/promises'
// import path             from 'path'

// const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

// interface JwtPayload { id: number; name: string; role: string }

// interface CampaignImage extends RowDataPacket {
//   id: number; image_path: string; uploaded_by: string; created_at: string; status: string
// }
// interface CountRow extends RowDataPacket { total: number }

// async function getAuthUser(): Promise<JwtPayload | null> {
//   try {
//     const cookieStore = await cookies()
//     const token = cookieStore.get('auth_token')?.value
//     if (!token) return null
//     return jwt.verify(token, JWT_SECRET) as JwtPayload
//   } catch { return null }
// }

// // ─── GET — pagination + status filter + date filter ───────────────────────────
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url)
//     const campaignId = searchParams.get('campaign_id')
//     if (!campaignId) {
//       return NextResponse.json({ success: false, error: 'campaign_id required' }, { status: 400 })
//     }

//     const page     = Math.max(1, Number(searchParams.get('page')  ?? 1))
//     const limit    = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
//     const offset   = (page - 1) * limit
//     const status   = searchParams.get('status')   ?? ''   // pending | success | failed | ''
//     const dateFrom = searchParams.get('date_from') ?? ''  // YYYY-MM-DD
//     const dateTo   = searchParams.get('date_to')   ?? ''  // YYYY-MM-DD

//     // dynamic WHERE
//     const conditions: string[] = ['campaign_id = ?']
//     const params: unknown[]    = [Number(campaignId)]

//     if (status)   { conditions.push('status = ?');                      params.push(status) }
//     if (dateFrom) { conditions.push('DATE(created_at) >= ?');           params.push(dateFrom) }
//     if (dateTo)   { conditions.push('DATE(created_at) <= ?');           params.push(dateTo) }

//     const where = conditions.join(' AND ')

//     const [[{ total }]] = await db.query<CountRow[]>(
//       `SELECT COUNT(*) AS total FROM campaign_images WHERE ${where}`,
//       params
//     )

//     const [rows] = await db.query<CampaignImage[]>(
//       `SELECT id, image_path, uploaded_by, created_at, status
//        FROM campaign_images
//        WHERE ${where}
//        ORDER BY created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     )

//     return NextResponse.json({
//       success: true,
//       images:  rows,
//       pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
//     })
//   } catch (err) {
//     return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
//   }
// }

// // ─── POST — upload ─────────────────────────────────────────────────────────────
// export async function POST(req: Request) {
//   try {
//     const user = await getAuthUser()
//     if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

//     const formData   = await req.formData()
//     const campaignId = formData.get('campaign_id')
//     const nameMode   = formData.get('name_mode') as 'original' | 'unique'
//     const files      = formData.getAll('images') as File[]

//     if (!campaignId) return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 })
//     if (!files?.length) return NextResponse.json({ success: false, error: 'No images selected' }, { status: 400 })

//     const uploadsDir = path.join(process.cwd(), 'uploads')
//     await mkdir(uploadsDir, { recursive: true })

//     let uploadedCount = 0
//     for (const file of files) {
//       const ext      = path.extname(file.name) || '.jpg'
//       const filename = nameMode === 'original'
//         ? file.name.replace(/\s+/g, '_')
//         : `${Date.now()}_${Math.random().toString(16).slice(2, 8)}${ext}`

//       await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))
//       await db.query<ResultSetHeader>(
//         `INSERT INTO campaign_images (campaign_id, image_path, uploaded_by, created_at, status)
//          VALUES (?, ?, ?, NOW(), 'pending')`,
//         [Number(campaignId), `/uploads/${filename}`, user.name]
//       )
//       uploadedCount++
//     }

//     return NextResponse.json({ success: true, message: `${uploadedCount} image(s) uploaded successfully` })
//   } catch (err) {
//     return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
//   }
// }

// // ─── DELETE — single image ─────────────────────────────────────────────────────
// export async function DELETE(req: Request) {
//   try {
//     const user = await getAuthUser()
//     if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

//     const { searchParams } = new URL(req.url)
//     const imageId = searchParams.get('id')
//     if (!imageId) return NextResponse.json({ success: false, error: 'Image ID required' }, { status: 400 })

//     // pehle path fetch karo
//     const [rows] = await db.query<CampaignImage[]>(
//       'SELECT image_path FROM campaign_images WHERE id = ?',
//       [Number(imageId)]
//     )
//     if (!rows.length) return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 })

//     // file disk se delete karo
//     try {
//       const filePath = path.join(process.cwd(), rows[0].image_path)
//       await unlink(filePath)
//     } catch { /* file already missing — ignore */ }

//     // DB se delete karo
//     await db.query('DELETE FROM campaign_images WHERE id = ?', [Number(imageId)])

//     return NextResponse.json({ success: true, message: 'Image deleted' })
//   } catch (err) {
//     return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
//   }
// }




import db               from '@/lib/db'
import jwt              from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { cookies }      from 'next/headers'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path             from 'path'
import { logActivity }  from '@/lib/logActivity'  // ✅

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_secret_key'

interface JwtPayload { id: number; name: string; role: string }

interface CampaignImage extends RowDataPacket {
  id: number; image_path: string; uploaded_by: string; created_at: string; status: string
}
interface CountRow extends RowDataPacket { total: number }

async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch { return null }
}

// ─── GET — pagination + status filter + date filter ───────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaign_id')
    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaign_id required' }, { status: 400 })
    }

    const page     = Math.max(1, Number(searchParams.get('page')  ?? 1))
    const limit    = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
    const offset   = (page - 1) * limit
    const status   = searchParams.get('status')   ?? ''
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo   = searchParams.get('date_to')   ?? ''

    const conditions: string[] = ['campaign_id = ?']
    const params: unknown[]    = [Number(campaignId)]

    if (status)   { conditions.push('status = ?');            params.push(status) }
    if (dateFrom) { conditions.push('DATE(created_at) >= ?'); params.push(dateFrom) }
    if (dateTo)   { conditions.push('DATE(created_at) <= ?'); params.push(dateTo) }

    const where = conditions.join(' AND ')

    const [[{ total }]] = await db.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM campaign_images WHERE ${where}`,
      params
    )

    const [rows] = await db.query<CampaignImage[]>(
      `SELECT id, image_path, uploaded_by, created_at, status
       FROM campaign_images
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    return NextResponse.json({
      success: true,
      images:  rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

// ─── POST — upload ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const formData   = await req.formData()
    const campaignId = formData.get('campaign_id')
    const nameMode   = formData.get('name_mode') as 'original' | 'unique'
    const files      = formData.getAll('images') as File[]

    if (!campaignId) return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 })
    if (!files?.length) return NextResponse.json({ success: false, error: 'No images selected' }, { status: 400 })

    const uploadsDir = path.join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    let uploadedCount = 0
    for (const file of files) {
      const ext      = path.extname(file.name) || '.jpg'
      const filename = nameMode === 'original'
        ? file.name.replace(/\s+/g, '_')
        : `${Date.now()}_${Math.random().toString(16).slice(2, 8)}${ext}`

      await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))
      await db.query<ResultSetHeader>(
        `INSERT INTO campaign_images (campaign_id, image_path, uploaded_by, created_at, status)
         VALUES (?, ?, ?, NOW(), 'pending')`,
        [Number(campaignId), `/uploads/${filename}`, user.name]
      )
      uploadedCount++
    }

    // ✅ Activity log
    await logActivity(user.id, `Uploaded ${uploadedCount} image(s) to campaign ID: ${campaignId}`)

    return NextResponse.json({ success: true, message: `${uploadedCount} image(s) uploaded successfully` })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

// ─── DELETE — single image ─────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('id')
    if (!imageId) return NextResponse.json({ success: false, error: 'Image ID required' }, { status: 400 })

    const [rows] = await db.query<CampaignImage[]>(
      'SELECT image_path FROM campaign_images WHERE id = ?',
      [Number(imageId)]
    )
    if (!rows.length) return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 })

    const imagePath = rows[0].image_path

    // file disk se delete karo
    try {
      const filePath = path.join(process.cwd(), imagePath)
      await unlink(filePath)
    } catch { /* file already missing — ignore */ }

    // DB se delete karo
    await db.query('DELETE FROM campaign_images WHERE id = ?', [Number(imageId)])

    // ✅ Activity log
    await logActivity(user.id, `Deleted image: "${imagePath}"`)

    return NextResponse.json({ success: true, message: 'Image deleted' })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}