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
  create_definitions?: CreateDefinition
  default_val?: {
    type: string
    value: {
      type: string
      value: string
    }
  }
  nullable?: {
    type: string
    value: string
  }
}

export interface CreateDefinition {
  constraint: string
  definition: Definition[]
  constraint_type: string
  keyword: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  index: any
  resource: string
  reference_definition: ReferenceDefinition
}

export interface ReferenceDefinition {
  definition: Definition2[]
  table: Table[]
  keyword: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  match: any
  on_action: {
    type: string
    value: {
      type: string
      value: string
    }
  }[]
}

export interface Definition2 {
  type: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  table: any
  column: string
}

export interface Table {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  db: any
  table: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  as: any
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
          columnType:
            // @ts-ignore
            `${actionNode.definition.dataType}${actionNode.definition.parentheses ? `(${actionNode.definition.length}${actionNode.definition.scale ? `, ${actionNode.definition.scale}` : ''})` : ''}${actionNode.definition.suffix ? ` ${actionNode.definition.suffix.join(' ')}` : ''}`.trim(),
          isNullable: actionNode.nullable?.value !== 'not null',
          //default: actionNode.definition.default_val?.value.value,
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
          columnType:
            // @ts-ignore
            `${actionNode.definition.dataType}${actionNode.definition.parentheses ? `(${actionNode.definition.length}${actionNode.definition.scale ? `, ${actionNode.definition.scale}` : ''})` : ''}${actionNode.definition.suffix ? ` ${actionNode.definition.suffix.join(' ')}` : ''}`.trim(),
          isNullable: actionNode.nullable?.value !== 'not null',
          default: actionNode.default_val?.value.value,
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

    case 'change':
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
          indexName: actionNode.index,
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
      if (actionNode.create_definitions?.constraint_type === 'FOREIGN KEY') {
        const cDef = actionNode.create_definitions
        return [
          {
            action: 'add_constraint',
            constraintName: cDef.constraint,
            constraintType: cDef.constraint_type.toUpperCase(),
            referencedTable: cDef.reference_definition.table[0].table,
            referencedColumns:
              cDef.reference_definition.definition?.map((col) =>
                typeof col.column === 'string' ? col.column : ''
              ) || [],
            referencedOnDelete:
              cDef.reference_definition.on_action
                .find((item) => item.type === 'on delete')
                ?.value.value.toUpperCase() || '',
            referencedOnUpdate:
              cDef.reference_definition.on_action
                .find((item) => item.type === 'on update')
                ?.value.value.toUpperCase() || '',
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
