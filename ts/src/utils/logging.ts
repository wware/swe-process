/**
 * Simple logger utility
 * In a real-world application, this would be replaced with a more sophisticated
 * logging library like Winston or Pino
 */
class Logger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor() {
    // Set log level based on environment (default to 'info')
    this.logLevel = (process.env.LOG_LEVEL as any) || 'info';
  }

  /**
   * Logs a debug message
   * @param message The message to log
   * @param meta Additional metadata to log
   */
  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, meta);
    }
  }

  /**
   * Logs an info message
   * @param message The message to log
   * @param meta Additional metadata to log
   */
  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, meta);
    }
  }

  /**
   * Logs a warning message
   * @param message The message to log
   * @param meta Additional metadata to log
   */
  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, meta);
    }
  }

  /**
   * Logs an error message
   * @param message The message to log
   * @param meta Additional metadata to log
   */
  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      this.log('ERROR', message, meta);
    }
  }

  /**
   * Determines if a log message should be shown based on the current log level
   * @param level The level of the log message
   * @returns Whether the log message should be shown
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Logs a message with the specified level
   * @param level The level of the log message
   * @param message The message to log
   * @param meta Additional metadata to log
   */
  private log(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const metaString = meta ? JSON.stringify(meta) : '';
    
    console.log(`[${timestamp}] ${level}: ${message} ${metaString}`);
  }
}

// Export a singleton instance of the logger
export const logger = new Logger();
