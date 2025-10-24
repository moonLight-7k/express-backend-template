import { Request, Response } from 'express'
import { queueManager } from '@/queue/queueManager'
import { logger } from '@/utils/logger'

export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params

    if (!queueName || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: queueName, jobId',
      })
    }

    const jobStatus = await queueManager.getJobStatus(queueName, jobId)

    if (!jobStatus) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        queueName,
        jobId,
      })
    }

    logger.info(`Job status retrieved: ${queueName}/${jobId}`)

    res.status(200).json({
      success: true,
      jobStatus,
    })
  } catch (error: any) {
    logger.error('Error getting job status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      message: error.message,
    })
  }
}
