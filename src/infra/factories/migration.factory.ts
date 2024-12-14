import type { MigrationService } from '@/core/migration.service.interface'
import { CreateMigrationService } from '../../core/services/create-migration.service'
import { CustomMigrationService } from '../../core/services/custom-migration.service'
import { RoutinesMigrationService } from '../../core/services/routines.migration.service'
import { UpdateMigrationService } from '../../core/services/update-migration.service'
import type { MigrationFileBuilder } from '@/core/migration.builder.interface'
import { logger } from '@/utils/logger'
import { dbConnection } from '@/utils/db-connection'
import { AuditSQLGenerator } from '@/core/generators/audit-table-alter-generator'
import { TriggerManager } from '@/core/generators/triggers-generator'

export class MigrationFactory {
  getMigrationService(
    migrationType: string,
    fileBuilderFactory: () => MigrationFileBuilder
  ): MigrationService {
    switch (migrationType) {
      case 'create':
        return new CreateMigrationService(
          fileBuilderFactory(),
          new TriggerManager(dbConnection)
        )
      case 'update':
        return new UpdateMigrationService(
          fileBuilderFactory(),
          dbConnection,
          new AuditSQLGenerator(),
          new TriggerManager(dbConnection)
        )
      case 'routine':
        return new RoutinesMigrationService(fileBuilderFactory())
      case 'custom':
        return new CustomMigrationService(fileBuilderFactory())
      default:
        logger.error(`Tipo de migração desconhecido: ${migrationType}`)
        throw new Error(`Tipo de migração desconhecido: ${migrationType}`)
    }
  }
}
