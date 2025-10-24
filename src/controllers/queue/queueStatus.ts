import { Request, Response } from 'express'
import { queueManager } from '@/queue/queueManager'
import { QueueName } from '@/types/queue'
import { logger } from '@/utils/logger'

export const getQueueStatus = async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params

    if (!queueName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: queueName',
      })
    }

    const status = await queueManager.getQueueStatus(queueName)

    logger.info(`Queue status retrieved: ${queueName}`)

    res.status(200).json({
      success: true,
      status,
    })
  } catch (error: any) {
    logger.error('Error getting queue status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status',
      message: error.message,
    })
  }
}

export const getAllQueuesStatus = async (req: Request, res: Response) => {
  try {
    const queueNames = Object.values(QueueName)

    const statusPromises = queueNames.map(async (name) => {
      try {
        return await queueManager.getQueueStatus(name)
      } catch (error) {
        logger.error(`Error getting status for queue ${name}:`, error)
        return {
          name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
          error: 'Failed to retrieve status',
        }
      }
    })

    const statuses = await Promise.all(statusPromises)

    logger.info('All queue statuses retrieved')

    res.status(200).json({
      success: true,
      queues: statuses,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error('Error getting all queues status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get all queues status',
      message: error.message,
    })
  }
}
