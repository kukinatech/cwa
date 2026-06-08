import {
  pgTable, uuid, text, boolean,
  timestamp, jsonb,
  unique
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:         uuid('id').defaultRandom().primaryKey(),
  email:      text('email').notNull().unique(),
  username:   text('username').notNull().unique(),
  password:   text('password').notNull(), // hash bcrypt
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

export const cliTokens = pgTable('cli_tokens', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  label:     text('label'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const components = pgTable('components', {
  id:          uuid('id').defaultRandom().primaryKey(),
  authorId:    uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  slug:        text('slug').notNull().unique(),
  description: text('description'),
  tags:        text('tags').array(),
  storagePath: text('storage_path').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})
export const compStyles = pgTable('comp_styles', {
  id:          uuid('id').defaultRandom().primaryKey(),
  componentId: uuid('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  styles:      jsonb('styles').notNull(),
  isDefault:   boolean('is_default').default(false).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  unique('comp_styles_component_name_unique').on(t.componentId, t.name), // ← constraint
])