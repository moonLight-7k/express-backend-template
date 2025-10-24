import { auth } from 'firebase-admin'

export declare global {
  namespace Express {
    interface Request {
      user?: auth.DecodedIdToken | { uid: string }
      requestId?: string
    }
  }
}

export {}
