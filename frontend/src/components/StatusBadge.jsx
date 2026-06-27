const STATUS_CONFIG = {
    Open: {
        label: 'Open',
        className: 'status-open',
        dot: 'bg-red-400',
    },
    'In Progress': {
        label: 'In Progress',
        className: 'status-in-progress',
        dot: 'bg-amber-400',
    },
    Resolved: {
        label: 'Resolved',
        className: 'status-resolved',
        dot: 'bg-emerald-400',
    },
}

export default function StatusBadge({ status, size = 'md' }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Open
    const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${sizeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
            {config.label}
        </span>
    )
}
