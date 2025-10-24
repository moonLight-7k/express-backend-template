import { Job } from 'bull'
import { queueManager } from '../queueManager'
import { QueueName, NotificationJobData } from '../../types/queue'
import { logger } from '../../utils/logger'


async function processNotificationJob(
    job: Job<NotificationJobData>,
): Promise<any> {
    const { userId, title, message, type, metadata } = job.data

    logger.info(`🔔 Processing notification job ${job.id}`, {
        userId,
        title,
        type,
    })

    try {
        await job.progress(10)

        // TODO: Replace with actual notification sending logic

        await new Promise((resolve) => setTimeout(resolve, 500))
        await job.progress(50)

        await new Promise((resolve) => setTimeout(resolve, 500))
        await job.progress(90)

        logger.info(`✅ Notification sent successfully`, {
            jobId: job.id,
            userId,
            title,
            type,
        })

        await job.progress(100)

        return {
            success: true,
            sentAt: new Date().toISOString(),
            userId,
            type,
        }
    } catch (error: any) {
        logger.error(`❌ Failed to send notification`, {
            jobId: job.id,
            error: error.message,
            userId,
            title,
        })

        throw error
    }
}

export function initializeNotificationProcessor(): void {
    const notificationQueue = queueManager.getQueue(QueueName.NOTIFICATION)

    notificationQueue.process('send-notification', 10, processNotificationJob)

    logger.info(`🔔 Notification queue processor initialized`)
}
