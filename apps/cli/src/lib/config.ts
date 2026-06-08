import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const CONFIG_DIR = join(homedir(), '.cwa')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export interface CliConfig {
  token: string
  apiUrl: string
}

export function readConfig(): CliConfig | null {
  if (!existsSync(CONFIG_FILE)) return null
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export function writeConfig(config: CliConfig): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function getApiUrl(): string {
  return readConfig()?.apiUrl ?? process.env.CWA_API_URL ?? 'http://localhost:3000/api'
}