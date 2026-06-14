#!/usr/bin/env node
import { Command } from 'commander'
import { loginCommand } from './commands/login'
import { addCommand } from './commands/add'
import { publishCommand } from './commands/publish'
import { meCommand } from './commands/me';
import { initCommand } from './commands/init'
import 'dotenv/config';
const pkg = require('../package.json')

const program = new Command()

program
  .name('cwa')
  .description('CLI para instalar e publicar componentes Angular')
  .version(pkg.version)

program
  .command('login')
  .description('Autenticar na plataforma CWA')
  .action(loginCommand)

program
  .command('add <slug> [styleName]')
  .description('Instalar um componente no projecto')
  .action(addCommand)

program
  .command('publish <dir>')
  .description('Publicar um componente na plataforma')
  .action(publishCommand)
program
  .command('me')
  .description('Mostra o usuário logado')
  .action(meCommand)

program
  .command('init')
  .description('Iniciar um novo componente com cwa.config.ts')
  .action(initCommand)

program.parse()