'use client'

import { useState } from 'react'
import {
  MdHistory,
  MdLogin,
  MdLogout,
  MdEdit,
  MdAdd,
  MdDelete,
  MdFilterList,
  MdDownload,
  MdRefresh,
  MdPerson,
  MdSearch,
  MdAdminPanelSettings,
} from 'react-icons/md'

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionType = 'login' | 'logout' | 'create' | 'update' | 'delete'
type FilterAction = ActionType | 'all'

interface AdminLog {
  id:        number
  timestamp: string
  adminName: string
  adminId:   string
  role:      'super_admin' | 'admin'
  action:    ActionType
  module:    string        // e.g. "Campaign", "System", "User"
  details:   string        // human-readable description
  ip:        string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockLogs: AdminLog[] = [
  { id: 1,  timestamp: '09 May, 13:45:02', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'login',  module: 'Auth',     details: 'Logged in successfully',                    ip: '192.168.1.10' },
  { id: 2,  timestamp: '09 May, 13:46:30', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'create', module: 'Campaign',  details: 'Created "Campaign 6"',                      ip: '192.168.1.10' },
  { id: 3,  timestamp: '09 May, 13:50:14', adminName: 'Priya Verma',   adminId: 'ADM-002', role: 'admin',       action: 'login',  module: 'Auth',     details: 'Logged in successfully',                    ip: '10.0.0.22'    },
  { id: 4,  timestamp: '09 May, 13:52:44', adminName: 'Priya Verma',   adminId: 'ADM-002', role: 'admin',       action: 'update', module: 'System',   details: 'Updated System 3 config',                   ip: '10.0.0.22'    },
  { id: 5,  timestamp: '09 May, 14:01:08', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'update', module: 'Campaign',  details: 'Updated "Campaign 2" targets',              ip: '192.168.1.10' },
  { id: 6,  timestamp: '09 May, 14:05:55', adminName: 'Amit Joshi',    adminId: 'ADM-003', role: 'admin',       action: 'login',  module: 'Auth',     details: 'Logged in successfully',                    ip: '172.16.0.5'   },
  { id: 7,  timestamp: '09 May, 14:08:30', adminName: 'Amit Joshi',    adminId: 'ADM-003', role: 'admin',       action: 'create', module: 'Target',   details: 'Uploaded new CSV — 340 targets added',      ip: '172.16.0.5'   },
  { id: 8,  timestamp: '09 May, 14:15:00', adminName: 'Priya Verma',   adminId: 'ADM-002', role: 'admin',       action: 'delete', module: 'Campaign',  details: 'Deleted "Campaign Draft 1"',                ip: '10.0.0.22'    },
  { id: 9,  timestamp: '09 May, 14:18:22', adminName: 'Priya Verma',   adminId: 'ADM-002', role: 'admin',       action: 'logout', module: 'Auth',     details: 'Logged out',                                ip: '10.0.0.22'    },
  { id: 10, timestamp: '09 May, 14:22:40', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'create', module: 'Admin',    details: 'Created new admin "Sneha Kapoor"',          ip: '192.168.1.10' },
  { id: 11, timestamp: '09 May, 14:30:10', adminName: 'Sneha Kapoor',  adminId: 'ADM-004', role: 'admin',       action: 'login',  module: 'Auth',     details: 'First login after account creation',        ip: '10.10.1.8'    },
  { id: 12, timestamp: '09 May, 14:33:55', adminName: 'Amit Joshi',    adminId: 'ADM-003', role: 'admin',       action: 'update', module: 'Settings', details: 'Changed notification email',                ip: '172.16.0.5'   },
  { id: 13, timestamp: '09 May, 14:40:02', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'delete', module: 'System',   details: 'Removed System 6 from active pool',         ip: '192.168.1.10' },
  { id: 14, timestamp: '09 May, 14:45:18', adminName: 'Sneha Kapoor',  adminId: 'ADM-004', role: 'admin',       action: 'create', module: 'Job',      details: 'Created job for Campaign 4',                ip: '10.10.1.8'    },
  { id: 15, timestamp: '09 May, 14:50:30', adminName: 'Amit Joshi',    adminId: 'ADM-003', role: 'admin',       action: 'logout', module: 'Auth',     details: 'Logged out',                                ip: '172.16.0.5'   },
  { id: 16, timestamp: '09 May, 14:55:00', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'update', module: 'Admin',    details: 'Updated role of "Sneha Kapoor" to Admin',   ip: '192.168.1.10' },
  { id: 17, timestamp: '09 May, 15:02:44', adminName: 'Sneha Kapoor',  adminId: 'ADM-004', role: 'admin',       action: 'update', module: 'Campaign',  details: 'Updated "Campaign 5" schedule',             ip: '10.10.1.8'    },
  { id: 18, timestamp: '09 May, 15:10:05', adminName: 'Rahul Sharma',  adminId: 'ADM-001', role: 'super_admin', action: 'logout', module: 'Auth',     details: 'Logged out',                                ip: '192.168.1.10' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const actionMeta: Record<ActionType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  login:  { label: 'Login',  icon: <MdLogin  size={12} />, color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  logout: { label: 'Logout', icon: <MdLogout size={12} />, color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200'   },
  create: { label: 'Create', icon: <MdAdd    size={12} />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  update: { label: 'Update', icon: <MdEdit   size={12} />, color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  delete: { label: 'Delete', icon: <MdDelete size={12} />, color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
}

const roleBadge: Record<AdminLog['role'], string> = {
  super_admin: 'bg-blue-50 text-blue-700 border border-blue-200',
  admin:       'bg-slate-100 text-slate-500 border border-slate-200',
}
const roleLabel: Record<AdminLog['role'], string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
}

// unique admins for filter dropdown
const uniqueAdmins = Array.from(
  new Map(mockLogs.map(l => [l.adminId, { id: l.adminId, name: l.adminName }])).values()
)

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: ActionType }) {
  const m = actionMeta[action]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.color} ${m.bg} ${m.border}`}>
      {m.icon} {m.label}
    </span>
  )
}

// ─── Stat Card counts ─────────────────────────────────────────────────────────

const filterCards: { key: FilterAction; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { key: 'all',    label: 'All',    color: 'text-slate-700',   bg: 'bg-slate-100',  icon: <MdHistory size={16} />             },
  { key: 'login',  label: 'Login',  color: 'text-blue-700',    bg: 'bg-blue-100',   icon: <MdLogin   size={16} />             },
  { key: 'logout', label: 'Logout', color: 'text-slate-600',   bg: 'bg-slate-200',  icon: <MdLogout  size={16} />             },
  { key: 'create', label: 'Create', color: 'text-emerald-700', bg: 'bg-emerald-100',icon: <MdAdd     size={16} />             },
  { key: 'update', label: 'Update', color: 'text-amber-700',   bg: 'bg-amber-100',  icon: <MdEdit    size={16} />             },
  { key: 'delete', label: 'Delete', color: 'text-red-700',     bg: 'bg-red-100',    icon: <MdDelete  size={16} />             },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminsActivityPage(): React.JSX.Element {
  const [actionFilter, setActionFilter] = useState<FilterAction>('all')
  const [adminFilter,  setAdminFilter]  = useState<string>('all')
  const [search,       setSearch]       = useState<string>('')

  const filtered = mockLogs.filter(log => {
    const matchAction = actionFilter === 'all' || log.action === actionFilter
    const matchAdmin  = adminFilter  === 'all' || log.adminId === adminFilter
    const q           = search.toLowerCase()
    const matchSearch = !q ||
      log.adminName.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q)    ||
      log.details.toLowerCase().includes(q)   ||
      log.ip.includes(q)
    return matchAction && matchAdmin && matchSearch
  })

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Admins Activity</h1>
          <p className="text-sm text-slate-500 mt-0.5">Har admin ki activity ka complete record</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            <MdDownload size={16} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            <MdRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Action Filter Stat Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {filterCards.map(card => (
          <button
            key={card.key}
            onClick={() => setActionFilter(card.key)}
            className={`bg-white border rounded-lg p-3 text-left transition-all cursor-pointer ${
              actionFilter === card.key
                ? 'border-blue-500 ring-1 ring-blue-500'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-400">{card.label}</p>
              <div className={`w-6 h-6 rounded-md ${card.bg} flex items-center justify-center`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
            <p className={`text-xl font-semibold ${card.color}`}>
              {card.key === 'all'
                ? mockLogs.length
                : mockLogs.filter(l => l.action === card.key).length}
            </p>
          </button>
        ))}
      </div>

      {/* Search + Admin Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, module, details, IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
        </div>

        {/* Admin Dropdown */}
        <div className="relative">
          <MdAdminPanelSettings size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={adminFilter}
            onChange={e => setAdminFilter(e.target.value)}
            className="pl-8 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition appearance-none cursor-pointer"
          >
            <option value="all">All Admins</option>
            {uniqueAdmins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <MdFilterList size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-8">#</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-40">Timestamp</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Admin</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-24">Action</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-24">Module</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Details</th>
              <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-32">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 text-xs py-12">
                  Koi activity nahi mili — filter change karein
                </td>
              </tr>
            ) : (
              filtered.map((log, i) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    i < filtered.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  {/* # */}
                  <td className="px-4 py-3 text-xs text-slate-300">{log.id}</td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{log.timestamp}</td>

                  {/* Admin */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MdPerson size={13} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 leading-none">{log.adminName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400">{log.adminId}</span>
                          <span className={`text-[9px] font-medium px-1 py-0 rounded ${roleBadge[log.role]}`}>
                            {roleLabel[log.role]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3"><ActionBadge action={log.action} /></td>

                  {/* Module */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {log.module}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{log.details}</td>

                  {/* IP */}
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-400 text-right">
        {filtered.length} of {mockLogs.length} records
      </p>

    </div>
  )
}