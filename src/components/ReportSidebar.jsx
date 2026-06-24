import { useState, useEffect, useRef } from 'react'
import { X, Upload, MapPin, Loader2, Sparkles, CheckCircle, AlertCircle, ChevronDown, AlertTriangle, ArrowUp, Minus } from 'lucide-react'
import { submitReport } from '../services/reportsService'
import { reverseGeocode } from '../services/geocodingService'
import { classifyImage } from '../services/aiClassifier'
import { validateImageFile } from '../utils/imageUtils'
import { checkRateLimit, formatRetryMessage } from '../utils/rateLimiter'
import toast from 'react-hot-toast'

const CATEGORIES = ['Pothole', 'Sanitation', 'Streetlight', 'Flooding', 'Vandalism', 'Other']

const PRIORITIES = [
    { value: 'Low', label: 'Low', icon: Minus, color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
    { value: 'Medium', label: 'Medium', icon: Minus, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    { value: 'High', label: 'High', icon: ArrowUp, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
    { value: 'Critical', label: 'Critical', icon: AlertTriangle, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
]

const CATEGORY_EMOJI = {
    Pothole: '🕳️', Sanitation: '🗑️', Streetlight: '💡',
    Flooding: '🌊', Vandalism: '🖊️', Other: '⚠️',
}

export default function ReportSidebar({ isOpen, draftPosition, onClose, onSuccess }) {
    const [address, setAddress] = useState('')
    const [loadingAddress, setLoadingAddress] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        reportedBy: '',
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState(null)
    const [classifying, setClassifying] = useState(false)
    const [errors, setErrors] = useState({})
    const fileInputRef = useRef(null)

    // Fetch address when draftPosition changes
    useEffect(() => {
        if (draftPosition) {
            setLoadingAddress(true)
            setAddress('')
            reverseGeocode(draftPosition[0], draftPosition[1]).then((addr) => {
                setAddress(addr)
                setLoadingAddress(false)
            })
        }
    }, [draftPosition])

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setForm({ title: '', description: '', category: '', priority: 'Medium', reportedBy: '' })
            setImageFile(null)
            setImagePreview(null)
            setAiSuggestion(null)
            setErrors({})
        }
    }, [isOpen])

    function handleChange(e) {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: null }))
    }

    async function handleImageChange(e) {
        const file = e.target.files[0]
        if (!file) return

        const validation = validateImageFile(file)
        if (!validation.valid) {
            toast.error(validation.error)
            return
        }

        const rateCheck = checkRateLimit('ai_classify', { maxAttempts: 10, windowMs: 60_000 })
        if (!rateCheck.allowed) {
            toast.error(formatRetryMessage(rateCheck.retryAfterSec))
            return
        }

        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))

        setClassifying(true)
        setAiSuggestion(null)
        try {
            const result = await classifyImage(file)
            setAiSuggestion(result)
            if (!form.category && result) {
                setForm((prev) => ({ ...prev, category: result.category }))
            }
        } catch {
            toast.error('AI analysis unavailable — please select a category manually')
        } finally {
            setClassifying(false)
        }
    }

    function removeImage() {
        setImageFile(null)
        setImagePreview(null)
        setAiSuggestion(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function validate() {
        const newErrors = {}
        if (!form.category) newErrors.category = 'Please select a category'
        if (!form.description.trim() && !form.title.trim()) {
            newErrors.description = 'Please provide a title or description'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!validate() || !draftPosition) return

        const rateCheck = checkRateLimit('submit_report', { maxAttempts: 3, windowMs: 300_000 })
        if (!rateCheck.allowed) {
            toast.error(formatRetryMessage(rateCheck.retryAfterSec))
            return
        }

        setSubmitting(true)
        try {
            await submitReport(
                {
                    title: form.title || `${form.category} Issue`,
                    description: form.description,
                    category: form.category,
                    priority: form.priority,
                    lat: draftPosition[0],
                    lng: draftPosition[1],
                    address,
                    reportedBy: form.reportedBy,
                },
                imageFile
            )
            toast.success('Report submitted! Thank you for making your city better. 🏙️', {
                duration: 4000,
                style: { background: '#0f1e3d', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.3)' },
            })
            onSuccess && onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            toast.error(`Failed to submit: ${err.message}`, {
                style: { background: '#0f1e3d', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' },
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[500] md:hidden"
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <div
                className="fixed right-0 top-0 h-full z-[600] w-full max-w-sm sidebar-enter glass-dark border-l border-white/10 flex flex-col overflow-hidden"
                style={{ top: '64px', height: 'calc(100% - 64px)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
                    <div>
                        <h2 className="text-white font-bold text-base">Report an Issue</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            {loadingAddress ? (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Locating…
                                </span>
                            ) : (
                                <span className="text-xs text-slate-400 truncate max-w-[220px]">
                                    {address || `${draftPosition?.[0]?.toFixed(4)}, ${draftPosition?.[1]?.toFixed(4)}`}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* Image Upload */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                            Photo Evidence
                        </label>
                        {imagePreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                                <img src={imagePreview} alt="preview" className="w-full h-44 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="bg-red-500/80 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" /> Remove
                                    </button>
                                </div>

                                {/* AI suggestion */}
                                {(classifying || aiSuggestion) && (
                                    <div className="absolute bottom-2 left-2 right-2">
                                        {classifying ? (
                                            <div className="glass text-xs text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                                                AI analyzing image…
                                            </div>
                                        ) : aiSuggestion && (
                                            <div className="glass text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                                <span className="text-slate-300">
                                                    {aiSuggestion.isAI ? 'AI suggests' : 'Suggested'}:{' '}
                                                    <span className="text-purple-300 font-medium">{aiSuggestion.category}</span>
                                                    <span className="text-slate-500 ml-1">({aiSuggestion.confidence}% confidence)</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-36 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500/50 hover:text-slate-300 hover:bg-blue-500/5 transition-all duration-200 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-all">
                                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Upload Photo</p>
                                    <p className="text-xs">JPG, PNG, HEIC up to 10MB</p>
                                </div>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                            Category <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        setForm((p) => ({ ...p, category: cat }))
                                        setErrors((p) => ({ ...p, category: null }))
                                    }}
                                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all border ${form.category === cat
                                            ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-lg leading-none">{CATEGORY_EMOJI[cat]}</span>
                                    <span>{cat}</span>
                                </button>
                            ))}
                        </div>
                        {errors.category && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.category}
                            </p>
                        )}
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                            Priority Level
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {PRIORITIES.map(({ value, label, icon: PIcon, color }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, priority: value }))}
                                    className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl text-[10px] font-medium transition-all border ${form.priority === value
                                            ? color
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <PIcon className="w-3.5 h-3.5" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                            Title (optional)
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder={form.category ? `${form.category} issue near me` : 'Brief title…'}
                            className="civic-input"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the issue in detail. How severe is it? How long has it been there?"
                            rows={4}
                            className="civic-input resize-none"
                        />
                        {errors.description && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Reporter */}
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                            Your Name / Email (optional)
                        </label>
                        <input
                            type="text"
                            name="reportedBy"
                            value={form.reportedBy}
                            onChange={handleChange}
                            placeholder="Anonymous"
                            className="civic-input"
                        />
                    </div>

                    {/* Coordinates display */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Coordinates</span>
                            <span className="text-xs text-slate-300 font-mono">
                                {draftPosition ? `${draftPosition[0].toFixed(6)}, ${draftPosition[1].toFixed(6)}` : '—'}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-600">Drag the red pin on the map for precise placement</p>
                    </div>
                </form>

                {/* Footer CTA */}
                <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 space-y-2">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="civic-btn-primary flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                        ) : (
                            <><CheckCircle className="w-4 h-4" /> Submit Report</>
                        )}
                    </button>
                    <button type="button" onClick={onClose} className="civic-btn-secondary w-full text-center">
                        Cancel
                    </button>
                </div>
            </div>
        </>
    )
}
