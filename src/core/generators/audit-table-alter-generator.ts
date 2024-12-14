import { logger } from '@/utils/logger'
import type { AlterTableDefinition } from '../types'

export class AuditSQLGenerator {
  private readonly ignoredPatterns = [
    /CONSTRAINT/i,
    /FOREIGN KEY/i,
    /PRIMARY KEY/i,
    /INDEX/i,
    /UNIQUE/i,
    /CHECK/i,
    /ENGINE/i,
  ]

  generateAuditTableAlterSQL(alterDef: AlterTableDefinition): string | null {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return this.adaptStatement(alterDef.sql!)
  }

  adaptStatement(statement: string): string | null {
    // Check full statement content against ignored patterns
    if (this.ignoredPatterns.some((pattern) => pattern.test(statement))) {
      return null
    }

    // Only process column modifications for audit tables
    if (statement.match(/^ALTER TABLE/i)) {
      // Only allow ADD COLUMN, MODIFY COLUMN, DROP COLUMN
      if (/(ADD|MODIFY|DROP)\s+COLUMN/i.test(statement)) {
        return this.adaptAlterTableToAudit(statement)
      }
      return null
    }

    if (statement.match(/^DROP TABLE/i)) {
      return statement.replace(/DROP TABLE (\w+)/i, (_, tableName) => {
        return `DROP TABLE ad_${tableName}`
      })
    }

    if (statement.match(/^RENAME TABLE/i)) {
      return statement.replace(/RENAME TABLE (\w+)/i, (_, tableName) => {
        return `RENAME TABLE ad_${tableName}`
      })
    }

    logger.warn(`Comando não suportado diretamente: ${statement}`)
    return null
  }

  private adaptAlterTableToAudit(statement: string): string | null {
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
}
