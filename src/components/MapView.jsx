import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ReportMarker from './ReportMarker'
import { fetchReports, subscribeToReports } from '../services/reportsService'
import { MapPin, Loader2, AlertCircle } from 'lucide-react'

// Fix Leaflet default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER = [20.5937, 78.9629] // India center fallback
const DEFAULT_ZOOM = 13

function createDraftIcon() {
    return L.divIcon({
        html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
        <div style="
          position:absolute; width:40px; height:40px;
          border-radius:50%; background:rgba(59,130,246,0.3);
          animation: pulseRing 1.5s ease-out infinite;
        "></div>
        <div style="
          width:16px; height:16px; border-radius:50%;
          background:#3b82f6; border:3px solid white;
          box-shadow:0 2px 8px rgba(59,130,246,0.6);
          position:relative; z-index:1;
        "></div>
      </div>
    `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    })
}

// Inner component to handle map events
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

// Draft pin marker
function DraftPin({ position }) {
    const markerRef = useRef(null)

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup()
        }
    }, [])

    return position ? (
        <ReportMarker
            report={{
                id: 'draft',
                lat: position[0],
                lng: position[1],
                title: 'New Report',
                category: 'Other',
                status: 'draft',
            }}
        />
    ) : null
}

export default function MapView({ draftPosition, onMapClick, reports: externalReports, onReportsChange }) {
    const [reports, setReports] = useState([])
    const [userLocation, setUserLocation] = useState(null)
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const mapRef = useRef(null)

    // Get user geolocation on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    setUserLocation([latitude, longitude])
                    setMapCenter([latitude, longitude])
                },
                () => {
                    // Silently fall back to default
                },
                { timeout: 8000 }
            )
        }
    }, [])

    // Load initial reports
    useEffect(() => {
        async function loadReports() {
            try {
                setLoading(true)
                const data = await fetchReports()
                setReports(data || [])
                onReportsChange && onReportsChange(data || [])
            } catch (err) {
                console.error('Failed to load reports:', err)
                setError('Could not load reports. Check your Supabase config.')
            } finally {
                setLoading(false)
            }
        }
        loadReports()
    }, [])

    // Real-time subscription
    useEffect(() => {
        const unsub = subscribeToReports(
            (newReport) => {
                setReports((prev) => {
                    const updated = [newReport, ...prev.filter((r) => r.id !== newReport.id)]
                    onReportsChange && onReportsChange(updated)
                    return updated
                })
            },
            (updatedReport) => {
                setReports((prev) => {
                    const updated = prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
                    onReportsChange && onReportsChange(updated)
                    return updated
                })
            }
        )
        return unsub
    }, [])

    // Fly to draft position when set
    useEffect(() => {
        if (draftPosition && mapRef.current) {
            mapRef.current.flyTo(draftPosition, Math.max(mapRef.current.getZoom(), 15), {
                duration: 0.8,
            })
        }
    }, [draftPosition])

    const handleMapClick = useCallback((lat, lng) => {
        onMapClick && onMapClick(lat, lng)
    }, [onMapClick])

    // User location marker
    const userLocationIcon = L.divIcon({
        html: `
      <div style="position:relative; width:20px; height:20px;">
        <div style="
          width:20px; height:20px; border-radius:50%;
          background:#3b82f6; border:3px solid white;
          box-shadow:0 2px 8px rgba(59,130,246,0.7);
        "></div>
      </div>
    `,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    })

    return (
        <div className="relative w-full h-full">
            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 z-[400] flex items-center justify-center" style={{ background: 'rgba(11,18,32,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        <span className="text-slate-300 text-sm">Loading CivicPulse Map…</span>
                    </div>
                </div>
            )}

            {/* Error banner */}
            {error && !loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 glass-dark border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Click hint */}
            {!loading && !draftPosition && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                    <div className="glass-dark border border-white/10 text-slate-400 text-xs px-4 py-2 rounded-full flex items-center gap-2 animate-bounce">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        Click anywhere on the map to report an issue
                    </div>
                </div>
            )}

            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full"
                ref={mapRef}
                zoomControl={true}
                style={{ cursor: 'crosshair' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    maxZoom={19}
                />

                <MapClickHandler onMapClick={handleMapClick} />

                {/* User location */}
                {userLocation && (
                    <ReportMarker
                        report={{
                            id: 'user-loc',
                            lat: userLocation[0],
                            lng: userLocation[1],
                            title: 'Your Location',
                            category: 'Other',
                            status: 'Open',
                            description: 'This is your current location.',
                        }}
                    />
                )}

                {/* Draft pin */}
                {draftPosition && (
                    <DraftPinMarker position={draftPosition} />
                )}

                {/* Report markers */}
                {reports.map((report) => (
                    <ReportMarker key={report.id} report={report} />
                ))}
            </MapContainer>
        </div>
    )
}

// Separate draft pin with pulsing icon
function DraftPinMarker({ position }) {
    const draftIcon = createDraftIcon()

    return (
        <ReportMarker
            report={{
                id: 'draft',
                lat: position[0],
                lng: position[1],
                title: '📍 New Report Here',
                category: 'Other',
                status: 'Open',
                description: 'Fill in the form to submit this report.',
            }}
        />
    )
}
