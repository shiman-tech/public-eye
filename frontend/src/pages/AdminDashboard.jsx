import { useState, useEffect } from 'react'
import { fetchReports, updateReportStatus, computeDashboardStats } from '../services/reportsService'
import { subscribeToReports } from '../services/reportsService'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import ReportAgeIndicator from '../components/ReportAgeIndicator'
import StatusTimeline from '../components/StatusTimeline'
import StatusChangeModal from '../components/StatusChangeModal'
import DashboardStats from '../components/DashboardStats'
import { Loader2, AlertCircle, MapPin, Clock, LogOut, RefreshCw, User, MessageSquare } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLUMNS = [
    { status: 'Open', label: 'Open', colClass: 'kanban-col-open', emoji: '🔴' },
    { status: 'In Progress', label: 'In Progress', colClass: 'kanban-col-progress', emoji: '🟡' },
    { status: 'Resolved', label: 'Resolved', colClass: 'kanban-col-resolved', emoji: '🟢' },
]

const NEXT_STATUS = { Open: 'In Progress', 'In Progress': 'Resolved', Resolved: 'Open' }
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const CATEGORY_EMOJI = {
    Pothole: '🕳️', Sanitation: '🗑️', Streetlight: '💡',
    Flooding: '🌊', Vandalism: '🖊️', Other: '⚠️',
}

export default function AdminDashboard() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [adminEmail, setAdminEmail] = useState('admin')

    // Status change modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [modalReport, setModalReport] = useState(null)
    const [modalTargetStatus, setModalTargetStatus] = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
        loadReports()
        loadAdminEmail()
        const unsub = subscribeToReports(
            (newReport) => setReports((p) => [newReport, ...p.filter((r) => r.id !== newReport.id)]),
            (updated) => setReports((p) => p.map((r) => (r.id === updated.id ? updated : r)))
        )
        return unsub
    }, [])

    async function loadAdminEmail() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) setAdminEmail(user.email)
        } catch { /* fallback to 'admin' */ }
    }

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

    function openStatusChangeModal(report, targetStatus) {
        setModalReport(report)
        setModalTargetStatus(targetStatus)
        setModalOpen(true)
    }

    async function handleStatusChangeConfirm(report, newStatus, note) {
        try {
            await updateReportStatus(report.id, newStatus, {
                adminEmail,
                adminNote: note,
                previousStatus: report.status,
            })
            setReports((p) => p.map((r) => (r.id === report.id ? {
                ...r,
                status: newStatus,
                admin_notes: note || r.admin_notes,
                resolved_by: newStatus === 'Resolved' ? adminEmail : r.resolved_by,
                resolved_at: newStatus === 'Resolved' ? new Date().toISOString() : r.resolved_at,
            } : r)))
            toast.success(`Status updated to "${newStatus}"`, {
                style: { background: '#0f1e3d', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.3)' },
            })
            setModalOpen(false)
            setModalReport(null)
            setModalTargetStatus(null)
        } catch (err) {
            // Re-throw so the modal can show the error
            throw err
        }
    }

    function handleModalCancel() {
        setModalOpen(false)
        setModalReport(null)
        setModalTargetStatus(null)
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const stats = computeDashboardStats(reports)

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Admin Header */}
            <div className="glass-dark border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm">
                        {reports.length} total reports · Real-time enabled ·{' '}
                        <span className="text-slate-400">{adminEmail}</span>
                    </p>
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
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Dashboard Stats */}
                    <div className="px-6 pt-4 pb-2 flex-shrink-0">
                        <DashboardStats stats={stats} />
                    </div>

                    {/* Kanban Board */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 pt-3">
                        <div className="flex gap-4 h-full min-w-max">
                            {COLUMNS.map(({ status, label, colClass, emoji }) => {
                                const columnReports = reports
                                    .filter((r) => r.status === status)
                                    .sort((a, b) => (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2))
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
                                                        onStatusChange={openStatusChangeModal}
                                                        nextStatus={NEXT_STATUS[report.status]}
                                                        adminEmail={adminEmail}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Change Confirmation Modal */}
            <StatusChangeModal
                isOpen={modalOpen}
                report={modalReport}
                targetStatus={modalTargetStatus}
                adminEmail={adminEmail}
                onConfirm={handleStatusChangeConfirm}
                onCancel={handleModalCancel}
            />
        </div>
    )
}

function KanbanCard({ report, onStatusChange, nextStatus, adminEmail }) {
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
                {/* Category & Priority */}
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        {CATEGORY_EMOJI[report.category]} {report.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={report.priority || 'Medium'} size="sm" />
                        <StatusBadge status={report.status} size="sm" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-white text-sm font-semibold mb-1">{report.title || `${report.category} Issue`}</h3>

                {/* Address */}
                {report.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{report.address}</span>
                    </p>
                )}

                {/* Report Age */}
                <div className="mb-2">
                    <ReportAgeIndicator createdAt={report.created_at} status={report.status} size="sm" />
                </div>

                {/* Expanded content */}
                {expanded && (
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                        {report.description && (
                            <p className="text-xs text-slate-400 leading-relaxed">{report.description}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            <span>{report.reported_by || 'Anonymous'}</span>
                        </div>

                        {/* Admin notes */}
                        {report.admin_notes && (
                            <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                                <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium mb-0.5">
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    Admin Note
                                </div>
                                <p className="text-[11px] text-slate-400 italic">"{report.admin_notes}"</p>
                            </div>
                        )}

                        {/* Resolved by info */}
                        {report.resolved_by && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                                <User className="w-2.5 h-2.5" />
                                Resolved by {report.resolved_by}
                                {report.resolved_at && (
                                    <span className="text-slate-600">
                                        · {new Date(report.resolved_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Status Timeline */}
                        <StatusTimeline reportId={report.id} />
                    </div>
                )}

                {/* Action button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(report, nextStatus)
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
                >
                    Move to "{nextStatus}" →
                </button>
            </div>
        </div>
    )
}
