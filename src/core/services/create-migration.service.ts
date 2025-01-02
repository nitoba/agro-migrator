import {
  MigrationService,
  type MigrationParams,
} from '@/core/migration.service.interface'
import { parseCreateTableSQL } from '@/core/parsers/create-table-parser'
import type { TriggerManager } from '@/core/generators/triggers-generator'
import type { MigrationFileGenerator } from '@/core/generators/migration-file-generator'
import type { TriggersResult } from '../types'
import type { AuditTableSQLGenerator } from '../generators/audit-table-generator'

export class CreateMigrationService extends MigrationService {
  constructor(
    private readonly migrationFileGenerator: MigrationFileGenerator,
    private readonly triggerManager: TriggerManager,
    private readonly auditTableGenerator: AuditTableSQLGenerator
  ) {
    super()
  }

  async generateMigration({ sqlFilePath }: MigrationParams): Promise<string> {
    // Lê e separa as seções UP e DOWN do arquivo SQL
    const { up: upSQL, down: downSQL } = await this.processSQLFile(sqlFilePath)

    // Analisa o UP SQL
    const tableDefs = parseCreateTableSQL(upSQL)

    const allCreateMainTableSQL: string[] = []
    const allCreateAuditTableSQL: string[] = []
    const allDropAuditTableSQL: string[] = []
    const allTriggersSQL: TriggersResult[] = []
    const allDropTriggersSQL: TriggersResult[] = []

    for (const tableDef of tableDefs) {
      const createMainTableSQL = tableDef.sql
      // Gera tabela de auditoria
      const auditTableSQL =
        this.auditTableGenerator.generateAuditTableSQL(tableDef)
      // Gera triggers
      const triggersSQL = this.triggerManager.generateTriggersSQLFromColumns({
        tableName: tableDef.tableName,
        columns: tableDef.columns.map((c) => c.name),
      })
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      allCreateMainTableSQL.push(createMainTableSQL!)
      allCreateAuditTableSQL.push(auditTableSQL)
      allDropAuditTableSQL.push(
        `DROP TABLE IF EXISTS ad_${tableDef.tableName};`
      )
      allTriggersSQL.push(triggersSQL)

      allDropTriggersSQL.push({
        insertTrigger: {
          name: triggersSQL.insertTrigger.name,
          content: '',
        },
        updateTrigger: {
          name: triggersSQL.updateTrigger.name,
          content: '',
        },
        deleteTrigger: {
          name: triggersSQL.deleteTrigger.name,
          content: '',
        },
      })
    }

    const downSQLStatements = downSQL
      .split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    const migrationFilePathCreated =
      await this.migrationFileGenerator.generateMigrationFile({
        upSQLStatements: allCreateMainTableSQL,
        downSQLStatements: downSQLStatements,
        auditUpSQLStatements: allCreateAuditTableSQL,
        auditDownSQLStatements: allDropAuditTableSQL,
        triggersUpSQLStatements: allTriggersSQL,
        triggersDownSQLStatements: allDropTriggersSQL,
      })

    return migrationFilePathCreated
  }
}
