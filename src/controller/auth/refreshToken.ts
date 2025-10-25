import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import admin from 'firebase-admin'
import { logger } from '@/utils/logger'

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.user?.uid

    if (!authenticatedUserId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authenticated' })
    }

    const newToken = await admin.auth().createCustomToken(authenticatedUserId)

    logger.info(`Token refreshed for user: ${authenticatedUserId}`)

    return res.status(StatusCodes.OK).json({
      message: 'Token refreshed successfully',
      token: newToken,
    })
  } catch (error: any) {
    logger.error('Error refreshing token:', error)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to refresh token' })
  }
}
