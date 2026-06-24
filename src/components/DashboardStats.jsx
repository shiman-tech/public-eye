import { BarChart3, AlertTriangle, CheckCircle, Clock, TrendingUp, Inbox } from 'lucide-react'

const CATEGORY_EMOJI = {
    Pothole: '🕳️', Sanitation: '🗑️', Streetlight: '💡',
    Flooding: '🌊', Vandalism: '🖊️', Other: '⚠️',
}

/**
 * Dashboard analytics summary bar displaying key metrics.
 * Provides admins a quick pulse on system health.
 */
export default function DashboardStats({ stats }) {
    if (!stats || stats.total === 0) {
        return (
            <div className="glass-dark rounded-2xl border border-white/10 p-4 text-center">
                <Inbox className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-sm text-slate-500">No reports to analyze yet</p>
            </div>
        )
    }

    const resolvedPct = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Reports */}
            <StatCard
                icon={BarChart3}
                iconColor="text-blue-400"
                label="Total Reports"
                value={stats.total}
            />

            {/* Open */}
            <StatCard
                icon={Inbox}
                iconColor="text-red-400"
                label="Open"
                value={stats.open}
                highlight={stats.open > 0 ? 'text-red-400' : undefined}
            />

            {/* In Progress */}
            <StatCard
                icon={TrendingUp}
                iconColor="text-amber-400"
                label="In Progress"
                value={stats.inProgress}
            />

            {/* Resolved */}
            <StatCard
                icon={CheckCircle}
                iconColor="text-emerald-400"
                label="Resolved"
                value={`${stats.resolved} (${resolvedPct}%)`}
            />

            {/* Critical / High Priority */}
            <StatCard
                icon={AlertTriangle}
                iconColor="text-rose-400"
                label="Critical / High"
                value={`${stats.critical} / ${stats.high}`}
                highlight={stats.critical > 0 ? 'text-rose-400' : undefined}
            />

            {/* Avg Resolution */}
            <StatCard
                icon={Clock}
                iconColor="text-cyan-400"
                label="Avg Resolution"
                value={stats.avgResolutionHours !== null ? `${stats.avgResolutionHours}h` : '—'}
            />
        </div>
    )
}

function StatCard({ icon: Icon, iconColor, label, value, highlight }) {
    return (
        <div className="glass-dark rounded-xl border border-white/10 p-3 flex flex-col gap-1 hover:border-white/20 transition-all">
            <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
            </div>
            <span className={`text-lg font-bold ${highlight || 'text-white'}`}>{value}</span>
        </div>
    )
}
