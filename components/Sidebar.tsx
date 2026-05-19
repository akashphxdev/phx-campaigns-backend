// // Path: components/Sidebar.tsx
// 'use client'

// import Link                    from 'next/link'
// import { usePathname, useRouter } from 'next/navigation'
// import { useEffect, useState } from 'react'
// import {
//   MdDashboard,
//   MdCampaign,
//   MdUploadFile,
//   MdImage,
//   MdComputer,
//   MdMonitor,
//   MdAdminPanelSettings,
//   MdHistory,
//   MdSettings,
//   MdMenuBook,
//   MdLogout,
//   MdPerson,
//   MdRocketLaunch,
//   MdDesktopWindows,
// } from 'react-icons/md'

// interface NavLink {
//   href:  string
//   label: string
//   icon:  React.ReactNode
//   roles: string[]   // which roles can see this link
// }

// interface UserInfo {
//   id:    number
//   name:  string
//   email: string
//   role:  string
// }

// const links: NavLink[] = [
//   { href: '/',                label: 'Dashboard',       icon: <MdDashboard          size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/live-pcs',        label: 'Live PCs',        icon: <MdDesktopWindows     size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/campaigns',       label: 'Campaigns',       icon: <MdCampaign           size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/csv-upload',      label: 'CSV Upload',      icon: <MdUploadFile         size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/images',          label: 'Images',          icon: <MdImage              size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/systems',         label: 'Systems',         icon: <MdComputer           size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/system-logs',     label: 'System Logs',     icon: <MdMonitor            size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
//   { href: '/admins',          label: 'Admins',          icon: <MdAdminPanelSettings size={18} />, roles: ['superadmin'] },
//   { href: '/admins-activity', label: 'Admins Activity', icon: <MdHistory            size={18} />, roles: ['superadmin'] },
//   { href: '/settings',        label: 'Settings',        icon: <MdSettings           size={18} />, roles: ['superadmin'] },
//   { href: '/automation-api',  label: 'Automation APIs', icon: <MdMenuBook           size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
// ]

// const roleLabel: Record<string, string> = {
//   superadmin:   'Super Admin',
//   datauploader: 'Data Uploader',
//   viewer:       'Viewer',
// }

// const roleBadgeClass: Record<string, string> = {
//   superadmin:   'bg-blue-50 text-blue-700 border border-blue-200',
//   datauploader: 'bg-green-50 text-green-700 border border-green-200',
//   viewer:       'bg-slate-100 text-slate-600 border border-slate-200',
// }

// export default function Sidebar(): React.JSX.Element {
//   const path   = usePathname()
//   const router = useRouter()

//   const [user, setUser] = useState<UserInfo | null>(null)

//   useEffect(() => {
//     fetch('/api/auth/me')
//       .then((r) => r.json())
//       .then((data) => {
//         if (data.success) setUser(data.user)
//       })
//       .catch(() => {})
//   }, [])

//   const handleLogout = async (): Promise<void> => {
//     try {
//       await fetch('/api/auth/logout', { method: 'POST' })
//     } catch {
//       // ignore
//     }
//     document.cookie = 'auth_token=; Max-Age=0; path=/'
//     router.push('/login')
//   }

//   // Filter links based on user role
//   const visibleLinks = links.filter(l =>
//     !user || l.roles.includes(user.role)
//   )

//   return (
//     <aside className="fixed left-0 top-0 w-60 h-screen bg-white border-r border-slate-200 flex flex-col z-50">

//       {/* Brand */}
//       <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-slate-200">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
//             <MdRocketLaunch size={18} className="text-white" />
//           </div>
//           <div className="min-w-0">
//             <p className="text-[11.5px] font-semibold text-slate-800 leading-tight">
//               Phoenix Advanced
//             </p>
//             <p className="text-[11.5px] font-semibold text-slate-800 leading-tight">
//               Softwares Pvt. Ltd
//             </p>
//             <p className="text-[10px] text-slate-400 mt-0.5">Campaigns System</p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 min-h-0 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
//         {visibleLinks.map((l: NavLink) => {
//           const active: boolean = path === l.href
//           return (
//             <Link
//               key={l.href}
//               href={l.href}
//               className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
//                 active
//                   ? 'bg-blue-50 text-blue-700'
//                   : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
//               }`}
//             >
//               <span className={`flex-shrink-0 transition-colors ${
//                 active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
//               }`}>
//                 {l.icon}
//               </span>
//               {l.label}
//               {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
//             </Link>
//           )
//         })}
//       </nav>

//       {/* User + Logout */}
//       <div className="flex-shrink-0 px-3 py-3 border-t border-slate-200 flex flex-col gap-1.5">

