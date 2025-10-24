import { Request, Response } from 'express'
import { queueManager } from '@/queue/queueManager'
import { logger } from '@/utils/logger'
import { NotificationJobData, QueueName } from '@/types/queue'

export const addNotificationJob = async (req: Request, res: Response) => {
  try {
    const jobData: NotificationJobData = req.body

    if (
      !jobData.userId ||
      !jobData.title ||
      !jobData.message ||
      !jobData.type
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, title, message, type',
      })
    }

    const job = await queueManager.addJob(
      QueueName.NOTIFICATION,
      'send-notification',
      jobData,
      req.body.options,
    )

    logger.info(`Notification job added: ${job.id}`)

    res.status(201).json({
      success: true,
      message: 'Notification job added successfully',
      jobId: job.id,
      queueName: QueueName.NOTIFICATION,
    })
  } catch (error: any) {
    logger.error('Error adding notification job:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add notification job',
      message: error.message,
    })
  }
}
