'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdHourglassEmpty,
  MdSync,
  MdBarChart,
  MdComputer,
  MdArticle,
  MdFiberManualRecord,
  MdTrendingUp,
  MdAccessTime,
} from 'react-icons/md'

interface SystemInfo {
  id: number
  system_name: string
  is_active: boolean
  success: number
  failed: number
  avg_time: number | null
  last_req: string | null
  last_success_at: string | null
  processing_count: number
}

interface LogEntry {
  system_name: string
  description: string
  status: string
  datetime: string
}

interface CampaignData {
  campaign_id: number
  campaign_name: string
  total_rows: number
  success: number
  failed: number
  pending: number
  processing: number
  systems: SystemInfo[]
  recent_logs: LogEntry[]
}

function fmtTime(sec: number | null): string {
  if (sec === null || sec === undefined) return '—'
  if (sec < 60)   return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
}

function ProgressRing({ value, total, color }: { value: number; total: number; color: string }) {
  const pct    = total > 0 ? (value / total) * 100 : 0
  const r      = 20
  const circ   = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="26" y="30" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

function StatBar({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        <span className="text-[11px] font-semibold" style={{ color }}>
          {value} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

const logStyles: Record<string, { dot: string; text: string; badge: string }> = {
  success:    { dot: 'bg-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:     { dot: 'bg-red-400',     text: 'text-red-600',     badge: 'bg-red-50 text-red-700 border-red-200' },
  processing: { dot: 'bg-blue-400',    text: 'text-blue-600',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export default function DashboardPage() {
  const [data,      setData]      = useState<CampaignData[]>([])
  const [loading,   setLoading]   = useState(true)
  const [lastSync,  setLastSync]  = useState<string>('')
  const [countdown, setCountdown] = useState(30)
  const [error,     setError]     = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch('/api/dashboard')
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setData(json.data)
      setLastSync(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => { fetchData(); setCountdown(30) }, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
      </div>
      <p className="text-slate-400 text-sm tracking-wide">Loading dashboard...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
        <MdCancel size={20} className="text-red-400" />
      </div>
      <p className="text-red-500 text-sm">Error: {error}</p>
      <button onClick={fetchData}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-medium transition-colors border border-slate-200">
        <MdRefresh size={14} /> Retry
      </button>
    </div>
  )

  const totalSuccess    = data.reduce((a, c) => a + c.success, 0)
  const totalFailed     = data.reduce((a, c) => a + c.failed, 0)
  const totalPending    = data.reduce((a, c) => a + c.pending, 0)
  const totalRows       = data.reduce((a, c) => a + c.total_rows, 0)
  const totalProcessing = data.reduce((a, c) => a + c.processing, 0)

  return (
    <div className="w-full space-y-6">

      {/* ── Top Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Automation Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time campaign monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
              <MdFiberManualRecord size={7} className="text-emerald-500 animate-pulse" />
              Last sync {lastSync} · {countdown}s
            </div>
          )}
          <button
            onClick={() => { fetchData(); setCountdown(30) }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <MdRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Global Summary Strip ── */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Rows',  value: totalRows,       icon: <MdBarChart size={20} className="text-blue-600" />,    bg: 'bg-blue-50',    val: 'text-blue-700'   },
            { label: 'Success',     value: totalSuccess,    icon: <MdCheckCircle size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', val: 'text-emerald-700' },
            { label: 'Failed',      value: totalFailed,     icon: <MdCancel size={20} className="text-red-500" />,        bg: 'bg-red-50',     val: 'text-red-700'    },
            { label: 'Pending',     value: totalPending,    icon: <MdHourglassEmpty size={20} className="text-amber-600" />, bg: 'bg-amber-50', val: 'text-amber-700'  },
            { label: 'Processing',  value: totalProcessing, icon: <MdSync size={20} className="text-sky-600" />,          bg: 'bg-sky-50',     val: 'text-sky-700'    },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400 leading-none mb-1">{s.label}</p>
                <p className={`text-2xl font-semibold leading-none ${s.val}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Campaign Cards ── */}
      {data.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl bg-white">
          No campaigns found
        </div>
      ) : data.map(camp => {
        const total    = camp.total_rows || 1
        const isActive = camp.systems.some(s => s.is_active)

        return (
          <div key={camp.campaign_id}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

            {/* Card Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <h2 className="text-[14px] font-bold text-slate-800 tracking-tight">{camp.campaign_name}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <MdBarChart size={12} />
                <span>{camp.total_rows.toLocaleString()} rows</span>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* Stats + Ring */}
              <div className="flex items-start gap-5 flex-wrap">

                {/* Progress Rings */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <ProgressRing value={camp.success} total={total} color="#10b981" />
                    <p className="text-[10px] text-slate-400 mt-1">Success</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing value={camp.failed} total={total} color="#ef4444" />
                    <p className="text-[10px] text-slate-400 mt-1">Failed</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing value={camp.pending} total={total} color="#f59e0b" />
                    <p className="text-[10px] text-slate-400 mt-1">Pending</p>
                  </div>
                </div>

                {/* Stat Numbers */}
                <div className="flex-1 min-w-[200px] grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Success',    val: camp.success,    bg: 'bg-emerald-50', color: 'text-emerald-700' },
                    { label: 'Failed',     val: camp.failed,     bg: 'bg-red-50',     color: 'text-red-700'     },
                    { label: 'Pending',    val: camp.pending,    bg: 'bg-amber-50',   color: 'text-amber-700'   },
                    { label: 'Processing', val: camp.processing, bg: 'bg-sky-50',     color: 'text-sky-700'     },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2.5 border border-slate-100`}>
                      <div className="text-[10px] text-slate-400 mb-1">{s.label}</div>
                      <div className={`text-[20px] font-bold ${s.color}`}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2.5 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MdTrendingUp size={11} /> Distribution
                </p>
                <StatBar value={camp.success}    total={camp.total_rows} color="#10b981" label="Success" />
                <StatBar value={camp.failed}     total={camp.total_rows} color="#ef4444" label="Failed" />
                <StatBar value={camp.pending}    total={camp.total_rows} color="#f59e0b" label="Pending" />
                {camp.processing > 0 &&
                  <StatBar value={camp.processing} total={camp.total_rows} color="#0ea5e9" label="Processing" />}
              </div>

              {/* Systems + Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Systems */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    <MdComputer size={12} /> Systems
                    <span className="ml-auto text-[10px] font-normal normal-case bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
                      {camp.systems.length} assigned
                    </span>
                  </div>
                  {camp.systems.length === 0 ? (
                    <p className="text-[12px] text-slate-400 text-center py-4">No systems assigned</p>
                  ) : (
                    <div className="space-y-0 divide-y divide-slate-100">
                      {camp.systems.map(sys => (
                        <div key={sys.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${sys.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-slate-700 truncate">{sys.system_name}</div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-[11px] text-emerald-600 font-medium">{sys.success} ok</span>
                              <span className="text-[11px] text-red-500 font-medium">{sys.failed} fail</span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MdAccessTime size={10} /> {fmtTime(sys.avg_time)}
                              </span>
                            </div>
                            {sys.last_req && (
                              <div className="text-[10px] text-slate-400 mt-0.5">Last: {sys.last_req}</div>
                            )}
                            {sys.processing_count > 0 && (
                              <div className="text-[10px] text-blue-500 mt-0.5 font-medium flex items-center gap-1">
                                <MdSync size={9} className="animate-spin" /> {sys.processing_count} processing
                              </div>
                            )}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border flex-shrink-0 ${
                            sys.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {sys.is_active ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Logs */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    <MdArticle size={12} /> Recent Logs
                    <span className="ml-auto text-[10px] font-normal normal-case bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
                      Last 5
                    </span>
                  </div>
                  {camp.recent_logs.length === 0 ? (
                    <p className="text-[12px] text-slate-400 text-center py-4">No logs yet</p>
                  ) : (
                    <div className="space-y-0 divide-y divide-slate-100">
                      {camp.recent_logs.slice(0, 5).map((log, i) => {
                        const ls = logStyles[log.status] ?? logStyles.processing
                        return (
                          <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ls.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-slate-600 leading-snug line-clamp-2">{log.description}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold capitalize ${ls.badge}`}>
                                  {log.status}
                                </span>
                                <span className="text-[10px] text-slate-400">{log.datetime}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}