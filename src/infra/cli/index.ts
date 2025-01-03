import { logoWithGradient } from '@/utils/logo'
import { intro, confirm, isCancel, cancel, spinner, log } from '@clack/prompts'
import { type MigrationInfo, MigrationPrompts } from './migration.prompts'
import { MigrationConfig } from '@/core/types/config.schema'
import { logger } from '@/utils/logger'
import chalk from 'chalk'
import { inject, injectable } from 'inversify'
import { container } from '../container'
import { MigrationFileBuilder } from '@/core/migration.builder.interface'
import type { MigrationService } from '@/core/migration.service.interface'

@injectable()
export class MigrationRunner {
  constructor(
    private readonly migrationPrompts: MigrationPrompts,
    @inject(MigrationConfig)
    private readonly config: MigrationConfig
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

    const migrationService = container.get<MigrationService>(migrationType)

    const builder = container.get<MigrationFileBuilder>(MigrationFileBuilder)

    builder.collectRequiredInformation({
      migrationName,
      outputDir: finalOutputDir,
    })

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
