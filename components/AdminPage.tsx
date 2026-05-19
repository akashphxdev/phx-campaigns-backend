// Path: app/admins/page.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MdPersonAdd, MdAdd, MdClose, MdCheckCircle, MdError,
  MdPerson, MdInbox, MdShield, MdPeople, MdSupervisorAccount,
  MdUploadFile, MdSearch, MdEdit, MdDelete,
} from 'react-icons/md'

interface Admin {
  id:         number
  name:       string
  email:      string
  role:       'superadmin' | 'datauploader' | 'viewer'
  is_active:  boolean
  created_at: string
}

interface AdminForm {
  name:     string
  email:    string
  role:     string
  password: string
}

const roleBadge: Record<string, string> = {
  superadmin:   'bg-purple-50 text-purple-700 border border-purple-200',
  datauploader: 'bg-blue-50   text-blue-700   border border-blue-200',
  viewer:       'bg-slate-100 text-slate-600  border border-slate-200',
}
const roleLabel: Record<string, string> = {
  superadmin:   'Super Admin',
  datauploader: 'Data Uploader',
  viewer:       'Viewer',
}
const roleAvatar: Record<string, string> = {
  superadmin:   'bg-purple-100',
  datauploader: 'bg-blue-100',
  viewer:       'bg-slate-100',
}
const roleAvatarIcon: Record<string, string> = {
  superadmin:   'text-purple-600',
  datauploader: 'text-blue-600',
  viewer:       'text-slate-500',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const initialForm: AdminForm = { name: '', email: '', role: 'viewer', password: '' }

const inputCls = `
  w-full border border-slate-200 rounded-lg px-3.5 py-2.5
  text-sm text-slate-800 placeholder:text-slate-300
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  disabled:opacity-60 transition-shadow bg-white
`

export default function AdminsPage(): React.JSX.Element {
  const [admins,      setAdmins]      = useState<Admin[]>([])
  const [fetching,    setFetching]    = useState<boolean>(true)
  const [fetchErr,    setFetchErr]    = useState<string>('')
  const [search,      setSearch]      = useState<string>('')

  // Create modal
  const [createOpen,  setCreateOpen]  = useState<boolean>(false)
  const [form,        setForm]        = useState<AdminForm>(initialForm)
  const [saving,      setSaving]      = useState<boolean>(false)
  const [saveErr,     setSaveErr]     = useState<string>('')
  const [saveOk,      setSaveOk]      = useState<boolean>(false)
  const firstInputRef                 = useRef<HTMLInputElement>(null)

  // Edit modal
  const [editAdmin,   setEditAdmin]   = useState<Admin | null>(null)
  const [editForm,    setEditForm]    = useState<AdminForm>(initialForm)
  const [editSaving,  setEditSaving]  = useState<boolean>(false)
  const [editErr,     setEditErr]     = useState<string>('')
  const [editOk,      setEditOk]      = useState<boolean>(false)

  // Delete confirm
  const [deleteAdmin, setDeleteAdmin] = useState<Admin | null>(null)
  const [deleting,    setDeleting]    = useState<boolean>(false)
  const [deleteErr,   setDeleteErr]   = useState<string>('')

  // Toggle active
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAdmins = useCallback(async (): Promise<void> => {
    setFetching(true)
    setFetchErr('')
    try {
      const res  = await fetch('/api/admins')
      const data = await res.json() as { success: boolean; admins: Admin[]; error?: string }
      if (data.success) setAdmins(data.admins)
      else              setFetchErr(data.error ?? 'Failed to load admins')
    } catch {
      setFetchErr('Could not connect to server')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => { void fetchAdmins() }, [fetchAdmins])

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      if (createOpen  && !saving)      setCreateOpen(false)
      if (editAdmin   && !editSaving)  setEditAdmin(null)
      if (deleteAdmin && !deleting)    setDeleteAdmin(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [createOpen, editAdmin, deleteAdmin, saving, editSaving, deleting])

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = (): void => {
    setForm(initialForm)
    setSaveErr('')
    setSaveOk(false)
    setCreateOpen(true)
    setTimeout(() => firstInputRef.current?.focus(), 80)
  }

  const handleCreate = async (): Promise<void> => {
    if (!form.name.trim())     { setSaveErr('Name is required');     return }
    if (!form.email.trim())    { setSaveErr('Email is required');    return }
    if (!form.password.trim()) { setSaveErr('Password is required'); return }
    setSaving(true)
    setSaveErr('')
    setSaveOk(false)
    try {
      const res  = await fetch('/api/admins', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json() as { success: boolean; admin: Admin; error?: string }
      if (data.success) {
        setAdmins(prev => [data.admin, ...prev])
        setSaveOk(true)
        setForm(initialForm)
        setTimeout(() => setCreateOpen(false), 1200)
      } else {
        setSaveErr(data.error ?? 'Something went wrong')
      }
    } catch {
      setSaveErr('Could not connect to server')
    } finally {
      setSaving(false)
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (a: Admin): void => {
    setEditAdmin(a)
    setEditForm({ name: a.name, email: a.email, role: a.role, password: '' })
    setEditErr('')
    setEditOk(false)
  }

  const handleEdit = async (): Promise<void> => {
    if (!editAdmin) return
    if (!editForm.name.trim())  { setEditErr('Name is required');  return }
    if (!editForm.email.trim()) { setEditErr('Email is required'); return }
    setEditSaving(true)
    setEditErr('')
    setEditOk(false)
    try {
      const res  = await fetch(`/api/admins/${editAdmin.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:  editForm.name,
          email: editForm.email,
          role:  editForm.role,
          ...(editForm.password.trim() ? { password: editForm.password } : {}),
        }),
      })
      const data = await res.json() as { success: boolean; admin: Admin; error?: string }
      if (data.success) {
        setAdmins(prev => prev.map(a => a.id === editAdmin.id ? data.admin : a))
        setEditOk(true)
        setTimeout(() => setEditAdmin(null), 1200)
      } else {
        setEditErr(data.error ?? 'Something went wrong')
      }
    } catch {
      setEditErr('Could not connect to server')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (): Promise<void> => {
    if (!deleteAdmin) return
    setDeleting(true)
    setDeleteErr('')
    try {
      const res  = await fetch(`/api/admins/${deleteAdmin.id}`, { method: 'DELETE' })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setAdmins(prev => prev.filter(a => a.id !== deleteAdmin.id))
        setDeleteAdmin(null)
      } else {
        setDeleteErr(data.error ?? 'Failed to delete')
      }
    } catch {
      setDeleteErr('Could not connect to server')
    } finally {
      setDeleting(false)
    }
  }

  // ── Toggle Active ─────────────────────────────────────────────────────────
  const handleToggleActive = useCallback(async (a: Admin): Promise<void> => {
    setTogglingIds(prev => new Set(prev).add(a.id))
    try {
      const res  = await fetch(`/api/admins/${a.id}/toggle-active`, { method: 'PATCH' })
      const data = await res.json() as { success: boolean; is_active: boolean }
      if (data.success) {
        setAdmins(prev =>
          prev.map(x => x.id === a.id ? { ...x, is_active: data.is_active } : x)
        )
      }
    } catch { /* silent */ } finally {
      setTogglingIds(prev => {
        const s = new Set(prev)
        s.delete(a.id)
        return s
      })
    }
  }, [])

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())  ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    roleLabel[a.role].toLowerCase().includes(search.toLowerCase())
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Admins</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage admin accounts and their roles</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <MdAdd size={18} /> Add Admin
        </button>
      </div>

      {/* Stats */}
      {!fetching && !fetchErr && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Total Admins',
              value: admins.length,
              icon:  <MdPeople            size={20} className="text-blue-600"   />,
              bg:    'bg-blue-50',
              val:   'text-blue-700',
            },
            {
              label: 'Super Admins',
              value: admins.filter(a => a.role === 'superadmin').length,
              icon:  <MdSupervisorAccount size={20} className="text-purple-600" />,
              bg:    'bg-purple-50',
              val:   'text-purple-700',
            },
            {
              label: 'Data Uploaders',
              value: admins.filter(a => a.role === 'datauploader').length,
              icon:  <MdUploadFile        size={20} className="text-sky-600"    />,
              bg:    'bg-sky-50',
              val:   'text-sky-700',
            },
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

      {/* Table Card */}
      <div className="bg-white rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Admin List</h2>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 w-52">
            <MdSearch size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search admins..."
              className="bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 outline-none w-full"
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

        {/* Body */}
        {fetching ? (
          <div className="py-16 text-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading admins...</p>
          </div>
        ) : fetchErr ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MdError size={20} className="text-red-400" />
            </div>
            <p className="text-sm text-red-500">{fetchErr}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MdInbox size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">
              {search ? `No admins found for "${search}"` : 'No admins yet'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a, i) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">

                  {/* # */}
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{i + 1}</td>

                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${roleAvatar[a.role]} flex items-center justify-center flex-shrink-0`}>
                        <MdPerson size={15} className={roleAvatarIcon[a.role]} />
                      </div>
                      <span className="text-[13px] font-medium text-slate-800">{a.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-[13px] text-slate-500">{a.email}</td>

                  {/* Role */}
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${roleBadge[a.role]}`}>
                      {roleLabel[a.role]}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => void handleToggleActive(a)}
                      disabled={togglingIds.has(a.id)}
                      className="flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      title={a.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${a.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${a.is_active ? 'left-[18px]' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-[12px] font-medium ${a.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {togglingIds.has(a.id) ? '...' : a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{formatDate(a.created_at)}</td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(a)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit admin"
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => { setDeleteErr(''); setDeleteAdmin(a) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete admin"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        {!fetching && !fetchErr && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-[12px] text-slate-400">
              Showing{' '}
              <span className="font-medium text-slate-600">{filtered.length}</span>
              {' '}of{' '}
              <span className="font-medium text-slate-600">{admins.length}</span>
              {' '}admins
            </p>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ──────────────────────────────────────────────────── */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget && !saving) setCreateOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MdPersonAdd size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-800 leading-none">Create New Admin</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={() => { if (!saving) setCreateOpen(false) }}
                disabled={saving}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <MdClose size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {saveOk ? (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                    <MdCheckCircle size={26} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-slate-800">Admin Created!</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">Closing automatically...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={firstInputRef}
                      type="text"
                      value={form.name}
                      onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setSaveErr('') }}
                      placeholder="John Doe"
                      maxLength={100}
                      disabled={saving}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setSaveErr('') }}
                      placeholder="john@phoenixadvanced.com"
                      maxLength={150}
                      disabled={saving}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Role <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MdShield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <select
                        value={form.role}
                        onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                        disabled={saving}
                        className={`${inputCls} pl-9 appearance-none cursor-pointer`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="datauploader">Data Uploader</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setSaveErr('') }}
                      placeholder="Min 6 characters"
                      disabled={saving}
                      className={inputCls}
                    />
                  </div>
                  {saveErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <MdError size={14} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600">{saveErr}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!saveOk && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => { if (!saving) setCreateOpen(false) }}
                  disabled={saving}
                  className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreate()}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  {saving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                    : <><MdAdd size={16} />Create Admin</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      {editAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget && !editSaving) setEditAdmin(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <MdEdit size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-800 leading-none">Edit Admin</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Editing: {editAdmin.name}</p>
                </div>
              </div>
              <button
                onClick={() => { if (!editSaving) setEditAdmin(null) }}
                disabled={editSaving}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <MdClose size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {editOk ? (
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                    <MdCheckCircle size={26} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-slate-800">Admin Updated!</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">Closing automatically...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => { setEditForm(p => ({ ...p, name: e.target.value })); setEditErr('') }}
                      placeholder="John Doe"
                      maxLength={100}
                      disabled={editSaving}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => { setEditForm(p => ({ ...p, email: e.target.value })); setEditErr('') }}
                      placeholder="john@phoenixadvanced.com"
                      maxLength={150}
                      disabled={editSaving}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Role <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MdShield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                        disabled={editSaving}
                        className={`${inputCls} pl-9 appearance-none cursor-pointer`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="datauploader">Data Uploader</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      New Password
                      <span className="ml-1.5 text-[10px] font-normal text-slate-400">(leave blank to keep current)</span>
                    </label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={e => { setEditForm(p => ({ ...p, password: e.target.value })); setEditErr('') }}
                      placeholder="Leave blank to keep current"
                      disabled={editSaving}
                      className={inputCls}
                    />
                  </div>
                  {editErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <MdError size={14} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600">{editErr}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!editOk && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => { if (!editSaving) setEditAdmin(null) }}
                  disabled={editSaving}
                  className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleEdit()}
                  disabled={editSaving}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  {editSaving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                    : <><MdEdit size={16} />Save Changes</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ──────────────────────────────────────────────────── */}
      {deleteAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget && !deleting) setDeleteAdmin(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdDelete size={24} className="text-red-500" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-800">Delete Admin?</h3>
              <p className="text-[13px] text-slate-500 mt-1.5">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-700">{deleteAdmin.name}</span>?
                {' '}This action cannot be undone.
              </p>
              {deleteErr && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mt-3 text-left">
                  <MdError size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{deleteErr}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => { if (!deleting) setDeleteAdmin(null) }}
                disabled={deleting}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                {deleting
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                  : <><MdDelete size={16} />Yes, Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}