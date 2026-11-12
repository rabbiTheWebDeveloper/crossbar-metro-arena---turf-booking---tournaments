// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNative = require('eslint-plugin-react-native');

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*', 'android/*', 'ios/*', 'release/*', 'credentials/*', '.expo/*']
    },
    {
        files: ['src/**/*.{js,jsx}'],
        plugins: { 'react-native': reactNative },
        settings: {
            // Resolve the "@/..." alias declared in jsconfig.json
            'import/resolver': {
                node: { extensions: ['.js', '.jsx'] },
                typescript: { project: './jsconfig.json' }
            }
        },
        rules: {
            // React Compiler advisories: useful hints, but not correctness errors for this codebase.
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/static-components': 'off',
            'react-hooks/incompatible-library': 'off',
            // A bare string outside a text component crashes React Native at runtime.
            'react-native/no-raw-text': ['error', { skip: ['AppText', 'Heading', 'Label', 'Mono'] }],
            'react/no-unescaped-entities': 'off',
            // False positives on packages with platform-specific (.native.js) entry files
            'import/namespace': 'off',
            'react/display-name': 'off',
            'no-undef': 'error',
            'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true, caughtErrors: 'none' }]
        }
    },
    {
        // Node scripts
        files: ['scripts/**/*.js'],
        languageOptions: { globals: { __dirname: 'readonly', process: 'readonly', require: 'readonly', module: 'readonly', console: 'readonly' } }
    },
    {
        // Jest test files
        files: ['__tests__/**/*.js'],
        languageOptions: {
            globals: { jest: 'readonly', describe: 'readonly', test: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly' }
        }
    }
]);
