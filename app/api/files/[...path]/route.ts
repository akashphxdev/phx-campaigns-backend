import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

const MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params

    // Path traversal attack se bachao
    const safe = segments.map(s => path.basename(s))
    const filePath = path.join(process.cwd(), 'uploads', ...safe)

    const file = await readFile(filePath)
    const ext  = path.extname(filePath).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'

    return new NextResponse(file, {
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}