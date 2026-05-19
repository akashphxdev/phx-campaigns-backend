'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MdUploadFile, MdCheckCircle, MdError, MdInsertDriveFile,
  MdClose, MdWarning, MdCampaign, MdSchedule,
  MdDelete, MdCloudUpload, MdExpandMore, MdExpandLess,
  MdPerson, MdKeyboardArrowDown,
} from 'react-icons/md'

interface Campaign     { id: number; name: string }
interface UploadRecord {
  id:            number
  filename:      string
  campaign_name: string
  admin_name:    string
  admin_email:   string
  row_count:     number
  status:        'success' | 'partial' | 'failed'
  uploaded_at:   string
}
interface CsvRow { id: number; row_number: number; data: Record<string, string> }

type StatusConfig = Record<UploadRecord['status'], { label: string; className: string; icon: React.ReactNode }>

const statusConfig: StatusConfig = {
  success: { label: 'Success', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <MdCheckCircle size={12} className="text-emerald-500" /> },
  partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700 border border-amber-200',       icon: <MdWarning     size={12} className="text-amber-500"   /> },
  failed:  { label: 'Failed',  className: 'bg-red-50 text-red-700 border border-red-200',             icon: <MdError       size={12} className="text-red-500"     /> },
}
function formatDate(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Expandable Row Component ──────────────────────────────────────────────────
function ExpandableRow({
  record,
  index,
  onDelete,
  confirmDelete,
  setConfirmDelete,
  deletingId,
  handleDelete,
}: {
  record:           UploadRecord
  index:            number
  onDelete:         (id: number) => void
  confirmDelete:    number | null
  setConfirmDelete: (id: number | null) => void
  deletingId:       number | null
  handleDelete:     (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [rows,     setRows]     = useState<CsvRow[]>([])
  const [loading,  setLoading]  = useState(false)
  const [loaded,   setLoaded]   = useState(false)

  const toggleExpand = async () => {
    if (!expanded && !loaded) {
      setLoading(true)
      try {
        const res  = await fetch(`/api/upload-csv/rows?upload_id=${record.id}`)
        const data = await res.json()
        if (data.success) {
          const parsed = data.rows.map((r: CsvRow) => ({
            ...r,
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
          }))
          setRows(parsed)
          setLoaded(true)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    setExpanded(prev => !prev)
  }

  const columns = rows.length > 0 ? Object.keys(rows[0].data) : []

  return (
    <>
      {/* Main Row */}
      <tr className={index !== 0 ? 'border-t border-slate-100' : ''}>

        <td className="px-4 py-3 text-slate-400 text-sm">{index + 1}</td>

        {/* File */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <MdInsertDriveFile size={14} className="text-slate-300 flex-shrink-0" />
            <span className="text-sm text-slate-700 truncate max-w-[140px]">{record.filename}</span>
          </div>
        </td>

        {/* Campaign */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <MdCampaign size={13} className="text-blue-400 flex-shrink-0" />
            <span className="text-sm text-slate-600">{record.campaign_name}</span>
          </div>
        </td>

        {/* Uploaded By */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MdPerson size={11} className="text-blue-600" />
            </div>
            <span className="text-sm text-slate-600">{record.admin_name}</span>
          </div>
        </td>

        {/* Rows */}
        <td className="px-4 py-3">
          <span className="text-sm font-medium text-slate-700">{record.row_count}</span>
        </td>

        {/* Date */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MdSchedule size={12} className="text-slate-300" />
            {formatDate(record.uploaded_at)}
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusConfig[record.status].className}`}>
            {statusConfig[record.status].icon}
            {statusConfig[record.status].label}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">

            {/* Expand/Collapse */}
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
              title={expanded ? 'Collapse' : 'View Data'}
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : expanded ? (
                <MdExpandLess size={15} />
              ) : (
                <MdExpandMore size={15} />
              )}
              {expanded ? 'Hide' : 'View'}
            </button>

            {/* Delete */}
            {confirmDelete === record.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg disabled:opacity-60 cursor-pointer"
                >
                  {deletingId === record.id ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(record.id)}
                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                title="Delete"
              >
                <MdDelete size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Data Row */}
      {expanded && (
        <tr className="border-t border-blue-100 bg-slate-50">
          <td colSpan={8} className="px-4 py-3">
            {rows.length === 0 ? (
              <p className="text-sm text-slate-400 py-2 text-center">No data rows found</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-medium text-slate-400 uppercase tracking-wider w-8">#</th>
                      {columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.id} className={i !== 0 ? 'border-t border-slate-100' : ''}>
                        <td className="px-3 py-2 text-slate-400">{row.row_number}</td>
                        {columns.map(col => (
                          <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                            {row.data[col] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2 border-t border-slate-200 bg-white">
                  <p className="text-xs text-slate-400">{rows.length} rows</p>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CsvUploadPage(): React.JSX.Element {
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [selected,      setSelected]      = useState<Campaign | null>(null)
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const [records,       setRecords]       = useState<UploadRecord[]>([])
  const [campaignsLoad, setCampaignsLoad] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Upload state
  const [dragging,  setDragging]  = useState(false)
  const [file,      setFile]      = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState('')
  const [uploadErr, setUploadErr] = useState('')

  // History
  const [histLoading,   setHistLoading]   = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deletingId,    setDeletingId]    = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchCampaigns = async () => {
    setCampaignsLoad(true)
    try {
      const res  = await fetch('/api/campaigns')
      const data = await res.json()
      if (data.success) setCampaigns(data.campaigns)
    } catch { /* ignore */ }
    finally { setCampaignsLoad(false) }
  }

  const fetchUploads = async () => {
    setHistLoading(true)
    try {
      const res  = await fetch('/api/upload-csv')
      const data = await res.json()
      if (data.success) setRecords(data.uploads)
    } catch { /* ignore */ }
    finally { setHistLoading(false) }
  }

  useEffect(() => { fetchCampaigns(); fetchUploads() }, [])

  const validateFile = (f: File): boolean => {
    if (!f.name.endsWith('.csv')) { setFileError('Only .csv files are allowed'); return false }
    if (f.size > 10 * 1024 * 1024) { setFileError('File size must be under 10MB'); return false }
    setFileError(''); return true
  }

  const handleFile = (f: File) => {
    setSuccess(''); setUploadErr('')
    if (validateFile(f)) setFile(f)
  }

  const handleUpload = async () => {
    if (!file)     { setUploadErr('Please select a CSV file'); return }
    if (!selected) { setUploadErr('Please select a campaign first'); return }

    setLoading(true); setUploadErr(''); setSuccess('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('campaign_id',   String(selected.id))
      form.append('campaign_name', selected.name)
      const res  = await fetch('/api/upload-csv', { method: 'POST', body: form })
      const data = await res.json()
      if (data.success) {
        setSuccess(`${data.row_count} rows uploaded successfully!`)
        setFile(null)
        fetchUploads()
      } else {
        setUploadErr(data.error ?? 'Upload failed')
      }
    } catch { setUploadErr('Could not connect to server') }
    finally   { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/upload-csv?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) setRecords(prev => prev.filter(r => r.id !== id))
    } catch { /* ignore */ }
    finally { setDeletingId(null); setConfirmDelete(null) }
  }

  const totalRows    = records.reduce((s, r) => s + r.row_count, 0)
  const totalSuccess = records.filter(r => r.status === 'success').length

  return (
    <div className="w-full">

      {/* Page Header */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-800">CSV Upload</h1>
        <p className="text-sm text-slate-500 mt-1">Select a campaign and upload your CSV file</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Total Uploads', value: records.length,              color: 'text-blue-600'    },
          { label: 'Successful',    value: totalSuccess,                color: 'text-emerald-600' },
          { label: 'Total Rows',    value: totalRows.toLocaleString(),  color: 'text-slate-700'   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-7">
        <h2 className="text-sm font-semibold text-slate-700 mb-5">Upload New CSV</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Campaign Dropdown */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              Campaign <span className="text-red-400">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(p => !p)}
                disabled={campaignsLoad}
                className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MdCampaign size={15} className={selected ? 'text-blue-500' : 'text-slate-300'} />
                  <span className={`truncate ${selected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {campaignsLoad ? 'Loading...' : selected ? selected.name : 'Select a campaign'}
                  </span>
                </div>
                <MdKeyboardArrowDown
                  size={18}
                  className={`text-slate-400 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-52 overflow-y-auto">
                  {campaigns.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-400 text-center">No campaigns found</p>
                  ) : (
                    campaigns.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelected(c); setDropdownOpen(false); setUploadErr('') }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                          selected?.id === c.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <MdCampaign size={14} className={selected?.id === c.id ? 'text-blue-500' : 'text-slate-300'} />
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* File Drop Zone */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">
              CSV File <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => !file && inputRef.current?.click()}
              className={`
                relative rounded-lg border-2 border-dashed transition-all duration-150
                ${file
                  ? 'border-blue-300 bg-blue-50 cursor-default'
                  : dragging
                    ? 'border-blue-400 bg-blue-50 cursor-copy'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer'
                }
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />

              {file ? (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MdInsertDriveFile size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setSuccess('') }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  >
                    <MdClose size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
                  <MdCloudUpload size={22} className="text-slate-300 mb-1.5" />
                  <p className="text-xs font-medium text-slate-600">Drop CSV here or <span className="text-blue-500">browse</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">Max 10MB</p>
                </div>
              )}
            </div>

            {fileError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <MdError size={13} /> {fileError}
              </p>
            )}
          </div>
        </div>

        {/* Upload Error */}
        {uploadErr && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mt-4">
            <MdError size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{uploadErr}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 mt-4">
            <MdCheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={loading || !file || !selected}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <MdUploadFile size={17} />
                Upload CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-medium text-slate-700">Upload History</h2>
        </div>

        {histLoading ? (
          <div className="py-10 text-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center">
            <MdUploadFile size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No uploads yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">#</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">File</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Campaign</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Rows</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <ExpandableRow
                    key={r.id}
                    record={r}
                    index={i}
                    onDelete={(id) => setConfirmDelete(id)}
                    confirmDelete={confirmDelete}
                    setConfirmDelete={setConfirmDelete}
                    deletingId={deletingId}
                    handleDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}