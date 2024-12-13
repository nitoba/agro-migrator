import type { AlterColumnOperation } from '../types'

export function columnDefinitionToSQL(col: AlterColumnOperation): string {
  // if (!col.columnName) {
  //   throw new Error(
  //     'columnName e columnType são necessários para gerar a definição da coluna.'
  //   )
  // }

  // Iniciar com o nome e tipo da coluna
  let typeWithLength = col.columnType ? col.columnType.toUpperCase() : ''
  if (col.length && col.length > 0) {
    typeWithLength += `(${col.length})`
  }

  let colDef = `${col.columnName} ${typeWithLength}`

  if (col.isNullable === false) {
    colDef += ' NOT NULL'
  }

  if (col.default !== undefined) {
    colDef += ` DEFAULT ${col.default}`
  }

  if (col.extra) {
    colDef += ` ${col.extra}`
  }

  // Constraints
  // Verificamos primeiro se a coluna é primary key
  if (
    col.isPrimaryKey === true ||
    col.constraintType?.toUpperCase() === 'PRIMARY KEY'
  ) {
    colDef += ' PRIMARY KEY'
  }

  // UNIQUE Constraint
  if (col.constraintType?.toUpperCase() === 'UNIQUE') {
    colDef += ' UNIQUE'
  }

  // FOREIGN KEY Constraint (inline)
  if (col.constraintType?.toUpperCase() === 'FOREIGN KEY') {
    if (
      !col.referencedTable ||
      !col.referencedColumns ||
      col.referencedColumns.length === 0
    ) {
      throw new Error(
        'Para FOREIGN KEY é necessário referencedTable e referencedColumns.'
      )
    }
    const refCols = col.referencedColumns.join(', ')
    colDef += ` REFERENCES ${col.referencedTable}(${refCols})`

    if (col.referencedOnDelete) {
      colDef += ` ON DELETE ${col.referencedOnDelete}`
    }

    if (col.referencedOnUpdate) {
      colDef += ` ON UPDATE ${col.referencedOnUpdate}`
    }
  }

  return colDef.trim()
}
