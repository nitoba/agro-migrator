import { MigrationRunner } from './infra/cli'
import { MigrationPrompts } from './infra/cli/migration.prompts'
import { MigrationFactory } from './infra/factories/migration.factory'
import { createConnectionWithConfig } from './utils/db-connection'
import { loadConfig } from './utils/load-config'
import { logger } from './utils/logger'

try {
  logger.info('Carregando configurações... 🛠️'.toUpperCase())
  const config = await loadConfig()
  logger.info('Configuração carregada com sucesso. 🛠️  ✅'.toUpperCase())
  logger.info('Iniciando conexão com o banco de dados... 🌐'.toUpperCase())
  await createConnectionWithConfig(config.dbConnection)
  logger.info('Conexão com o banco de dados estabelecida. 🌐 ✅'.toUpperCase())

  logger.info('Inicializando a aplicação... 🍃'.toUpperCase())
  const migrationPrompts = new MigrationPrompts(config)
  const migrationFactory = new MigrationFactory()

  const runner = new MigrationRunner(config, migrationFactory, migrationPrompts)
  await runner.run()
} catch (error) {
  logger.error(error)
  process.exit(1)
} finally {
  logger.info('Finalizando a aplicação...')
  logger.info('Aplicação finalizada com sucesso. ✅')
  process.exit(0)
}
