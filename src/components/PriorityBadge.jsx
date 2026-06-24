import { AlertTriangle, ArrowUp, Minus, ChevronUp } from 'lucide-react'

const PRIORITY_CONFIG = {
    Critical: {
        label: 'Critical',
        className: 'priority-critical',
        icon: AlertTriangle,
        dot: 'bg-rose-500',
    },
    High: {
        label: 'High',
        className: 'priority-high',
        icon: ArrowUp,
        dot: 'bg-orange-400',
    },
    Medium: {
        label: 'Medium',
        className: 'priority-medium',
        icon: Minus,
        dot: 'bg-blue-400',
    },
    Low: {
        label: 'Low',
        className: 'priority-low',
        icon: ChevronUp,
        dot: 'bg-slate-400',
    },
}

/**
 * Visual priority indicator badge component.
 * Displays the priority level with a color-coded badge and icon.
 */
export default function PriorityBadge({ priority, size = 'md' }) {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium
    const Icon = config.icon
    const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'

    return (
        <span className={`inline-flex items-center rounded-full font-semibold border ${config.className} ${sizeClass}`}>
            <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {config.label}
        </span>
    )
}

export { PRIORITY_CONFIG }
