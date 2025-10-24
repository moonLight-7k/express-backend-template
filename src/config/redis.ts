import Redis from 'ioredis'
import { env } from './environment'
import { logger } from '../utils/logger'

/**
 * Redis connection configuration
 */
const redisConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
}

/**
 * Create a new Redis client instance
 */
export const createRedisClient = (): Redis => {
    const client = new Redis(redisConfig)

    client.on('connect', () => {
        logger.info('📡 Redis client connected')
    })

    client.on('ready', () => {
        logger.info('✅ Redis client ready')
    })

    client.on('error', (err) => {
        logger.error('❌ Redis client error:', err)
    })

    client.on('close', () => {
        logger.warn('🔌 Redis client connection closed')
    })

    client.on('reconnecting', () => {
        logger.info('🔄 Redis client reconnecting...')
    })

    return client
}

/**
 * Default Redis client for general use
 */
export const redisClient = createRedisClient()

/**
 * Bull queue connection options
 */
export const bullRedisConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    },
}
