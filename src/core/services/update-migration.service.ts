import { parseAlterTableSQL } from '@/core/parsers/alter-table-parser'
import type { TriggerManager } from '@/core/generators/triggers-generator'
import { generateMigrationFile } from '@/core/generators/migration-file-generator'
import type { AlterTableDefinition, TriggersResult } from '@/core/types'
import type { Connection } from 'mysql2/promise'
import {
  MigrationService,
  type MigrationParams,
} from '../migration.service.interface'
import type { MigrationFileBuilder } from '../migration.builder.interface'
import type { AuditSQLGenerator } from '../generators/audit-table-alter-generator'

type ProcessSQLResult = {
  main: string[]
  audit: string[]
  triggers: TriggersResult[]
}

export class UpdateMigrationService extends MigrationService {
  constructor(
    private readonly migrationBuilder: MigrationFileBuilder,
    private readonly dbConnection: Connection,
    private readonly auditTableSQLGenerator: AuditSQLGenerator,
    private triggerManager: TriggerManager
  ) {
    super()

    if (!this.dbConnection) {
      throw new Error('Conexão com o banco de dados não inicializada.')
    }
  }

  async generateMigration({ sqlFilePath }: MigrationParams): Promise<string> {
    const { up: upSQL, down: downSQL } = await this.processSQLFile(sqlFilePath)

    const currentUpStatements = await this.processUpSQL(upSQL)
    const currentDownStatements = await this.processDownSQL(downSQL)

    return generateMigrationFile(
      {
        upSQLStatements: currentUpStatements?.main,
        downSQLStatements: currentDownStatements?.main,
        auditUpSQLStatements: currentUpStatements?.audit,
        auditDownSQLStatements: currentDownStatements?.audit,
        triggersUpSQLStatements: currentUpStatements?.triggers,
        triggersDownSQLStatements: currentDownStatements?.triggers,
      },
      this.migrationBuilder
    )
  }

  private async processUpSQL(upSQL: string): Promise<ProcessSQLResult> {
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
      let currentColumns = await this.getUpdatedColumnsForTable(tableName)
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
      const newTriggersSQL = this.triggerManager.generateTriggersSQLFromColumns(
        {
          tableName: tableName,
          columns: currentColumns,
        }
      )
      allUpTriggersSQL.push(newTriggersSQL)
    }

    return {
      main: allUpSQLStatements,
      audit: allUpAuditSQLStatements,
      triggers: allUpTriggersSQL,
    }
  }

  private async processDownSQL(downSQL: string): Promise<ProcessSQLResult> {
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
        await this.triggerManager.getTriggersForTable(tableName)
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

  private async getUpdatedColumnsForTable(
    tableName: string
  ): Promise<string[]> {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const [columns] = await this.dbConnection.query<[{ Field: string }[], any]>(
      `SHOW COLUMNS FROM ${tableName}`
    )
    return columns.map((col) => col.Field)
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
