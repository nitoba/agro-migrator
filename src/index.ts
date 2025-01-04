import 'reflect-metadata'
import {
  createConnectionWithConfig,
  DB_CONNECTION,
} from './utils/db-connection'
import { loadConfig } from './utils/load-config'
import { logger } from './utils/logger'
import { AppModule } from './infra/app.module'
import { MigrationConfig } from './core/types/config.schema'
import { MigrationRunner } from './infra/cli'
import { DiContainer } from './infra/container'

try {
  logger.info('Carregando configurações... 🛠️'.toUpperCase())
  const config = await loadConfig()
  logger.info('Configuração carregada com sucesso. 🛠️  ✅'.toUpperCase())
  logger.info('Iniciando conexão com o banco de dados... 🌐'.toUpperCase())
  const dbConnection = await createConnectionWithConfig(config.dbConnection)
  logger.info('Conexão com o banco de dados estabelecida. 🌐 ✅'.toUpperCase())

  logger.info('Inicializando a aplicação... 🍃'.toUpperCase())

  DiContainer.addProvider(MigrationConfig, config)
  DiContainer.addProvider(DB_CONNECTION, dbConnection)

  new AppModule()

  const runner = DiContainer.get(MigrationRunner)
  await runner.run()
} catch (error) {
  logger.error(error)
  process.exit(1)
} finally {
  logger.info('Finalizando a aplicação...')
  logger.info('Aplicação finalizada com sucesso. ✅')
  process.exit(0)
}
