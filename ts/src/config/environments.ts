/**
 * Environment types supported by the application
 */
export enum Environment {
  TEST = 'test',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production'
}

/**
 * Common configuration for all environments
 */
export interface BaseConfig {
  environment: Environment;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Configuration for the test environment
 */
export interface TestConfig extends BaseConfig {
  environment: Environment.TEST;
}

/**
 * Configuration for the development environment
 */
export interface DevelopmentConfig extends BaseConfig {
  environment: Environment.DEVELOPMENT;
  sqlite: {
    dbPath: string;
  };
}

/**
 * Configuration for the production environment
 */
export interface ProductionConfig extends BaseConfig {
  environment: Environment.PRODUCTION;
  aws: {
    region: string;
    dynamoDb: {
      tableName: string;
    };
  };
}

/**
 * Union type for all environment configurations
 */
export type EnvironmentConfig = TestConfig | DevelopmentConfig | ProductionConfig;

/**
 * Test environment configuration
 */
export const testConfig: TestConfig = {
  environment: Environment.TEST,
  logLevel: 'error'
};

/**
 * Development environment configuration
 */
export const developmentConfig: DevelopmentConfig = {
  environment: Environment.DEVELOPMENT,
  logLevel: 'debug',
  sqlite: {
    dbPath: './data/todos.db'
  }
};

/**
 * Production environment configuration
 */
export const productionConfig: ProductionConfig = {
  environment: Environment.PRODUCTION,
  logLevel: 'info',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    dynamoDb: {
      tableName: process.env.DYNAMODB_TABLE || 'todos'
    }
  }
};

/**
 * Environment configuration map
 */
export const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  [Environment.TEST]: testConfig,
  [Environment.DEVELOPMENT]: developmentConfig,
  [Environment.PRODUCTION]: productionConfig
};
