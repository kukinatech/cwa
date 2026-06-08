import prompts from 'prompts'
import ora from 'ora'
import chalk from 'chalk'
import { writeConfig, getApiUrl } from '../lib/config'
import { apiRequest } from '../lib/api'

export async function loginCommand() {
  console.log(chalk.bold('\n  CWA — Login\n'))

  const { email, password } = await prompts([
    { type: 'text', name: 'email', message: 'Email' },
    { type: 'password', name: 'password', message: 'Password' },
  ])

  if (!email || !password) {
    console.log(chalk.red('  Cancelado.'))
    process.exit(0)
  }

  const spinner = ora('A autenticar...').start()

  try {
    // 1. login → JWT de sessão
    const { token: sessionToken } = await apiRequest<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // 2. gerar token CLI
    const { token: cliToken } = await apiRequest<{ token: string }>('/auth/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    writeConfig({ token: cliToken, apiUrl: getApiUrl() })

    spinner.succeed(chalk.green('Autenticado com sucesso!'))
    console.log(chalk.gray('  Token guardado em ~/.cwa/config.json\n'))
  } catch (e) {
    spinner.fail(chalk.red(`Erro: ${(e as Error).message}`))
    process.exit(1)
  }
}