import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 10)

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash)