import { Router } from 'express'
import { healthController } from '@/controllers/health/health'
import { versionController } from '@/controllers/version/version'
import { authMiddleware } from '@/middleware/auth'
import { authRouter } from '@/routes/auth'
import { queueRouter } from '@/routes/queue'

const apiRouter = Router()

apiRouter.get('/health', authMiddleware, healthController)

apiRouter.get('/version', authMiddleware, versionController)

apiRouter.use('/auth', authRouter)

apiRouter.use('/queue', queueRouter)

export { apiRouter }
