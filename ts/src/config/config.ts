import { Environment, EnvironmentConfig, environmentConfigs } from './environments';

/**
 * Gets the current environment based on the NODE_ENV environment variable
 * @returns The current environment
 */
export function getCurrentEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  switch (nodeEnv.toLowerCase()) {
    case 'test':
      return Environment.TEST;
    case 'production':
      return Environment.PRODUCTION;
    case 'development':
    default:
      return Environment.DEVELOPMENT;
  }
}

/**
 * Gets the configuration for the current environment
 * @returns The environment configuration
 */
export function getConfig(): EnvironmentConfig {
  const environment = getCurrentEnvironment();
  return environmentConfigs[environment];
}

/**
 * Singleton instance of the current environment configuration
 */
export const config = getConfig();

/**
 * Gets a nested property from the configuration
 * @param path The path to the property (e.g., 'aws.region')
 * @param defaultValue The default value to return if the property doesn't exist
 * @returns The property value, or the default value if the property doesn't exist
 */
export function getConfigProperty<T>(path: string, defaultValue?: T): T {
  const properties = path.split('.');
  let value: any = config;
  
  for (const property of properties) {
    if (value === undefined) {
      return defaultValue as T;
    }
    
    value = value[property];
  }
  
  return value !== undefined ? value : defaultValue as T;
}
