import type { TableDefinition } from '../types'

export function generateAuditTableSQL(mainTable: TableDefinition): string {
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
