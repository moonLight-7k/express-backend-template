import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { logger } from '../../utils/logger'

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.user?.uid

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const newToken = await admin.auth().createCustomToken(authenticatedUserId)

    logger.info(`Token refreshed for user: ${authenticatedUserId}`)

    return res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken,
    })
  } catch (error: any) {
    logger.error('Error refreshing token:', error)
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
}
