import { Hono } from 'hono'
import { db } from '../db/client'
import { compStyles, components } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

export const styleRoutes = new Hono()

// GET /api/styles/:componentSlug/default  (público — estilo original do autor)
styleRoutes.get('/:componentSlug/default', async (c) => {
  try {
    const [comp] = await db
      .select({ id: components.id })
      .from(components)
      .where(eq(components.slug, c.req.param('componentSlug')))
      .limit(1)

    if (!comp) return c.json({ error: 'Component not found' }, 404)

    const [style] = await db
      .select()
      .from(compStyles)
      .where(
        and(
          eq(compStyles.componentId, comp.id),
          eq(compStyles.isDefault, true)
        )
      )
      .limit(1)

    if (!style) return c.json({ error: 'No default style' }, 404)

    return c.json({ styles: style.styles })

  } catch (error) {
    return c.json({ error: 'Algo deu errado', message: (error as Error).message }, 500)
  }
})

// GET /api/styles/:componentSlug/mine  (requer token — estilo do utilizador)
styleRoutes.get('/:componentSlug/mine', authMiddleware, async (c) => {
  const userId = c.get('userId') as string

  const [comp] = await db
    .select({ id: components.id })
    .from(components)
    .where(eq(components.slug, c.req.param('componentSlug')))
    .limit(1)

  if (!comp) return c.json({ error: 'Component not found' }, 404)

  const [style] = await db
    .select()
    .from(compStyles)
    .where(
      and(
        eq(compStyles.componentId, comp.id),
        eq(compStyles.userId, userId)
      )
    )
    .limit(1)

  return c.json({ styles: style?.styles ?? null })
})

// POST /api/styles/:componentSlug  (salva/actualiza estilo — requer token)
styleRoutes.post('/:componentSlug', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const { styles } = await c.req.json()

  if (!styles) return c.json({ error: 'Missing styles' }, 400)

  const [comp] = await db
    .select({ id: components.id })
    .from(components)
    .where(eq(components.slug, c.req.param('componentSlug')))
    .limit(1)

  if (!comp) return c.json({ error: 'Component not found' }, 404)

  // upsert manual — Drizzle não tem onConflict com multiple columns fácil
  const [existing] = await db
    .select({ id: compStyles.id })
    .from(compStyles)
    .where(
      and(
        eq(compStyles.componentId, comp.id),
        eq(compStyles.userId, userId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(compStyles)
      .set({ styles })
      .where(eq(compStyles.id, existing.id))
  } else {
    await db.insert(compStyles).values({
      componentId: comp.id,
      userId,
      styles,
      isDefault: false,
    })
  }

  return c.json({ message: 'Saved' })
})