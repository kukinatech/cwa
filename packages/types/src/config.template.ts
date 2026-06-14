export interface TemplateOptions {
  name: string
  version: string
  description: string
  tags: string[]
}

export function generateConfigTemplate(options: TemplateOptions): string {
  const { name, version, description, tags } = options
  const tagsList = tags.map(t => `'${t}'`).join(', ')
  const prefix   = name.toLowerCase().replace(/\s+/g, '-')

  return `import type { CwaConfig } from '@admiro/cwa-core'

    export default {
      name:        '${name}',
      version:     '${version}',
      description: '${description}',
      tags:        [${tagsList}],

      customizable: {
        bgColor: {
          type:    'color',
          default: '#3b82f6',
          label:   'Cor de fundo',
          cssVar:  '--${prefix}-bg',
        },
        color: {
          type:    'color',
          default: '#ffffff',
          label:   'Cor do texto',
          cssVar:  '--${prefix}-color',
        },
        borderRadius: {
          type:    'range',
          default: 4,
          min:     0,
          max:     32,
          unit:    'px',
          label:   'Border radius',
          cssVar:  '--${prefix}-radius',
        },
        paddingX: {
          type:    'range',
          default: 16,
          min:     0,
          max:     48,
          unit:    'px',
          label:   'Padding horizontal',
          cssVar:  '--${prefix}-padding-x',
        },
        paddingY: {
          type:    'range',
          default: 8,
          min:     0,
          max:     32,
          unit:    'px',
          label:   'Padding vertical',
          cssVar:  '--${prefix}-padding-y',
        },
        fontSize: {
          type:    'range',
          default: 14,
          min:     10,
          max:     24,
          unit:    'px',
          label:   'Tamanho da fonte',
          cssVar:  '--${prefix}-font-size',
        },
      },

      dependencies: [],
    } as CwaConfig
    `
}

export function generateTsTemplate(name: string): string {
  const prefix    = name.toLowerCase().replace(/\s+/g, '-')
  const className = name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') + 'Component'

  return `import { Component } from '@angular/core'

@Component({
  selector:    'cwa-${prefix}',
  standalone:  true,
  templateUrl: './${prefix}.component.html',
  styleUrl:    './${prefix}.component.css',
})
export class ${className} {}
`
}

export function generateHtmlTemplate(name: string): string {
  const prefix = name.toLowerCase().replace(/\s+/g, '-')

  return `<button class="cwa-${prefix}">
  <ng-content />
</button>
`
}

export function generateCssTemplate(name: string): string {
  const prefix = name.toLowerCase().replace(/\s+/g, '-')

  return `.cwa-${prefix} {
  background-color: var(--${prefix}-bg, #3b82f6);
  color:            var(--${prefix}-color, #ffffff);
  border-radius:    var(--${prefix}-radius, 4px);
  padding:          var(--${prefix}-padding-y, 8px) var(--${prefix}-padding-x, 16px);
  font-size:        var(--${prefix}-font-size, 14px);
  border:           none;
  cursor:           pointer;
  transition:       background-color 0.2s, opacity 0.2s;
}

.cwa-${prefix}:hover {
  opacity: 0.9;
}

.cwa-${prefix}:active {
  opacity: 0.8;
}

.cwa-${prefix}:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`
}