import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.ENV = 'test'
process.env.PORT = '3001'
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001'

global.console = {
    ...console,
    // Uncomment the line below if you want to suppress logs during tests
    // log: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
}

// Increase timeout for async tests
jest.setTimeout(10000)