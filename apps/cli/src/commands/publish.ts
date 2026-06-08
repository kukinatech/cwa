import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import AdmZip from 'adm-zip'
import ora from 'ora'
import chalk from 'chalk'
import prompts from 'prompts'
import { readConfig, getApiUrl } from '../lib/config'

const REQUIRED_EXTENSIONS = ['.ts', '.css']
const REQUIRED_CONFIG = 'cwa.config.ts'

export async function publishCommand(dir: string) {
  const config = readConfig()

  if (!config?.token) {
    console.log(chalk.red('  Não autenticado. Executa: cwa login'))
    process.exit(1)
  }

  const absDir = join(process.cwd(), dir)

  if (!existsSync(absDir)) {
    console.log(chalk.red(`  Directório não encontrado: ${absDir}`))
    process.exit(1)
  }

  // 1. verificar ficheiros obrigatórios
  const files = readdirSync(absDir)
  const missing = REQUIRED_EXTENSIONS.filter(
    ext => !files.some(f => f.endsWith(ext) && f !== REQUIRED_CONFIG)
  )

  if (missing.length) {
    console.log(chalk.red(`  Falta pelo menos um ficheiro com extensão: ${missing.join(', ')}`))
    process.exit(1)
  }

  // 2. extrair name do cwa.config.ts
  const configSource = readFileSync(join(absDir, 'cwa.config.ts'), 'utf-8')
  const nameMatch = configSource.match(/name\s*:\s*['"]([^'"]+)['"]/)

  if (!nameMatch) {
    console.log(chalk.red('  Campo "name" não encontrado no cwa.config.ts'))
    process.exit(1)
  }

  const slug = nameMatch[1]

  console.log(chalk.bold(`\n  Publicar: ${chalk.cyan(slug)}\n`))

  // 3. pedir descrição e tags
  const { description, tags } = await prompts([
    { type: 'text', name: 'description', message: 'Descrição (opcional)' },
    { type: 'text', name: 'tags', message: 'Tags separadas por vírgula (ex: ui,modal)' },
  ])

  const spinner = ora(`A publicar ${chalk.cyan(slug)}...`).start()

  try {
    // 4. criar zip com todos os ficheiros do directório
    const zip = new AdmZip()
    files.forEach(f => zip.addLocalFile(join(absDir, f)))
    const zipBuffer = zip.toBuffer()

    // 5. enviar para a API
    const form = new FormData()
    form.append('name', slug!)
    form.append('slug', slug!)
    form.append('description', description ?? '')
    form.append('tags', tags ?? '')
    form.append('file',
      new Blob([zipBuffer], { type: 'application/zip' }),
      `${slug}.zip`
    )

    const res = await fetch(`${getApiUrl()}/components`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}` },
      body: form,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      spinner.fail(chalk.red(`Erro: ${body.error}`))
      process.exit(1)
    }

    const { component } = await res.json()

    spinner.succeed(chalk.green(`${slug} publicado com sucesso!`))
    console.log(chalk.gray(`  id: ${component.id}\n`))
  } catch (e) {
    spinner.fail(chalk.red(`Erro: ${(e as Error).message}`))
    process.exit(1)
  }
}