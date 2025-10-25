import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import admin from 'firebase-admin'
import { logger } from '@/utils/logger'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email and password are required' })
    }

    const userRecord = await admin.auth().getUserByEmail(email)

    const customToken = await admin.auth().createCustomToken(userRecord.uid)

    logger.info(`User logged in: ${userRecord.uid}`)

    return res.status(StatusCodes.OK).json({
      message: 'Login successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    })
  } catch (error: any) {
    logger.error('Error during login:', error)

    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid email or password' })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to login' })
  }
}
