import { Hono } from 'hono'
import { authRoutes } from './auth'
import { componentRoutes } from './components'
import { styleRoutes } from './styles'

export const routes = new Hono()

routes.route('/auth', authRoutes)
routes.route('/components', componentRoutes)
routes.route('/styles', styleRoutes)