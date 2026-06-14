import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { routes } from './routes'
import 'dotenv/config';

const app = new Hono()
const HOST_API = process.env.API_URL ?? 'http://localhost:3000'

app.use('*', logger())
app.use('*', cors({
  origin:      process.env.WEB_URL ?? 'http://localhost:4200',
  credentials: true,   // obrigatório para cookies cross-origin
}))
app.get('/', (c) => c.json({ status: 'cwa ok' }))
app.route('/api', routes)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on ${HOST_API}`)
})