import { Hono } from 'hono'
import { db } from '../db/client'
import { components, compStyles, users } from '../db/schema'
import { eq, and, or } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { processComponentUpload } from '../services/component.service'
import { deleteComponentFiles, listComponentFiles } from '../services/storage.service'

export const componentRoutes = new Hono()

// GET /api/components
componentRoutes.get('/', async (c) => {
  const rows = await db
    .select({
      id:          components.id,
      name:        components.name,
      slug:        components.slug,
      description: components.description,
      tags:        components.tags,
      storagePath: components.storagePath,
      createdAt:   components.createdAt,
      author: {
        id:       users.id,
        username: users.username,
      },
      defaultStyle: {
        id:     compStyles.id,
        styles: compStyles.styles,
      },
    })
    .from(components)
    .leftJoin(users, eq(components.authorId, users.id))
    .leftJoin(
      compStyles,
      and(
        eq(compStyles.componentId, components.id),
        eq(compStyles.isDefault, true)
      )
    )

  // adiciona urls dos ficheiros a cada componente
  const enriched = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      files: await listComponentFiles(row.slug),
    }))
  )

  return c.json({ components: enriched })
})

// GET /api/components/:slug
componentRoutes.get('/:slug', async (c) => {
  const [row] = await db
    .select({
      id:          components.id,
      name:        components.name,
      slug:        components.slug,
      description: components.description,
      tags:        components.tags,
      storagePath: components.storagePath,
      createdAt:   components.createdAt,
      author: {
        id:       users.id,
        username: users.username,
      },
      defaultStyle: {
        id:     compStyles.id,
        styles: compStyles.styles,
      },
    })
    .from(components)
    .leftJoin(users, eq(components.authorId, users.id))
    .leftJoin(
      compStyles,
      and(
        eq(compStyles.componentId, components.id),
        eq(compStyles.isDefault, true)
      )
    )
    .where(eq(components.slug, c.req.param('slug')))
    .limit(1)

  if (!row) return c.json({ error: 'Not found' }, 404)

  const files = await listComponentFiles(row.slug)

  return c.json({ component: { ...row, files } })
})

// POST /api/components
componentRoutes.post('/', authMiddleware, async (c) => {
  try {
    const form = await c.req.formData()

    const name        = form.get('name') as string
    const slug        = form.get('slug') as string
    const description = form.get('description') as string | null
    const tags        = form.get('tags') as string | null
    const file        = form.get('file') as File | null

    if (!name || !slug || !file)
      return c.json({ error: 'Missing fields' }, 400)

    if (!file.name.endsWith('.zip'))
      return c.json({ error: 'File must be a .zip' }, 400)

    const existingComponent = await db
      .select({ id: components.id })
      .from(components)
      .where(or(eq(components.name, name), eq(components.slug, slug)))
      .limit(1)

    if (existingComponent.length > 0)
      return c.json({ error: 'Component já existe' }, 409)

    const userId    = c.get('userId')
    const zipBuffer = Buffer.from(await file.arrayBuffer())

    const result = await processComponentUpload(slug, zipBuffer)

    if (!result.ok)
      return c.json({ error: result.error, details: result.details }, 422)

    const [component] = await db
      .insert(components)
      .values({
        authorId:    userId,
        name,
        slug,
        description: description ?? undefined,
        tags:        tags ? tags.split(',') : [],
        storagePath: `components/${slug}`,
      })
      .returning()

    return c.json({ component, files: result.uploadedFiles }, 201)
  } catch (error: any) {
    return c.json({ error: 'Algo deu errado durante o registro', details: error.message }, 500)
  }
})

// DELETE /api/components/:slug
componentRoutes.delete('/:slug', authMiddleware, async (c) => {
  const userId = c.get('userId') as string

  const [row] = await db
    .select()
    .from(components)
    .where(
      and(
        eq(components.slug, c.req.param('slug')),
        eq(components.authorId, userId)
      )
    )
    .limit(1)

  if (!row) return c.json({ error: 'Not found or forbidden' }, 404)

  await deleteComponentFiles(row.slug)
  await db.delete(components).where(eq(components.id, row.id))

  return c.json({ message: 'Deleted' })
})