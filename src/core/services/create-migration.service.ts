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

    // Lê o arquivo SQL
    const mainTableSQL =
      fullPath.length > 0 ? await Bun.file(fullPath).text() : ''

    // Analisa o arquivo SQL
    const tableDefs = parseCreateTableSQL(mainTableSQL)

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

    const migrationFilePathCreated = await generateMigrationFile(
      {
        mainTableSQL: allCreateMainTableSQL,
        auditTableSQL: allCreateAuditTableSQL,
        triggersSQL: allTriggersSQL,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }
}
