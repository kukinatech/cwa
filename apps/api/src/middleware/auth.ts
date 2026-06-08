import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { cliTokens, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { hashToken, verifyJwt } from '../lib/crypto';
import { HTTPException } from 'hono/http-exception';




// hash simples com Bun nativo

export const authMiddleware = createMiddleware<{ Variables: { userId: string } }>(
  async (c, next) => {
    const header = c.req.header('Authorization')

    if (!header?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Token em falta' })
    }

    const token = header.slice(7)

    // 1. tentar JWT de sessão
    try {
      const payload = await verifyJwt(token)
      c.set('userId', payload.sub)
      return await next()
    } catch { }

    // 2. tentar token CLI (hash SHA-256)
    const tokenHash = hashToken(token)
    const [cliToken] = await db
      .select({ userId: cliTokens.userId, expiresAt: cliTokens.expiresAt })
      .from(cliTokens)
      .where(eq(cliTokens.tokenHash, tokenHash))
      .limit(1)

    if (!cliToken) {
      throw new HTTPException(401, { message: 'Token inválido' })
    }

    if (cliToken.expiresAt < new Date()) {
      throw new HTTPException(401, { message: 'Token expirado' })
    }

    c.set('userId', cliToken.userId)
    await next()
  }
)