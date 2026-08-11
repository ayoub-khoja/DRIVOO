import 'dotenv/config'
import process from 'node:process'
import http from 'node:http'
import * as env from './config/env.config'
import * as databaseHelper from './utils/databaseHelper'
import app from './app'
import * as logger from './utils/logger'

/**
 * Creates and returns an HTTP server.
 * TLS/SSL is expected to be terminated by a reverse proxy (Nginx, OVH, Cloudflare, etc.).
 *
 * @returns {http.Server} The server instance
 */
const createServer = (): http.Server => {
  http.globalAgent.maxSockets = Infinity
  return http.createServer(app)
}

/**
 * Shutdown timeout duration in milliseconds.
 * If server shutdown takes longer than this, the process will be forcefully exited.
 *
 * @constant {number}
 */
const shutdownTimeoutMs = 10_000

/**
 * Starts the server and sets up graceful shutdown handlers.
 */
const start = async (): Promise<void> => {
  try {
    const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)
    const initialized = await databaseHelper.initialize()

    if (!connected || !initialized) {
      logger.error('Failed to connect or initialize the database')
      process.exit(1)
    }

    const server = createServer()

    server.listen(env.PORT, () => {
      logger.info(`HTTP server is running on port ${env.PORT}`)
    })

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Gracefully stopping server...`)

      // Force shutdown if close hangs after timeout
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Forced shutdown due to timeout')
        process.exit(1)
      }, shutdownTimeoutMs)

      server.close(async () => {
        clearTimeout(shutdownTimeout)
        logger.info('HTTP server closed')
        await databaseHelper.close(true)
        process.exit(0)
      })
    }

    ;['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => process.once(signal, shutdown))
  } catch (err) {
    logger.error('Server failed to start', err)
    process.exit(1)
  }
}

start() // Start server
