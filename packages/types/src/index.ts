export type {
  CwaConfig,
  CwaProp,
  ColorProp,
  RangeProp,
  CwaStyleNode,
  CwaStyleGroup,
  CwaDependency,
  CssUnit,
} from './config.types'

export {
  isCwaProp,
  isCwaStyleGroup,
  flattenProps,
  generateCssVars,
  extractDefaults,
} from './config.utils'


export {
  generateConfigTemplate,
  generateTsTemplate,
  generateHtmlTemplate,
  generateCssTemplate,
} from './config.template'

export type { FlatProp, StyleValues } from './config.utils'
