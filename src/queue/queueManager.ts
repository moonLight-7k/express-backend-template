import Bull, { Queue, Job, JobOptions as BullJobOptions } from 'bull'
import { bullRedisConfig } from '../config/redis'
import { logger } from '../utils/logger'
import {
    QueueName,
    JobData,
    JobOptions,
    QueueStatus,
    JobStatus,
} from '../types/queue'


class QueueManager {
    private queues: Map<string, Queue> = new Map()

    public getQueue(name: QueueName | string): Queue {
        if (!this.queues.has(name)) {
            const queue = new Bull(name, {
                redis: bullRedisConfig,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            })

            this.setupQueueEventHandlers(queue, name)
            this.queues.set(name, queue)

            logger.info(`📋 Queue "${name}" created`)
        }

        return this.queues.get(name)!
    }


    public async addJob(
        queueName: QueueName | string,
        jobName: string,
        data: JobData,
        options?: JobOptions,
    ): Promise<Job> {
        const queue = this.getQueue(queueName)

        const bullOptions: BullJobOptions = {
            ...options,
            backoff:
                typeof options?.backoff === 'object'
                    ? options.backoff
                    : { type: 'exponential', delay: options?.backoff || 2000 },
        }

        const job = await queue.add(jobName, data, bullOptions)

        logger.info(`✉️  Job added to "${queueName}" queue`, {
            jobId: job.id,
            jobName,
        })

        return job
    }


    public async getJob(
        queueName: QueueName | string,
        jobId: string,
    ): Promise<Job | null> {
        const queue = this.getQueue(queueName)
        return await queue.getJob(jobId)
    }


    public async getJobStatus(
        queueName: QueueName | string,
        jobId: string,
    ): Promise<JobStatus | null> {
        const job = await this.getJob(queueName, jobId)

        if (!job) {
            return null
        }

        const state = await job.getState()

        return {
            id: job.id,
            name: job.name,
            data: job.data,
            progress: job.progress(),
            returnValue: job.returnvalue,
            failedReason: job.failedReason,
            stacktrace: job.stacktrace,
            attemptsMade: job.attemptsMade,
            delay: job.opts?.delay || 0,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            state,
        }
    }


    public async getQueueStatus(
        queueName: QueueName | string,
    ): Promise<QueueStatus> {
        const queue = this.getQueue(queueName)

        const [waiting, active, completed, failed, delayed, isPaused] =
            await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
                queue.isPaused(),
            ])

        return {
            name: queueName,
            waiting,
            active,
            completed,
            failed,
            delayed,
            paused: isPaused,
        }
    }


    public async pauseQueue(queueName: QueueName | string): Promise<void> {
        const queue = this.getQueue(queueName)
        await queue.pause()
        logger.info(`⏸️  Queue "${queueName}" paused`)
    }


    public async resumeQueue(queueName: QueueName | string): Promise<void> {
        const queue = this.getQueue(queueName)
        await queue.resume()
        logger.info(`▶️  Queue "${queueName}" resumed`)
    }


    public async cleanQueue(
        queueName: QueueName | string,
        grace: number = 0,
        status?: 'completed' | 'wait' | 'active' | 'delayed' | 'failed',
    ): Promise<Job[]> {
        const queue = this.getQueue(queueName)
        const jobs = await queue.clean(grace, status)
        logger.info(`🧹 Queue "${queueName}" cleaned`, {
            jobsRemoved: jobs.length,
            status,
        })
        return jobs
    }


    public async emptyQueue(queueName: QueueName | string): Promise<void> {
        const queue = this.getQueue(queueName)
        await queue.empty()
        logger.info(`🗑️  Queue "${queueName}" emptied`)
    }

    public async removeJob(
        queueName: QueueName | string,
        jobId: string,
    ): Promise<void> {
        const job = await this.getJob(queueName, jobId)
        if (job) {
            await job.remove()
            logger.info(`🗑️  Job removed from "${queueName}" queue`, { jobId })
        }
    }

    public async retryJob(
        queueName: QueueName | string,
        jobId: string,
    ): Promise<void> {
        const job = await this.getJob(queueName, jobId)
        if (job) {
            await job.retry()
            logger.info(`🔄 Job retry initiated for "${queueName}" queue`, {
                jobId,
            })
        }
    }

    private setupQueueEventHandlers(queue: Queue, name: string): void {
        queue.on('error', (error) => {
            logger.error(`❌ Queue "${name}" error:`, error)
        })

        queue.on('waiting', (jobId) => {
            logger.debug(`⏳ Job ${jobId} is waiting in "${name}" queue`)
        })

        queue.on('active', (job) => {
            logger.debug(`🔄 Job ${job.id} started in "${name}" queue`)
        })

        queue.on('completed', (job, result) => {
            logger.info(`✅ Job ${job.id} completed in "${name}" queue`, {
                result,
            })
        })

        queue.on('failed', (job, err) => {
            logger.error(`❌ Job ${job?.id} failed in "${name}" queue`, {
                error: err.message,
                stack: err.stack,
            })
        })

        queue.on('progress', (job, progress) => {
            logger.debug(`📊 Job ${job.id} progress: ${progress}%`)
        })

        queue.on('stalled', (job) => {
            logger.warn(`⚠️  Job ${job.id} stalled in "${name}" queue`)
        })

        queue.on('removed', (job) => {
            logger.info(`🗑️  Job ${job.id} removed from "${name}" queue`)
        })
    }


    public async closeAll(): Promise<void> {
        const closePromises = Array.from(this.queues.entries()).map(
            async ([name, queue]) => {
                await queue.close()
                logger.info(`🔌 Queue "${name}" closed`)
            },
        )

        await Promise.all(closePromises)
        this.queues.clear()
    }

    public getQueueNames(): string[] {
        return Array.from(this.queues.keys())
    }

    public hasQueue(name: QueueName | string): boolean {
        return this.queues.has(name)
    }
}

export const queueManager = new QueueManager()
