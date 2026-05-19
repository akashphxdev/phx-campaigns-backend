// Path: components/Topbar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter }       from 'next/navigation'
import { MdSearch, MdPerson }           from 'react-icons/md'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/':                { title: 'Dashboard',       subtitle: "Welcome back, here's what's happening"  },
  '/campaigns':       { title: 'Campaigns',       subtitle: 'Manage and monitor your campaigns'      },
  '/targets':         { title: 'Targets',         subtitle: 'View and manage target lists'           },
  '/csv-upload':      { title: 'CSV Upload',      subtitle: 'Import data via CSV files'              },
  '/images':          { title: 'Images',          subtitle: 'Manage campaign image assets'           },
  '/jobs':            { title: 'Jobs',            subtitle: 'Monitor background job queues'          },
  '/systems':         { title: 'Systems',         subtitle: 'Connected systems and integrations'     },
  '/system-logs':     { title: 'System Logs',     subtitle: 'Real-time system activity logs'        },
  '/reports':         { title: 'Reports',         subtitle: 'Analytics and performance reports'      },
  '/admins':          { title: 'Admins',          subtitle: 'Manage admin accounts and permissions'  },
  '/admins-activity': { title: 'Admins Activity', subtitle: 'Track admin actions and audit trail'   },
  '/settings':        { title: 'Settings',        subtitle: 'System configuration and preferences'  },
  '/documentation':   { title: 'Documentation',   subtitle: 'Guides, API docs and references'       },
}

interface SearchResult {
  href:     string
  title:    string
  subtitle: string
}

interface UserInfo {
  id:    number
  name:  string
  email: string
  role:  string
}

const allPages: SearchResult[] = Object.entries(pageTitles).map(([href, { title, subtitle }]) => ({
  href,
  title,
  subtitle,
}))

// ✅ Role display label
const roleLabel: Record<string, string> = {
  superadmin:   'Super Admin',
  datauploader: 'Data Uploader',
  viewer:       'Viewer',
}

export default function Topbar(): React.JSX.Element {
  const path   = usePathname()
  const router = useRouter()
  const page   = pageTitles[path] ?? { title: 'Campaigns Managment', subtitle: 'Phoenix Advanced Softwares Pvt. Ltd' }

  const [query,   setQuery]   = useState<string>('')
  const [open,    setOpen]    = useState<boolean>(false)
  const [focused, setFocused] = useState<number>(-1)

  // ✅ Dynamic user state
  const [user, setUser] = useState<UserInfo | null>(null)

  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ✅ API se user fetch karo
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day:     '2-digit',
    month:   'short',
    year:    'numeric',
  })

  const results: SearchResult[] = query.trim().length === 0
    ? []
    : allPages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
        setQuery('')
        setFocused(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!open || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocused((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocused((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && focused >= 0) {
      navigate(results[focused].href)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setFocused(-1)
    }
  }

  const navigate = (href: string): void => {
    router.push(href)
    setOpen(false)
    setQuery('')
    setFocused(-1)
    inputRef.current?.blur()
  }

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 z-40">

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-slate-800 leading-none truncate">
          {page.title}
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
          {page.subtitle}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Date */}
        <span className="hidden sm:block text-[11px] text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
          {today}
        </span>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 w-48 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            <MdSearch size={15} className="text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search pages..."
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setFocused(-1) }}
              onFocus={() => { if (query.trim()) setOpen(true) }}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setOpen(false); setFocused(-1) }}
                className="text-slate-300 hover:text-slate-500 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && query.trim().length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-lg overflow-hidden z-50"
            >
              {results.length > 0 ? (
                results.map((r, i) => (
                  <button
                    key={r.href}
                    onClick={() => navigate(r.href)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                      i === focused ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <MdSearch size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className={`text-[13px] font-medium truncate ${i === focused ? 'text-blue-700' : 'text-slate-700'}`}>
                        {r.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{r.subtitle}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-[13px] text-slate-400">No pages found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* ✅ Dynamic Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MdPerson size={15} className="text-blue-600" />
          </div>
          <div className="hidden sm:block">
            {user ? (
              <>
                <p className="text-[12px] font-semibold text-slate-800 leading-none">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {roleLabel[user.role] ?? user.role}
                </p>
              </>
            ) : (
              // Loading skeleton
              <>
                <div className="h-2.5 w-20 bg-slate-200 rounded animate-pulse mb-1" />
                <div className="h-2 w-14 bg-slate-200 rounded animate-pulse" />
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}