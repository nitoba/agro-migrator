import { createConnection, type Connection } from 'mysql2/promise'
import type { MigrationConfig } from '@/core/types/config.schema'

export let dbConnection: Connection

export const createConnectionWithConfig = async (
  config: MigrationConfig['dbConnection']
) => {
  if (!dbConnection) {
    dbConnection = await createConnection({
      host: config?.host,
      user: config?.username,
      password: config?.password,
      database: config?.database,
      port: config?.port,
    })
  }
}
