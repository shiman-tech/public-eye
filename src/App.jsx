import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import StatusBoard from './pages/StatusBoard'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden bg-civic-dark">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/status" element={
              <div className="h-full overflow-y-auto">
                <StatusBoard />
              </div>
            } />
            <Route path="/login" element={
              <div className="h-full overflow-y-auto">
                <LoginPage />
              </div>
            } />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}
