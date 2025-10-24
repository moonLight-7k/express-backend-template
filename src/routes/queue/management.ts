import { Router } from 'express'
import { pauseQueue, resumeQueue, cleanQueue, emptyQueue } from '../../controller/queue'

const managementRouter = Router()

managementRouter.post('/:queueName/pause', pauseQueue)
managementRouter.post('/:queueName/resume', resumeQueue)
managementRouter.post('/:queueName/clean', cleanQueue)
managementRouter.post('/:queueName/empty', emptyQueue)

export { managementRouter }
