import { defineConfig } from 'oxfmt'

export default defineConfig({
    printWidth: 100,
    tabWidth: 4,
    semi: false,
    arrowParens: 'avoid',
    singleQuote: true,
    sortImports: {
        newlinesBetween: true,
        sortSideEffects: true,
        groups: [
            'type-import',
            'side_effect',
            'value-builtin',
            'value-external',
            'type-internal',
            'value-internal',
            ['type-parent', 'value-parent'],
            ['type-sibling', 'value-sibling'],
            ['type-index', 'value-index'],
            'unknown',
        ],
    },
})
