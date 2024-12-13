import { logger } from '@/utils/logger'
import type { TableDefinition, ColumnDefinition } from '../types'
import { Parser } from 'node-sql-parser'

const parser = new Parser()

type DefaultVal = {
  type: string
  name: {
    name: [
      {
        type: string
        value: string
      },
    ]
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  over: any | null
}

export function parseCreateTableSQL(sql: string): TableDefinition[] {
  const asts = parser.astify(sql)

  const createStatements = (Array.isArray(asts) ? asts : [asts]).filter(
    (node) => node.type === 'create'
  )

  return createStatements.map((createTableNode) => {
    if (
      !createTableNode.table ||
      !Array.isArray(createTableNode.table) ||
      createTableNode.table.length === 0
    ) {
      logger.error('Estrutura de tabela inválida no nó CREATE TABLE.')
      throw new Error('Estrutura de tabela inválida no nó CREATE TABLE.')
    }

    const tableName = createTableNode.table[0].table

    // Extrair as colunas da estrutura da tabela
    if (!createTableNode.create_definitions) {
      logger.error('Definições de colunas não encontradas no nó CREATE TABLE.')
      throw new Error(
        'Definições de colunas não encontradas no nó CREATE TABLE.'
      )
    }

    const columns: ColumnDefinition[] = createTableNode.create_definitions
      .filter((def) => def.resource === 'column')
      .map((col) => {
        return {
          name:
            col.column.type === 'column_ref'
              ? col.column.column
              : col.column.as,
          type: col.definition.dataType,
          isNullable: !!col.nullable,
          isPrimaryKey: !!col.primary,
          default: col.default_val
            ? (col.default_val.value as DefaultVal).name.name[0].value
            : undefined,
          extra: col.auto_increment ? 'AUTO_INCREMENT' : undefined,
        } as ColumnDefinition
      })

    const sql = parser
      .sqlify(createTableNode, { trimQuery: true })
      .replace(/`/g, '')

    return {
      tableName,
      columns,
      sql,
    }
  })
}
