import type { MigrationService } from '@/core/migration.service.interface'
import { AlterTableMigrationService } from '@/core/services/alter-table-migration.service'
import { CreateTableMigrationService } from '@/core/services/create-table-migration.service'
import { Container } from 'inversify'
import 'reflect-metadata'
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

export class DIContainer {
  private container = new Container()

  constructor() {
    this.container.bind(IRepository).to(DatabaseRepository)

    this.container
      .bind<MigrationService>(MigrationTypes.UPDATE)
      .to(AlterTableMigrationService)

    this.container.bind(AuditTableSQLGeneratorService).toSelf()

    this.container
      .bind<MigrationService>(MigrationTypes.CREATE)
      .to(CreateTableMigrationService)

    this.container.bind(MigrationFileGeneratorService).toSelf()

    this.container
      .bind<MigrationService>(MigrationTypes.CUSTOM)
      .to(RawSQLMigrationService)

    this.container
      .bind<MigrationService>(MigrationTypes.ROUTINE)
      .to(StoredProcedureMigrationService)

    this.container.bind(TriggersManagerService).toSelf()

    this.container
      .bind(MigrationFileBuilder)
      .to(DefaultMigrationFileBuilder)
      .inSingletonScope()

    this.container.bind(MigrationPrompts).toSelf()

    this.container.bind(MigrationRunner).toSelf()
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  get<T>(key: any): T {
    return this.container.get<T>(key)
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  addConstant<T>(key: any, value: T) {
    this.container.bind<T>(key).toConstantValue(value)
  }
}

export const container = new DIContainer()
