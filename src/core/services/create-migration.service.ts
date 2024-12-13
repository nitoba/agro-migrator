import path from 'node:path'
import {
  MigrationService,
  type MigrationParams,
} from '@/core/migration.service.interface'
import { parseCreateTableSQL } from '@/core/parsers/create-table-parser'
import { generateAuditTableSQL } from '@/core/generators/audit-table-create-generator'
import { generateTriggersSQLFromColumns } from '@/core/generators/triggers-generator'
import { generateMigrationFile } from '@/core/generators/migration-file-generator'
import type { MigrationFileBuilder } from '../migration.builder.interface'
import type { TriggersResult } from '../types'

export class CreateMigrationService extends MigrationService {
  constructor(private readonly migrationBuilder: MigrationFileBuilder) {
    super()
  }

  async generateMigration({ sqlFiles }: MigrationParams): Promise<string> {
    const fullPath = sqlFiles.currentSqlFile
      ? path.resolve(sqlFiles.currentSqlFile)
      : ''

    // Lê e separa as seções UP e DOWN do arquivo SQL
    const { up: upSQL, down: downSQL } = await this.processSQLFile(fullPath)

    // Analisa o UP SQL
    const tableDefs = parseCreateTableSQL(upSQL)

    const allCreateMainTableSQL: string[] = []
    const allCreateAuditTableSQL: string[] = []
    const allTriggersSQL: TriggersResult[] = []

    for (const tableDef of tableDefs) {
      const createMainTableSQL = tableDef.sql
      // Gera tabela de auditoria
      const auditTableSQL = generateAuditTableSQL(tableDef)
      // Gera triggers
      const triggersSQL = generateTriggersSQLFromColumns({
        tableName: tableDef.tableName,
        columns: tableDef.columns.map((c) => c.name),
      })
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      allCreateMainTableSQL.push(createMainTableSQL!)
      allCreateAuditTableSQL.push(auditTableSQL)
      allTriggersSQL.push(triggersSQL)
    }

    const downSQLStatements = downSQL.split(';').filter(Boolean)

    const migrationFilePathCreated = await generateMigrationFile(
      {
        mainTableSQLStatements: allCreateMainTableSQL,
        mainTableSQLDownStatements: downSQLStatements,
        auditTableSQLStatements: allCreateAuditTableSQL,
        triggersSQLStatements: allTriggersSQL,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }
}
