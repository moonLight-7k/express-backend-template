import { Router } from 'express'
import { jobsRouter } from './jobs'
import { statusRouter } from './status'
import { managementRouter } from './management'

const queueRouter = Router()

queueRouter.use('/jobs', jobsRouter)
queueRouter.use('/status', statusRouter)
queueRouter.use('/manage', managementRouter)

export { queueRouter }
