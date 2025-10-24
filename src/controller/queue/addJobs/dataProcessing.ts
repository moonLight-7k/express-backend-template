import { Request, Response } from 'express'
import { queueManager } from '@/queue/queueManager'
import { logger } from '@/utils/logger'
import { DataProcessingJobData, QueueName } from '@/types/queue'



export const addDataProcessingJob = async (req: Request, res: Response) => {
  try {
    const jobData: DataProcessingJobData = req.body

    if (!jobData.taskId || !jobData.type || !jobData.data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: taskId, type, data',
      })
    }

    const job = await queueManager.addJob(
      QueueName.DATA_PROCESSING,
      'process-data',
      jobData,
      req.body.options,
    )

    logger.info(`Data processing job added: ${job.id}`)

    res.status(201).json({
      success: true,
      message: 'Data processing job added successfully',
      jobId: job.id,
      queueName: QueueName.DATA_PROCESSING,
    })
  } catch (error: any) {
    logger.error('Error adding data processing job:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add data processing job',
      message: error.message,
    })
  }
}
