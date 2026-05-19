// Path: app/login/page.tsx
'use client'

import { useState }      from 'react'
import { useRouter }     from 'next/navigation'
import {
  MdEmail,
  MdLock,
  MdLogin,
  MdError,
  MdSecurity,
  MdBlock,
} from 'react-icons/md'

export default function LoginPage(): React.JSX.Element {
  const router = useRouter()

  const [email,    setEmail]    = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading,  setLoading]  = useState<boolean>(false)
  const [error,    setError]    = useState<string>('')
  const [blocked,  setBlocked]  = useState<boolean>(false)

  const resetAlerts = (): void => {
    setError('')
    setBlocked(false)
  }

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    resetAlerts()

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.success) {
        router.push('/')
      } else if (data.error === 'ACCOUNT_BLOCKED') {
        // ✅ Blocked admin ke liye alag message
        setBlocked(true)
      } else {
        setError(data.error ?? 'Login failed')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="w-screen min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MdLogin size={28} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800 leading-snug">
            Phoenix Advanced Softwares Pvt. Ltd
          </h1>
          <p className="text-sm text-slate-500 mt-1">Campaigns Login System</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Form Body */}
          <div className="px-7 pt-7 pb-5 space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <MdEmail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); resetAlerts() }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
                  placeholder="admin@phoenixadvanced.com"
                  disabled={loading}
                  className="
                    w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5
                    text-sm text-slate-800 placeholder:text-slate-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:opacity-60 transition-shadow bg-white
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <MdLock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); resetAlerts() }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
                  placeholder="••••••••"
                  disabled={loading}
                  className="
                    w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5
                    text-sm text-slate-800 placeholder:text-slate-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:opacity-60 transition-shadow bg-white
                  "
                />
              </div>
            </div>

            {/* ✅ Blocked Alert */}
            {blocked && (
              <div className="flex flex-col gap-1.5 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <MdBlock size={16} className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">Account Blocked</p>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  You are blocked. Please contact your manager to restore access.
                </p>
              </div>
            )}

            {/* ✅ Invalid credentials / other errors */}
            {error && !blocked && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <MdError size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

          </div>

          {/* Security Badge */}
          <div className="border-t border-slate-100 px-7 py-3 flex items-center justify-center gap-1.5">
            <MdSecurity size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">Secured with 256-bit encryption</span>
          </div>

          {/* Sign In Button */}
          <div className="border-t border-slate-100 px-7 py-5">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="
                w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white text-sm font-medium py-2.5 rounded-lg
                transition-colors flex items-center justify-center gap-2 cursor-pointer
              "
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <MdLogin size={17} />
                  Sign In
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Phoenix Advanced Softwares Pvt. Ltd &copy; {new Date().getFullYear()}. All rights reserved.
        </p>

      </div>
    </main>
  )
}