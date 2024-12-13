import { createConnection, type Connection } from 'mysql2/promise'
import type { MigrationConfig } from '@/core/types/config.schema'
import { logger } from './logger'

export let dbConnection: Connection

export const createConnectionWithConfig = async (
  config: MigrationConfig['dbConnection']
) => {
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
  } catch (error) {
    logger.error(
      'Erro ao conectar ao banco de dados. Verifique as credenciais.'
    )
    process.exit(1)
  }
}
