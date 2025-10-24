interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  ENV: 'development' | 'production' | 'test'
  PORT: number

  ALLOWED_ORIGINS: string[]

  RATE_LIMIT_WINDOW_MS: number
  RATE_LIMIT_MAX_REQUESTS: number
  RATE_LIMIT_MESSAGE: string

  JSON_LIMIT: string
  URL_ENCODED_LIMIT: string

  LOG_LEVEL: string

  FIREBASE_PROJECT_ID?: string
  FIREBASE_CLIENT_EMAIL?: string
  FIREBASE_PRIVATE_KEY?: string
  FIREBASE_DATABASE_URL?: string

  JWT_SECRET?: string

  DATABASE_URL?: string
}

/**
 * Validates and returns environment configuration
 * @returns Validated environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const requiredEnvVars = ['NODE_ENV', 'ENV', 'PORT', 'ALLOWED_ORIGINS']

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  return {
    NODE_ENV:
      (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    ENV: (process.env.ENV as EnvironmentConfig['ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),

    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],

    RATE_LIMIT_WINDOW_MS: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10,
    ),
    RATE_LIMIT_MAX_REQUESTS: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10,
    ),
    RATE_LIMIT_MESSAGE:
      process.env.RATE_LIMIT_MESSAGE ||
      'Too many requests from this IP, please try again after 15 minutes',

    JSON_LIMIT: process.env.JSON_LIMIT || '10mb',
    URL_ENCODED_LIMIT: process.env.URL_ENCODED_LIMIT || '10mb',

    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,

    JWT_SECRET: process.env.JWT_SECRET,

    DATABASE_URL: process.env.DATABASE_URL,
  }
}

/**
 * Validates Firebase environment variables
 * @returns boolean indicating if Firebase is properly configured
 */
export function validateFirebaseConfig(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' || process.env.ENV === 'development'
  )
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

export const env = getEnvironmentConfig()
