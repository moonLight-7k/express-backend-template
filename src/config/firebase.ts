import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { env, validateFirebaseConfig } from './environment'

dotenv.config()


let credential

if (validateFirebaseConfig()) {
  credential = admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID!,
    clientEmail: env.FIREBASE_CLIENT_EMAIL!,
    privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  })
} else {
  try {
    const serviceAccount = require('../../firebase-service-account.json')
    credential = admin.credential.cert(serviceAccount)
  } catch (error) {
    throw new Error(
      'Firebase configuration error: Either provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables, or ensure firebase-service-account.json exists in the project root.',
    )
  }
}

admin.initializeApp({
  credential,
  databaseURL: env.FIREBASE_DATABASE_URL || `https://${env.FIREBASE_PROJECT_ID}.firebaseio.com`,
})

export const db = admin.firestore()
export const realtimeDb = admin.database()
