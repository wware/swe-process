#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { SQLiteStorage } from '../src/storage/sqlite-storage';
import { developmentConfig } from '../src/config/environments';
import { logger } from '../src/utils/logging';

/**
 * Sets up the local SQLite database
 */
async function setupLocalDb(): Promise<void> {
  try {
    // Get the database path from the development configuration
    const dbPath = developmentConfig.sqlite.dbPath;
    
    // Create the directory if it doesn't exist
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      logger.info(`Creating directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Initialize the SQLite storage
    logger.info(`Initializing SQLite database at: ${dbPath}`);
    const storage = new SQLiteStorage(dbPath);
    await storage.initialize();
    
    // Close the database connection
    await storage.close();
    
    logger.info('Local SQLite database setup complete');
  } catch (error) {
    logger.error('Failed to set up local SQLite database', { error });
    process.exit(1);
  }
}

// Run the setup function
setupLocalDb();
