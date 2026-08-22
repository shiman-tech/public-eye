import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { config } from './config.js'
import reportsRouter from './routes/reports.js'
import classifyRouter from './routes/classify.js'
import geocodeRouter from './routes/geocode.js'

const app = express()

// Logger
app.use(morgan('dev'))

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, true) // fallback permissive in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Route Handlers
app.use('/api/reports', reportsRouter)
app.use('/api', classifyRouter)
app.use('/api/geocode', geocodeRouter)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ detail: 'Not Found' })
})

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err)
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({ detail: message })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`PublicEye API server listening on http://0.0.0.0:${config.port}`)
  })
}

export default app
