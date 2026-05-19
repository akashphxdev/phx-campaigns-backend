// Path: app/campaigns/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  MdCampaign,
  MdAdd,
  MdClose,
  MdCheckCircle,
  MdError,
  MdCalendarToday,
  MdInbox,
  MdEdit,
  MdDelete,
  MdPerson,
  MdWarning,
} from 'react-icons/md'

interface Campaign {
  id:         number
  name:       string
  created_by: string
  created_at: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ── Reusable Overlay ──────────────────────────────────────────────────────────
function Overlay({
  onBgClick,
  children,
}: {
  onBgClick: () => void
  children:  React.ReactNode
}): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onBgClick() }}
    >
      {children}
    </div>
  )
}

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateModal({
  onClose,
  onCreated,
}: {
  onClose:   () => void
  onCreated: (c: Campaign) => void
}): React.JSX.Element {
  const [name,    setName]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [ok,      setOk]      = useState(false)

  const handleCreate = useCallback(async () => {
    if (!name.trim()) { setErr('Campaign name cannot be empty'); return }
    setSaving(true)
    setErr('')
    try {
      const res  = await fetch('/api/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      })
      const data = await res.json()
      if (data.success) {
        onCreated(data.campaign)
        setOk(true)
        setTimeout(onClose, 1200)
      } else {
        setErr(data.error ?? 'Something went wrong')
      }
    } catch {
      setErr('Could not connect to server')
    } finally {
      setSaving(false)
    }
  }, [name, onCreated, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saving, onClose])

  return (
    <Overlay onBgClick={() => { if (!saving) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <MdCampaign size={16} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Create New Campaign</h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {ok ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <MdCheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">Campaign created successfully!</p>
            </div>
          ) : (
            <>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Campaign Name <span className="text-red-400">*</span>
              </label>
              {/* autoFocus — no ref, no setTimeout, fresh mount se kaam karega */}
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErr('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                placeholder="e.g. Summer Sale 2026"
                maxLength={100}
                disabled={saving}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 transition-shadow"
              />
              <p className="text-xs text-slate-300 text-right mt-1">{name.length}/100</p>
              {err && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                  <MdError size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{err}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!ok && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <MdAdd size={16} />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({
  campaign,
  onClose,
  onUpdated,
}: {
  campaign:  Campaign
  onClose:   () => void
  onUpdated: (c: Campaign) => void
}): React.JSX.Element {
  const [name,   setName]   = useState(campaign.name)
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const [ok,     setOk]     = useState(false)

  const handleEdit = useCallback(async () => {
    if (!name.trim()) { setErr('Campaign name cannot be empty'); return }
    setSaving(true)
    setErr('')
    try {
      const res  = await fetch(`/api/campaigns/${campaign.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      })
      const data = await res.json()
      if (data.success) {
        onUpdated(data.campaign)
        setOk(true)
        setTimeout(onClose, 1200)
      } else {
        setErr(data.error ?? 'Something went wrong')
      }
    } catch {
      setErr('Could not connect to server')
    } finally {
      setSaving(false)
    }
  }, [name, campaign.id, onUpdated, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saving, onClose])

  return (
    <Overlay onBgClick={() => { if (!saving) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <MdEdit size={15} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Edit Campaign</h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {ok ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <MdCheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">Campaign updated successfully!</p>
            </div>
          ) : (
            <>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Campaign Name <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErr('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEdit() }}
                placeholder="e.g. Summer Sale 2026"
                maxLength={100}
                disabled={saving}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 transition-shadow"
              />
              <p className="text-xs text-slate-300 text-right mt-1">{name.length}/100</p>
              {err && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                  <MdError size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{err}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!ok && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={saving || !name.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <MdEdit size={15} />
                  Update Campaign
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({
  campaign,
  onClose,
  onDeleted,
}: {
  campaign:  Campaign
  onClose:   () => void
  onDeleted: (id: number) => void
}): React.JSX.Element {
  const [deleting, setDeleting] = useState(false)
  const [err,      setErr]      = useState('')

  const handleDelete = async (): Promise<void> => {
    setDeleting(true)
    setErr('')
    try {
      const res  = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        onDeleted(campaign.id)
        onClose()
      } else {
        setErr(data.error ?? 'Something went wrong')
      }
    } catch {
      setErr('Could not connect to server')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleting, onClose])

  return (
    <Overlay onBgClick={() => { if (!deleting) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
              <MdWarning size={15} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Delete Campaign</h3>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-800">"{campaign.name}"</span>?
            This action cannot be undone.
          </p>
          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
              <MdError size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{err}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <MdDelete size={15} />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CampaignsPage(): React.JSX.Element {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [fetching,  setFetching]  = useState<boolean>(true)
  const [fetchErr,  setFetchErr]  = useState<string>('')

  // Modal visibility — separate component mount/unmount karta hai (fix for focus bug)
  const [showCreate, setShowCreate] = useState<boolean>(false)
  const [editTarget, setEditTarget] = useState<Campaign | null>(null)
  const [delTarget,  setDelTarget]  = useState<Campaign | null>(null)

  const fetchCampaigns = async (): Promise<void> => {
    setFetching(true)
    setFetchErr('')
    try {
      const res  = await fetch('/api/campaigns')
      const data = await res.json()
      if (data.success) setCampaigns(data.campaigns)
      else setFetchErr(data.error ?? 'Failed to load campaigns')
    } catch {
      setFetchErr('Could not connect to server')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  return (
    <div className="w-full">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">
            View all campaigns — click Add to create a new one
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <MdAdd size={18} />
          Add Campaign
        </button>
      </div>

      {/* Total count card */}
      {!fetching && !fetchErr && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 inline-flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <MdCampaign size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Campaigns</p>
            <p className="text-xl font-semibold text-blue-600">{campaigns.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-medium text-slate-700">Campaign List</h2>
        </div>

        {fetching ? (
          <div className="px-5 py-10 text-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        ) : fetchErr ? (
          <div className="px-5 py-8 text-center">
            <MdError size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">{fetchErr}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MdInbox size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No campaigns yet</p>
            <p className="text-xs text-slate-300 mt-1">Click "Add Campaign" to create your first one</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">#</th>
                <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Campaign Name</th>
                <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Created By</th>
                <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Created At</th>
                <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: Campaign, i: number) => (
                <tr key={c.id} className={i !== 0 ? 'border-t border-slate-100' : ''}>

                  <td className="px-5 py-3 text-sm text-slate-400">{i + 1}</td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <MdCampaign size={15} className="text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MdPerson size={12} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-600">{c.created_by ?? '—'}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MdCalendarToday size={13} className="text-slate-300" />
                      {formatDate(c.created_at)}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {/* ✅ Edit — amber color */}
                      <button
                        onClick={() => setEditTarget(c)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <MdEdit size={13} />
                        Edit
                      </button>

                      {/* ✅ Delete — red color */}
                      <button
                        onClick={() => setDelTarget(c)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <MdDelete size={13} />
                        Delete
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Modals — alag components mein mount hain, isliye autoFocus sahi kaam karta hai */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setCampaigns(prev => [c, ...prev])}
        />
      )}

      {editTarget && (
        <EditModal
          key={editTarget.id}
          campaign={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(c) => setCampaigns(prev => prev.map(x => x.id === c.id ? c : x))}
        />
      )}

      {delTarget && (
        <DeleteModal
          campaign={delTarget}
          onClose={() => setDelTarget(null)}
          onDeleted={(id) => setCampaigns(prev => prev.filter(x => x.id !== id))}
        />
      )}

    </div>
  )
}