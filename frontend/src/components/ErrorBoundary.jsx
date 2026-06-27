import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">Something went wrong</h2>
                        <p className="text-slate-400 text-sm mt-1 max-w-md">
                            An unexpected error occurred. Please refresh the page to continue.
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="civic-btn-primary max-w-xs flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Page
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
