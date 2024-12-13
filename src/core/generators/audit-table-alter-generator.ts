import type { AlterTableDefinition } from '../types'

export function generateAuditTableAlterSQL(
  alterDef: AlterTableDefinition
): string {
  const auditTableName = `ad_${alterDef.tableName}`
  return `${alterDef.sql?.replace(new RegExp(`ALTER TABLE ${alterDef.tableName}`, 'g'), `ALTER TABLE ${auditTableName}`) || ''};`
}

// const alterDefs = parseAlterTableSQL(`
// ALTER TABLE user ADD COLUMN last_login TIMESTAMP;
// ALTER TABLE user CHANGE name nome VARCHAR(100) NOT NULL;
// `)

// for (const alterDef of alterDefs) {
//   const auditTableAlterSQL = generateAuditTableAlterSQL(alterDef)
//   console.log(auditTableAlterSQL)
// }
