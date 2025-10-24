import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { db } from '../../config/firebase'
import { logger } from '../../utils/logger'

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
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

    return res.status(201).json({
      message: 'User created successfully',
      userId: userRecord.uid,
      token: customToken,
    })
  } catch (error: any) {
    logger.error('Error creating user:', error)

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use' })
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' })
    }

    return res.status(500).json({ error: 'Failed to create user' })
  }
}
