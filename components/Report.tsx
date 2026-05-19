'use client'

import { useEffect, useState, useRef } from 'react'
import {
  MdAssessment, MdFilterList, MdDownload, MdArrowBack,
  MdCheckCircle, MdCancel, MdHourglassEmpty, MdPending,
  MdVisibility, MdVisibilityOff,
} from 'react-icons/md'

interface Campaign {
  id:          number
  name:        string
  created_by:  string
  created_at:  string
  total_rows:  number
  success:     number
  failed:      number
  processing:  number
  pending:     number
}

interface CsvRow {
  id:           number
  row_number:   number
  data:         any
  status:       string
  process_time: number | null
  started_at:   string | null
  completed_at: string | null
  ip:           string | null
  filename:     string
  system_name:  string | null
}

const statusColors: Record<string, string> = {
  success:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  failed:     'bg-red-100 text-red-700 border border-red-200',
  processing: 'bg-blue-100 text-blue-700 border border-blue-200',
  pending:    'bg-slate-100 text-slate-600 border border-slate-200',
}

// Static columns that can be toggled
const STATIC_COLS = [
  { key: 'index',       label: '#'            },
  { key: 'row_number',  label: 'Row'          },
  { key: 'status',      label: 'Status'       },
  { key: 'process_time',label: 'Process Time' },
  { key: 'date',        label: 'Date'         },
  { key: 'started_at',  label: 'Started At'   },
  { key: 'completed_at',label: 'Completed At' },
  { key: 'ip',          label: 'IP'           },
  { key: 'system_name', label: 'System'       },
  { key: 'filename',    label: 'File'         },
]

