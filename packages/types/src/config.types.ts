// ---------------------------------------------------------------------------
// Tipos base dos controlos de customização
// ---------------------------------------------------------------------------

/** Controlo de cor — abre color picker na plataforma web */
export interface ColorProp {
  type: 'color'
  default: string        // valor CSS válido: hex, rgb, rgba, hsl
  label?: string         // label exibida no painel (opcional, usa a key se omitido)
  cssVar: string         // ex: "--modal-overlay-bg"
}

/** Controlo de intervalo numérico — abre slider na plataforma web */
export interface RangeProp {
  type: 'range'
  default: number
  min: number
  max: number
  step?: number          // padrão: 1
  unit: CssUnit          // unidade aplicada ao valor: "px", "rem", "%", etc.
  label?: string
  cssVar: string         // ex: "--modal-content-radius"
}

/** União de todos os controlos suportados no MVP */
export type CwaProp = ColorProp | RangeProp

/** Unidades CSS suportadas */
export type CssUnit = 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh'

// ---------------------------------------------------------------------------
// Estrutura de tags customizáveis (permite aninhamento livre)
// ---------------------------------------------------------------------------

/**
 * Um nó da árvore de customização pode ser:
 *   - uma prop direta (ColorProp | RangeProp)
 *   - um grupo de props/subgrupos (ex: content -> header, body, footer)
 */
export type CwaStyleNode = CwaProp | CwaStyleGroup

/** Grupo de props ou subgrupos — sem profundidade máxima definida */
export type CwaStyleGroup = {
  [key: string]: CwaStyleNode
}

// ---------------------------------------------------------------------------
// Dependências do componente
// ---------------------------------------------------------------------------

export interface CwaDependency {
  name: string           // ex: "@angular/cdk"
  version: string        // ex: "^21.0.0"
  optional?: boolean
}

// ---------------------------------------------------------------------------
// Contrato principal — cwa.config.ts de cada componente
// ---------------------------------------------------------------------------

export interface CwaConfig {
  /** Nome único do componente — usado como slug na plataforma */
  name: string

  /** Versão semântica */
  version: string

  /** Descrição curta exibida no catálogo */
  description?: string

  /** Tags para filtro no catálogo */
  tags?: string[]

  /**
   * Árvore de customização do componente.
   * Cada leaf com cssVar é um controlo no painel.
   * Grupos sem cssVar são apenas agrupamentos visuais.
   *
   * Exemplo:
   * {
   *   overlay: {
   *     bgColor: { type: 'color', default: 'rgba(0,0,0,0.5)', cssVar: '--modal-overlay-bg' }
   *   },
   *   content: {
   *     borderRadius: { type: 'range', default: 8, min: 0, max: 24, unit: 'px', cssVar: '--modal-content-radius' },
   *     header: {
   *       fontSize: { type: 'range', default: 18, min: 12, max: 32, unit: 'px', cssVar: '--modal-header-font-size' }
   *     }
   *   }  
   * }
   */
  customizable: CwaStyleGroup

  /** Dependências npm necessárias para o componente funcionar */
  dependencies?: CwaDependency[]
}
