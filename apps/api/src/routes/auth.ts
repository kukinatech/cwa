import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { db } from '../db/client'
import { users, cliTokens } from '../db/schema'
import { eq } from 'drizzle-orm'
import { hashToken, hashPassword, verifyPassword, signJwt } from '../lib/crypto'
import { authCliMiddleware, authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'
export const authRoutes = new Hono()

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  try {
    const { email, username, password } = await c.req.json()

    if (!email || !username || !password)
      return c.json({ error: 'Campos em falta' }, 400)

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing.length)
      return c.json({ error: 'Email ou senha incorretas' }, 409)

    const [user] = await db
      .insert(users)
      .values({ email, username, password: await hashPassword(password) })
      .returning({ id: users.id, username: users.username })

    return c.json({ user }, 201)

  } catch (error) {

    return c.json({ error: 'Algo deu errado durante o registro' }, 500)
  }
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})
// POST /api/auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {

    const { email, password } = c.req.valid('json')
    console.log(email, password)
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })


    if (!user) return c.json({ error: 'Credenciais inválidas' }, 401)

    const valid = await verifyPassword(password, user.password)

    if (!valid) return c.json({ error: 'Credenciais inválidas' }, 401)

    const token = await signJwt({ sub: user.id, email: user.email })

    // define o cookie HTTPOnly
    setCookie(c, 'cwa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
      path: '/',
    })

    return c.json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    })
  } catch (error) {
    return c.json({ error: 'Algo deu errado durante o login', details: (error as Error).message }, 500)
  }
})

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const token = getCookie(c, 'cwa_token')

  if (token) {
    const hash = hashToken(token)
    await db.delete(cliTokens).where(eq(cliTokens.tokenHash, hash))
  }

  deleteCookie(c, 'cwa_token', { path: '/' })

  return c.json({ message: 'Logged out' })
})

// GET /api/auth/me  (sessão actual)
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string

    const user = await db
      .select({ id: users.id, email: users.email, username: users.username, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user.length) return c.json({ error: 'Utilizador não encontrado' }, 404)

    return c.json({ user: user[0] })
  } catch (error) {
    return c.json({ error: 'Algo deu errado durante a verificação do usuário' }, 500)
  }
})

authRoutes.post('/token', authMiddleware, async (c) => {
  const userId = c.get('userId') as string

  const rawToken = Array.from(
    crypto.getRandomValues(new Uint8Array(20))
  ).map(b => b.toString(16).padStart(2, '0')).join('')

  const tokenHash = hashToken(rawToken)

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  await db.insert(cliTokens).values({ userId, tokenHash, expiresAt })

  // rawToken devolvido apenas uma vez — não fica guardado em plain text
  return c.json({ token: rawToken }, 201)
})