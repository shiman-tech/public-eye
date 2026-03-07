import { Link, useLocation } from 'react-router-dom'
import { MapPin, List, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)

    const navLinks = [
        { to: '/', label: 'Live Map', icon: MapPin },
        { to: '/status', label: 'Status Board', icon: List },
        { to: '/admin', label: 'Admin', icon: Shield },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <nav className="relative z-50 glass-dark border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-200">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-lg leading-none">CivicPulse</span>
                            <span className="block text-cyan-400 text-[10px] font-medium tracking-widest uppercase leading-none">
                                Infrastructure Reports
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(to)
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/10 py-2 px-4 space-y-1 animate-fade-in">
                    {navLinks.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(to)
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    )
}
