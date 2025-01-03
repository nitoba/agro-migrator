import { createConnection } from 'mysql2/promise'
import type { MigrationConfig } from '@/core/types/config.schema'
import { logger } from './logger'

export const DB_CONNECTION = Symbol('dbConnection')

export const createConnectionWithConfig = async (
  config: MigrationConfig['dbConnection']
) => {
  let dbConnection: Awaited<ReturnType<typeof createConnection>> | null = null
  try {
    if (!dbConnection) {
      dbConnection = await createConnection({
        host: config?.host,
        user: config?.username,
        password: config?.password,
        database: config?.database,
        port: config?.port,
      })
    }

    return dbConnection
  } catch (error) {
    logger.error(
      'Erro ao conectar ao banco de dados. Verifique as credenciais.'
    )
    process.exit(1)
  }
}
