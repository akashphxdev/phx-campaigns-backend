'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MdClose, MdCheckCircle, MdError, MdInbox,
  MdUploadFile, MdImage, MdCampaign, MdCloudUpload,
  MdDelete, MdChevronLeft, MdChevronRight, MdFilterList,
  MdCalendarToday, MdInsertDriveFile, MdShuffle,
} from 'react-icons/md'

interface Campaign      { id: number; name: string; created_by: string; created_at: string }
interface PreviewFile   { id: string; file: File; preview: string; status: 'pending'|'uploading'|'done'|'error' }
interface UploadedImage { id: number; image_path: string; uploaded_by: string; created_at: string; status: string }
interface Pagination    { page: number; limit: number; total: number; totalPages: number }

function localId() { return Math.random().toString(36).slice(2, 10) }
const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    failed:  'bg-red-50 text-red-500 border-red-200',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  )
}

export default function ImagesPage(): React.JSX.Element {

  const [campaigns,    setCampaigns]    = useState<Campaign[]>([])
  const [campLoad,     setCampLoad]     = useState(true)
  const [selectedCamp, setSelectedCamp] = useState<Campaign | null>(null)

  const [files,        setFiles]        = useState<PreviewFile[]>([])
  const [dragging,     setDragging]     = useState(false)
  const fileInputRef                     = useRef<HTMLInputElement>(null)

  const [showModal,    setShowModal]    = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [uploadErr,    setUploadErr]    = useState('')
  const [uploadOk,     setUploadOk]     = useState('')

  const [images,       setImages]       = useState<UploadedImage[]>([])
  const [pagination,   setPagination]   = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [imgLoad,      setImgLoad]      = useState(false)

  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo,   setFilterDateTo]   = useState('')

  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  // fetch campaigns
  useEffect(() => {
    void (async () => {
      try {
        const res  = await fetch('/api/campaigns')
        const data = await res.json() as { success: boolean; campaigns: Campaign[] }
        if (data.success) setCampaigns(data.campaigns)
      } finally { setCampLoad(false) }
    })()
  }, [])

  // fetch images
  const fetchImages = useCallback(async (
    campId: number, page = 1, status = '', dateFrom = '', dateTo = '',
  ) => {
    setImgLoad(true)
    try {
      const params = new URLSearchParams({
        campaign_id: String(campId), page: String(page), limit: '20',
        ...(status   ? { status }              : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo   ? { date_to:   dateTo   } : {}),
      })
      const res  = await fetch(`/api/images?${params}`)
      const data = await res.json() as { success: boolean; images: UploadedImage[]; pagination: Pagination }
      if (data.success) { setImages(data.images); setPagination(data.pagination) }
    } finally { setImgLoad(false) }
  }, [])

  const selectCampaign = (c: Campaign) => {
    setSelectedCamp(c); setFiles([]); setUploadErr(''); setUploadOk('')
    setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo('')
    void fetchImages(c.id, 1)
  }

  const applyFilters = () => {
    if (selectedCamp) void fetchImages(selectedCamp.id, 1, filterStatus, filterDateFrom, filterDateTo)
  }

  const resetFilters = () => {
    setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo('')
    if (selectedCamp) void fetchImages(selectedCamp.id, 1)
  }

  const goPage = (p: number) => {
    if (selectedCamp) void fetchImages(selectedCamp.id, p, filterStatus, filterDateFrom, filterDateTo)
  }

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid    = Array.from(incoming).filter(f => ALLOWED_TYPES.includes(f.type))
    const previews = valid.map(f => ({ id: localId(), file: f, preview: URL.createObjectURL(f), status: 'pending' as const }))
    setFiles(prev => [...prev, ...previews].slice(0, 500))
    setUploadErr(''); setUploadOk('')
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id)
      if (f) URL.revokeObjectURL(f.preview)
      return prev.filter(x => x.id !== id)
    })
  }

  const onUploadClick = () => {
    if (!selectedCamp) { setUploadErr('Please select a campaign first'); return }
    if (!files.length)  { setUploadErr('Please add images first'); return }
    setShowModal(true)
  }

  const doUpload = async (mode: 'original' | 'unique') => {
    if (!selectedCamp) return
    setShowModal(false); setUploading(true); setUploadErr(''); setUploadOk('')
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })))
    try {
      const fd = new FormData()
      fd.append('campaign_id', String(selectedCamp.id))
      fd.append('name_mode', mode)
      files.forEach(f => fd.append('images', f.file))
      const res  = await fetch('/api/images', { method: 'POST', body: fd })
      const data = await res.json() as { success: boolean; message: string; error?: string }
      if (data.success) {
        setFiles(prev => prev.map(f => ({ ...f, status: 'done' as const })))
        setUploadOk(data.message)
        setTimeout(() => { setFiles([]); setUploadOk('') }, 1500)
        void fetchImages(selectedCamp.id, 1, filterStatus, filterDateFrom, filterDateTo)
      } else {
        setUploadErr(data.error ?? 'Upload failed')
        setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })))
      }
    } catch {
      setUploadErr('Could not connect to server')
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })))
    } finally { setUploading(false) }
  }

  const confirmDelete = async () => {
    if (!deleteId || !selectedCamp) return
    setDeleting(true)
    try {
      const res  = await fetch(`/api/images?id=${deleteId}`, { method: 'DELETE' })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setDeleteId(null)
        void fetchImages(selectedCamp.id, pagination.page, filterStatus, filterDateFrom, filterDateTo)
      }
    } finally { setDeleting(false) }
  }

  const activeFilters = filterStatus || filterDateFrom || filterDateTo

  return (
    <div className="w-full">

      {/* Name Mode Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Image Save Mode</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <MdClose size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">How should the images be saved?</p>
            <div className="space-y-2.5">
              {(['original', 'unique'] as const).map(mode => (
                <button key={mode} onClick={() => void doUpload(mode)}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-2">
                    {mode === 'original'
                      ? <MdInsertDriveFile size={15} className="text-slate-400 group-hover:text-blue-500" />
                      : <MdShuffle         size={15} className="text-slate-400 group-hover:text-blue-500" />}
                    <p className="text-[13px] font-semibold text-slate-700 group-hover:text-blue-700">
                      {mode === 'original' ? 'Original Name' : 'Unique Name'}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-[23px]">
                    {mode === 'original'
                      ? 'Original filename will be used (e.g. photo.jpg)'
                      : 'A random unique name will be generated (e.g. 1779169_3a2f.jpg)'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-72">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MdDelete size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 text-center mb-1">Delete Image?</h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              This action cannot be undone. The file will also be removed from disk.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                className="flex-1 px-3 py-2 text-[12px] font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={() => void confirmDelete()} disabled={deleting}
                className="flex-1 px-3 py-2 text-[12px] font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {deleting
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <MdDelete size={13} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-800">Images</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage campaign image assets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* LEFT: Campaigns */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <MdCampaign size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">Campaigns</h2>
            </div>
            <div className="p-3">
              {campLoad ? (
                <div className="py-6 text-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No campaigns found</p>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {campaigns.map(c => (
                    <button key={c.id} onClick={() => selectCampaign(c)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-[13px] transition-all cursor-pointer
                        ${selectedCamp?.id === c.id
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                          : 'border-slate-100 text-slate-700 hover:bg-slate-50'}`}>
                      {c.name}
                      <span className="block text-[11px] text-slate-400 font-normal mt-0.5">{c.created_by}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-3 space-y-4">

          {/* Upload bar */}
          <div className="bg-white rounded-xl p-4">
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 transition-all
                ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
            >
              <input ref={fileInputRef} type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple className="hidden" disabled={uploading}
                onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MdUploadFile size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-700 leading-none mb-0.5">
                    {dragging ? 'Drop here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedCamp ? `→ ${selectedCamp.name}` : 'Select a campaign first'}
                    {' · '}JPG PNG WebP GIF · max 500 files
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {files.length > 0 && (
                  <span className="text-[12px] bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                    {files.length} selected
                  </span>
                )}
                {files.length > 0 && !uploading && (
                  <button onClick={onUploadClick}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    <MdCloudUpload size={14} /> Upload
                  </button>
                )}
                {uploading && (
                  <div className="flex items-center gap-1.5 text-[12px] text-blue-600">
                    <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>

            {uploadErr && (
              <div className="flex items-center gap-2 mt-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <MdError size={13} className="text-red-500" />
                <p className="text-[12px] text-red-600">{uploadErr}</p>
              </div>
            )}
            {uploadOk && (
              <div className="flex items-center gap-2 mt-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <MdCheckCircle size={13} className="text-emerald-500" />
                <p className="text-[12px] text-emerald-600">{uploadOk}</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map(f => (
                  <div key={f.id}
                    className={`relative group rounded-lg overflow-hidden border w-14 h-14 flex-shrink-0
                      ${f.status === 'done'      ? 'border-emerald-300' :
                        f.status === 'error'     ? 'border-red-300'     :
                        f.status === 'uploading' ? 'border-blue-300'    : 'border-slate-200'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    {f.status === 'done'      && <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center"><MdCheckCircle size={16} className="text-white" /></div>}
                    {f.status === 'uploading' && <div className="absolute inset-0 bg-blue-900/30 flex items-center justify-center"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                    {f.status === 'error'     && <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center"><MdError size={16} className="text-white" /></div>}
                    {!uploading && f.status === 'pending' && (
                      <button onClick={() => removeFile(f.id)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <MdClose size={9} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images Table */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MdImage size={15} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">
                  {selectedCamp ? selectedCamp.name : 'Uploaded Images'}
                </h2>
                {pagination.total > 0 && (
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {pagination.total} total
                  </span>
                )}
              </div>
            </div>

            {/* Filters */}
            {selectedCamp && (
              <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <MdFilterList size={11} /> Status
                  </label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer">
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <MdCalendarToday size={11} /> From
                  </label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <MdCalendarToday size={11} /> To
                  </label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer" />
                </div>

                <div className="flex items-center gap-2 pb-0.5">
                  <button onClick={applyFilters}
                    className="text-[12px] font-medium px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                    Apply
                  </button>
                  {activeFilters && (
                    <button onClick={resetFilters}
                      className="text-[12px] font-medium px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="p-4">
              {!selectedCamp ? (
                <div className="py-14 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MdCampaign size={18} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400">Select a campaign to view images</p>
                </div>
              ) : imgLoad ? (
                <div className="py-14 text-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : images.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MdInbox size={18} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400">
                    {activeFilters ? 'No images match the selected filters' : 'No images uploaded for this campaign yet'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-[11px] font-semibold text-slate-400 pb-2.5 pr-3 w-14">Image</th>
                          <th className="text-left text-[11px] font-semibold text-slate-400 pb-2.5 pr-3">Name</th>
                          <th className="text-left text-[11px] font-semibold text-slate-400 pb-2.5 pr-3">Status</th>
                          <th className="text-left text-[11px] font-semibold text-slate-400 pb-2.5 pr-3">Uploaded By</th>
                          <th className="text-left text-[11px] font-semibold text-slate-400 pb-2.5 pr-3">Date</th>
                          <th className="text-left text-[11px] font-semibold text-slate-400 pb-2.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {images.map(img => (
                          <tr key={img.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 pr-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.image_path} alt="" className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 max-w-[180px]">
                              <p className="text-slate-700 truncate font-medium">{img.image_path.split('/').pop()}</p>
                            </td>
                            <td className="py-2.5 pr-3"><StatusBadge status={img.status} /></td>
                            <td className="py-2.5 pr-3"><p className="text-slate-600">{img.uploaded_by}</p></td>
                            <td className="py-2.5 pr-3"><p className="text-slate-400 whitespace-nowrap">{formatDate(img.created_at)}</p></td>
                            <td className="py-2.5">
                              <button onClick={() => setDeleteId(img.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                                <MdDelete size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">
                        Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                          <MdChevronLeft size={16} />
                        </button>

                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                          .reduce<(number | '...')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                            acc.push(p)
                            return acc
                          }, [])
                          .map((p, i) =>
                            p === '...' ? (
                              <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-[12px] text-slate-400">…</span>
                            ) : (
                              <button key={p} onClick={() => goPage(p as number)}
                                className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors cursor-pointer
                                  ${pagination.page === p
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                {p}
                              </button>
                            )
                          )}

                        <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                          <MdChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}