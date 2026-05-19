'use client'

import { useEffect, useState } from 'react'
import {
  MdSettings, MdDesktopWindows, MdEdit,
  MdDelete, MdSave, MdClose, MdAdd, MdCheckCircle,
} from 'react-icons/md'

interface SystemRow {
  id:                 number
  system_name:        string
  campaign_id:        number | null
  setting_id:         number | null
  data_mode:          'pending' | 'failed' | 'processing' | null
  sort_order:         'asc' | 'desc' | null
  success_limit:      number | null
  setting_created_at: string | null
  setting_updated_at: string | null
}

interface FormState {
  system_id:     number
  system_name:   string
  data_mode:     'pending' | 'failed' | 'processing'
  sort_order:    'asc' | 'desc'
  success_limit: string
}

const defaultForm = (sys: SystemRow): FormState => ({
  system_id:     sys.id,
  system_name:   sys.system_name,
  data_mode:     sys.data_mode     ?? 'pending',
  sort_order:    sys.sort_order    ?? 'asc',
  success_limit: sys.success_limit != null ? String(sys.success_limit) : '',
})

const dataModeOptions: { value: 'pending' | 'failed' | 'processing'; label: string; badge: string }[] = [
  { value: 'pending',    label: 'Pending',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'failed',     label: 'Failed',     badge: 'bg-red-50 text-red-700 border-red-200'             },
  { value: 'processing', label: 'Processing', badge: 'bg-amber-50 text-amber-700 border-amber-200'       },
]

const sortOptions: { value: 'asc' | 'desc'; label: string }[] = [
  { value: 'asc',  label: 'Oldest First (ASC)'  },
  { value: 'desc', label: 'Newest First (DESC)' },
]

export default function SettingsPage() {
  const [systems,  setSystems]  = useState<SystemRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState<FormState | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSystems = async () => {
    setLoading(true)
    const res  = await fetch('/api/settings')
    const data = await res.json()
    if (data.success) setSystems(data.systems)
    setLoading(false)
  }

  useEffect(() => { fetchSystems() }, [])

  const openEdit  = (sys: SystemRow) => setForm(defaultForm(sys))
  const closeModal = () => setForm(null)

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id:     form.system_id,
          data_mode:     form.data_mode,
          sort_order:    form.sort_order,
          success_limit: form.success_limit === '' ? null : Number(form.success_limit),
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Settings saved successfully')
        closeModal()
        fetchSystems()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (system_id: number, system_name: string) => {
    if (!confirm(`"${system_name}" ki settings reset karo?`)) return
    const res  = await fetch(`/api/settings?system_id=${system_id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('Settings reset to default')
      fetchSystems()
    }
  }

  const getDataModeBadge = (mode: string | null) => {
    const opt = dataModeOptions.find((o) => o.value === mode)
    if (!opt) return null
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${opt.badge}`}>
        {opt.label}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg">
          <MdCheckCircle size={16} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <MdSettings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-slate-800">Settings</h1>
          <p className="text-[11px] text-slate-400">Per-system data flow control</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">#</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">System</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Data Mode</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Sort Order</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Success Limit</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Last Updated</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : systems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">No systems found</td>
                </tr>
              ) : (
                systems.map((sys, i) => (
                  <tr key={sys.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MdDesktopWindows size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{sys.system_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {sys.setting_id
                        ? getDataModeBadge(sys.data_mode)
                        : <span className="text-slate-300 text-[11px]">Default (pending)</span>
                      }
                    </td>

                    <td className="px-4 py-3">
                      {sys.setting_id ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {sys.sort_order === 'desc' ? 'Newest First' : 'Oldest First'}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">Default (asc)</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {sys.setting_id
                        ? sys.success_limit != null
                          ? <span className="font-semibold text-slate-700">{sys.success_limit}</span>
                          : <span className="text-slate-400 text-[11px]">Unlimited</span>
                        : <span className="text-slate-300 text-[11px]">Unlimited</span>
                      }
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {sys.setting_updated_at
                        ? new Date(sys.setting_updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'
                      }
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(sys)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          {sys.setting_id ? <MdEdit size={12} /> : <MdAdd size={12} />}
                          {sys.setting_id ? 'Edit' : 'Set'}
                        </button>
                        {sys.setting_id && (
                          <button
                            onClick={() => handleDelete(sys.id, sys.system_name)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                          >
                            <MdDelete size={12} />
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md mx-4">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <MdDesktopWindows size={16} className="text-blue-600" />
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{form.system_name}</p>
                  <p className="text-[11px] text-slate-400">Configure data flow settings</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <MdClose size={18} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">

              {/* Data Mode */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Data Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {dataModeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => f ? { ...f, data_mode: opt.value } : f)}
                      className={`px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${
                        form.data_mode === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Sort Order
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => f ? { ...f, sort_order: opt.value } : f)}
                      className={`px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${
                        form.sort_order === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Success Limit */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Success Limit <span className="normal-case font-normal text-slate-400">(blank = unlimited)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  value={form.success_limit}
                  onChange={(e) => setForm((f) => f ? { ...f, success_limit: e.target.value } : f)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Is PC ko itne successful processes ke baad data dena band ho jayega
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <MdSave size={13} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}