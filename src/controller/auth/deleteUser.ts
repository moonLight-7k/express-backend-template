import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import admin from 'firebase-admin'
import { db } from '@/config/firebase'
import { logger } from '@/utils/logger'

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.user?.uid

    const { userId } = req.params

    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'User ID is required' })
    }

    if (authenticatedUserId !== userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ error: 'You can only delete your own account' })
    }

    await admin.auth().deleteUser(userId)

    await db.collection('users').doc(userId).delete()

    logger.info(`User account deleted: ${userId}`)

    return res.status(StatusCodes.OK).json({
      message: 'User account deleted successfully',
    })
  } catch (error: any) {
    logger.error('Error deleting user account:', error)

    if (error.code === 'auth/user-not-found') {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete user account' })
  }
}
