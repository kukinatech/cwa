import { Hono } from 'hono'
import { db } from '../db/client'
import { compStyles, components } from '../db/schema'
import { eq, and} from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { parseConfig } from '../lib/config-parser';
import { generateCssVars, type StyleValues } from '@cwa/types';
import { listComponentFiles } from '../services/storage.service';
import AdmZip from 'adm-zip';

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
    .select({ id: components.id, name: components.name })
    .from(components)
    .where(eq(components.slug, c.req.param('componentSlug')))
    .limit(1)

  if (!comp) return c.json({ error: 'Component not found' }, 404)

  const styles = await db
    .select({
      id: compStyles.id,
      name: compStyles.name,
      styles: compStyles.styles,
      isDefault: compStyles.isDefault,
      createdAt: compStyles.createdAt,
      component: {
        id: components.id,
        name: components.name
      }
    })
    .from(compStyles)
    .leftJoin(components, eq(compStyles.componentId, components.id))
    .where(
      and(
        eq(compStyles.componentId, comp.id),
        eq(compStyles.userId, userId)
      )
    )
    .orderBy(compStyles.createdAt)

  return c.json({ styles })
})

// POST /api/styles/:componentSlug  (salva/actualiza estilo — requer token)
styleRoutes.post('/:componentSlug', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const { name, styles, isDefault } = await c.req.json()
  console.log("DEFAULT: ", isDefault)
  if (!name) return c.json({ error: 'Missing name' }, 400)
  if (!styles) return c.json({ error: 'Missing styles' }, 400)

  const [comp] = await db
    .select({ id: components.id })
    .from(components)
    .where(eq(components.slug, c.req.param('componentSlug')))
    .limit(1)

  if (!comp) return c.json({ error: 'Component not found' }, 404)

  // upsert por componentId + userId + name
  // cada variante é única pelo nome por utilizador
  const [existing] = await db
    .select({ id: compStyles.id })
    .from(compStyles)
    .where(
      and(
        eq(compStyles.componentId, comp.id),
        eq(compStyles.userId, userId),
        eq(compStyles.name, name),         // ← distingue variantes
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(compStyles)
      .set({ styles, isDefault: !!isDefault })
      .where(eq(compStyles.id, existing.id))

    return c.json({ message: 'Variante actualizada' })
  }

  const [created] = await db
    .insert(compStyles)
    .values({
      componentId: comp.id,
      userId,
      name,
      styles,
      isDefault: !!isDefault,
    })
    .returning()

  return c.json({ style: created }, 201)
})

