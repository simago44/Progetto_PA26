import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
      tsconfig: "tsconfig.spec.json",
    }],
  },
  moduleNameMapper: {
    // strip .ts extension from imports so Jest can resolve them
    "^(\\.{1,2}/.*)\\.ts$": "$1",
  },
}

export default jestConfig
