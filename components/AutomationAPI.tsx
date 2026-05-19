'use client'

import { useState } from 'react'
import { MdContentCopy, MdCheckCircle } from 'react-icons/md'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
    >
      {copied ? <MdCheckCircle size={13} className="text-emerald-500" /> : <MdContentCopy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function ApiRunDocs() {
  return (
    <div className="max-w-3xl space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Documentation</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          System run trigger endpoints — GET and POST usage guide
        </p>
      </div>

      {/* ── 1. GET ── */}
      <div className="space-y-3">

        {/* Method + Title */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            GET
          </span>
          <span className="text-sm font-semibold text-slate-700">1. Trigger Run by System ID</span>
        </div>

        <p className="text-xs text-slate-500">
          Pass the system <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">id</code> as
          a query parameter in the URL to trigger a run for that specific system.
        </p>

        {/* Endpoint URL */}
        <div className="bg-slate-800 rounded-xl px-5 py-3.5 flex items-center justify-between">
          <code className="text-sm font-mono">
            <span className="text-emerald-400">http://localhost:3000/api/run?id=</span>
            <span className="text-amber-400">YOUR_SYSTEM_ID</span>
          </code>
          <CopyButton text="http://localhost:3000/api/run?id=YOUR_SYSTEM_ID" />
        </div>

        {/* Example block — distinct UI */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Example</span>
            </div>
            <CopyButton text="http://localhost:3000/api/run?id=3" />
          </div>
          <div className="bg-white px-5 py-3.5">
            <code className="text-sm font-mono text-slate-600">
              http://localhost:3000/api/run?id=<span className="text-blue-600 font-semibold">3</span>
            </code>
          </div>
        </div>

      </div>

      {/* ── 2. POST ── */}
      <div className="space-y-3">

        {/* Method + Title */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            POST
          </span>
          <span className="text-sm font-semibold text-slate-700">2. Trigger Run with Body</span>
        </div>

        <p className="text-xs text-slate-500">
          Send a JSON body with the <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">row_id</code>,
          run <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">status</code>, and
          the system <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">ip</code> to record the result.
        </p>

        {/* Endpoint URL */}
        <div className="bg-slate-800 rounded-xl px-5 py-3.5 flex items-center justify-between">
          <code className="text-sm font-mono text-emerald-400">
            http://localhost:3000/api/run
          </code>
          <CopyButton text="http://localhost:3000/api/run" />
        </div>

        {/* Request Body */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Request Body</p>
          <div className="relative bg-slate-800 rounded-xl px-5 py-4 group">
            <pre className="text-[13px] font-mono leading-relaxed whitespace-pre">
              <span className="text-slate-200">{"{\n"}</span>
              <span className="text-slate-400">{"  \"row_id\": "}</span><span className="text-amber-400">{"ROW_ID"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"status\": "}</span><span className="text-amber-400">{"\"success/failed\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"ip\": "}</span><span className="text-amber-400">{"\"YOUR_IP\""}</span><span className="text-slate-200">{"\n}"}</span>
            </pre>
            <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={'{\n  "row_id": ROW_ID,\n  "status": "success/failed",\n  "ip": "YOUR_IP"\n}'} />
            </div>
          </div>
        </div>

        {/* Example block — distinct UI */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Example</span>
            </div>
            <CopyButton text={'{\n  "row_id": 18,\n  "status": "success",\n  "ip": "192.168.1.5"\n}'} />
          </div>
          <div className="bg-white px-5 py-4">
            <pre className="text-[13px] font-mono leading-relaxed text-slate-600 whitespace-pre">
{`{
  "row_id": `}<span className="text-blue-600 font-semibold">18</span>{`,
  "status": `}<span className="text-emerald-600 font-semibold">"success"</span>{`,
  "ip": `}<span className="text-blue-600 font-semibold">"192.168.1.5"</span>{`
}`}
            </pre>
          </div>
        </div>

      </div>

    </div>
  )
}