import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { apiRouter } from '../src/routes'
import '../src/types/global'

export const createTestApp = () => {
    const app = express()

    app.use(cors())
    app.use(helmet())
    app.use(compression())

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 1000, // Higher limit for tests
        standardHeaders: 'draft-7',
        legacyHeaders: false,
    })
    app.use(limiter)

    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const requestId = uuidv4()
        req.requestId = requestId
        res.setHeader('X-Request-Id', requestId)
        next()
    })

    app.get('/health', (req: express.Request, res: express.Response) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            environment: 'test'
        })
    })

    app.use('/api/v1', apiRouter)

    app.use((req: express.Request, res: express.Response) => {
        res.status(404).json({
            error: 'Resource not found',
            requestId: req.requestId,
        })
    })

    app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(err.status || 500).json({
            error: err.message || 'Internal server error',
            requestId: req.requestId,
        })
    })

    return app
}