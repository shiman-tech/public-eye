import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchReports } from '../services/reportsService'
import StatusBadge from '../components/StatusBadge'
import { Search, Filter, MapPin, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

const CATEGORIES = ['All', 'Pothole', 'Sanitation', 'Streetlight', 'Flooding', 'Vandalism', 'Other']
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved']

const CATEGORY_EMOJI = {
    Pothole: '🕳️', Sanitation: '🗑️', Streetlight: '💡',
    Flooding: '🌊', Vandalism: '🖊️', Other: '⚠️',
}

export default function StatusBoard() {
    const [reports, setReports] = useState([])
    const [filtered, setFiltered] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')

    useEffect(() => {
        fetchReports()
            .then((data) => { setReports(data || []); setFiltered(data || []) })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let result = reports
        if (search.trim()) {
            const s = search.toLowerCase()
            result = result.filter(
                (r) => r.title?.toLowerCase().includes(s) ||
                    r.description?.toLowerCase().includes(s) ||
                    r.address?.toLowerCase().includes(s)
            )
        }
        if (categoryFilter !== 'All') result = result.filter((r) => r.category === categoryFilter)
        if (statusFilter !== 'All') result = result.filter((r) => r.status === statusFilter)
        setFiltered(result)
    }, [search, categoryFilter, statusFilter, reports])

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Public Status Board
                </h1>
                <p className="text-slate-400">
                    Track all reported infrastructure issues in your area.
                    {!loading && <span className="text-blue-400 ml-2 font-medium">{filtered.length} issues found</span>}
                </p>
            </div>

            {/* Filters */}
            <div className="glass-dark rounded-2xl p-4 mb-6 space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by address, title, or description…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="civic-input pl-10"
                    />
                </div>

                {/* Category & Status filters */}
                <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-xs text-slate-500 mb-1 block">Category</label>
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCategoryFilter(c)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${categoryFilter === c
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    {c !== 'All' ? `${CATEGORY_EMOJI[c]} ` : ''}{c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Status</label>
                        <div className="flex gap-1.5">
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${statusFilter === s
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-400">{error}</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">🔍</span>
                    <p className="text-slate-400 text-lg">No reports found</p>
                    <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((r) => (
                        <div
                            key={r.id}
                            className="glass-dark rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200 flex gap-4 group animate-fade-in"
                        >
                            {/* Image */}
                            {r.image_url ? (
                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                    <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center text-3xl border border-white/10">
                                    {CATEGORY_EMOJI[r.category] || '⚠️'}
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="text-white font-semibold text-sm truncate">{r.title || `${r.category} Issue`}</h3>
                                    <StatusBadge status={r.status} size="sm" />
                                </div>

                                {r.address && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                                        <MapPin className="w-3 h-3" /> {r.address}
                                    </p>
                                )}

                                {r.description && (
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{r.description}</p>
                                )}

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {formatDate(r.created_at)}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {CATEGORY_EMOJI[r.category]} {r.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
