'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  MdCheckCircle,
  MdError,
  MdSync,
  MdSearch,
  MdRefresh,
  MdInbox,
  MdComputer,
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
} from 'react-icons/md'

// ─── Types ─────────────────────────────────────────────────────────────────

type Status = 'success' | 'failed' | 'processing'

interface Log {
  id:          number
  system_name: string
  description: string
  status:      Status
  date:        string
  time:        string
}

// ─── Config ─────────────────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; icon: React.ReactNode; classes: string }> = {
  success: {
    label:   'Success',
    icon:    <MdCheckCircle size={13} />,
    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  failed: {
    label:   'Failed',
    icon:    <MdError size={13} />,
    classes: 'bg-red-50 text-red-600 border border-red-200',
  },
  processing: {
    label:   'Processing',
    icon:    <MdSync size={13} className="animate-spin" />,
    classes: 'bg-blue-50 text-blue-600 border border-blue-200',
  },
}

const statusFilterButtons: { label: string; value: Status | 'all' }[] = [
  { label: 'All',        value: 'all'        },
  { label: 'Success',    value: 'success'    },
  { label: 'Failed',     value: 'failed'     },
  { label: 'Processing', value: 'processing' },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// ─── Pagination Component ───────────────────────────────────────────────────

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

  const btnBase     = `flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer`
  const btnActive   = 'bg-slate-800 text-white border-slate-800'
  const btnInactive = 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
  const btnDisabled = 'bg-white text-slate-300 border-slate-100 cursor-not-allowed'

  return (
    <div className="flex items-center gap-1">

      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
      >
        <MdFirstPage size={16} />
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
      >
        <MdChevronLeft size={16} />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dot-${i}`} className="px-1 text-xs text-slate-400">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`${btnBase} ${currentPage === page ? btnActive : btnInactive}`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}
      >
        <MdChevronRight size={16} />
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}
      >
        <MdLastPage size={16} />
      </button>

    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function SystemLogsPage() {
  const [logs,         setLogs]         = useState<Log[]>([])
  const [systemNames,  setSystemNames]  = useState<string[]>([])
  const [total,        setTotal]        = useState(0)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterSystem, setFilterSystem] = useState<string>('all')
  const [currentPage,  setCurrentPage]  = useState(1)
  const [pageSize,     setPageSize]     = useState(10)

  // ── Debounced search ────────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ── Reset page on filter/search/size change ─────────────────────────────
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filterStatus, filterSystem, pageSize])

  // ── Fetch from server ───────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:   String(currentPage),
        limit:  String(pageSize),
        search: debouncedSearch,
        status: filterStatus,
        system: filterSystem,
      })

      const res  = await fetch(`/api/system-logs?${params}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setSystemNames(data.systemNames ?? [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, filterStatus, filterSystem])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ── Derived display range ───────────────────────────────────────────────
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex   = Math.min(currentPage * pageSize, total)

  // ───────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">System Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time activity logs for all registered systems
        </p>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by system name or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="
              w-full border border-slate-200 rounded-lg pl-8 pr-4 py-2
              text-sm text-slate-700 placeholder:text-slate-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white transition-shadow
            "
          />
        </div>

        {/* System dropdown */}
        <div className="relative">
          <MdComputer size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filterSystem}
            onChange={e => setFilterSystem(e.target.value)}
            className="
              border border-slate-200 rounded-lg pl-8 pr-8 py-2
              text-sm text-slate-600 bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              cursor-pointer appearance-none transition-shadow
            "
          >
            <option value="all">All Systems</option>
            {systemNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">▼</span>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2">
          {statusFilterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`
                text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer
                ${filterStatus === btn.value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="
            flex items-center gap-1.5 text-xs font-medium px-3 py-1.5
            border border-slate-200 rounded-lg bg-white text-slate-500
            hover:text-slate-700 hover:border-slate-300 transition-colors
            disabled:opacity-50 cursor-pointer
          "
        >
          <MdRefresh size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

      </div>

      {/* Active system badge */}
      {filterSystem !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filtering by:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <MdComputer size={12} />
            {filterSystem}
            <button
              onClick={() => setFilterSystem('all')}
              className="ml-1 hover:text-blue-900 cursor-pointer font-bold"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3 w-8">#</th>
              <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">System Name</th>
              <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Description</th>
              <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">

            {loading && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <MdRefresh size={22} className="animate-spin" />
                    <p className="text-xs">Loading logs...</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <MdInbox size={28} />
                    <p className="text-xs">No logs found</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && logs.map((log, i) => {
              const s = statusConfig[log.status] ?? statusConfig.processing
              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {startIndex + i}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-700">{log.system_name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg ${s.classes}`}>
                      {s.icon}
                      {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                    {log.date ? new Date(log.date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap font-mono">
                    {log.time ?? '—'}
                  </td>
                </tr>
              )
            })}

          </tbody>
        </table>

        {/* Footer */}
        {!loading && total > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">

            {/* Count */}
            <p className="text-xs text-slate-400">
              Showing{' '}
              <span className="font-medium text-slate-600">{startIndex}–{endIndex}</span>
              {' '}of{' '}
              <span className="font-medium text-slate-600">{total}</span> logs
            </p>

            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="
                  border border-slate-200 rounded-lg px-2 py-1
                  text-xs text-slate-600 bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  cursor-pointer
                "
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

      </div>
    </div>
  )
}