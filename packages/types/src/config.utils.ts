import type { CwaStyleGroup, CwaStyleNode, CwaProp } from './config.types'

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/** Verifica se um nó é uma prop (leaf) */
export function isCwaProp(node: CwaStyleNode): node is CwaProp {
  return 'type' in node && ('cssVar' in node)
}

/** Verifica se um nó é um grupo (tem subchaves mas não é prop) */
export function isCwaStyleGroup(node: CwaStyleNode): node is CwaStyleGroup {
  return !isCwaProp(node)
}

// ---------------------------------------------------------------------------
// Percorrer a árvore
// ---------------------------------------------------------------------------

/** Resultado de uma prop extraída da árvore */
export interface FlatProp {
  path: string[]         // ex: ['content', 'header', 'fontSize']
  prop: CwaProp
}

/**
 * Percorre recursivamente a CwaStyleGroup e devolve
 * todas as props (leaves) em formato plano.
 * Útil para a CLI validar o config e para a API indexar cssVars.
 */
export function flattenProps(
  group: CwaStyleGroup,
  path: string[] = []
): FlatProp[] {
  const result: FlatProp[] = []

  for (const [key, node] of Object.entries(group)) {
    if (isCwaProp(node)) {
      result.push({ path: [...path, key], prop: node })
    } else {
      result.push(...flattenProps(node, [...path, key]))
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Gerar bloco :root com CSS variables
// ---------------------------------------------------------------------------

export interface StyleValues {
  [key: string]: StyleValues | string | number
}

/**
 * Percorre o config (CwaStyleGroup) e os valores guardados (StyleValues)
 * em paralelo e gera o bloco CSS :root completo.
 *
 * - Se o utilizador tiver um valor em `values`, usa esse.
 * - Caso contrário usa o `default` definido no config.
 *
 * Exemplo de output:
 *   :root {
 *     --modal-overlay-bg: rgba(0,0,0,0.8);
 *     --modal-content-radius: 12px;
 *     --modal-header-font-size: 20px;
 *   }
 */
export function generateCssVars(
  group: CwaStyleGroup,
  values: StyleValues = {}
): string {
  const lines: string[] = []

  function walk(node: CwaStyleGroup, vals: StyleValues) {
    for (const [key, child] of Object.entries(node)) {
      if (isCwaProp(child)) {
        const userVal = (vals as Record<string, unknown>)[key]
        const value   = userVal !== undefined ? userVal : child.default
        const unit    = child.type === 'range' ? child.unit : ''
        lines.push(`  ${child.cssVar}: ${value}${unit};`)
      } else {
        const subVals = ((vals as Record<string, unknown>)[key] ?? {}) as StyleValues
        walk(child, subVals)
      }
    }
  }

  walk(group, values)

  return `:root {\n${lines.join('\n')}\n}`
}

/**
 * Extrai apenas os valores default do config como StyleValues.
 * Útil para gerar o CSS base sem customizações do utilizador.
 */
export function extractDefaults(group: CwaStyleGroup): StyleValues {
  const result: StyleValues = {}

  for (const [key, node] of Object.entries(group)) {
    if (isCwaProp(node)) {
      result[key] = node.default
    } else {
      result[key] = extractDefaults(node)
    }
  }

  return result
}
