import { logoWithGradient } from '@/utils/logo'
import { intro, confirm, isCancel, cancel, spinner, log } from '@clack/prompts'
import type { MigrationPrompts } from './migration.prompts'
import type { MigrationFactory } from '@/infra/factories/migration.factory'
import type {
  MigrationFileBuilder,
  MigrationFileBuilderArgs,
} from '@/core/migration.builder.interface'
import type { MigrationConfig } from '@/core/types/config.schema'
import { logger } from '@/utils/logger'
import chalk from 'chalk'

export class MigrationRunner {
  constructor(
    private readonly config: MigrationConfig,
    private readonly migrationFactory: MigrationFactory,
    private readonly migrationPrompts: MigrationPrompts,
    private readonly migrationFileBuilder: new (
      args: MigrationFileBuilderArgs
    ) => MigrationFileBuilder
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

  private async collectMigrationInfo(): Promise<
    ReturnType<MigrationPrompts['collectMigrationInfo']>
  > {
    return await this.migrationPrompts.collectMigrationInfo()
  }

  private async createMigration(
    migrationInfo: Awaited<ReturnType<MigrationPrompts['collectMigrationInfo']>>
  ): Promise<void> {
    const { migrationType, migrationName, sqlFile } = migrationInfo
    const finalOutputDir = this.config.outputDir

    const s = spinner()
    s.start('Migration create')
    s.message('Criando migration...')

    // Lazy creation of DefaultMigrationFileBuilder
    const migrationService = this.migrationFactory.getMigrationService(
      migrationType,
      () => {
        return new this.migrationFileBuilder({
          migrationName,
          outputDir: finalOutputDir,
        })
      }
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
