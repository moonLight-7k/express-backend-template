import request from 'supertest'
import express from 'express'
import { authMiddleware } from '../../src/middleware/auth'

// Mock firebase-admin completely
jest.mock('firebase-admin', () => {
    const mockAuth = {
        verifyIdToken: jest.fn(),
        getUser: jest.fn(),
    }

    return {
        __esModule: true,
        default: {
            auth: () => mockAuth,
        },
        auth: () => mockAuth,
    }
})

jest.mock('jsonwebtoken', () => ({
    decode: jest.fn(),
}))

jest.mock('../../src/utils/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}))

// Mock Firebase config to prevent initialization
jest.mock('../../src/config/firebase', () => ({}))

import admin from 'firebase-admin'
import * as jwt from 'jsonwebtoken'

describe('Auth Middleware Tests', () => {
    let app: express.Application
    const mockVerifyIdToken = admin.auth().verifyIdToken as jest.Mock
    const mockGetUser = admin.auth().getUser as jest.Mock
    const mockJwtDecode = jwt.decode as jest.Mock

    beforeEach(() => {
        app = express()
        app.use(express.json())

        app.get('/protected', authMiddleware, (req: express.Request, res: express.Response) => {
            res.json({ message: 'Access granted', user: req.user })
        })

        jest.clearAllMocks()
    })

    describe('Missing Authorization Header', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const response = await request(app).get('/protected')

            expect(response.status).toBe(401)
            expect(response.body).toHaveProperty('error', 'Unauthorized - No token provided')
        })

        it('should return 401 when authorization header does not start with Bearer', async () => {
            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'InvalidToken')

            expect(response.status).toBe(401)
            expect(response.body).toHaveProperty('error', 'Unauthorized - No token provided')
        })
    })

    describe('Valid Token Scenarios', () => {
        it('should allow access with valid Firebase ID token', async () => {
            const mockDecodedToken = { uid: 'test-user-id', email: 'test@example.com' }
            mockVerifyIdToken.mockResolvedValue(mockDecodedToken)

            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'Bearer valid-firebase-token')

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty('message', 'Access granted')
            expect(response.body.user).toEqual(mockDecodedToken)
            expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-firebase-token')
        })

        it('should allow access with valid custom token when ID token fails', async () => {
            const idTokenError = new Error('ID token verification failed')
            mockVerifyIdToken.mockRejectedValue(idTokenError)

            const mockDecodedCustomToken = { uid: 'test-user-id' }
            mockJwtDecode.mockReturnValue(mockDecodedCustomToken)

            const mockUserRecord = { uid: 'test-user-id' }
            mockGetUser.mockResolvedValue(mockUserRecord)

            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'Bearer valid-custom-token')

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty('message', 'Access granted')
            expect(response.body.user).toEqual({ uid: 'test-user-id' })
            expect(mockJwtDecode).toHaveBeenCalledWith('valid-custom-token')
            expect(mockGetUser).toHaveBeenCalledWith('test-user-id')
        })
    })

    describe('Invalid Token Scenarios', () => {
        it('should return 401 for expired ID token', async () => {
            const expiredError = new Error('Token expired')
                ; (expiredError as any).code = 'auth/id-token-expired'
            mockVerifyIdToken.mockRejectedValue(expiredError)

            mockJwtDecode.mockReturnValue(null)

            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'Bearer expired-token')

            expect(response.status).toBe(401)
            expect(response.body).toHaveProperty('error', 'Token expired')
        })

        it('should return 401 for invalid custom token format', async () => {
            const idTokenError = new Error('ID token verification failed')
            mockVerifyIdToken.mockRejectedValue(idTokenError)

            mockJwtDecode.mockReturnValue({ invalid: 'format' })

            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'Bearer invalid-custom-token')

            expect(response.status).toBe(401)
            expect(response.body).toHaveProperty('error', 'Invalid token')
        })

        it('should return 401 when user does not exist for custom token', async () => {
            const idTokenError = new Error('ID token verification failed')
            mockVerifyIdToken.mockRejectedValue(idTokenError)

            mockJwtDecode.mockReturnValue({ uid: 'non-existent-user' })
            mockGetUser.mockRejectedValue(new Error('User not found'))

            const response = await request(app)
                .get('/protected')
                .set('Authorization', 'Bearer custom-token-non-existent-user')

            expect(response.status).toBe(401)
            expect(response.body).toHaveProperty('error', 'Invalid token')
        })
    })
})