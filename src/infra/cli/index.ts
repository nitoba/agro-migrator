import { logoWithGradient } from '@/utils/logo'
import { intro, confirm, isCancel, cancel, spinner, log } from '@clack/prompts'
import type { MigrationInfo, MigrationPrompts } from './migration.prompts'
import type { MigrationFactory } from '@/infra/factories/migration.factory'
import type { MigrationConfig } from '@/core/types/config.schema'
import { logger } from '@/utils/logger'
import chalk from 'chalk'

export class MigrationRunner {
  constructor(
    private readonly config: MigrationConfig,
    private readonly migrationFactory: MigrationFactory,
    private readonly migrationPrompts: MigrationPrompts
  ) {}

  private async initialize(): Promise<void> {
    intro(`${logoWithGradient}`)

    const shouldCreateMigration = await confirm({
      message: 'Vamos criar uma migration? 🚀',
      initialValue: true,
      inactive: 'Não',
      active: 'Sim',
    })

    if (isCancel(shouldCreateMigration) || !shouldCreateMigration) {
      cancel('Tudo bem então, Tchau! 👋')
      process.exit(0)
    }
  }

  private async collectMigrationInfo(): Promise<MigrationInfo> {
    return await this.migrationPrompts.collectMigrationInfo()
  }

  private async createMigration(migrationInfo: MigrationInfo): Promise<void> {
    const { migrationType, migrationName, sqlFile, outputDir } = migrationInfo
    const finalOutputDir = this.config.outputDir ?? outputDir

    const s = spinner()
    s.start('Migration create')
    s.message('Criando migration...')

    // Lazy creation of DefaultMigrationFileBuilder
    const migrationService = this.migrationFactory.getMigrationService(
      migrationType,
      migrationName,
      finalOutputDir
    )

    const migrationFilePath = await migrationService.generateMigration({
      sqlFilePath: sqlFile,
    })

    s.stop('Migration create')
    log.success(
      chalk.bold.green(
        `✅ Migration criada com sucesso em: ${migrationFilePath}`
      )
    )
  }

  public async run(): Promise<void> {
    try {
      await this.initialize()
      const migrationInfo = await this.collectMigrationInfo()
      await this.createMigration(migrationInfo)
    } catch (error: unknown) {
      this.handleError(error)
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof Error) {
      logger.error(`❌ Erro durante a execução: ${error.message}`)
    } else {
      logger.error('❌ Erro desconhecido ao gerar a migration')
    }
  }
}
