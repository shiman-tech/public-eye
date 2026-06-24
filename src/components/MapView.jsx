import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ReportMarker from './ReportMarker'
import { fetchReports, subscribeToReports } from '../services/reportsService'
import { MapPin, Loader2, AlertCircle, Crosshair, Layers, Navigation } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM = 16
const REPORT_ZOOM = 18
const MAX_ZOOM = 20

const MAP_LAYERS = {
    streets: {
        label: 'Streets',
        description: 'Roads, buildings & parks',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: MAX_ZOOM,
    },
    detailed: {
        label: 'Detailed',
        description: 'Color-coded geography',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: MAX_ZOOM,
    },
    satellite: {
        label: 'Satellite',
        description: 'Aerial imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 19,
    },
    hybrid: {
        label: 'Hybrid',
        description: 'Satellite + labels',
        base: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
            maxZoom: 19,
        },
        overlay: {
            url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
            maxZoom: MAX_ZOOM,
        },
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
}

function createDraftIcon() {
    return L.divIcon({
        html: `
      <div style="position:relative;width:48px;height:56px;display:flex;align-items:flex-end;justify-content:center;">
        <div style="
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:44px;height:44px;border-radius:50%;
          background:rgba(239,68,68,0.25);
          animation:pulseRing 1.5s ease-out infinite;
        "></div>
        <svg width="36" height="48" viewBox="0 0 36 48" style="position:relative;z-index:1;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#ef4444" stroke="#fff" stroke-width="2"/>
          <circle cx="18" cy="17" r="7" fill="#fff"/>
          <circle cx="18" cy="17" r="4" fill="#ef4444"/>
        </svg>
      </div>
    `,
        className: '',
        iconSize: [48, 56],
        iconAnchor: [24, 56],
    })
}

function MapClickHandler({ onMapClick, draftPosition }) {
    useMapEvents({
        click(e) {
            if (!draftPosition) {
                onMapClick(e.latlng.lat, e.latlng.lng)
            }
        },
    })
    return null
}

function MapFlyTo({ position, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (position) {
            map.flyTo(position, Math.max(map.getZoom(), zoom), { duration: 0.6 })
        }
    }, [position, zoom, map])
    return null
}

