/**
 * @author Aleksandar Panich
 * @version Assignment02
 *
 * - Creates and exports a MySQL connection pool for the application
 * - All database queries throughout the app use this shared pool
 * - Connects to Aiven-hosted MySQL using credentials from .env
 *
 * Step 1: Load mysql2 promise-based library
 * Step 2: Create a connection pool using environment variables
 * Step 3: Export the pool for use in route files
 */
const mysql = require('mysql2/promise');

/**
 * MySQL connection pool configured for Aiven cloud database.
 *
 * - Uses SSL with rejectUnauthorized: false for Aiven compatibility
 * - Pool allows multiple simultaneous queries without blocking
 * - Credentials loaded from .env file for security
 *
 * @returns {Pool} mysql2 connection pool instance
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;