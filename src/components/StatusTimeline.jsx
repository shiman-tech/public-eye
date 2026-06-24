import { useState, useEffect } from 'react'
import { fetchStatusHistory } from '../services/reportsService'
import { Clock, Loader2, ChevronDown, ChevronUp, User, MessageSquare } from 'lucide-react'

const STATUS_COLORS = {
    'Open': 'bg-red-500',
    'In Progress': 'bg-amber-500',
    'Resolved': 'bg-emerald-500',
}

/**
 * Expandable timeline showing the chronological history of status changes
 * for a report. Displays admin name, timestamp, and note for each change.
 */
export default function StatusTimeline({ reportId, compact = false }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        if (expanded && history.length === 0) {
            loadHistory()
        }
    }, [expanded])

    async function loadHistory() {
        setLoading(true)
        try {
            const data = await fetchStatusHistory(reportId)
            setHistory(data)
        } catch {
            setHistory([])
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    if (compact) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
                <Clock className="w-2.5 h-2.5" />
                History
                {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
        )
    }

    return (
        <div className="mt-2">
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors w-full"
            >
                <Clock className="w-3 h-3" />
                <span>Status History</span>
                {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>

            {expanded && (
                <div className="mt-2 animate-fade-in">
                    {loading ? (
                        <div className="flex items-center gap-2 py-3 justify-center">
                            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                            <span className="text-xs text-slate-500">Loading history…</span>
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-slate-600 py-2 text-center">No status history recorded yet</p>
                    ) : (
                        <div className="relative pl-4 border-l border-white/10 space-y-3 ml-1">
                            {history.map((entry, i) => (
                                <div key={entry.id || i} className="relative">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-civic-dark ${STATUS_COLORS[entry.to_status] || 'bg-slate-500'}`} />

                                    <div className="space-y-0.5">
                                        {/* Status change line */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {entry.from_status && (
                                                <>
                                                    <span className="text-[10px] text-slate-500">{entry.from_status}</span>
                                                    <span className="text-[10px] text-slate-600">→</span>
                                                </>
                                            )}
                                            <span className="text-[10px] font-semibold text-white">{entry.to_status}</span>
                                        </div>

                                        {/* Admin & time */}
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span className="flex items-center gap-0.5">
                                                <User className="w-2.5 h-2.5" />
                                                {entry.changed_by || 'system'}
                                            </span>
                                            <span>{formatDate(entry.changed_at)}</span>
                                        </div>

                                        {/* Note */}
                                        {entry.note && (
                                            <div className="flex items-start gap-1 mt-0.5">
                                                <MessageSquare className="w-2.5 h-2.5 text-slate-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-[10px] text-slate-400 leading-relaxed italic">"{entry.note}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
