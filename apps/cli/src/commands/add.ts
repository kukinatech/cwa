import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import AdmZip from 'adm-zip'
import ora from 'ora'
import chalk from 'chalk'
import { readConfig, getApiUrl } from '../lib/config'

export async function addCommand(slug: string, styleId: string) {
  const config = readConfig()

  if (!config?.token) {
    console.log(chalk.red('  Não autenticado. Corre: cwa login'))
    process.exit(1)
  }

  const spinner = ora(`A instalar ${chalk.cyan(slug)}...`).start()

  try {
    const res = await fetch(
      `${getApiUrl()}/components/${slug}/${styleId}/download`,
      { headers: { Authorization: `Bearer ${config.token}` } }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      spinner.fail(chalk.red(`Erro: ${body.error}`))
      process.exit(1)
    }

    // descompactar zip para /components
    const zipBuffer = Buffer.from(await res.arrayBuffer())
    const zip = new AdmZip(zipBuffer)
    const destDir = join(process.cwd(), 'components')

    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })

    zip.extractAllTo(destDir, true)  // mantém a pasta slug/ dentro

    const files = zip.getEntries().map(e => e.entryName)

    spinner.succeed(chalk.green(`${slug} instalado em components/${slug}/`))
    console.log(chalk.gray(`  ${files.join('\n  ')}\n`))
  } catch (e) {
    spinner.fail(chalk.red(`Erro: ${(e as Error).message}`))
    process.exit(1)
  }
}