import request from 'supertest'
import express from 'express'
import { healthController } from '../../src/controller/health/health'

describe('Health Controller Tests', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())

        app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            req.requestId = 'test-request-id'
            next()
        })

        app.get('/api/v1/health', healthController)
    })

    it('should return health status with system information', async () => {
        const response = await request(app).get('/api/v1/health')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('status', 'success')
        expect(response.body).toHaveProperty('timestamp')
        expect(response.body).toHaveProperty('server')
        expect(response.body).toHaveProperty('system')
        expect(response.body.server).toHaveProperty('uptime')
        expect(response.body.system).toHaveProperty('memory')
        expect(response.body.system).toHaveProperty('cpuModel')
        expect(response.body.system).toHaveProperty('cpuCores')
    })

    it('should include memory usage information', async () => {
        const response = await request(app).get('/api/v1/health')

        expect(response.body.system.memory).toHaveProperty('total')
        expect(response.body.system.memory).toHaveProperty('free')
        expect(response.body.system.memory).toHaveProperty('used')
        expect(typeof response.body.system.memory.total).toBe('string')
        expect(typeof response.body.system.memory.free).toBe('string')
        expect(response.body.system.memory.total).toMatch(/GB$/)
        expect(response.body.system.memory.free).toMatch(/GB$/)
    })

    it('should include CPU information', async () => {
        const response = await request(app).get('/api/v1/health')

        expect(response.body.system).toHaveProperty('cpuModel')
        expect(response.body.system).toHaveProperty('cpuCores')
        expect(response.body.system).toHaveProperty('loadAverage')
        expect(typeof response.body.system.cpuCores).toBe('number')
        expect(typeof response.body.system.loadAverage).toBe('object')
        expect(response.body.system.loadAverage).toHaveProperty('oneMinute')
        expect(response.body.system.loadAverage).toHaveProperty('fiveMinutes')
        expect(response.body.system.loadAverage).toHaveProperty('fifteenMinutes')
    })
})