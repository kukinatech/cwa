import chalk from "chalk";
import { readConfig } from "../lib/config";
import { apiRequest } from "../lib/api";
import ora from "ora";

export async function meCommand() {
  const config = readConfig()

  if (!config) {
    console.error(chalk.red("  Não autenticado. Corre: cwa login"))
    return
  }

  const spinner = ora('A obter informações do utilizador...').start()

  try {
    const { user } = await apiRequest<{ user: { id: string; email: string; username: string } }>('/auth/me')

    spinner.succeed(chalk.green('Utilizador autenticado'))
    console.log(chalk.gray(`  id:       ${user.id}`))
    console.log(chalk.gray(`  email:    ${user.email}`))
    console.log(chalk.gray(`  username: ${user.username}\n`))
  } catch (error) {
    spinner.fail(chalk.red(`Erro: ${(error as Error).message}`))
  }
}