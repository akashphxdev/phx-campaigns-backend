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
        <h1 className="text-xl font-semibold text-slate-800">API Documentation</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          System run trigger endpoints — GET and POST usage guide
        </p>
      </div>

      {/* ── 1. GET ── */}
      <div className="space-y-3">

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            GET
          </span>
          <span className="text-sm font-semibold text-slate-700">1. Trigger Run by System ID</span>
        </div>

        <p className="text-xs text-slate-500">
          Pass the system <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">id</code> as
          a query parameter to trigger a run. The response includes the next pending CSV row data.
          If the campaign has a pending image, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">image_id</code> and{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">image_path</code> will
          be returned — otherwise both will be <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">null</code>.
        </p>

        {/* Endpoint URL */}
        <div className="bg-slate-800 rounded-xl px-5 py-3.5 flex items-center justify-between">
          <code className="text-sm font-mono">
            <span className="text-emerald-400">http://localhost:3000/api/run?id=</span>
            <span className="text-amber-400">YOUR_SYSTEM_ID</span>
          </code>
          <CopyButton text="http://localhost:3000/api/run?id=YOUR_SYSTEM_ID" />
        </div>

        {/* Example Request */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Example Request</span>
            </div>
            <CopyButton text="http://localhost:3000/api/run?id=3" />
          </div>
          <div className="bg-white px-5 py-3.5">
            <code className="text-sm font-mono text-slate-600">
              http://localhost:3000/api/run?id=<span className="text-blue-600 font-semibold">3</span>
            </code>
          </div>
        </div>

        {/* GET Response — with image */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Response</p>

          <p className="text-[11px] text-slate-400 mb-1.5">
            ✅ With image — campaign had a pending image
          </p>
          <div className="relative bg-slate-800 rounded-xl px-5 py-4 mb-3 group">
            <pre className="text-[13px] font-mono leading-relaxed whitespace-pre">
              <span className="text-slate-200">{"{\n"}</span>
              <span className="text-slate-400">{"  \"row_id\": "}</span><span className="text-amber-400">{"42"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"row_number\": "}</span><span className="text-amber-400">{"7"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"campaign_id\": "}</span><span className="text-amber-400">{"2"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"campaign\": "}</span><span className="text-emerald-400">{"\"My Campaign\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"filename\": "}</span><span className="text-emerald-400">{"\"leads.csv\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-blue-300">{"  \"image_id\": "}</span><span className="text-amber-400">{"15"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-blue-300">{"  \"image_path\": "}</span><span className="text-emerald-400">{"\"https://yourdomain.com/uploads/img.jpg\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"...csv fields\": \"...rest of the row data\""}</span><span className="text-slate-200">{"\n}"}</span>
            </pre>
            <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={'{\n  "row_id": 42,\n  "row_number": 7,\n  "campaign_id": 2,\n  "campaign": "My Campaign",\n  "filename": "leads.csv",\n  "image_id": 15,\n  "image_path": "https://yourdomain.com/uploads/img.jpg"\n}'} />
            </div>
          </div>

          {/* GET Response — without image */}
          <p className="text-[11px] text-slate-400 mb-1.5">
            ⚪ Without image — no pending image found in campaign
          </p>
          <div className="relative bg-slate-800 rounded-xl px-5 py-4 group">
            <pre className="text-[13px] font-mono leading-relaxed whitespace-pre">
              <span className="text-slate-200">{"{\n"}</span>
              <span className="text-slate-400">{"  \"row_id\": "}</span><span className="text-amber-400">{"42"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"row_number\": "}</span><span className="text-amber-400">{"7"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"campaign_id\": "}</span><span className="text-amber-400">{"2"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"campaign\": "}</span><span className="text-emerald-400">{"\"My Campaign\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"filename\": "}</span><span className="text-emerald-400">{"\"leads.csv\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-blue-300">{"  \"image_id\": "}</span><span className="text-slate-500">{"null"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-blue-300">{"  \"image_path\": "}</span><span className="text-slate-500">{"null"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"...csv fields\": \"...rest of the row data\""}</span><span className="text-slate-200">{"\n}"}</span>
            </pre>
            <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={'{\n  "row_id": 42,\n  "row_number": 7,\n  "campaign_id": 2,\n  "campaign": "My Campaign",\n  "filename": "leads.csv",\n  "image_id": null,\n  "image_path": null\n}'} />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold text-blue-700 mb-1">💡 Note — Image handling</p>
          <p className="text-[11px] text-blue-600 leading-relaxed">
            Always check <code className="bg-blue-100 px-1 rounded font-mono">image_id</code> before using the image.
            If it is <code className="bg-blue-100 px-1 rounded font-mono">null</code>, no image was assigned for this run.
            If an image is returned, save the <code className="bg-blue-100 px-1 rounded font-mono">image_id</code> — you will need
            to pass it back in the POST request to mark it as success or failed.
          </p>
        </div>

      </div>

      {/* ── 2. POST ── */}
      <div className="space-y-3">

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            POST
          </span>
          <span className="text-sm font-semibold text-slate-700">2. Submit Run Result</span>
        </div>

        <p className="text-xs text-slate-500">
          After processing the data received from GET, send the result back using POST.
          Include <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">row_id</code>,{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">status</code>, and optionally{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">ip</code>.
          If GET returned an <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">image_id</code>,
          pass it here as well so the image status gets updated.
        </p>

        {/* Endpoint URL */}
        <div className="bg-slate-800 rounded-xl px-5 py-3.5 flex items-center justify-between">
          <code className="text-sm font-mono text-emerald-400">
            http://localhost:3000/api/run
          </code>
          <CopyButton text="http://localhost:3000/api/run" />
        </div>

        {/* Fields table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Request Fields</span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Field</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Type</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Required</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 font-mono text-blue-600">row_id</td>
                <td className="px-4 py-2.5 text-slate-500">number</td>
                <td className="px-4 py-2.5"><span className="text-red-500 font-semibold">Yes</span></td>
                <td className="px-4 py-2.5 text-slate-500">The <code className="bg-slate-100 px-1 rounded">row_id</code> received from GET response</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-blue-600">status</td>
                <td className="px-4 py-2.5 text-slate-500">string</td>
                <td className="px-4 py-2.5"><span className="text-red-500 font-semibold">Yes</span></td>
                <td className="px-4 py-2.5 text-slate-500"><code className="bg-slate-100 px-1 rounded">"success"</code> or <code className="bg-slate-100 px-1 rounded">"failed"</code></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-blue-600">image_id</td>
                <td className="px-4 py-2.5 text-slate-500">number</td>
                <td className="px-4 py-2.5"><span className="text-slate-400 font-semibold">No</span></td>
                <td className="px-4 py-2.5 text-slate-500">Pass the <code className="bg-slate-100 px-1 rounded">image_id</code> from GET response if an image was returned</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-blue-600">ip</td>
                <td className="px-4 py-2.5 text-slate-500">string</td>
                <td className="px-4 py-2.5"><span className="text-slate-400 font-semibold">No</span></td>
                <td className="px-4 py-2.5 text-slate-500">IP address of the machine processing the run</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Request Body */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Request Body</p>
          <div className="relative bg-slate-800 rounded-xl px-5 py-4 group">
            <pre className="text-[13px] font-mono leading-relaxed whitespace-pre">
              <span className="text-slate-200">{"{\n"}</span>
              <span className="text-slate-400">{"  \"row_id\": "}</span><span className="text-amber-400">{"ROW_ID"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"status\": "}</span><span className="text-amber-400">{"\"success\" | \"failed\""}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-blue-300">{"  \"image_id\": "}</span><span className="text-amber-400">{"IMAGE_ID"}</span><span className="text-slate-500">{"  // optional — only if image was returned in GET"}</span><span className="text-slate-200">{",\n"}</span>
              <span className="text-slate-400">{"  \"ip\": "}</span><span className="text-amber-400">{"\"YOUR_IP\""}</span><span className="text-slate-500">{"           // optional"}</span><span className="text-slate-200">{"\n}"}</span>
            </pre>
            <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={'{\n  "row_id": ROW_ID,\n  "status": "success",\n  "image_id": IMAGE_ID,\n  "ip": "YOUR_IP"\n}'} />
            </div>
          </div>
        </div>

        {/* Example — with image */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Example — with image</span>
            </div>
            <CopyButton text={'{\n  "row_id": 42,\n  "status": "success",\n  "image_id": 15,\n  "ip": "192.168.1.5"\n}'} />
          </div>
          <div className="bg-white px-5 py-4">
            <pre className="text-[13px] font-mono leading-relaxed text-slate-600 whitespace-pre">
{`{
  "row_id": `}<span className="text-blue-600 font-semibold">42</span>{`,
  "status": `}<span className="text-emerald-600 font-semibold">"success"</span>{`,
  "image_id": `}<span className="text-blue-600 font-semibold">15</span>{`,
  "ip": `}<span className="text-blue-600 font-semibold">"192.168.1.5"</span>{`
}`}
            </pre>
          </div>
        </div>

        {/* Example — without image */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Example — without image</span>
            </div>
            <CopyButton text={'{\n  "row_id": 42,\n  "status": "failed",\n  "ip": "192.168.1.5"\n}'} />
          </div>
          <div className="bg-white px-5 py-4">
            <pre className="text-[13px] font-mono leading-relaxed text-slate-600 whitespace-pre">
{`{
  "row_id": `}<span className="text-blue-600 font-semibold">42</span>{`,
  "status": `}<span className="text-red-500 font-semibold">"failed"</span>{`,
  "ip": `}<span className="text-blue-600 font-semibold">"192.168.1.5"</span>{`
}`}
            </pre>
          </div>
        </div>

        {/* POST Response */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Response</p>
          <div className="relative bg-slate-800 rounded-xl px-5 py-4 group">
            <pre className="text-[13px] font-mono leading-relaxed whitespace-pre">
              <span className="text-slate-200">{"{\n"}</span>
              <span className="text-slate-400">{"  \"ok\": "}</span><span className="text-emerald-400">{"true"}</span><span className="text-slate-200">{"\n}"}</span>
            </pre>
            <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={'{\n  "ok": true\n}'} />
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold text-amber-700 mb-1">⚠️ Important — image_id in POST</p>
          <p className="text-[11px] text-amber-600 leading-relaxed">
            If GET returned an <code className="bg-amber-100 px-1 rounded font-mono">image_id</code>, you must pass it
            back in POST. Without it, the image will remain stuck in{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">"processing"</code> status and will not be reassigned to future runs.
          </p>
        </div>

      </div>

    </div>
  )
}