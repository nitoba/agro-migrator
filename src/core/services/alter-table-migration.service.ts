import { parseAlterTableSQL } from '@/core/parsers/alter-table-parser'
import type { TriggersManagerService } from '@/core/services/triggers-manager.service'
import type { MigrationFileGeneratorService } from '@/core/services/migration-file-generator.service'
import type { AlterTableDefinition, TriggersResult } from '@/core/types'
import {
  MigrationService,
  type MigrationParams,
} from '../migration.service.interface'
import type { AuditTableSQLGeneratorService } from './audit-table-generator.service'
import type { IRepository } from '../repositories/repository'
import { injectable } from 'inversify'

type ProcessSQLResult = {
  main: string[]
  audit: string[]
  triggers: TriggersResult[]
}

@injectable()
export class AlterTableMigrationService extends MigrationService {
  constructor(
    private readonly migrationFileGenerator: MigrationFileGeneratorService,
    private readonly databaseRepository: IRepository,
    private readonly auditTableSQLGenerator: AuditTableSQLGeneratorService,
    private triggersManager: TriggersManagerService
  ) {
    super()
  }

  async generateMigration({ sqlFilePath }: MigrationParams): Promise<string> {
    const { up: upSQL, down: downSQL } = await this.processSQLFile(sqlFilePath)

    const currentUpStatements = await this.processUpSQL(upSQL)
    const currentDownStatements = await this.processDownSQL(downSQL)

    return this.migrationFileGenerator.generateMigrationFile({
      upSQLStatements: currentUpStatements?.main,
      downSQLStatements: currentDownStatements?.main,
      auditUpSQLStatements: currentUpStatements?.audit,
      auditDownSQLStatements: currentDownStatements?.audit,
      triggersUpSQLStatements: currentUpStatements?.triggers,
      triggersDownSQLStatements: currentDownStatements?.triggers,
    })
  }

  async processUpSQL(upSQL: string): Promise<ProcessSQLResult> {
    const alterDefs = parseAlterTableSQL(upSQL)
    const allUpSQLStatements: string[] = []
    const allUpAuditSQLStatements: string[] = []
    const allUpTriggersSQL: TriggersResult[] = []

    // Agrupar alterações por tabela
    const tableAlterations = new Map<string, typeof alterDefs>()

    // Processar UP
    for (const alterDef of alterDefs) {
      if (!tableAlterations.has(alterDef.tableName)) {
        tableAlterations.set(alterDef.tableName, [])
      }
      tableAlterations.get(alterDef.tableName)?.push(alterDef)
    }

    for (const [tableName, tableAlterDefs] of tableAlterations.entries()) {
      let currentColumns =
        await this.databaseRepository.getColumnsForTable(tableName)
      for (const alterDef of tableAlterDefs) {
        currentColumns = this.updateColumns(alterDef, currentColumns)
        allUpSQLStatements.push(
          alterDef.sql?.trim().endsWith(';')
            ? // biome-ignore lint/style/noNonNullAssertion: <explanation>
              alterDef.sql!
            : `${
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                alterDef.sql!
              };`
        )

        const auditSQL =
          this.auditTableSQLGenerator.generateAuditTableAlterSQL(alterDef)
        if (auditSQL) {
          allUpAuditSQLStatements.push(
            auditSQL.trim().endsWith(';') ? auditSQL : `${auditSQL};`
          )
        }
      }
      const newTriggersSQL =
        this.triggersManager.generateTriggersSQLFromColumns({
          tableName: tableName,
          columns: currentColumns,
        })
      allUpTriggersSQL.push(newTriggersSQL)
    }

    return {
      main: allUpSQLStatements,
      audit: allUpAuditSQLStatements,
      triggers: allUpTriggersSQL,
    }
  }

  async processDownSQL(downSQL: string): Promise<ProcessSQLResult> {
    const alterDefs = parseAlterTableSQL(downSQL)
    const allDownSQLStatements: string[] = []
    const allDownAuditSQLStatements: string[] = []
    const allDownTriggersSQL: TriggersResult[] = []

    // Agrupar alterações por tabela
    const tableAlterations = new Map<string, typeof alterDefs>()

    // Processar DOWN
    for (const alterDef of alterDefs) {
      if (!tableAlterations.has(alterDef.tableName)) {
        tableAlterations.set(alterDef.tableName, [])
      }
      tableAlterations.get(alterDef.tableName)?.push(alterDef)
    }

    for (const [tableName] of tableAlterations.entries()) {
      const oldTriggers =
        await this.triggersManager.getTriggersForTable(tableName)
      allDownTriggersSQL.push(oldTriggers)
    }
    const downStatements = downSQL
      .split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    for (const statement of downStatements) {
      const auditStatement =
        this.auditTableSQLGenerator.adaptStatement(statement)
      auditStatement && allDownAuditSQLStatements.push(auditStatement)
      allDownSQLStatements.push(statement)
    }

    return {
      main: allDownSQLStatements,
      audit: allDownAuditSQLStatements,
      triggers: allDownTriggersSQL,
    }
  }

  private updateColumns(
    alterRef: AlterTableDefinition,
    currentColumns: string[]
  ) {
    let updatedCurrentColumns = currentColumns
    for (const operation of alterRef.operations) {
      if (operation.action === 'add') {
        // Adicionar nova coluna
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        currentColumns.push(operation.columnName!)
      } else if (operation.action === 'drop') {
        // Remover coluna existente
        updatedCurrentColumns = currentColumns.filter(
          (col) => col !== operation.columnName
        )
      } else if (
        operation.action === 'modify' ||
        operation.action === 'change'
      ) {
        // Modificar uma coluna existente
        const index = currentColumns.findIndex(
          (col) => col === operation.columnName
        )
        if (index !== -1) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          currentColumns[index] = operation.columnName!
        }
      } else if (operation.action === 'rename_column') {
        // Renomear coluna
        const index = currentColumns.findIndex(
          (col) => col === operation.oldColumnName
        )
        if (index !== -1) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          currentColumns[index] = operation.newColumnName!
        }
      }
    }

    return updatedCurrentColumns
  }
}
