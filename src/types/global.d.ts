import { auth } from 'firebase-admin'

declare global {
  namespace Express {
    interface Request {
      user?: auth.DecodedIdToken | { uid: string }
      requestId?: string
    }
  }
}

export {}
