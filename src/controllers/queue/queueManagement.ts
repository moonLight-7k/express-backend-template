import { Request, Response } from 'express'
import { queueManager } from '@/queue/queueManager'
import { logger } from '@/utils/logger'

export const pauseQueue = async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: queueName',
      })
    }

    await queueManager.pauseQueue(queueName)

    logger.info(`Queue paused: ${queueName}`)

    res.status(200).json({
      success: true,
      message: `Queue "${queueName}" paused successfully`,
      queueName,
    })
  } catch (error: any) {
    logger.error('Error pausing queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to pause queue',
      message: error.message,
    })
  }
}

export const resumeQueue = async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: queueName',
      })
    }

    await queueManager.resumeQueue(queueName)

    logger.info(`Queue resumed: ${queueName}`)

    res.status(200).json({
      success: true,
      message: `Queue "${queueName}" resumed successfully`,
      queueName,
    })
  } catch (error: any) {
    logger.error('Error resuming queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to resume queue',
      message: error.message,
    })
  }
}

export const cleanQueue = async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params
    const { grace = 0, status = 'completed' } = req.body

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: queueName',
      })
    }

    const validStatuses = ['completed', 'wait', 'active', 'delayed', 'failed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const jobs = await queueManager.cleanQueue(queueName, grace, status)

    logger.info(`Queue cleaned: ${queueName}`)

    res.status(200).json({
      success: true,
      message: `Queue "${queueName}" cleaned successfully`,
      queueName,
      jobsRemoved: jobs.length,
      status,
    })
  } catch (error: any) {
    logger.error('Error cleaning queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to clean queue',
      message: error.message,
    })
  }
}

export const emptyQueue = async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: queueName',
      })
    }

    await queueManager.emptyQueue(queueName)

    logger.info(`Queue emptied: ${queueName}`)

    res.status(200).json({
      success: true,
      message: `Queue "${queueName}" emptied successfully`,
      queueName,
    })
  } catch (error: any) {
    logger.error('Error emptying queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to empty queue',
      message: error.message,
    })
  }
}
