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

    const sqlContent = await Bun.file(sqlFiles.currentSqlFile).text()

    // Parse o conteúdo SQL para obter todas as alterações
    const alterDefs = parseAlterTableSQL(sqlContent)
    if (alterDefs.length === 0) {
      const message = 'Nenhuma instrução ALTER TABLE encontrada no arquivo SQL.'
      logger.error(message)
      throw new Error(message)
    }

    // Acumuladores para todos os comandos ALTER da tabela principal e da auditoria
    const allAlterMainTableSQL: string[] = []
    const allAlterAuditTableSQL: string[] = []
    const allTriggersSQL: TriggersResult[] = []

    // Agrupar alterações por tabela
    const tableAlterations = new Map<string, typeof alterDefs>()

    for (const alterDef of alterDefs) {
      if (!tableAlterations.has(alterDef.tableName)) {
        tableAlterations.set(alterDef.tableName, [])
      }
      tableAlterations.get(alterDef.tableName)?.push(alterDef)
    }

    // Processar cada tabela individualmente
    for (const [tableName, tableAlterDefs] of tableAlterations.entries()) {
      let currentColumns: string[] = []

      // Obter o estado inicial das colunas da tabela
      const [initialColumns] = await this.dbConnection.query<
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        [{ Field: string }[], any]
      >(`SHOW COLUMNS FROM ${tableName}`)
      currentColumns = initialColumns.map((col) => col.Field)

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
        allAlterMainTableSQL.push(alterDef.sql!)

        // Gerar comandos para alterar a tabela de auditoria
        const alterAuditTableSQL = generateAuditTableAlterSQL(alterDef)
        allAlterAuditTableSQL.push(alterAuditTableSQL)
      }

      // Gerar triggers com base no estado atualizado das colunas
      const triggersSQL = generateTriggersSQLFromColumns({
        tableName,
        columns: currentColumns, // Estado atualizado das colunas
      })

      allTriggersSQL.push(triggersSQL)
    }

    // Gerar o arquivo de migration
    const migrationFilePathCreated = await generateMigrationFile(
      {
        alterMainTableSQL: allAlterMainTableSQL,
        alterAuditTableSQL: allAlterAuditTableSQL,
        triggersSQL: allTriggersSQL,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }
}
