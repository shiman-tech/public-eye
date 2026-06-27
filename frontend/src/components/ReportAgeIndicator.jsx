import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * Shows how long ago a report was created, with color-coded urgency.
 * - < 24h: green (fresh)
 * - 1-3 days: amber (aging)
 * - 3+ days: red (overdue)
 * 
 * Resolved reports always show as green.
 */
export default function ReportAgeIndicator({ createdAt, status, size = 'md' }) {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now - created
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffHours / 24

    // Determine age tier
    let tier, label, Icon

    if (status === 'Resolved') {
        tier = 'fresh'
        Icon = CheckCircle
        label = formatElapsed(diffMs) + ' (resolved)'
    } else if (diffHours < 24) {
        tier = 'fresh'
        Icon = Clock
        label = formatElapsed(diffMs)
    } else if (diffDays < 3) {
        tier = 'aging'
        Icon = Clock
        label = formatElapsed(diffMs)
    } else {
        tier = 'overdue'
        Icon = AlertTriangle
        label = formatElapsed(diffMs) + ' overdue'
    }

    const tierClasses = {
        fresh: 'text-emerald-400',
        aging: 'text-amber-400',
        overdue: 'text-red-400',
    }

    const sizeClass = size === 'sm' ? 'text-[10px]' : 'text-xs'

    return (
        <span className={`inline-flex items-center gap-1 ${tierClasses[tier]} ${sizeClass}`}>
            <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            <span>{label}</span>
        </span>
    )
}

/**
 * Format elapsed time into a human-readable string
 */
function formatElapsed(ms) {
    const minutes = Math.floor(ms / (1000 * 60))
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return '1 day ago'
    return `${days} days ago`
}
