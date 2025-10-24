import { Router } from 'express'
import { getQueueStatus, getAllQueuesStatus } from '@/controllers/queue'

const statusRouter = Router()

statusRouter.get('/', getAllQueuesStatus)
statusRouter.get('/:queueName', getQueueStatus)

export { statusRouter }
