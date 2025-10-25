import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import admin from 'firebase-admin'
import { db } from '@/config/firebase'
import { logger } from '@/utils/logger'

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email and password are required' })
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    })

    await db
      .collection('users')
      .doc(userRecord.uid)
      .set({
        email,
        displayName: displayName || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    logger.info(`New user created: ${userRecord.uid}`)
    const customToken = await admin.auth().createCustomToken(userRecord.uid)

    return res.status(StatusCodes.CREATED).json({
      message: 'User created successfully',
      userId: userRecord.uid,
      token: customToken,
    })
  } catch (error: any) {
    logger.error('Error creating user:', error)

    if (error.code === 'auth/email-already-exists') {
      return res.status(StatusCodes.CONFLICT).json({ error: 'Email already in use' })
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid email format' })
    }

    if (error.code === 'auth/weak-password') {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Password is too weak' })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create user' })
  }
}
