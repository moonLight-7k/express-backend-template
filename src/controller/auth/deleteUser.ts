import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { db } from '../../config/firebase'
import { logger } from '../../utils/logger'

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const authenticatedUserId = req.user?.uid

    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (authenticatedUserId !== userId) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own account' })
    }

    await admin.auth().deleteUser(userId)

    await db.collection('users').doc(userId).delete()

    logger.info(`User account deleted: ${userId}`)

    return res.status(200).json({
      message: 'User account deleted successfully',
    })
  } catch (error: any) {
    logger.error('Error deleting user account:', error)

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(500).json({ error: 'Failed to delete user account' })
  }
}
