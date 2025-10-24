import { Job, Queue } from 'bull'

/**
 * Available queue names
 */
export enum QueueName {
    EMAIL = 'email',
    NOTIFICATION = 'notification',
    DATA_PROCESSING = 'data-processing',
}

/**
 * Email job data structure
 */
export interface EmailJobData {
    to: string | string[]
    subject: string
    body: string
    html?: string
    cc?: string[]
    bcc?: string[]
    attachments?: Array<{
        filename: string
        content: string | Buffer
        contentType?: string
    }>
}

/**
 * Notification job data structure
 */
export interface NotificationJobData {
    userId: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    metadata?: Record<string, any>
}

/**
 * Data processing job data structure
 */
export interface DataProcessingJobData {
    taskId: string
    type: string
    data: any
    options?: Record<string, any>
}

/**
 * Union type of all job data types
 */
export type JobData = EmailJobData | NotificationJobData | DataProcessingJobData

/**
 * Job options for Bull
 */
export interface JobOptions {
    attempts?: number
    backoff?: number | { type: string; delay: number }
    delay?: number
    timeout?: number
    priority?: number
    removeOnComplete?: boolean | number
    removeOnFail?: boolean | number
}

/**
 * Queue status information
 */
export interface QueueStatus {
    name: string
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    paused: boolean
}

/**
 * Job status information
 */
export interface JobStatus {
    id: string | number | undefined
    name: string | undefined
    data: any
    progress: number | object
    returnValue: any
    failedReason?: string
    stacktrace?: string[]
    attemptsMade: number
    delay: number
    timestamp: number
    processedOn?: number | null
    finishedOn?: number | null
    state: string
}
