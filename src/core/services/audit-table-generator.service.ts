import { logger } from '@/utils/logger'
import type { AlterTableDefinition, TableDefinition } from '../types'

export class AuditTableSQLGeneratorService {
  private readonly ignoredPatterns = [
    /CONSTRAINT/i,
    /FOREIGN KEY/i,
    /PRIMARY KEY/i,
    /INDEX/i,
    /UNIQUE/i,
    /CHECK/i,
    /ENGINE/i,
  ]

  generateAuditTableSQL(mainTable: TableDefinition): string {
    const auditTableName = `ad_${mainTable.tableName}`

    // Colunas padrão da auditoria
    const auditColumns = `
    id_audit INT AUTO_INCREMENT PRIMARY KEY,
    oper CHAR(1) DEFAULT NULL,
    data_audit DATE DEFAULT NULL,
    hora_audit TIME DEFAULT NULL,
    id_usuario INT UNSIGNED DEFAULT NULL,
    usuario VARCHAR(510) DEFAULT NULL,
    plataforma VARCHAR(50) DEFAULT NULL,
    ip_reverso VARCHAR(50) DEFAULT NULL,
    sistema_operacional VARCHAR(50) DEFAULT NULL,
    requisicao_id VARCHAR(50) DEFAULT NULL
    `.trim()

    // Colunas da tabela principal
    const mainTableColumns = mainTable.columns
      .map((col) => {
        let colDef = `${col.name} ${col.type.toUpperCase()}`
        if (!col.isNullable) colDef += ' NOT NULL'
        if (col.default) colDef += ` DEFAULT ${col.default}`
        if (col.extra) colDef += ` ${col.extra}`
        return colDef
      })
      .join(',\n')

    // Montar CREATE TABLE da auditoria
    const sql = `
  CREATE TABLE ${auditTableName} (
    ${auditColumns},
    ${mainTableColumns}
  );
  `.trim()
    return sql
  }

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
