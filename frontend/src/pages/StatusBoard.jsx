import { useState, useEffect } from 'react'
import { fetchReports } from '../services/reportsService'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import ReportAgeIndicator from '../components/ReportAgeIndicator'
import StatusTimeline from '../components/StatusTimeline'
import { Search, MapPin, Clock, Loader2, AlertCircle, User, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = ['All', 'Pothole', 'Sanitation', 'Streetlight', 'Flooding', 'Vandalism', 'Other']
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved']
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low']

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
    const [priorityFilter, setPriorityFilter] = useState('All')

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
        if (priorityFilter !== 'All') result = result.filter((r) => r.priority === priorityFilter)
        setFiltered(result)
    }, [search, categoryFilter, statusFilter, priorityFilter, reports])

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Public Status Board
                </h1>
                <p className="text-slate-400">
                    Track all reported infrastructure issues in your area. Full transparency on admin actions.
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

                {/* Category, Status & Priority filters */}
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

                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Priority</label>
                        <div className="flex gap-1.5">
                            {PRIORITIES.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriorityFilter(p)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${priorityFilter === p
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    {p}
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
                        <StatusBoardCard key={r.id} report={r} formatDate={formatDate} />
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Individual report card on the Status Board with expandable details.
 */
function StatusBoardCard({ report: r, formatDate }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div
            className="glass-dark rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200 group animate-fade-in cursor-pointer"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex gap-4">
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
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <PriorityBadge priority={r.priority || 'Medium'} size="sm" />
                            <StatusBadge status={r.status} size="sm" />
                        </div>
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
                        <div className="flex items-center gap-3">
                            <ReportAgeIndicator createdAt={r.created_at} status={r.status} size="sm" />
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDate(r.created_at)}
                            </span>
                        </div>
                        <span className="text-xs text-slate-500">
                            {CATEGORY_EMOJI[r.category]} {r.category}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded section: admin notes, resolution info, timeline */}
            {expanded && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-3 animate-fade-in">
                    {/* Admin notes */}
                    {r.admin_notes && (
                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium mb-1">
                                <MessageSquare className="w-3 h-3" />
                                Admin Note
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed italic">"{r.admin_notes}"</p>
                        </div>
                    )}

                    {/* Resolved by info */}
                    {r.resolved_by && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <div>
                                <span className="text-xs text-emerald-400 font-medium">Resolved by {r.resolved_by}</span>
                                {r.resolved_at && (
                                    <span className="text-xs text-slate-500 ml-2">
                                        on {new Date(r.resolved_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reporter */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        Reported by: {r.reported_by || 'Anonymous'}
                    </div>

                    {/* Status Timeline */}
                    <StatusTimeline reportId={r.id} />

                    {/* Expand indicator */}
                    <div className="flex items-center justify-center">
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                    </div>
                </div>
            )}

            {/* Collapse indicator when not expanded */}
            {!expanded && (
                <div className="flex items-center justify-center mt-2">
                    <ChevronDown className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
                </div>
            )}
        </div>
    )
}
