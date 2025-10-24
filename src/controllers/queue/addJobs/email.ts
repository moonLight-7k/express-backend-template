import { Request, Response } from 'express'
import { queueManager } from '@/queue/queueManager'
import { logger } from '@/utils/logger'
import { EmailJobData, QueueName } from '@/types/queue'

export const addEmailJob = async (req: Request, res: Response) => {
  try {
    const jobData: EmailJobData = req.body

    if (!jobData.to || !jobData.subject || !jobData.body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, body',
      })
    }

    const job = await queueManager.addJob(
      QueueName.EMAIL,
      'send-email',
      jobData,
      req.body.options,
    )

    logger.info(`Email job added: ${job.id}`)

    res.status(201).json({
      success: true,
      message: 'Email job added successfully',
      jobId: job.id,
      queueName: QueueName.EMAIL,
    })
  } catch (error: any) {
    logger.error('Error adding email job:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add email job',
      message: error.message,
    })
  }
}
