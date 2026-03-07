import { useState, useEffect } from 'react'
import { fetchReports, updateReportStatus } from '../services/reportsService'
import { subscribeToReports } from '../services/reportsService'
import StatusBadge from '../components/StatusBadge'
import { Loader2, AlertCircle, MapPin, Clock, LogOut, RefreshCw } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLUMNS = [
    { status: 'Open', label: 'Open', colClass: 'kanban-col-open', emoji: '🔴' },
    { status: 'In Progress', label: 'In Progress', colClass: 'kanban-col-progress', emoji: '🟡' },
    { status: 'Resolved', label: 'Resolved', colClass: 'kanban-col-resolved', emoji: '🟢' },
]

const NEXT_STATUS = { Open: 'In Progress', 'In Progress': 'Resolved', Resolved: 'Open' }
const CATEGORY_EMOJI = {
    Pothole: '🕳️', Sanitation: '🗑️', Streetlight: '💡',
    Flooding: '🌊', Vandalism: '🖊️', Other: '⚠️',
}

export default function AdminDashboard() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [updating, setUpdating] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        loadReports()
        const unsub = subscribeToReports(
            (newReport) => setReports((p) => [newReport, ...p.filter((r) => r.id !== newReport.id)]),
            (updated) => setReports((p) => p.map((r) => (r.id === updated.id ? updated : r)))
        )
        return unsub
    }, [])

    async function loadReports() {
        try {
            setLoading(true)
            const data = await fetchReports()
            setReports(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(report, newStatus) {
        setUpdating(report.id)
        try {
            await updateReportStatus(report.id, newStatus)
            setReports((p) => p.map((r) => (r.id === report.id ? { ...r, status: newStatus } : r)))
            toast.success(`Status updated to "${newStatus}"`, {
                style: { background: '#0f1e3d', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.3)' },
            })
        } catch (err) {
            toast.error(`Update failed: ${err.message}`, {
                style: { background: '#0f1e3d', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' },
            })
        } finally {
            setUpdating(null)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Admin Header */}
            <div className="glass-dark border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm">{reports.length} total reports · Real-time enabled</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadReports}
                        className="civic-btn-secondary flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-all text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                    <p className="text-red-400">{error}</p>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex gap-4 h-full min-w-max">
                        {COLUMNS.map(({ status, label, colClass, emoji }) => {
                            const columnReports = reports.filter((r) => r.status === status)
                            return (
                                <div key={status} className={`w-80 flex flex-col glass-dark rounded-2xl border border-white/10 overflow-hidden ${colClass}`}>
                                    {/* Column header */}
                                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span>{emoji}</span>
                                            <span className="font-semibold text-white text-sm">{label}</span>
                                        </div>
                                        <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                            {columnReports.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {columnReports.length === 0 ? (
                                            <div className="text-center py-8 text-slate-600 text-sm">
                                                No {label.toLowerCase()} reports
                                            </div>
                                        ) : (
                                            columnReports.map((report) => (
                                                <KanbanCard
                                                    key={report.id}
                                                    report={report}
                                                    isUpdating={updating === report.id}
                                                    onStatusChange={handleStatusChange}
                                                    nextStatus={NEXT_STATUS[report.status]}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function KanbanCard({ report, isUpdating, onStatusChange, nextStatus }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div
            className="glass rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-200 cursor-pointer animate-fade-in"
            onClick={() => setExpanded(!expanded)}
        >
            {/* Image */}
            {report.image_url && (
                <div className="h-32 overflow-hidden">
                    <img src={report.image_url} alt={report.title} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-3">
                {/* Category */}
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        {CATEGORY_EMOJI[report.category]} {report.category}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                </div>

                {/* Title */}
                <h3 className="text-white text-sm font-semibold mb-1">{report.title || `${report.category} Issue`}</h3>

                {/* Address */}
                {report.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{report.address}</span>
                    </p>
                )}

                {/* Expanded content */}
                {expanded && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                        {report.description && (
                            <p className="text-xs text-slate-400 leading-relaxed mb-2">{report.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            <span>{report.reported_by || 'Anonymous'}</span>
                        </div>
                    </div>
                )}

                {/* Action button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(report, nextStatus)
                    }}
                    disabled={isUpdating}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                    {isUpdating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <>Move to "{nextStatus}" →</>
                    )}
                </button>
            </div>
        </div>
    )
}
