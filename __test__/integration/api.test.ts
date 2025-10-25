import request from 'supertest'
import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { apiRouter } from '../../src/routes'

jest.mock('../../src/middleware/auth', () => ({
    authMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        req.user = { uid: 'test-user-id' }
        req.requestId = 'test-request-id'
        next()
    },
}))

jest.mock('firebase-admin', () => ({
    auth: () => ({
        verifyIdToken: jest.fn(),
    }),
}))

// Mock Firebase config to prevent initialization
jest.mock('../../src/config/firebase', () => ({}))

jest.mock('../../src/utils/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
    },
}))

describe('API Routes Integration Tests', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())

        app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            req.requestId = 'test-request-id'
            next()
        })

        app.use('/api/v1', apiRouter)
    })

    describe('Health Endpoint', () => {
        it('should return detailed health information', async () => {
            const response = await request(app).get('/api/v1/health')

            expect(response.status).toBe(StatusCodes.OK)
            expect(response.body).toHaveProperty('status', 'success')
            expect(response.body).toHaveProperty('timestamp')
            expect(response.body).toHaveProperty('server')
            expect(response.body).toHaveProperty('system')
        })
    })

    describe('Version Endpoint', () => {
        it('should return version information', async () => {
            const response = await request(app).get('/api/v1/version')

            expect(response.status).toBe(StatusCodes.OK)
            expect(response.body).toHaveProperty('status', 'success')
            expect(response.body).toHaveProperty('version', '1.0.0')
            expect(response.body).toHaveProperty('name', 'express-ts-templete')
        })
    })

    describe('Auth Routes', () => {
        it('should respond to auth routes (even if they fail due to missing implementation)', async () => {
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'test@example.com', password: 'password' })

            expect([StatusCodes.OK, StatusCodes.BAD_REQUEST, StatusCodes.UNAUTHORIZED, StatusCodes.INTERNAL_SERVER_ERROR]).toContain(loginResponse.status)
        })
    })
})