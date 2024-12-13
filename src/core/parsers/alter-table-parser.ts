import { Parser, type BaseFrom, type ColumnRefItem } from 'node-sql-parser'
import type { AlterTableDefinition, AlterColumnOperation } from '../types'
const parser = new Parser()

export interface ActionNode {
  action: string
  column: Column
  old_column?: Column
  definition: Definition
  resource: string
  keyword: string
  suffix: string
  prefix: string
  type: string
  index?: string
  constraint?: string
}

export interface Column {
  type: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  table: any
  column: string
}

export interface Definition {
  constraint?: string
  reference_definition?: {
    table: string
    column: string
    on_delete?: string
    on_update?: string
    definition?: ColumnRefItem[]
  }
  column?: string | { expr: { value: string } }
  dataType: string
  nullable: {
    type: string
    value: string
  }
  primary?: string
  auto_increment?: {
    type: string
    value: string
  }
  index: string
  length?: number
  default_val?: {
    type: string
    value: {
      type: string
      value: string
    }
  }
  constraint_type?: string
}

export function parseAlterTableSQL(sql: string): AlterTableDefinition[] {
  const asts = parser.astify(sql, { database: 'MySQL' })

  const alterStatements = (Array.isArray(asts) ? asts : [asts]).filter(
    (node) => node.type === 'alter'
  )

  return alterStatements.map((alterNode) => {
    const tableName = (alterNode.table[0] as BaseFrom).table
    const operations: AlterColumnOperation[] = []

    const actions = Array.isArray(alterNode.expr)
      ? alterNode.expr
      : [alterNode.expr]

    for (const actionNode of actions) {
      const keyword = actionNode.keyword as string | undefined
      const resource = actionNode.resource as string | undefined

      if (isRenameTableAction(actionNode)) {
        operations.push(handleRenameTableAction(actionNode))
        continue
      }

      if (!keyword && !resource) {
        continue
      }

      switch (resource) {
        case 'column':
          operations.push(...handleColumnActions(actionNode))
          break
        case 'index':
          operations.push(...handleIndexActions(actionNode))
          break

        case 'constraint':
          operations.push(...handleConstraintActions(actionNode))
          break

        default:
          // Outros casos podem ser adicionados conforme necessário
          break
      }
    }

    const sql = parser.sqlify(alterNode, { trimQuery: true }).replace(/`/g, '')
    return {
      tableName,
      operations,
      sql,
    }
  })
}

function isRenameTableAction(actionNode: ActionNode): boolean {
  return actionNode.type === 'alter' && actionNode.action === 'rename'
}

function handleRenameTableAction(actionNode: ActionNode): AlterColumnOperation {
  return {
    action: 'rename_column',
    newTableName: actionNode.column.column,
    columnName: actionNode.column.column,
    newColumnName: actionNode.column.column,
    oldColumnName: actionNode.old_column?.column,
    // default: actionNode.definition.default_val?.value.value,
    // isNullable: actionNode.definition.nullable
    //   ? actionNode.definition.nullable.value !== 'not null'
    //   : true,
    // isPrimaryKey: actionNode.definition.primary === 'primary key',
    // extra: actionNode.definition.auto_increment ? 'AUTO_INCREMENT' : undefined,
  }
}

function handleColumnActions(actionNode: ActionNode): AlterColumnOperation[] {
  switch (actionNode.action) {
    case 'add':
      return [
        {
          action: 'add',
          columnName: actionNode.column.column,
          columnType: actionNode.definition.dataType,
          isNullable: actionNode.definition.nullable
            ? actionNode.definition.nullable.value !== 'not null'
            : true,
          default: actionNode.definition.default_val?.value.value,
          isPrimaryKey: actionNode.definition.primary === 'primary key',
          extra: actionNode.definition.auto_increment
            ? 'AUTO_INCREMENT'
            : undefined,
        },
      ]

    case 'drop':
      return [
        {
          action: 'drop',
          columnName: actionNode.column.column,
        },
      ]

    case 'modify':
      return [
        {
          action: 'modify',
          columnName: actionNode.column.column as string,
          columnType: actionNode.definition.dataType,
          isNullable: actionNode.definition.nullable
            ? actionNode.definition.nullable.value !== 'not null'
            : true,
          default: actionNode.definition.default_val?.value.value,
          isPrimaryKey: actionNode.definition.primary === 'primary key',
          extra: actionNode.definition.auto_increment
            ? 'AUTO_INCREMENT'
            : undefined,
        },
      ]

    case 'rename':
      if (actionNode.old_column && actionNode.column) {
        return [
          {
            action: 'rename_column',
            oldColumnName: actionNode.old_column.column,
            newColumnName: actionNode.column.column,
          },
        ]
      }
      if (actionNode.old_column && actionNode.definition) {
        return [
          {
            action: 'rename_column',
            oldColumnName: actionNode.old_column.column,
            newColumnName: actionNode.column.column,
          },
        ]
      }
      break

    case 'change': {
      return [
        {
          action: 'change',
          columnName: actionNode.column.column as string,
          newColumnName: actionNode.column.column as string,
          columnType: actionNode.definition.dataType,
          oldColumnName: actionNode.old_column?.column,
          isNullable: actionNode.definition.nullable
            ? actionNode.definition.nullable.value !== 'not null'
            : true,
          default: actionNode.definition.default_val?.value.value,
          isPrimaryKey: actionNode.definition.primary === 'primary key',
          extra: actionNode.definition.auto_increment
            ? 'AUTO_INCREMENT'
            : undefined,
          length: actionNode.definition.length,
        },
      ]
    }
  }
  return []
}

function handleIndexActions(actionNode: ActionNode): AlterColumnOperation[] {
  switch (actionNode.action) {
    case 'add': {
      const indexColumns = Array.isArray(actionNode.definition)
        ? (actionNode.definition as Definition[]).map((colRef) => {
            return typeof colRef.column === 'string'
              ? colRef.column
              : colRef.column?.expr.value || ''
          })
        : []
      return [
        {
          action: 'add_index',
          indexName: actionNode.definition.index,
          indexColumns,
        },
      ]
    }

    case 'drop':
      return [
        {
          action: 'drop_index',
          indexName: actionNode.index,
        },
      ]
  }
  return []
}

function handleConstraintActions(
  actionNode: ActionNode
): AlterColumnOperation[] {
  switch (actionNode.action) {
    case 'add': {
      const cDef = actionNode.definition
      if (cDef.constraint_type === 'FOREIGN KEY' && cDef.reference_definition) {
        return [
          {
            action: 'add_constraint',
            constraintName: cDef.constraint,
            constraintType: cDef.constraint_type.toUpperCase(),
            referencedTable: cDef.reference_definition.table,
            referencedColumns:
              cDef.reference_definition.definition?.map((col: ColumnRefItem) =>
                typeof col.column === 'string'
                  ? col.column
                  : col.column?.expr.value.toString() || ''
              ) || [],
            referencedOnDelete: cDef.reference_definition.on_delete,
            referencedOnUpdate: cDef.reference_definition.on_update,
          },
        ]
      }
      break
    }

    case 'drop':
      if (actionNode.constraint) {
        return [
          {
            action: 'drop_constraint',
            constraintName: actionNode.constraint,
          },
        ]
      }
      break
  }
  return []
}

// const alterDefs = parseAlterTableSQL(`
// ALTER TABLE user ADD COLUMN last_login TIMESTAMP;
// ALTER TABLE user RENAME COLUMN name TO nome;
// ALTER TABLE user CHANGE COLUMN nome usuario_nome VARCHAR(255) NOT NULL;
// `)

// console.log(JSON.stringify(alterDefs, null, 2))
