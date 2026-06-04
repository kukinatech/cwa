import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { db } from '../db/client'
import { users, cliTokens } from '../db/schema'
import { eq } from 'drizzle-orm'
import { hashToken, hashPassword, verifyPassword } from '../lib/crypto'

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

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password)
    return c.json({ error: 'Missing fields' }, 400)

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user || !(await verifyPassword(password, user.password)))
    return c.json({ error: 'Credencias invalidas' }, 401)

  const raw   = crypto.randomUUID() + crypto.randomUUID()
  const hash  = hashToken(raw)

  await db.insert(cliTokens).values({
    userId:    user.id,
    tokenHash: hash,
    label:     'session',
  })

  // define cookie HttpOnly — nunca exposto ao JS
  setCookie(c, 'cwa_token', raw, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 30, // 30 dias
  })

  return c.json({
    user: { id: user.id, username: user.username, email: user.email },
  })
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
authRoutes.get('/me', async (c) => {
  const token = getCookie(c, 'cwa_token')

  if (!token)
    return c.json({ error: 'Não autorizado' }, 401)

  const hash = hashToken(token)

  const [row] = await db
    .select({
      id:       users.id,
      username: users.username,
      email:    users.email,
    })
    .from(cliTokens)
    .innerJoin(users, eq(cliTokens.userId, users.id))
    .where(eq(cliTokens.tokenHash, hash))
    .limit(1)

  if (!row)
    return c.json({ error: 'Não autorizado' }, 401)

  return c.json({ user: row })
})