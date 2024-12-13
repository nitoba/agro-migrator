import { DefaultMigrationFileBuilder } from './infra/builders/migration.builder'
import { MigrationRunner } from './infra/cli'
import { MigrationPrompts } from './infra/cli/migration.prompts'
import { MigrationFactory } from './infra/factories/migration.factory'
import { createConnectionWithConfig } from './utils/db-connection'
import { loadConfig } from './utils/load-config'
import { logger } from './utils/logger'

try {
  logger.info('Inicializando a aplicação... 🍃'.toUpperCase())

  const config = await loadConfig()
  createConnectionWithConfig(config.dbConnection)

  logger.info('Configuração carregada com sucesso. '.toUpperCase())

  const migrationPrompts = new MigrationPrompts(config)
  const migrationFactory = new MigrationFactory()

  const runner = new MigrationRunner(
    config,
    migrationFactory,
    migrationPrompts,
    DefaultMigrationFileBuilder
  )
  await runner.run()
} catch (error) {
  logger.error(error)
  process.exit(1)
} finally {
  logger.info('Finalizando a aplicação...')
  logger.info('Aplicação finalizada com sucesso. ✅')
  process.exit(0)
}
