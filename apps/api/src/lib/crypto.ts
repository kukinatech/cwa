import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { jwt } from 'zod';
import { SignJWT, jwtVerify } from 'jose'

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 10)

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash)

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const issuer = 'cwa-api'

export interface JwtPayload {
  sub: string   // user id
  email: string
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer })
  return payload as unknown as JwtPayload
}