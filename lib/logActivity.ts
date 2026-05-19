// Path: lib/logActivity.ts
// Helper: kisi bhi route se activity log karne ke liye

import db from '@/lib/db'
import { ResultSetHeader } from 'mysql2'

export async function logActivity(
  adminId: number,
  action:  string
): Promise<void> {
  try {
    await db.query<ResultSetHeader>(
      `INSERT INTO admin_activity (admin_id, action) VALUES (?, ?)`,
      [adminId, action]
    )
  } catch (err) {
    // Log silently — activity failure should not break main flow
    console.error('[logActivity Error]', err)
  }
}