//         <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
//           <div className="flex items-center gap-2.5">
//             <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
//               <MdPerson size={15} className="text-blue-600" />
//             </div>
//             <div className="min-w-0">
//               {user ? (
//                 <>
//                   <p className="text-slate-800 text-[12px] font-semibold truncate leading-none">
//                     {user.name}
//                   </p>
//                   <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide ${
//                     roleBadgeClass[user.role] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
//                   }`}>
//                     {roleLabel[user.role] ?? user.role}
//                   </span>
//                 </>
//               ) : (
//                 <>
//                   <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-1.5" />
//                   <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         <button
//           onClick={handleLogout}
//           className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 cursor-pointer hover:text-red-600 hover:bg-red-50 transition-all duration-150"
//         >
//           <MdLogout size={16} className="flex-shrink-0" />
//           Logout
//         </button>

//       </div>
//     </aside>
//   )
// }



// Path: components/Sidebar.tsx
'use client'

import Link                    from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MdDashboard,
  MdCampaign,
  MdUploadFile,
  MdImage,
  MdComputer,
  MdMonitor,
  MdAdminPanelSettings,
  MdHistory,
  MdSettings,
  MdMenuBook,
  MdLogout,
  MdPerson,
  MdRocketLaunch,
  MdDesktopWindows,
  MdAssessment,
} from 'react-icons/md'

interface NavLink {
  href:  string
  label: string
  icon:  React.ReactNode
  roles: string[]
}

interface UserInfo {
  id:    number
  name:  string
  email: string
  role:  string
}

const links: NavLink[] = [
  { href: '/',                label: 'Dashboard',       icon: <MdDashboard          size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/live-pcs',        label: 'Live PCs',        icon: <MdDesktopWindows     size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/campaigns',       label: 'Campaigns',       icon: <MdCampaign           size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/csv-upload',      label: 'CSV Upload',      icon: <MdUploadFile         size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/images',          label: 'Images',          icon: <MdImage              size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/systems',         label: 'Systems',         icon: <MdComputer           size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/system-logs',     label: 'System Logs',     icon: <MdMonitor            size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
  { href: '/admins',          label: 'Admins',          icon: <MdAdminPanelSettings size={18} />, roles: ['superadmin'] },
  { href: '/admins-activity', label: 'Admins Activity', icon: <MdHistory            size={18} />, roles: ['superadmin'] },
  { href: '/settings',        label: 'Settings',        icon: <MdSettings           size={18} />, roles: ['superadmin'] },
  { href: '/reports',         label: 'Reports',         icon: <MdAssessment         size={18} />, roles: ['superadmin'] },
  { href: '/automation-api',  label: 'Automation APIs', icon: <MdMenuBook           size={18} />, roles: ['superadmin', 'datauploader', 'viewer'] },
]

const roleLabel: Record<string, string> = {
  superadmin:   'Super Admin',
  datauploader: 'Data Uploader',
  viewer:       'Viewer',
}

const roleBadgeClass: Record<string, string> = {
  superadmin:   'bg-blue-50 text-blue-700 border border-blue-200',
  datauploader: 'bg-green-50 text-green-700 border border-green-200',
  viewer:       'bg-slate-100 text-slate-600 border border-slate-200',
}

export default function Sidebar(): React.JSX.Element {
  const path   = usePathname()
  const router = useRouter()

  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    document.cookie = 'auth_token=; Max-Age=0; path=/'
    router.push('/login')
  }

  const visibleLinks = links.filter(l =>
    !user || l.roles.includes(user.role)
  )

  return (
    <aside className="fixed left-0 top-0 w-60 h-screen bg-white border-r border-slate-200 flex flex-col z-50">

      {/* Brand */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <MdRocketLaunch size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11.5px] font-semibold text-slate-800 leading-tight">
              Phoenix Advanced
            </p>
            <p className="text-[11.5px] font-semibold text-slate-800 leading-tight">
              Softwares Pvt. Ltd
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Campaigns System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {visibleLinks.map((l: NavLink) => {
          const active: boolean = path === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className={`flex-shrink-0 transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                {l.icon}
              </span>
              {l.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-slate-200 flex flex-col gap-1.5">

        <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MdPerson size={15} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              {user ? (
                <>
                  <p className="text-slate-800 text-[12px] font-semibold truncate leading-none">
                    {user.name}
                  </p>
                  <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide ${
                    roleBadgeClass[user.role] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {roleLabel[user.role] ?? user.role}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-1.5" />
                  <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 cursor-pointer hover:text-red-600 hover:bg-red-50 transition-all duration-150"
        >
          <MdLogout size={16} className="flex-shrink-0" />
          Logout
        </button>

      </div>
    </aside>
  )
}