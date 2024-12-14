export interface ColumnDefinition {
  name: string
  type: string
  isNullable: boolean
  isPrimaryKey: boolean
  default?: string
  extra?: string
}

export interface TableDefinition {
  tableName: string
  columns: ColumnDefinition[]
  sql?: string
}

export interface AlterColumnOperation {
  action:
    | 'add'
    | 'modify'
    | 'drop'
    | 'rename_column'
    | 'add_index'
    | 'drop_index'
    | 'add_constraint'
    | 'drop_constraint'
    | 'rename_table'
    | 'change'
    | 'drop_table'
  columnName?: string
  columnType?: string
  isNullable?: boolean
  default?: string
  isPrimaryKey?: boolean
  extra?: string
  oldColumnName?: string
  newColumnName?: string
  indexName?: string
  length?: number
  indexColumns?: string[]
  constraintName?: string
  constraintType?: string // ex: FOREIGN KEY, UNIQUE, CHECK
  referencedTable?: string
  referencedColumns?: string[]
  referencedOnDelete?: string
  referencedOnUpdate?: string
  newTableName?: string
}

export interface AlterTableDefinition {
  tableName: string
  operations: AlterColumnOperation[]
  sql?: string
}

export interface TriggerDefinition {
  name: string
  content: string
}

export type TriggersResult = {
  insertTrigger: TriggerDefinition
  updateTrigger: TriggerDefinition
  deleteTrigger: TriggerDefinition
}

export interface RoutineParameter {
  name: string
  type: string
}

export interface CreateRoutineDefinition {
  routineType: 'FUNCTION' | 'PROCEDURE'
  routineName: string
  parameters: RoutineParameter[]
  returnType?: string // para FUNCTION
  body?: string
}
