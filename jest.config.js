const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'services/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    'app/api/**/*.{js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.js',
    // Exclude telemedicine/video call files from coverage
    '!app/telemedicine/**',
    '!lib/webrtc/**',
    '!components/telemedicine/**',
    '!app/api/telemedicine/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    // Exclude telemedicine tests
    '/app/telemedicine/',
    '/lib/webrtc/',
    '/components/telemedicine/',
  ],
  modulePathIgnorePatterns: [
    // Exclude telemedicine from module resolution
    '/app/telemedicine/',
    '/lib/webrtc/',
    '/components/telemedicine/',
  ],
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { 
      configFile: './.jest/babel.config.js',
      presets: ['@babel/preset-env', '@babel/preset-react']
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|mongoose)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
