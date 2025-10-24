import dotenv from 'dotenv'

dotenv.config()

import express from 'express'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      user?: any
    }
  }
}
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { v4 as uuidv4 } from 'uuid'
import { apiRouter } from '@/routes'
import { logger } from '@/utils/logger'
import { env, isDevelopment, isProduction } from '@/config/environment'
import { initializeAllProcessors } from '@/queue/processors'
import { queueManager } from '@/queue/queueManager'

const app = express()

// Initialize queue processors
initializeAllProcessors()

app.use(
  cors({
    origin:
      env.ALLOWED_ORIGINS.length === 1 && env.ALLOWED_ORIGINS[0] === '*'
        ? '*'
        : env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use(helmet())

app.use(compression())

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7', // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: env.RATE_LIMIT_MESSAGE,
})
app.use(limiter)

app.use(express.json({ limit: env.JSON_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: env.URL_ENCODED_LIMIT }))

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = uuidv4()
    req.requestId = requestId

    res.setHeader('X-Request-Id', requestId)
    next()
  },
)

morgan.token('id', (req: express.Request) => req.requestId || '-')

const morganStream = {
  write: (message: string) => {
    logger.info(message.trim())
  },
}

if (isProduction()) {
  app.use(
    morgan(
      ':id :remote-addr :method :url :status :response-time ms - :res[content-length]',
      {
        stream: morganStream,
      },
    ),
  )
} else {
  app.use(
    morgan(
      ':id :method :url :status :response-time ms - :res[content-length]',
      {
        stream: morganStream,
      },
    ),
  )

  app.use(morgan('dev'))
}

const PORT = env.PORT

app.use('/api/v1', apiRouter)

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  logger.warn(`Not found [${req.requestId}]: ${req.method} ${req.url}`)
  res.status(404).json({
    error: 'Resource not found',
    requestId: req.requestId,
  })
})

// Global error handler
app.use(
  (
    err: Error & { status?: number },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(`Error [${req.requestId}]: ${err.message}`, {
      stack: err.stack,
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    })

    res.status(err.status || 500).json({
      error: isProduction() ? 'Internal server error' : err.message,
      requestId: req.requestId,
    })
  },
)

app.listen(PORT, () => {
  logger.info(`🔥 Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server and queues')
  await queueManager.closeAll()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server and queues')
  await queueManager.closeAll()
  process.exit(0)
})
