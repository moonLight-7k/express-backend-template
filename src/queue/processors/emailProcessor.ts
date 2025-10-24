import { Job } from 'bull'
import { queueManager } from '@/queue/queueManager'
import { QueueName, EmailJobData } from '@/types/queue'
import { logger } from '@/utils/logger'

async function processEmailJob(job: Job<EmailJobData>): Promise<any> {
    const { to, subject, body, html, cc, bcc, attachments } = job.data

    logger.info(`📧 Processing email job ${job.id}`, {
        to,
        subject,
    })

    try {
        await job.progress(10)

        // TODO: Replace with actual email sending logic

        await new Promise((resolve) => setTimeout(resolve, 1000))
        await job.progress(50)

        await new Promise((resolve) => setTimeout(resolve, 1000))
        await job.progress(90)

        logger.info(`✅ Email sent successfully`, {
            jobId: job.id,
            to,
            subject,
        })

        await job.progress(100)

        return {
            success: true,
            sentAt: new Date().toISOString(),
            recipients: Array.isArray(to) ? to : [to],
        }
    } catch (error: any) {
        logger.error(`❌ Failed to send email`, {
            jobId: job.id,
            error: error.message,
            to,
            subject,
        })

        throw error
    }
}

export function initializeEmailProcessor(): void {
    const emailQueue = queueManager.getQueue(QueueName.EMAIL)

    emailQueue.process('send-email', 5, processEmailJob)

    logger.info(`📧 Email queue processor initialized`)
}
