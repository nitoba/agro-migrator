import { parseAlterTableSQL } from '@/core/parsers/alter-table-parser'
import { generateAuditTableAlterSQL } from '@/core/generators/audit-table-alter-generator'
import { generateTriggersSQLFromColumns } from '@/core/generators/triggers-generator'
import { generateMigrationFile } from '@/core/generators/migration-file-generator'
import type { TriggersResult } from '@/core/types'
import {
  MigrationService,
  type MigrationParams,
} from '../migration.service.interface'
import type { MigrationFileBuilder } from '../migration.builder.interface'
import { logger } from '@/utils/logger'
import type { Connection } from 'mysql2/promise'

type TriggerDBResult = {
  Trigger: string
  Event: string
  Table: string
  Statement: string
  Timing: string
  Created: string
}

export class UpdateMigrationService extends MigrationService {
  constructor(
    private readonly migrationBuilder: MigrationFileBuilder,
    private readonly dbConnection: Connection
  ) {
    super()

    if (!this.dbConnection) {
      throw new Error('Conexão com o banco de dados não inicializada.')
    }
  }

  async generateMigration({ sqlFiles }: MigrationParams): Promise<string> {
    if (!sqlFiles.currentSqlFile) {
      const message = 'Nenhum arquivo SQL fornecido.'
      logger.error(message)
      throw new Error(message)
    }

    // Lê e separa as seções UP e DOWN do arquivo SQL
    const { up: upSQL, down: downSQL } = await this.processSQLFile(
      sqlFiles.currentSqlFile
    )

    // Parse o conteúdo SQL para obter todas as alterações
    const alterDefs = parseAlterTableSQL(upSQL)

    if (alterDefs.length === 0) {
      const message = 'Nenhuma instrução ALTER TABLE encontrada no arquivo SQL.'
      logger.error(message)
      throw new Error(message)
    }

    // Parse o conteúdo SQL do DOWN
    const downDefs = parseAlterTableSQL(downSQL)
    if (downDefs.length === 0) {
      const message = 'Nenhuma instrução ALTER TABLE encontrada no bloco DOWN.'
      logger.error(message)
      throw new Error(message)
    }

    // Acumuladores para todos os comandos ALTER da tabela principal e da auditoria
    const allUpSQLStatements: string[] = []
    const allDownSQLStatements: string[] = []
    const allUpAuditSQLStatements: string[] = []
    const allDownAuditSQLStatements: string[] = []
    const allDownTriggersSQL: TriggersResult[] = []
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

    // Processar cada tabela individualmente
    for (const [tableName, tableAlterDefs] of tableAlterations.entries()) {
      let currentColumns = await this.getUpdatedColumnsForTable(tableName)
      const oldTriggers = await this.getTriggersForTable(tableName)

      // Aplicar todas as operações de cada alteração
      for (const alterDef of tableAlterDefs) {
        for (const operation of alterDef.operations) {
          if (operation.action === 'add') {
            // Adicionar nova coluna
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            currentColumns.push(operation.columnName!)
          } else if (operation.action === 'drop') {
            // Remover coluna existente
            currentColumns = currentColumns.filter(
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

        // Adicionar o SQL de alteração para a tabela principal
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        allUpSQLStatements.push(alterDef.sql!)

        // Gerar comandos para alterar a tabela de auditoria
        const alterAuditTableSQL = generateAuditTableAlterSQL(alterDef)
        allUpAuditSQLStatements.push(alterAuditTableSQL)
      }

      // Gerar triggers com base no estado atualizado das colunas
      const newTriggersSQL = generateTriggersSQLFromColumns({
        tableName,
        columns: currentColumns, // Estado atualizado das colunas
      })

      console.log(JSON.stringify(oldTriggers))

      allUpTriggersSQL.push(newTriggersSQL)
      allDownTriggersSQL.push(oldTriggers)
    }

    // Processar statements DOWN e adaptar para a tabela de auditoria
    const downSQLStatements = downSQL
      .split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    for (const statement of downSQLStatements) {
      allDownSQLStatements.push(statement)
      const auditStatement = this.adaptStatementToAudit(statement)
      if (auditStatement) {
        allDownAuditSQLStatements.push(auditStatement)
      }
    }

    // Gerar o arquivo de migration
    const migrationFilePathCreated = await generateMigrationFile(
      {
        upSQLStatements: allUpSQLStatements,
        downSQLStatements: downSQLStatements,
        auditUpSQLStatements: allUpAuditSQLStatements,
        auditDownSQLStatements: allDownAuditSQLStatements,
        triggersUpSQLStatements: allUpTriggersSQL,
        triggersDownSQLStatements: allDownTriggersSQL,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }

  private async getTriggersForTable(
    tableName: string
  ): Promise<TriggersResult> {
    const [triggersSQL] = await this.dbConnection.query<
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      [TriggerDBResult[], any]
    >(`SHOW TRIGGERS LIKE '${tableName}'`)

    // Transformar o resultado em TriggersResult (pode ser adaptado conforme a saída real)
    return this.parseTriggersFromResult(triggersSQL)
  }

  private async getUpdatedColumnsForTable(
    tableName: string
  ): Promise<string[]> {
    // Obter o estado inicial das colunas da tabela
    const [initialColumns] = await this.dbConnection.query<
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      [{ Field: string }[], any]
    >(`SHOW COLUMNS FROM ${tableName}`)
    return initialColumns.map((col) => col.Field)
  }

  private parseTriggersFromResult(result: TriggerDBResult[]): TriggersResult {
    const triggerTypes = {
      da: 'insertTrigger',
      de: 'updateTrigger',
      di: 'deleteTrigger',
    } as const

    return result
      .filter((trigger) =>
        Object.keys(triggerTypes).some((suffix) =>
          trigger.Trigger.endsWith(suffix)
        )
      )
      .reduce((acc, currentTrigger) => {
        const suffix = Object.keys(triggerTypes).find((suffix) =>
          currentTrigger.Trigger.endsWith(suffix)
        )

        if (suffix) {
          const triggerKey = triggerTypes[suffix as keyof typeof triggerTypes]
          acc[triggerKey] = {
            name: currentTrigger.Trigger,
            content: currentTrigger.Statement,
          }
        }

        return acc
      }, {} as TriggersResult)
  }

  private adaptAlterTableToAudit(statement: string): string | null {
    // Substituir a tabela principal pela tabela de auditoria
    const tableNameRegex = /ALTER TABLE\s+(\w+)/i
    const match = statement.match(tableNameRegex)
    if (match) {
      const tableName = match[1]
      const auditTableName = `ad_${tableName}`
      return statement.replace(
        new RegExp(`\\b${tableName}\\b`, 'g'),
        auditTableName
      )
    }
    return null
  }

  private adaptStatementToAudit(statement: string): string | null {
    // Verifica e adapta os comandos SQL listados
    if (statement.match(/^ALTER TABLE/i)) {
      return this.adaptAlterTableToAudit(statement)
    }

    if (statement.match(/^DROP TABLE/i)) {
      // Adaptar DROP TABLE
      return statement.replace(/DROP TABLE (\w+)/i, (_, tableName) => {
        const auditTableName = `ad_${tableName}`
        return `DROP TABLE ${auditTableName}`
      })
    }

    if (statement.match(/^RENAME TABLE/i)) {
      // Adaptar RENAME TABLE
      return statement.replace(/RENAME TABLE (\w+)/i, (_, tableName) => {
        const auditTableName = `ad_${tableName}`
        return `RENAME TABLE ${auditTableName}`
      })
    }

    if (statement.match(/^ALTER COLUMN/i)) {
      return this.adaptAlterTableToAudit(statement)
    }

    if (statement.match(/^ADD CONSTRAINT/i)) {
      return this.adaptAlterTableToAudit(statement)
    }

    if (statement.match(/^DROP INDEX/i)) {
      return this.adaptAlterTableToAudit(statement)
    }

    if (statement.match(/^ENGINE/i)) {
      return this.adaptAlterTableToAudit(statement)
    }

    logger.warn(`Comando não suportado diretamente: ${statement}`)
    return null
  }
}
