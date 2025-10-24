export { initializeEmailProcessor } from './emailProcessor'
export { initializeNotificationProcessor } from './notificationProcessor'
export { initializeDataProcessingProcessor } from './dataProcessingProcessor'

import { initializeEmailProcessor } from './emailProcessor'
import { initializeNotificationProcessor } from './notificationProcessor'
import { initializeDataProcessingProcessor } from './dataProcessingProcessor'
import { logger } from '@/utils/logger'

export function initializeAllProcessors(): void {
    logger.info('🚀 Initializing queue processors...')

    initializeEmailProcessor()
    initializeNotificationProcessor()
    initializeDataProcessingProcessor()

    logger.info('✅ All queue processors initialized')
}
