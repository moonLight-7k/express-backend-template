import { Router } from 'express'
import { signup, login, deleteAccount, refreshToken } from '@/controller/auth'
import { authMiddleware } from '@/middleware/auth'

const authRouter = Router()

authRouter.post('/signup', signup)
authRouter.post('/login', login)
authRouter.post('/refresh-token', authMiddleware, refreshToken)

authRouter.delete('/delete/:userId', authMiddleware, deleteAccount)

export { authRouter }
