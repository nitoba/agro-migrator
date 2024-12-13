import type { MigrationFileBuilder } from '../migration.builder.interface'
import type { CreateRoutineDefinition, TriggersResult } from '../types'

interface GenerateMigrationFileOptions {
  upSQLStatements?: string[]
  downSQLStatements?: string[]
  auditUpSQLStatements?: string[]
  auditDownSQLStatements?: string[]
  triggersUpSQLStatements?: TriggersResult[]
  triggersDownSQLStatements?: TriggersResult[]
  routineSQLStatement?: string
  routineDefinitions?: CreateRoutineDefinition
  customSQLStatement?: string
}

export async function generateMigrationFile(
  options: GenerateMigrationFileOptions,
  builder: MigrationFileBuilder
): Promise<string> {
  const {
    triggersUpSQLStatements,
    triggersDownSQLStatements,
    upSQLStatements,
    downSQLStatements,
    auditUpSQLStatements,
    auditDownSQLStatements,
    customSQLStatement,
    routineSQLStatement,
    routineDefinitions,
  } = options

  // Adiciona os statements para o UP
  builder.addToUpStatementsFromCustomSQL(customSQLStatement)
  builder.addToUpStatementsFromRoutineSQL(
    routineSQLStatement,
    routineDefinitions
  )
  builder.addToUpStatementsFromSQL(upSQLStatements)
  builder.addToUpStatementsFromSQL(auditUpSQLStatements)
  builder.addToUpStatementsFromTriggersSQL(triggersUpSQLStatements)

  // Adiciona os statements para o DOWN
  builder.addToDownStatementsFromTriggersSQL(triggersDownSQLStatements)
  builder.addToDownStatementsFromSQL(auditDownSQLStatements)
  builder.addToDownStatementsFromSQL(downSQLStatements)

  const content = builder.buildMigrationFileContent()
  const migrationFilePath = builder.getMigrationFilePath()

  await Bun.write(migrationFilePath, content)
  return migrationFilePath
}
