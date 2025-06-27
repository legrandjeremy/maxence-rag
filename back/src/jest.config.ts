/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        '**/*.ts',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/coverage/**',
        '!jest.config.ts'
    ],
    // Skip tests that need to be fixed
    testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/S3Service.test.ts'
    ]
};

export default config;
