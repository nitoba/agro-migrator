import { AlterTableMigrationService } from '@/core/services/alter-table-migration.service'
import { CreateTableMigrationService } from '@/core/services/create-table-migration.service'
import { StoredProcedureMigrationService } from '@/core/services/stored-procedure-migration.service'
import { RawSQLMigrationService } from '@/core/services/raw-sql-migration.service'
import { MigrationTypes } from '@/core/types/migration.types'
import { TriggersManagerService } from '@/core/services/triggers-manager.service'
import { AuditTableSQLGeneratorService } from '@/core/services/audit-table-generator.service'
import { MigrationFileGeneratorService } from '@/core/services/migration-file-generator.service'
import { MigrationFileBuilder } from '@/core/migration.builder.interface'
import { DefaultMigrationFileBuilder } from './builders/migration.builder'
import { IRepository } from '@/core/repositories/repository'
import { DatabaseRepository } from './repositories/database.repository'
import { MigrationRunner } from './cli'
import { MigrationPrompts } from './cli/migration.prompts'
import { Module } from './decorators/module'

@Module({
  providers: [
    { provide: IRepository, useClass: DatabaseRepository },
    { provide: MigrationTypes.UPDATE, useClass: AlterTableMigrationService },
    { provide: MigrationTypes.CREATE, useClass: CreateTableMigrationService },
    { provide: MigrationTypes.CUSTOM, useClass: RawSQLMigrationService },
    {
      provide: MigrationTypes.ROUTINE,
      useClass: StoredProcedureMigrationService,
    },
    {
      provide: MigrationFileBuilder,
      useClass: DefaultMigrationFileBuilder,
      scope: 'singleton',
    },
    MigrationFileGeneratorService,
    AuditTableSQLGeneratorService,
    TriggersManagerService,
    MigrationPrompts,
    MigrationRunner,
  ],
})
export class AppModule {}
