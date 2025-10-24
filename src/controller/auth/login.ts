import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { logger } from '../../utils/logger'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const userRecord = await admin.auth().getUserByEmail(email)

    const customToken = await admin.auth().createCustomToken(userRecord.uid)

    logger.info(`User logged in: ${userRecord.uid}`)

    return res.status(200).json({
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
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    return res.status(500).json({ error: 'Failed to login' })
  }
}
