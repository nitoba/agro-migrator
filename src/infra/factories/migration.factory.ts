import { CreateTableMigrationService } from '../../core/services/create-table-migration.service'
import { RawSQLMigrationService } from '../../core/services/raw-sql-migration.service'
import { StoredProcedureMigrationService } from '../../core/services/stored-procedure-migration.service'
import { AlterTableMigrationService } from '../../core/services/alter-table-migration.service'
import { logger } from '@/utils/logger'
import { dbConnection } from '@/utils/db-connection'
import { AuditTableSQLGeneratorService } from '@/core/services/audit-table-generator.service'
import { TriggersManagerService } from '@/core/services/triggers-manager.service'
import { MigrationFileGeneratorService } from '@/core/services/migration-file-generator.service'
import { MigrationType } from '@/core/types/migration.types'
import { DefaultMigrationFileBuilder } from '../builders/migration.builder'
import { CreateMigrationUseCase } from '@/application/use-cases/create-migration.use-case'
import { DatabaseRepository } from '@/infra/repositories/database.repository'

export class MigrationFactory {
  getMigrationCreator(
    migrationType: MigrationType,
    migrationName: string,
    outputDir: string
  ): CreateMigrationUseCase {
    const migrationFileGenerator = new MigrationFileGeneratorService(
      new DefaultMigrationFileBuilder({ migrationName, outputDir })
    )
    const databaseRepository = new DatabaseRepository(dbConnection)
    switch (migrationType) {
      case MigrationType.CREATE:
        return new CreateMigrationUseCase(
          new CreateTableMigrationService(
            migrationFileGenerator,
            new TriggersManagerService(databaseRepository),
            new AuditTableSQLGeneratorService()
          )
        )
      case MigrationType.UPDATE:
        return new CreateMigrationUseCase(
          new AlterTableMigrationService(
            migrationFileGenerator,
            databaseRepository,
            new AuditTableSQLGeneratorService(),
            new TriggersManagerService(databaseRepository)
          )
        )
      case MigrationType.ROUTINE:
        return new CreateMigrationUseCase(
          new StoredProcedureMigrationService(migrationFileGenerator)
        )
      case MigrationType.CUSTOM:
        return new CreateMigrationUseCase(
          new RawSQLMigrationService(migrationFileGenerator)
        )
      default:
        logger.error(`Tipo de migração desconhecido: ${migrationType}`)
        throw new Error(`Tipo de migração desconhecido: ${migrationType}`)
    }
  }
}
