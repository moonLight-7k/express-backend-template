import { Request, Response } from 'express'
import { queueManager } from '../../queue/queueManager'
import { logger } from '../../utils/logger'


export const retryJob = async (req: Request, res: Response) => {
    try {
        const { queueName, jobId } = req.params

        if (!queueName || !jobId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: queueName, jobId',
            })
        }

        await queueManager.retryJob(queueName, jobId)

        logger.info(`Job retry initiated: ${queueName}/${jobId}`)

        res.status(200).json({
            success: true,
            message: 'Job retry initiated successfully',
            queueName,
            jobId,
        })
    } catch (error: any) {
        logger.error('Error retrying job:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to retry job',
            message: error.message,
        })
    }
}


export const removeJob = async (req: Request, res: Response) => {
    try {
        const { queueName, jobId } = req.params

        if (!queueName || !jobId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: queueName, jobId',
            })
        }

        await queueManager.removeJob(queueName, jobId)

        logger.info(`Job removed: ${queueName}/${jobId}`)

        res.status(200).json({
            success: true,
            message: 'Job removed successfully',
            queueName,
            jobId,
        })
    } catch (error: any) {
        logger.error('Error removing job:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to remove job',
            message: error.message,
        })
    }
}
