#!/usr/bin/env node
import { Command } from 'commander'
import { loginCommand } from './commands/login'
import { addCommand } from './commands/add'
import { publishCommand } from './commands/publish'

const program = new Command()

program
  .name('cwa')
  .description('CLI para instalar e publicar componentes Angular')
  .version('0.1.0')

program
  .command('login')
  .description('Autenticar na plataforma CWA')
  .action(loginCommand)

program
  .command('add <slug> <styleId>')
  .description('Instalar um componente no projecto')
  .action(addCommand)

program
  .command('publish <dir>')
  .description('Publicar um componente na plataforma')
  .action(publishCommand)

program.parse()