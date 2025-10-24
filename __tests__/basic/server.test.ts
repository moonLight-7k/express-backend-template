import request from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-12345'
}))

const { v4: uuidv4 } = require('uuid')

const createTestApp = () => {
    const app = express()

    app.use(cors())
    app.use(helmet())
    app.use(express.json())

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

    app.use((req: express.Request, res: express.Response) => {
        res.status(404).json({
            error: 'Resource not found',
            requestId: req.requestId,
        })
    })

    return app
}

describe('Server Basic Tests', () => {
    const app = createTestApp()

    describe('Health Check', () => {
        it('should return 200 for basic health check', async () => {
            const response = await request(app).get('/health')

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty('status', 'OK')
            expect(response.body).toHaveProperty('timestamp')
            expect(response.body).toHaveProperty('requestId')
            expect(response.body).toHaveProperty('environment', 'test')
        })

        it('should include request ID in response headers', async () => {
            const response = await request(app).get('/health')

            expect(response.headers).toHaveProperty('x-request-id')
            expect(response.headers['x-request-id']).toBeTruthy()
        })
    })

    describe('404 Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app).get('/non-existent-route')

            expect(response.status).toBe(404)
            expect(response.body).toHaveProperty('error', 'Resource not found')
            expect(response.body).toHaveProperty('requestId')
        })
    })

    describe('CORS Headers', () => {
        it('should include CORS headers in response', async () => {
            const response = await request(app).get('/health')

            expect(response.headers).toHaveProperty('access-control-allow-origin')
        })
    })

    describe('Security Headers', () => {
        it('should include security headers from helmet', async () => {
            const response = await request(app).get('/health')

            expect(response.headers).toHaveProperty('x-frame-options')
            expect(response.headers).toHaveProperty('x-content-type-options')
        })
    })
})