import { createMiddleware } from 'hono/factory'
import { db } from '../db/client'
import { cliTokens, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { hashToken } from '../lib/crypto';
import { getCookie } from 'hono/cookie';


type AppContext = {
  Variables: {
    userId: string
  }
}


// hash simples com Bun nativo

export const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const token = getCookie(c, 'cwa_token')

  if (!token)
    return c.json({ error: 'Unauthorized' }, 401)

  const hash = hashToken(token)

  const [row] = await db
    .select({ userId: cliTokens.userId })
    .from(cliTokens)
    .where(eq(cliTokens.tokenHash, hash))
    .limit(1)

  if (!row)
    return c.json({ error: 'Unauthorized' }, 401)

  c.set('userId', row.userId)
  await next()
})