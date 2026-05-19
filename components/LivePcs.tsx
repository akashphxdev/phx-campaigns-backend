'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  MdDesktopWindows,
  MdRefresh,
  MdWifiOff,
  MdSpeed,
  MdSlowMotionVideo,
  MdAccessTime,
  MdDone,
  MdClose,
  MdCircle,
  MdBarChart,
  MdTimer,
} from 'react-icons/md'

interface SystemRow {
  id:                 number
  system_name:        string
  campaign_id:        number | null
  is_active:          number
  start_datetime:     string | null
  end_datetime:       string | null
  success:            number
  failed:             number
  avg_time:           number        // in minutes (float) — from systems table
  last_req:           string | null
  created_by:         number | null
  created_at:         string
  updated_at:         string
  last_get_at:        string | null
  last_success_at:    string | null
  recent_avg_seconds: number | null // AVG of last 5 successful rows from csv_rows
}

type SystemStatus = 'fast' | 'slow' | 'offline' | 'idle'

interface ProcessedSystem extends SystemRow {
  status:        SystemStatus
  lastProcessMs: number | null   // ms taken for last process
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getStatus(sys: SystemRow): { status: SystemStatus; lastProcessMs: number | null } {
  const now = Date.now()

  if (!sys.last_get_at) return { status: 'idle', lastProcessMs: null }

  const lastGetMs = new Date(sys.last_get_at).getTime()

  // Calculate lastProcessMs upfront so offline rows still show it
  let lastProcessMs: number | null = null
  if (sys.last_success_at) {
    const diff = new Date(sys.last_success_at).getTime() - lastGetMs
    if (diff > 0) lastProcessMs = diff
  }

  // Fixed offline threshold: if no request in last 10 minutes → offline
  const OFFLINE_THRESH_MS = 10 * 60 * 1000   // 10 minutes

  if (now - lastGetMs > OFFLINE_THRESH_MS) {
    return { status: 'offline', lastProcessMs }   // show last known process time even if offline
  }

  if (lastProcessMs === null) return { status: 'idle', lastProcessMs: null }

  // avg for speed comparison — use recent_avg_seconds (last 5 jobs) if available
  const avgMs = sys.recent_avg_seconds != null
    ? sys.recent_avg_seconds * 1000
    : (sys.avg_time ?? 3) * 60 * 1000

  const status: SystemStatus = lastProcessMs < avgMs ? 'fast' : 'slow'
  return { status, lastProcessMs }
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  return `${(s / 60).toFixed(2)}min`
}

function fmtSeconds(sec: number | string | null): string {
  if (sec == null) return '—'

  const num = Number(sec)

  if (isNaN(num)) return '—'

  if (num < 60) return `${num.toFixed(1)}s`

  return `${(num / 60).toFixed(2)}min`
}

function fmtDateRelative(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ─── status config ────────────────────────────────────────────────────────────

const statusConfig: Record<SystemStatus, {
  label:   string
  bg:      string
  border:  string
  badge:   string
  dot:     string
  icon:    React.ReactNode
}> = {
  fast: {
    label:  'Working Fast',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
    badge:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
    dot:    'bg-emerald-500',
    icon:   <MdSpeed size={16} className="text-emerald-600" />,
  },
  slow: {
    label:  'Working Slow',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
    badge:  'bg-amber-100 text-amber-700 border border-amber-200',
    dot:    'bg-amber-400',
    icon:   <MdSlowMotionVideo size={16} className="text-amber-600" />,
  },
  offline: {
    label:  'Offline',
    bg:     'bg-red-50',
    border: 'border-red-200',
    badge:  'bg-red-100 text-red-700 border border-red-200',
    dot:    'bg-red-500',
    icon:   <MdWifiOff size={16} className="text-red-600" />,
  },
  idle: {
    label:  'Idle',
    bg:     'bg-slate-50',
    border: 'border-slate-200',
    badge:  'bg-slate-100 text-slate-600 border border-slate-200',
    dot:    'bg-slate-400',
    icon:   <MdCircle size={16} className="text-slate-400" />,
  },
}

// ─── component ───────────────────────────────────────────────────────────────

export default function LivePCsPage() {
  const [systems,     setSystems]     = useState<ProcessedSystem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown,   setCountdown]   = useState(60)

  const fetchSystems = useCallback(async () => {
    try {
      const res  = await fetch('/api/live-pcs')
      const data = await res.json()
      if (data.success) {
        const processed: ProcessedSystem[] = (data.systems as SystemRow[]).map((s) => ({
          ...s,
          ...getStatus(s),
        }))
        setSystems(processed)
        setLastUpdated(new Date())
        setCountdown(60)
      }
    } catch {
      // network err — silently ignore, will retry
    } finally {
      setLoading(false)
    }
  }, [])

  // initial fetch + 1-min interval
  useEffect(() => {
    fetchSystems()
    const interval = setInterval(fetchSystems, 60_000)
    return () => clearInterval(interval)
  }, [fetchSystems])

  // countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 60 : c - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // summary counts
  const counts = {
    fast:    systems.filter((s) => s.status === 'fast').length,
    slow:    systems.filter((s) => s.status === 'slow').length,
    offline: systems.filter((s) => s.status === 'offline').length,
    idle:    systems.filter((s) => s.status === 'idle').length,
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <MdDesktopWindows size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800">Live PCs</h1>
            <p className="text-[11px] text-slate-400">
              Real-time system status · auto-refresh every 60s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400">
              Updated {fmtDateRelative(lastUpdated.toISOString())} · next in {countdown}s
            </span>
          )}
          <button
            onClick={fetchSystems}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-medium transition-colors"
          >
            <MdRefresh size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        {(
          [
            { key: 'fast',    label: 'Fast',    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { key: 'slow',    label: 'Slow',    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'   },
            { key: 'offline', label: 'Offline', color: 'text-red-600',     bg: 'bg-red-50 border-red-200'       },
            { key: 'idle',    label: 'Idle',    color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200'   },
          ] as const
        ).map((item) => (
          <div
            key={item.key}
            className={`rounded-xl border px-4 py-3 ${item.bg} flex items-center justify-between`}
          >
            <span className="text-[12px] text-slate-500 font-medium">{item.label}</span>
            <span className={`text-[22px] font-bold ${item.color}`}>
              {counts[item.key]}
            </span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">#</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">System</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Status</th>

                {/* NEW: Last Process Time */}
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <MdTimer size={13} className="text-slate-400" />
                    Last Process Time
                  </div>
                </th>

                {/* NEW: Avg (Last 5 Rows) */}
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <MdBarChart size={13} className="text-slate-400" />
                    Avg (Last 5 Jobs)
                  </div>
                </th>

                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Avg Time</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Success</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Failed</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Last Request</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Last Success</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : systems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                    No systems found
                  </td>
                </tr>
              ) : (
                systems.map((sys, i) => {
                  const cfg = statusConfig[sys.status]
                  return (
                    <tr
                      key={sys.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors ${cfg.bg}`}
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>

                      {/* System name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MdDesktopWindows size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-700">{sys.system_name}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${
                            sys.status !== 'offline' && sys.status !== 'idle' ? 'animate-pulse' : ''
                          }`} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Last Process Time — lastProcessMs */}
                      <td className="px-4 py-3">
                        {sys.lastProcessMs !== null ? (
                          <span className={`font-semibold ${
                            sys.status === 'fast'    ? 'text-emerald-600' :
                            sys.status === 'offline' ? 'text-red-500'     :
                            'text-amber-600'
                          }`}>
                            {fmtMs(sys.lastProcessMs)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Avg Last 5 Jobs — recent_avg_seconds from csv_rows */}
                      <td className="px-4 py-3">
                        {sys.recent_avg_seconds != null ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                            <MdBarChart size={13} />
                            {fmtSeconds(sys.recent_avg_seconds)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Avg Time — from systems.avg_time (minutes) */}
                      <td className="px-4 py-3 text-slate-500">
                        {sys.avg_time != null ? `${sys.avg_time} min` : '—'}
                      </td>

                      {/* Success */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <MdDone size={13} />
                          {sys.success ?? 0}
                        </span>
                      </td>

                      {/* Failed */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-red-500 font-medium">
                          <MdClose size={13} />
                          {sys.failed ?? 0}
                        </span>
                      </td>

                      {/* Last Request */}
                      <td className="px-4 py-3 text-slate-500">
                        {fmtDateRelative(sys.last_get_at)}
                      </td>

                      {/* Last Success */}
                      <td className="px-4 py-3 text-slate-500">
                        {fmtDateRelative(sys.last_success_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}