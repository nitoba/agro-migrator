import type { MigrationService } from '@/core/migration.service.interface'
import { CreateMigrationService } from '../../core/services/create-migration.service'
import { CustomMigrationService } from '../../core/services/custom-migration.service'
import { RoutinesMigrationService } from '../../core/services/routines.migration.service'
import { UpdateMigrationService } from '../../core/services/update-migration.service'
import type { MigrationFileBuilder } from '@/core/migration.builder.interface'
import { logger } from '@/utils/logger'
import { dbConnection } from '@/utils/db-connection'
import { AuditTableSQLGenerator } from '@/core/generators/audit-table-generator'
import { TriggerManager } from '@/core/generators/triggers-generator'
import { MigrationFileGenerator } from '@/core/generators/migration-file-generator'
import { MigrationType } from '@/core/types/migration.types'

export class MigrationFactory {
  getMigrationService(
    migrationType: MigrationType,
    fileBuilderFactory: () => MigrationFileBuilder
  ): MigrationService {
    const migrationFileGenerator = new MigrationFileGenerator(
      fileBuilderFactory()
    )
    switch (migrationType) {
      case MigrationType.CREATE:
        return new CreateMigrationService(
          migrationFileGenerator,
          new TriggerManager(dbConnection),
          new AuditTableSQLGenerator()
        )
      case MigrationType.UPDATE:
        return new UpdateMigrationService(
          migrationFileGenerator,
          dbConnection,
          new AuditTableSQLGenerator(),
          new TriggerManager(dbConnection)
        )
      case MigrationType.ROUTINE:
        return new RoutinesMigrationService(migrationFileGenerator)
      case MigrationType.CUSTOM:
        return new CustomMigrationService(migrationFileGenerator)
      default:
        logger.error(`Tipo de migração desconhecido: ${migrationType}`)
        throw new Error(`Tipo de migração desconhecido: ${migrationType}`)
    }
  }
}
