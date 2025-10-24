import request from 'supertest'
import express from 'express'
import { versionController } from '../../src/controller/version/version'

describe('Version Controller Tests', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())

        app.get('/api/v1/version', versionController)
    })

    it('should return version information from package.json', async () => {
        const response = await request(app).get('/api/v1/version')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('status', 'success')
        expect(response.body).toHaveProperty('version')
        expect(response.body).toHaveProperty('name')
        expect(response.body).toHaveProperty('timestamp')

        expect(response.body.name).toBe('express-ts-templete')
        expect(response.body.version).toBe('1.0.0')
    })

    it('should return correct data types', async () => {
        const response = await request(app).get('/api/v1/version')

        expect(typeof response.body.version).toBe('string')
        expect(typeof response.body.name).toBe('string')
        expect(typeof response.body.status).toBe('string')
        expect(typeof response.body.timestamp).toBe('string')
    })

    it('should return a valid ISO timestamp', async () => {
        const response = await request(app).get('/api/v1/version')

        const timestamp = new Date(response.body.timestamp)
        expect(timestamp.toISOString()).toBe(response.body.timestamp)
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })
})