import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import StatusBadge from './StatusBadge'

const STATUS_COLORS = {
    Open: { bg: '#ef4444', shadow: 'rgba(239,68,68,0.5)' },
    'In Progress': { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.5)' },
    Resolved: { bg: '#10b981', shadow: 'rgba(16,185,129,0.5)' },
}

const CATEGORY_ICONS = {
    Pothole: '🕳️',
    Sanitation: '🗑️',
    Streetlight: '💡',
    Flooding: '🌊',
    Vandalism: '🖊️',
    Other: '⚠️',
}

function createMarkerIcon(status) {
    const { bg, shadow } = STATUS_COLORS[status] || STATUS_COLORS.Open
    const html = `
    <div style="
      width: 28px; height: 28px;
      background: ${bg};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 12px ${shadow}, 0 0 0 3px rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.4);
      transition: transform 0.2s;
    ">
      <div style="
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        width: 10px; height: 10px;
        background: rgba(255,255,255,0.9);
        border-radius: 50%;
      "></div>
    </div>
  `
    return L.divIcon({
        html,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -32],
    })
}

export default function ReportMarker({ report, onClick }) {
    const icon = createMarkerIcon(report.status)
    const emoji = CATEGORY_ICONS[report.category] || '⚠️'
    const dateStr = new Date(report.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    })

    return (
        <Marker position={[report.lat, report.lng]} icon={icon}>
            <Popup maxWidth={280} className="civic-popup">
                <div className="p-1">
                    {/* Image thumbnail */}
                    {report.image_url && (
                        <div className="mb-3 rounded-lg overflow-hidden" style={{ height: '140px' }}>
                            <img
                                src={report.image_url}
                                alt={report.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Category & Status */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <span>{emoji}</span> {report.category}
                        </span>
                        <StatusBadge status={report.status} size="sm" />
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-white mb-1">{report.title}</h3>

                    {/* Address */}
                    {report.address && (
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            📍 {report.address}
                        </p>
                    )}

                    {/* Description */}
                    {report.description && (
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                            {report.description.length > 100
                                ? report.description.slice(0, 100) + '…'
                                : report.description}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/10">
                        <span>{report.reported_by || 'Anonymous'}</span>
                        <span>{dateStr}</span>
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}
