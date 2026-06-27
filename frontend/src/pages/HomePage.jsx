import { useState, useCallback } from 'react'
import MapView from '../components/MapView'
import ReportSidebar from '../components/ReportSidebar'

export default function HomePage() {
    const [draftPosition, setDraftPosition] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [reports, setReports] = useState([])

    const handleMapClick = useCallback((lat, lng) => {
        setDraftPosition([lat, lng])
        setSidebarOpen(true)
    }, [])

    const handleDraftPositionChange = useCallback((lat, lng) => {
        setDraftPosition([lat, lng])
    }, [])

    const handleSidebarClose = useCallback(() => {
        setSidebarOpen(false)
        setDraftPosition(null)
    }, [])

    const handleSuccess = useCallback(() => {
        setDraftPosition(null)
    }, [])

    return (
        <div className="flex h-full relative overflow-hidden">
            {/* Map takes full viewport */}
            <div className="flex-1 relative">
                <MapView
                    draftPosition={draftPosition}
                    onMapClick={handleMapClick}
                    onDraftPositionChange={handleDraftPositionChange}
                    onReportsChange={setReports}
                />
            </div>

            {/* Sidebar */}
            <ReportSidebar
                isOpen={sidebarOpen}
                draftPosition={draftPosition}
                onClose={handleSidebarClose}
                onSuccess={handleSuccess}
            />

            {/* Stats pill - bottom left */}
            <div className="absolute bottom-4 left-4 z-[400] flex gap-2 flex-wrap">
                {reports.length > 0 && (
                    <>
                        <StatPill
                            count={reports.filter((r) => r.status === 'Open').length}
                            label="Open"
                            color="text-red-400 bg-red-500/10 border-red-500/25"
                        />
                        <StatPill
                            count={reports.filter((r) => r.status === 'In Progress').length}
                            label="In Progress"
                            color="text-amber-400 bg-amber-500/10 border-amber-500/25"
                        />
                        <StatPill
                            count={reports.filter((r) => r.status === 'Resolved').length}
                            label="Resolved"
                            color="text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function StatPill({ count, label, color }) {
    return (
        <div className={`text-xs font-medium px-3 py-1.5 rounded-full border backdrop-blur-sm ${color}`}>
            <span className="font-bold">{count}</span> {label}
        </div>
    )
}