function fmt(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtSec(s: number | null) {
  if (s == null) return '—'
  if (s < 60) return `${s}s`
  return `${(s / 60).toFixed(2)}min`
}

export default function ReportsPage() {
  const [campaigns,    setCampaigns]    = useState<Campaign[]>([])
  const [selectedCamp, setSelectedCamp] = useState<Campaign | null>(null)
  const [rows,         setRows]         = useState<CsvRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [rowsLoading,  setRowsLoading]  = useState(false)

  // Filters
  const [status,   setStatus]   = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  // Column visibility: key → visible
  // Starts all true; data keys added when rows load
  const [colVisible, setColVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(STATIC_COLS.map(c => [c.key, true]))
  )

  const [dataKeys, setDataKeys] = useState<string[]>([])

  // Load campaigns
  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => { if (d.success) setCampaigns(d.campaigns) })
      .finally(() => setLoading(false))
  }, [])

  // Load campaign rows
  const loadRows = async (camp: Campaign) => {
    setSelectedCamp(camp)
    setRowsLoading(true)
    const params = new URLSearchParams({
      campaign_id: String(camp.id),
      status,
      date_from:   dateFrom,
      date_to:     dateTo,
    })
    const res  = await fetch(`/api/reports?${params}`)
    const data = await res.json()
    if (data.success) {
      setRows(data.rows)
      // Discover data keys and initialise their visibility
      if (data.rows.length > 0) {
        const keys: string[] = Object.keys(
          typeof data.rows[0].data === 'string'
            ? JSON.parse(data.rows[0].data)
            : data.rows[0].data
        )
        setDataKeys(keys)
        setColVisible(prev => {
          const next = { ...prev }
          keys.forEach(k => { if (!(k in next)) next[k] = true })
          return next
        })
      }
    }
    setRowsLoading(false)
  }

  const applyFilters = () => {
    if (selectedCamp) loadRows(selectedCamp)
  }

  const toggleCol = (key: string) =>
    setColVisible(prev => ({ ...prev, [key]: !prev[key] }))

  const showAll  = () => setColVisible(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])))
  const hideAll  = () => setColVisible(prev => Object.fromEntries(Object.keys(prev).map(k => [k, false])))

  const vis = (key: string) => colVisible[key] !== false

  // PDF Download
  const downloadPdf = () => {
    const style = `
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        p  { font-size: 11px; color: #64748b; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-size: 10px; color: #475569; border: 1px solid #e2e8f0; }
        td { padding: 6px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .success    { background: #d1fae5; color: #065f46; }
        .failed     { background: #fee2e2; color: #991b1b; }
        .processing { background: #dbeafe; color: #1e40af; }
        .pending    { background: #f1f5f9; color: #475569; }
      </style>
    `

    const headers: string[] = []
    if (vis('index'))        headers.push('#')
    if (vis('row_number'))   headers.push('Row')
    dataKeys.filter(k => vis(k)).forEach(k => headers.push(k))
    if (vis('status'))       headers.push('Status')
    if (vis('process_time')) headers.push('Process Time')
    if (vis('date'))         headers.push('Date')
    if (vis('started_at'))   headers.push('Started At')
    if (vis('completed_at')) headers.push('Completed At')
    if (vis('ip'))           headers.push('IP')
    if (vis('system_name'))  headers.push('System')
    if (vis('filename'))     headers.push('File')

    const tableRows = rows.map((r, i) => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
      let tr = '<tr>'
      if (vis('index'))        tr += `<td>${i + 1}</td>`
      if (vis('row_number'))   tr += `<td>${r.row_number}</td>`
      dataKeys.filter(k => vis(k)).forEach(k => { tr += `<td>${data[k] ?? '—'}</td>` })
      if (vis('status'))       tr += `<td><span class="badge ${r.status}">${r.status}</span></td>`
      if (vis('process_time')) tr += `<td>${fmtSec(r.process_time)}</td>`
      if (vis('date'))         tr += `<td>${r.started_at ? new Date(r.started_at).toLocaleDateString('en-IN') : '—'}</td>`
      if (vis('started_at'))   tr += `<td>${fmt(r.started_at)}</td>`
      if (vis('completed_at')) tr += `<td>${fmt(r.completed_at)}</td>`
      if (vis('ip'))           tr += `<td>${r.ip ?? '—'}</td>`
      if (vis('system_name'))  tr += `<td>${r.system_name ?? '—'}</td>`
      if (vis('filename'))     tr += `<td>${r.filename}</td>`
      tr += '</tr>'
      return tr
    }).join('')

    const html = `
      <html><head>${style}</head><body>
        <h1>Report — ${selectedCamp?.name}</h1>
        <p>Status: ${status} &nbsp;|&nbsp; Date: ${dateFrom || 'Any'} → ${dateTo || 'Any'} &nbsp;|&nbsp; Total: ${rows.length} rows</p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body></html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  // ── Campaign list ──
  if (!selectedCamp) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
            <MdAssessment size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800">Reports</h1>
            <p className="text-[11px] text-slate-400">Select a campaign to view its report</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No campaigns found</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {campaigns.map(c => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-slate-800">{c.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Created by {c.created_by} · {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-slate-500">Total: <b>{c.total_rows}</b></span>
                    <span className="text-[11px] text-emerald-600">✓ {c.success}</span>
                    <span className="text-[11px] text-red-500">✗ {c.failed}</span>
                    <span className="text-[11px] text-blue-500">⟳ {c.processing}</span>
                    <span className="text-[11px] text-slate-400">◌ {c.pending}</span>
                  </div>
                </div>
                <button
                  onClick={() => loadRows(c)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-medium rounded-lg transition-colors"
                >
                  View Report
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── All toggleable columns: data keys first, then static ──
  const allToggleCols: { key: string; label: string }[] = [
    ...STATIC_COLS.slice(0, 2), // # and Row
    ...dataKeys.map(k => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) })),
    ...STATIC_COLS.slice(2),    // Status onwards
  ]

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedCamp(null); setRows([]) }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <MdArrowBack size={16} />
          </button>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-800">{selectedCamp.name}</h1>
            <p className="text-[11px] text-slate-400">{rows.length} rows matching filters</p>
          </div>
        </div>
        <button
          onClick={downloadPdf}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-medium rounded-lg transition-colors"
        >
          <MdDownload size={15} />
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MdFilterList size={15} className="text-slate-400" />
          <span className="text-[12px] font-semibold text-slate-600">Filters</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-purple-400"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-[12px] font-medium rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Column toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Show / Hide Columns</span>
            <div className="flex gap-2">
              <button
                onClick={showAll}
                className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
              >
                Show All
              </button>
              <button
                onClick={hideAll}
                className="text-[10px] px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition-colors"
              >
                Hide All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allToggleCols.map(({ key, label }) => {
              const on = vis(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleCol(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    on
                      ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {on ? <MdVisibility size={11} /> : <MdVisibilityOff size={11} />}
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {vis('index')        && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">#</th>}
                {vis('row_number')   && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Row</th>}
                {dataKeys.filter(k => vis(k)).map(k => (
                  <th key={k} className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap capitalize">{k}</th>
                ))}
                {vis('status')       && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Status</th>}
                {vis('process_time') && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Process Time</th>}
                {vis('date')         && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Date</th>}
                {vis('started_at')   && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Started At</th>}
                {vis('completed_at') && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">Completed At</th>}
                {vis('ip')           && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">IP</th>}
                {vis('system_name')  && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">System</th>}
                {vis('filename')     && <th className="text-left px-3 py-2.5 text-slate-500 font-semibold whitespace-nowrap">File</th>}
              </tr>
            </thead>
            <tbody>
              {rowsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-4 py-10 text-center text-slate-400">
                    No data found for selected filters
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      {vis('index')        && <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>}
                      {vis('row_number')   && <td className="px-3 py-2.5 text-slate-500">{r.row_number}</td>}
                      {dataKeys.filter(k => vis(k)).map(k => (
                        <td key={k} className="px-3 py-2.5 text-slate-700 max-w-[160px] truncate">{String(data[k] ?? '—')}</td>
                      ))}
                      {vis('status')       && (
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[r.status] ?? statusColors.pending}`}>
                            {r.status}
                          </span>
                        </td>
                      )}
                      {vis('process_time') && <td className="px-3 py-2.5 text-slate-500">{fmtSec(r.process_time)}</td>}
                      {vis('date')         && <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.started_at ? new Date(r.started_at).toLocaleDateString('en-IN') : '—'}</td>}
                      {vis('started_at')   && <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{fmt(r.started_at)}</td>}
                      {vis('completed_at') && <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{fmt(r.completed_at)}</td>}
                      {vis('ip')           && <td className="px-3 py-2.5 text-slate-500 font-mono">{r.ip ?? '—'}</td>}
                      {vis('system_name')  && <td className="px-3 py-2.5 text-slate-500">{r.system_name ?? '—'}</td>}
                      {vis('filename')     && <td className="px-3 py-2.5 text-slate-400 text-[11px]">{r.filename}</td>}
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