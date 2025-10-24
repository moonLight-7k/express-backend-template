import { Router } from 'express'
import {
    addEmailJob,
    addNotificationJob,
    addDataProcessingJob,
    retryJob,
    removeJob,
} from '@/controllers/queue'
import { getJobStatus } from '@/controllers/queue'

const jobsRouter = Router()

jobsRouter.post('/email', addEmailJob)
jobsRouter.post('/notification', addNotificationJob)
jobsRouter.post('/data-processing', addDataProcessingJob)

jobsRouter.get('/:queueName/:jobId', getJobStatus)
jobsRouter.post('/:queueName/:jobId/retry', retryJob)
jobsRouter.delete('/:queueName/:jobId', removeJob)

export { jobsRouter }
