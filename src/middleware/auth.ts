import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import admin from 'firebase-admin'
import { logger } from '@/utils/logger'
import * as jwt from 'jsonwebtoken'

/**
 * Authentication middleware to verify Firebase JWT tokens
 * This middleware can handle both ID tokens and custom tokens
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized - No token provided' })
    }

    const token = authHeader.split(' ')[1]

    try {
      const decodedToken = await admin.auth().verifyIdToken(token)
      req.user = decodedToken
      next()
    } catch (idTokenError: any) {
      try {
        const decoded = jwt.decode(token) as { uid?: string }

        if (!decoded || !decoded.uid) {
          throw new Error('Invalid token format')
        }

        const userRecord = await admin.auth().getUser(decoded.uid)

        req.user = { uid: userRecord.uid }
        next()
      } catch (customTokenError: any) {
        logger.error('Authentication error:', idTokenError)
        logger.error('Custom token error:', customTokenError)

        if (idTokenError.code === 'auth/id-token-expired') {
          return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token expired' })
        }

        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' })
      }
    }
  } catch (error: any) {
    logger.error('Authentication error:', error)
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' })
  }
}
