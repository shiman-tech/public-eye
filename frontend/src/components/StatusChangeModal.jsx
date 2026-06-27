import { useState } from 'react'
import { X, ArrowRight, Loader2, AlertCircle, Shield, MessageSquare } from 'lucide-react'
import StatusBadge from './StatusBadge'

/**
 * Confirmation modal for admin status changes.
 * Prevents misclicks, captures admin notes for audit trail.
 * Requires a note when resolving a report.
 */
export default function StatusChangeModal({
    isOpen,
    report,
    targetStatus,
    adminEmail,
    onConfirm,
    onCancel,
}) {
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen || !report) return null

    const isResolving = targetStatus === 'Resolved'
    const noteRequired = isResolving

    async function handleConfirm() {
        if (noteRequired && !note.trim()) {
            setError('A resolution note is required when marking as Resolved')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await onConfirm(report, targetStatus, note.trim())
            setNote('')
            setError(null)
        } catch (err) {
            setError(err.message || 'Failed to update status')
        } finally {
            setLoading(false)
        }
    }

    function handleCancel() {
        setNote('')
        setError(null)
        onCancel()
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] modal-backdrop-enter"
                onClick={handleCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                <div
                    className="w-full max-w-md glass-dark rounded-2xl border border-white/15 shadow-2xl modal-content-enter overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <h3 className="text-white font-bold text-base">Confirm Status Change</h3>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-4">
                        {/* Report info */}
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <p className="text-sm font-semibold text-white truncate">{report.title}</p>
                            {report.address && (
                                <p className="text-xs text-slate-500 truncate">📍 {report.address}</p>
                            )}
                        </div>

                        {/* Status transition */}
                        <div className="flex items-center justify-center gap-4 py-2">
                            <StatusBadge status={report.status} />
                            <ArrowRight className="w-5 h-5 text-slate-500" />
                            <StatusBadge status={targetStatus} />
                        </div>

                        {/* Admin identity */}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Shield className="w-3 h-3" />
                            <span>Changing as: <span className="text-slate-300 font-medium">{adminEmail}</span></span>
                        </div>

                        {/* Note input */}
                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MessageSquare className="w-3 h-3" />
                                Admin Note {noteRequired ? <span className="text-red-400">*</span> : <span className="text-slate-600">(optional)</span>}
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => { setNote(e.target.value); setError(null) }}
                                placeholder={isResolving
                                    ? 'Describe the resolution (e.g., "Repair crew confirmed fix on Jun 24")'
                                    : 'Add context about this status change…'
                                }
                                rows={3}
                                className="civic-input resize-none text-sm"
                                autoFocus
                            />
                            {isResolving && (
                                <p className="text-[10px] text-slate-600 mt-1">
                                    Resolution notes are visible to the public for full transparency.
                                </p>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="civic-btn-secondary flex-1 text-center text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || (noteRequired && !note.trim())}
                            className="civic-btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                            ) : (
                                <>Confirm Change</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
