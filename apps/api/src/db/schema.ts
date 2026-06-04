import {
  pgTable, uuid, text, boolean,
  timestamp, jsonb
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
  styles:      jsonb('styles').notNull(),
  isDefault:   boolean('is_default').default(false).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})