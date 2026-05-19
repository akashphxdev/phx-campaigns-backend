// Path: app/admins-activity/page.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  MdHistory,
  MdError,
  MdInbox,
  MdPerson,
  MdCalendarToday,
  MdRefresh,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
} from 'react-icons/md'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Activity {
  id:          number
  admin_id:    number
  admin_name:  string
  admin_email: string
  role:        string
  action:      string
  created_at:  string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

const roleLabel: Record<string, string> = {
  superadmin:   'Super Admin',
  datauploader: 'Data Uploader',
  viewer:       'Viewer',
}

const roleBadgeClass: Record<string, string> = {
  superadmin:   'bg-blue-50 text-blue-700 border border-blue-200',
  datauploader: 'bg-green-50 text-green-700 border border-green-200',
  viewer:       'bg-slate-100 text-slate-600 border border-slate-200',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage:  number
  totalPages:   number
  onPageChange: (page: number) => void
}) {
  const pages = useMemo(() => {
    const delta = 2
    const range: (number | '...')[] = []
    const left  = currentPage - delta
    const right = currentPage + delta
    let prev: number | null = null

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        if (prev !== null && i - prev > 1) range.push('...')
        range.push(i)
        prev = i
      }
    }
    return range
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  const base     = 'flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer'
  const active   = 'bg-slate-800 text-white border-slate-800'
  const inactive = 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
  const disabled = 'bg-white text-slate-300 border-slate-100 cursor-not-allowed'

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
        className={`${base} ${currentPage === 1 ? disabled : inactive}`}>
        <MdFirstPage size={16} />
      </button>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        className={`${base} ${currentPage === 1 ? disabled : inactive}`}>
        <MdChevronLeft size={16} />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dot-${i}`} className="px-1 text-xs text-slate-400">...</span>
        ) : (
          <button key={page} onClick={() => onPageChange(page as number)}
            className={`${base} ${currentPage === page ? active : inactive}`}>
            {page}
          </button>
        )
      )}

      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className={`${base} ${currentPage === totalPages ? disabled : inactive}`}>
        <MdChevronRight size={16} />
      </button>
      <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
        className={`${base} ${currentPage === totalPages ? disabled : inactive}`}>
        <MdLastPage size={16} />
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminsActivityPage(): React.JSX.Element {
  const [activities,  setActivities]  = useState<Activity[]>([])
  const [roles,       setRoles]       = useState<string[]>([])
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [fetching,    setFetching]    = useState(true)
  const [fetchErr,    setFetchErr]    = useState('')
  const [search,      setSearch]      = useState('')
  const [filterRole,  setFilterRole]  = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize,    setPageSize]    = useState(10)

  // ── Debounced search ──────────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ── Reset page on filter change ───────────────────────────────────────────
  useEffect(() => { setCurrentPage(1) }, [debouncedSearch, filterRole, pageSize])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    setFetching(true)
    setFetchErr('')
    try {
      const params = new URLSearchParams({
        page:   String(currentPage),
        limit:  String(pageSize),
        search: debouncedSearch,
        role:   filterRole,
      })

      const res  = await fetch(`/api/admins-activity?${params}`)
      const data = await res.json()

      if (data.success) {
        setActivities(data.activities)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setRoles(data.roles ?? [])
      } else {
        setFetchErr(data.error ?? 'Failed to load activity logs')
      }
    } catch {
      setFetchErr('Could not connect to server')
    } finally {
      setFetching(false)
    }
  }, [currentPage, pageSize, debouncedSearch, filterRole])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  // ── Derived ───────────────────────────────────────────────────────────────
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex   = Math.min(currentPage * pageSize, total)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Admins Activity</h1>
          <p className="text-sm text-slate-500 mt-1">Track all admin actions and audit trail</p>
        </div>
        <button
          onClick={fetchActivities}
          disabled={fetching}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <MdRefresh size={17} className={fetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats + Filters row */}
      {!fetching && !fetchErr && (
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">

          {/* Total count */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 inline-flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <MdHistory size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Activities</p>
              <p className="text-xl font-semibold text-blue-600">{total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">

            {/* Role filter */}
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {roles.map(r => (
                <option key={r} value={r}>{roleLabel[r] ?? r}</option>
              ))}
            </select>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 w-72 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <MdSearch size={16} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by admin, role or action..."
                className="bg-transparent text-sm text-slate-700 placeholder:text-slate-300 outline-none w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-300 hover:text-slate-500 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Activity Log</h2>
        </div>

        {fetching ? (
          <div className="px-5 py-10 text-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading activity logs...</p>
          </div>
        ) : fetchErr ? (
          <div className="px-5 py-8 text-center">
            <MdError size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">{fetchErr}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MdInbox size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {search ? `No results for "${search}"` : 'No activity logs yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">#</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Admin</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a, i) => (
                    <tr key={a.id} className={i !== 0 ? 'border-t border-slate-100' : ''}>

                      {/* # */}
                      <td className="px-5 py-3 text-sm text-slate-400">{startIndex + i}</td>

                      {/* Admin */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MdPerson size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 leading-none">{a.admin_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{a.admin_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          roleBadgeClass[a.role] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {roleLabel[a.role] ?? a.role}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{a.action}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MdCalendarToday size={13} className="text-slate-300" />
                          {formatDate(a.created_at)}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer — count + page size + pagination */}
            {total > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">

                {/* Count */}
                <p className="text-xs text-slate-400">
                  Showing{' '}
                  <span className="font-medium text-slate-600">{startIndex}–{endIndex}</span>
                  {' '}of{' '}
                  <span className="font-medium text-slate-600">{total}</span> activities
                </p>

                {/* Rows per page */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />

              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}