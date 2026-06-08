import type { CwaConfig } from '@cwa/types'
import { transform } from 'esbuild'
/**
 *  usa um bundler (esbuild via Bun) para avaliar o módulo.
 */
export async function parseConfig(source: string): Promise<CwaConfig> {
  // 1. compila TypeScript → JavaScript com esbuild
  const { code } = await transform(source, {
    loader: 'ts',
    format: 'cjs', // CommonJS para usar com new Function()
    target: 'node18',
  })

  // 2. avalia o módulo CJS em sandbox
  const module = { exports: {} as { default?: unknown } }
  new Function('module', 'exports', code)(module, module.exports)

  const config = module.exports.default ?? module.exports

  // 3. valida estrutura
  validateConfig(config)
  return config as CwaConfig
}
function validateConfig(config: unknown): asserts config is CwaConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('CwaConfig invalido: config deve ser um objecto')
  }
  const c = config as Record<string, unknown>
  console.log("Config validation:", c)

  if (typeof c.name !== 'string' || !c.name) {
    throw new Error('CwaConfig invalido: campo "name" é obrigatório')
  }
  if (typeof c.version !== 'string' || !c.version) {
    throw new Error('CwaConfig invalido: campo "version" é obrigatório')
  }
  if (typeof c.customizable !== 'object' || c.customizable === null) {
    throw new Error('CwaConfig invalido: campo "customizable" é obrigatório')
  }
}