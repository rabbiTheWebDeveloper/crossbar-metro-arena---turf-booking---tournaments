/** Jest configuration: smoke tests that render every screen against a mock API (see __tests__/). */
module.exports = {
    preset: 'jest-expo',
    setupFiles: ['<rootDir>/__tests__/helpers/setup.js'],
    testMatch: ['<rootDir>/__tests__/**/*.test.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Jest cannot load the package's ESM (.mjs) entry; use its CommonJS build
        '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js'
    },
    // jest-expo's defaults
    transformIgnorePatterns: [
        '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|standard-navigation))',
        '/node_modules/react-native-reanimated/plugin/',
        '/node_modules/@react-native/babel-preset/'
    ],
    testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/']
};
