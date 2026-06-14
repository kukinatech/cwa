import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { routes } from './routes'
import 'dotenv/config';

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin:      process.env.WEB_URL ?? 'http://localhost:4200',
  credentials: true,   // obrigatório para cookies cross-origin
}))

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api', routes)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`)
})