function LayerSwitcher({ activeLayer, onLayerChange }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="absolute top-4 right-4 z-[450]">
            <button
                onClick={() => setOpen(!open)}
                className="glass-dark border border-white/15 text-white p-2.5 rounded-xl shadow-lg hover:bg-white/10 transition-all flex items-center gap-2"
                title="Switch map layer"
            >
                <Layers className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">{MAP_LAYERS[activeLayer].label}</span>
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-2 w-48 glass-dark border border-white/15 rounded-xl shadow-xl overflow-hidden">
                    {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                        <button
                            key={key}
                            onClick={() => { onLayerChange(key); setOpen(false) }}
                            className={`w-full text-left px-4 py-3 transition-all border-b border-white/5 last:border-0 ${
                                activeLayer === key
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            <div className="text-sm font-medium">{layer.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{layer.description}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function MapLegend() {
    return (
        <div className="absolute bottom-24 left-4 z-[450] glass-dark border border-white/10 rounded-xl p-3 text-xs space-y-1.5 hidden md:block">
            <div className="text-slate-400 font-medium mb-2">Map Legend</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#f2efe9] border border-gray-300"></span><span className="text-slate-400">Buildings & roads</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#aad3df]"></span><span className="text-slate-400">Water</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#c8facc]"></span><span className="text-slate-400">Parks & green</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#fde]"></span><span className="text-slate-400">Commercial areas</span></div>
        </div>
    )
}

function DraggableDraftPin({ position, onDragEnd }) {
    const markerRef = useRef(null)
    const draftIcon = createDraftIcon()

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={draftIcon}
            draggable
            eventHandlers={{
                dragend() {
                    const marker = markerRef.current
                    if (marker) {
                        const { lat, lng } = marker.getLatLng()
                        onDragEnd(lat, lng)
                    }
                },
            }}
        />
    )
}

function LocateButton({ onLocate }) {
    return (
        <button
            onClick={onLocate}
            className="absolute top-4 left-4 z-[450] glass-dark border border-white/15 text-white p-2.5 rounded-xl shadow-lg hover:bg-white/10 transition-all"
            title="Go to my location"
        >
            <Navigation className="w-4 h-4" />
        </button>
    )
}

function MapTileLayers({ layerKey }) {
    const layer = MAP_LAYERS[layerKey]

    if (layerKey === 'hybrid') {
        return (
            <>
                <TileLayer
                    url={layer.base.url}
                    attribution={layer.attribution}
                    maxZoom={layer.base.maxZoom}
                />
                <TileLayer
                    url={layer.overlay.url}
                    maxZoom={layer.overlay.maxZoom}
                    opacity={0.85}
                />
            </>
        )
    }

    return (
        <TileLayer
            url={layer.url}
            attribution={layer.attribution}
            maxZoom={layer.maxZoom}
        />
    )
}

export default function MapView({ draftPosition, onMapClick, onDraftPositionChange, onReportsChange }) {
    const [reports, setReports] = useState([])
    const [userLocation, setUserLocation] = useState(null)
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeLayer, setActiveLayer] = useState('detailed')
    const mapRef = useRef(null)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    setUserLocation([latitude, longitude])
                    setMapCenter([latitude, longitude])
                },
                () => {},
                { timeout: 8000, enableHighAccuracy: true }
            )
        }
    }, [])

    useEffect(() => {
        async function loadReports() {
            try {
                setLoading(true)
                const data = await fetchReports()
                setReports(data || [])
                onReportsChange?.(data || [])
            } catch (err) {
                console.error('Failed to load reports:', err)
                setError('Could not load reports. Check your Supabase config.')
            } finally {
                setLoading(false)
            }
        }
        loadReports()
    }, [])

    useEffect(() => {
        const unsub = subscribeToReports(
            (newReport) => {
                setReports((prev) => {
                    const updated = [newReport, ...prev.filter((r) => r.id !== newReport.id)]
                    onReportsChange?.(updated)
                    return updated
                })
            },
            (updatedReport) => {
                setReports((prev) => {
                    const updated = prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
                    onReportsChange?.(updated)
                    return updated
                })
            }
        )
        return unsub
    }, [])

    const handleMapClick = useCallback((lat, lng) => {
        onMapClick?.(lat, lng)
    }, [onMapClick])

    const handleDraftDrag = useCallback((lat, lng) => {
        onDraftPositionChange?.(lat, lng)
    }, [onDraftPositionChange])

    const handleLocate = useCallback(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.flyTo(userLocation, REPORT_ZOOM, { duration: 0.8 })
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = [pos.coords.latitude, pos.coords.longitude]
                    setUserLocation(loc)
                    mapRef.current?.flyTo(loc, REPORT_ZOOM, { duration: 0.8 })
                },
                () => setError('Could not access your location.'),
                { enableHighAccuracy: true }
            )
        }
    }, [userLocation])

    const userLocationIcon = L.divIcon({
        html: `
      <div style="position:relative;width:24px;height:24px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(59,130,246,0.3);animation:pulseRing 1.5s ease-out infinite;
        "></div>
        <div style="
          width:14px;height:14px;border-radius:50%;
          background:#3b82f6;border:3px solid white;
          box-shadow:0 2px 8px rgba(59,130,246,0.7);
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        "></div>
      </div>
    `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    })

    return (
        <div className="relative w-full h-full">
            {loading && (
                <div className="absolute inset-0 z-[400] flex items-center justify-center map-loading-overlay">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        <span className="text-slate-300 text-sm">Loading CivicPulse Map…</span>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 glass-dark border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {!loading && !draftPosition && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                    <div className="glass-dark border border-white/10 text-slate-400 text-xs px-4 py-2 rounded-full flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        Tap the exact spot on the map to report an issue
                    </div>
                </div>
            )}

            {draftPosition && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                    <div className="glass-dark border border-red-500/30 text-red-300 text-xs px-4 py-2 rounded-full flex items-center gap-2">
                        <Crosshair className="w-3.5 h-3.5" />
                        Drag the red pin to pinpoint the exact location
                    </div>
                </div>
            )}

            <LocateButton onLocate={handleLocate} />
            <LayerSwitcher activeLayer={activeLayer} onLayerChange={setActiveLayer} />
            <MapLegend />

            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_ZOOM}
                maxZoom={MAX_ZOOM}
                className="w-full h-full map-container-realistic"
                ref={mapRef}
                zoomControl={true}
                style={{ cursor: draftPosition ? 'grab' : 'crosshair' }}
            >
                <MapTileLayers layerKey={activeLayer} />

                <MapClickHandler onMapClick={handleMapClick} draftPosition={draftPosition} />
                {draftPosition && (
                    <MapFlyTo position={draftPosition} zoom={REPORT_ZOOM} />
                )}

                {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon} />
                )}

                {draftPosition && (
                    <DraggableDraftPin
                        position={draftPosition}
                        onDragEnd={handleDraftDrag}
                    />
                )}

                {reports.map((report) => (
                    <ReportMarker key={report.id} report={report} />
                ))}
            </MapContainer>
        </div>
    )
}
