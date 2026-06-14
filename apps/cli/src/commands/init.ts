import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import prompts from 'prompts'
import { generateConfigTemplate, generateTsTemplate, generateHtmlTemplate, generateCssTemplate } from '@admiro/cwa-core'
export async function initCommand() {
  console.log(chalk.bold('\n  CWA — Iniciar componente\n'))

  const { name, version, description, tags } = await prompts([
    { type: 'text', name: 'name', message: 'Nome do componente (slug)', initial: 'my-component' },
    { type: 'text', name: 'version', message: 'Versão', initial: '1.0.0' },
    { type: 'text', name: 'description', message: 'Descrição (opcional)', initial: '' },
    { type: 'text', name: 'tags', message: 'Tags separadas por vírgula', initial: 'ui' },
  ])

  if (!name) {
    console.log(chalk.red('  Cancelado.'))
    return
  }

  const prefix = name.toLowerCase().replace(/\s+/g, '-')
  const destDir = join(process.cwd(), prefix)

  // verificar se a pasta já existe
  if (existsSync(destDir)) {
    console.log(chalk.yellow(`  Pasta "${prefix}" já existe.`))
    return
  }

  const spinner = ora(`A criar componente ${chalk.cyan(prefix)}...`).start()

  try {
    const tagsList = tags ? tags.split(',').map((t: string) => t.trim()) : ['ui']

    // criar pasta
    mkdirSync(destDir, { recursive: true })

    // gerar e escrever ficheiros
    writeFileSync(
      join(destDir, 'cwa.config.ts'),
      generateConfigTemplate({ name: prefix, version, description: description ?? '', tags: tagsList }),
      'utf-8'
    )

    writeFileSync(
      join(destDir, `${prefix}.component.ts`),
      generateTsTemplate(prefix),
      'utf-8'
    )

    writeFileSync(
      join(destDir, `${prefix}.component.html`),
      generateHtmlTemplate(prefix),
      'utf-8'
    )

    writeFileSync(
      join(destDir, `${prefix}.component.css`),
      generateCssTemplate(prefix),
      'utf-8'
    )

    spinner.succeed(chalk.green(`Componente "${prefix}" criado com sucesso!`))
    console.log(chalk.gray(`
  ${prefix}/
    cwa.config.ts
    ${prefix}.component.ts
    ${prefix}.component.html
    ${prefix}.component.css
    `))
  } catch (e) {
    spinner.fail(chalk.red(`Erro: ${(e as Error).message}`))
  }
}