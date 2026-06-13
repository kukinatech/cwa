import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { cliTokens, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { hashToken, verifyJwt } from '../lib/crypto';
import { getCookie } from 'hono/cookie';

export const authMiddleware = createMiddleware<{ Variables: { userId: string } }>(
  async (c, next) => {
    // 1. tentar cookie HTTPOnly (plataforma web)
    const cookieToken = getCookie(c, 'cwa_token')
      console.log(cookieToken)

    if (cookieToken) {
      try {
        const payload = await verifyJwt(cookieToken)
        c.set('userId', payload.sub)
        return await next()
      } catch { }
    }

    // 2. tentar Bearer header (CLI + /auth/token)
    const header = c.req.header('Authorization')
    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7)

      // 2a. tentar JWT (usado pelo /auth/token da CLI)
      try {
        const payload = await verifyJwt(token)
        c.set('userId', payload.sub)
        return await next()
      } catch { }

      // 2b. tentar token CLI (guardado na base de dados)
      const tokenHash = hashToken(token)

      
      const [cliToken] = await db
        .select({ userId: cliTokens.userId, expiresAt: cliTokens.expiresAt })
        .from(cliTokens)
        .where(eq(cliTokens.tokenHash, tokenHash))
        .limit(1)

      if (!cliToken) return c.json({ message: 'Não autorizado' }, 401)
      if (!cliToken.expiresAt || cliToken.expiresAt < new Date()) {
        return c.json({ message: 'Token expirado' }, 401)
      }

      c.set('userId', cliToken.userId)
      return await next()
    }

    return c.json({ message: 'Não autorizado' }, 401)
  }
)