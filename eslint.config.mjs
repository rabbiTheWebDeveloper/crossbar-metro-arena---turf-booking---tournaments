import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'mobile/**',
            'public/**',
            'out/**',
            'coverage/**'
        ]
    },
    ...nextCoreWebVitals,
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'off'
        },
        rules: {
            // Standard img tags are intentionally used alongside unoptimized Next images
            '@next/next/no-img-element': 'off',
            // Keep apostrophes/quotes in UI copy readable without forced HTML entities
            'react/no-unescaped-entities': 'off',
            // React Compiler is not enabled in next.config.mjs; relax compiler-only heuristics
            // while keeping core rules-of-hooks, exhaustive-deps, and static-components active.
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/preserve-manual-memoization': 'off'
        }
    }
];

export default eslintConfig;
