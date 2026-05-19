'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MdComputer, MdAdd, MdEdit, MdDelete, MdClose, MdCheckCircle,
  MdError, MdAccessTime, MdCampaign, MdKeyboardArrowDown,
  MdSearch, MdPerson, MdCalendarToday,
} from 'react-icons/md'

interface Campaign {
  id:   number
  name: string
}

interface System {
  id:                number
  system_name:       string
  campaign_id:       number
  campaign_name:     string
  avg_time:          number
  start_datetime:    string | null
  end_datetime:      string | null
  is_active:         boolean
  is_on:             boolean
  success:           number
  failed:            number
  last_req:          string | null
  last_get_at:       string | null
  created_by:        number
  created_by_name:   string
  created_at:        string
}

function getNowLocal(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function formatDatetime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── DateTimeField ─────────────────────────────────────────────────────────────
function DateTimeField({ label, sublabel, value, onChange }: {
  label:     string
  sublabel?: string
  value:     string
  onChange:  (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1.5">
        {label} {sublabel && <span className="text-slate-400 font-normal">{sublabel}</span>}
      </label>
      <div className="relative">
        <input
          type="datetime-local" value={value} min={getNowLocal()}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 cursor-pointer">
            <MdClose size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddSystemModal({ campaigns, onClose, onSaved }: {
  campaigns: Campaign[]
  onClose:   () => void
  onSaved:   (s: System) => void
}) {
  const [systemName,    setSystemName]    = useState('')
  const [campaignId,    setCampaignId]    = useState<number | null>(null)
  const [avgTime,       setAvgTime]       = useState('')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime,   setEndDatetime]   = useState('')
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const dropdownRef      = useRef<HTMLDivElement>(null)
  const selectedCampaign = campaigns.find(c => c.id === campaignId) ?? null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSave = async () => {
    if (!systemName.trim())                                          { setError('System name is required'); return }
    if (!campaignId)                                                 { setError('Campaign is required'); return }
    if (!avgTime || isNaN(Number(avgTime)) || Number(avgTime) <= 0) { setError('Enter valid avg time'); return }
    if (startDatetime && endDatetime && new Date(endDatetime) <= new Date(startDatetime)) {
      setError('End date/time must be after start date/time'); return
    }
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/systems', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_name: systemName.trim(), campaign_id: campaignId,
          avg_time: Number(avgTime), start_datetime: startDatetime || null,
          end_datetime: endDatetime || null, created_by: 1,
        }),
      })
      const data = await res.json()
      if (data.success) { onSaved(data.system); onClose() }
      else setError(data.error ?? 'Failed to add system')
    } catch { setError('Could not connect to server') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <MdAdd size={16} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Add New System</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <MdClose size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">System Name <span className="text-red-400">*</span></label>
            <input type="text" value={systemName} onChange={e => { setSystemName(e.target.value); setError('') }}
              placeholder="Enter system name"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Campaign <span className="text-red-400">*</span></label>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(p => !p)}
                className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MdCampaign size={15} className={selectedCampaign ? 'text-blue-500' : 'text-slate-300'} />
                  <span className={`truncate ${selectedCampaign ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {selectedCampaign ? selectedCampaign.name : 'Select a campaign'}
                  </span>
                </div>
                <MdKeyboardArrowDown size={18} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto">
                  {campaigns.length === 0
                    ? <p className="px-4 py-3 text-sm text-slate-400 text-center">No campaigns found</p>
                    : campaigns.map(c => (
                      <button key={c.id} onClick={() => { setCampaignId(c.id); setDropdownOpen(false); setError('') }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${campaignId === c.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <MdCampaign size={14} className={campaignId === c.id ? 'text-blue-500' : 'text-slate-300'} />
                        {c.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Avg Time (minutes) <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type="number" min="1" value={avgTime} onChange={e => { setAvgTime(e.target.value); setError('') }}
                placeholder="e.g. 5"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
            </div>
          </div>
          <DateTimeField label="Start Date & Time" sublabel="(optional)" value={startDatetime} onChange={v => { setStartDatetime(v); setError('') }} />
          <DateTimeField label="End Date & Time"   sublabel="(optional)" value={endDatetime}   onChange={v => { setEndDatetime(v);   setError('') }} />
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MdAccessTime size={12} /> Past dates and times cannot be selected. Leave empty to run without time restriction.
          </p>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <MdError size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {loading ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Adding...</> : <><MdAdd size={15} />Add System</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditSystemModal({ system, onClose, onSaved }: {
  system:  System
  onClose: () => void
  onSaved: (updated: System) => void
}) {
  const [systemName,    setSystemName]    = useState(system.system_name)
  const [avgTime,       setAvgTime]       = useState(String(system.avg_time))
  const [startDatetime, setStartDatetime] = useState(system.start_datetime ?? '')
  const [endDatetime,   setEndDatetime]   = useState(system.end_datetime   ?? '')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')

  const handleSave = async () => {
    if (!systemName.trim())                                          { setError('System name is required'); return }
    if (!avgTime || isNaN(Number(avgTime)) || Number(avgTime) <= 0) { setError('Enter valid avg time'); return }
    if (startDatetime && endDatetime && new Date(endDatetime) <= new Date(startDatetime)) {
      setError('End date/time must be after start date/time'); return
    }
    setLoading(true); setError(''); setSuccess('')
    try {
      const res  = await fetch(`/api/systems?id=${system.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_name: systemName.trim(), avg_time: Number(avgTime),
          start_datetime: startDatetime || null, end_datetime: endDatetime || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Updated successfully!')
        onSaved({ ...system, system_name: systemName.trim(), avg_time: Number(avgTime), start_datetime: startDatetime || null, end_datetime: endDatetime || null })
        setTimeout(() => onClose(), 800)
      } else setError(data.error ?? 'Update failed')
    } catch { setError('Could not connect to server') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <MdEdit size={15} className="text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Edit System</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><MdClose size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">System ID</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
              <span className="text-xs font-mono font-bold text-blue-600">#{system.id}</span>
              <span className="text-xs text-slate-400">(read-only)</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">System Name <span className="text-red-400">*</span></label>
            <input type="text" value={systemName} onChange={e => { setSystemName(e.target.value); setError('') }}
              placeholder="Enter system name"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Avg Time (minutes) <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type="number" min="1" value={avgTime} onChange={e => { setAvgTime(e.target.value); setError('') }}
                placeholder="e.g. 5"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
            </div>
          </div>
          <DateTimeField label="Start Date & Time" sublabel="(optional)" value={startDatetime} onChange={v => { setStartDatetime(v); setError('') }} />
          <DateTimeField label="End Date & Time"   sublabel="(optional)" value={endDatetime}   onChange={v => { setEndDatetime(v);   setError('') }} />
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MdAccessTime size={12} /> Past dates and times cannot be selected. Leave empty to run without time restriction.
          </p>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <MdError size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              <MdCheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">{success}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {loading ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : <><MdEdit size={15} />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── System Card ───────────────────────────────────────────────────────────────
function SystemCard({ system, onEdit, onDelete, onToggle, confirmDelete, setConfirmDelete, deletingId }: {
  system:           System
  onEdit:           (s: System) => void
  onDelete:         (id: number) => void
  onToggle:         (id: number, current: boolean) => void
  confirmDelete:    number | null
  setConfirmDelete: (id: number | null) => void
  deletingId:       number | null
}) {
  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${system.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>

      {/* Colored Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${system.is_active ? 'bg-blue-600' : 'bg-slate-400'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <MdComputer size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">{system.system_name}</h3>
              <span className="font-mono text-xs text-white/60 flex-shrink-0">#{system.id}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MdCampaign size={11} className="text-white/60 flex-shrink-0" />
              <span className="text-xs text-white/70 truncate">{system.campaign_name ?? '—'}</span>
            </div>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle(system.id, system.is_active)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${system.is_active ? 'bg-white/30' : 'bg-white/20'}`}
          title={system.is_active ? 'Active' : 'Inactive'}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${system.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Detail rows */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Status</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${system.is_on ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={`text-xs font-medium ${system.is_on ? 'text-emerald-600' : 'text-slate-400'}`}>
                {system.is_on ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Avg Time</p>
            <div className="flex items-center gap-1">
              <MdAccessTime size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-700">{system.avg_time} min</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Created By</p>
            <div className="flex items-center gap-1">
              <MdPerson size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-700">{system.created_by_name ?? '—'}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Last Request</p>
            <span className="text-xs font-medium text-slate-700">{formatDate(system.last_req)}</span>
          </div>
        </div>

        {/* Schedule block */}
        <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-1.5">
          <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <MdCalendarToday size={11} /> Schedule
          </p>
          {system.start_datetime || system.end_datetime ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-400">Start</p>
                <p className="text-xs font-medium text-slate-700">{formatDatetime(system.start_datetime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">End</p>
                <p className="text-xs font-medium text-slate-700">{formatDatetime(system.end_datetime)}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No schedule — runs anytime</p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
        <button onClick={() => onEdit(system)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-medium transition-colors cursor-pointer"
        >
          <MdEdit size={13} /> Edit
        </button>
        {confirmDelete === system.id ? (
          <div className="flex-1 flex items-center gap-1.5">
            <button onClick={() => onDelete(system.id)} disabled={deletingId === system.id}
              className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-60 cursor-pointer"
            >
              {deletingId === system.id ? '...' : 'Confirm'}
            </button>
            <button onClick={() => setConfirmDelete(null)}
              className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(system.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium transition-colors cursor-pointer"
          >
            <MdDelete size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SystemsPage(): React.JSX.Element {
  const [systems,       setSystems]       = useState<System[]>([])
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [addModal,      setAddModal]      = useState(false)
  const [editSystem,    setEditSystem]    = useState<System | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deletingId,    setDeletingId]    = useState<number | null>(null)

  const fetchSystems = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/systems')
      const data = await res.json()
      if (data.success) setSystems(data.systems)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const fetchCampaigns = async () => {
    try {
      const res  = await fetch('/api/campaigns')
      const data = await res.json()
      if (data.success) setCampaigns(data.campaigns)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchSystems(); fetchCampaigns() }, [])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/systems?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) setSystems(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
    finally { setDeletingId(null); setConfirmDelete(null) }
  }

  const handleToggle = async (id: number, current: boolean) => {
    setSystems(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
    try {
      await fetch(`/api/systems?id=${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
    } catch {
      setSystems(prev => prev.map(s => s.id === id ? { ...s, is_active: current } : s))
    }
  }

  const filtered = systems.filter(s =>
    s.system_name.toLowerCase().includes(search.toLowerCase()) ||
    s.campaign_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalActive = systems.filter(s => s.is_active).length
  const totalOn     = systems.filter(s => s.is_on).length

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Systems</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all systems and their configurations</p>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <MdAdd size={17} /> Add System
        </button>
      </div>

      {/* Stats — 3 only, no success/failed/rate */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Systems', value: systems.length, color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Active',        value: totalActive,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Online',        value: totalOn,        color: 'text-violet-600',  bg: 'bg-violet-50'  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5 relative max-w-xs">
        <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search systems..."
          className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full bg-white"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading systems...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <MdComputer size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">{search ? 'No systems found' : 'No systems yet — add one!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <SystemCard
              key={s.id} system={s}
              onEdit={setEditSystem} onDelete={handleDelete} onToggle={handleToggle}
              confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {addModal && (
        <AddSystemModal campaigns={campaigns} onClose={() => setAddModal(false)} onSaved={s => setSystems(prev => [s, ...prev])} />
      )}
      {editSystem && (
        <EditSystemModal
          system={editSystem}
          onClose={() => setEditSystem(null)}
          onSaved={updated => {
            setSystems(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
            setEditSystem(null)
          }}
        />
      )}
    </div>
  )
}