import type { MigrationFileBuilder } from '../migration.builder.interface'
import type { CreateRoutineDefinition, TriggersResult } from '../types'

interface GenerateMigrationFileOptions {
  mainTableSQLStatements?: string[]
  auditTableSQLStatements?: string[]
  triggersSQLStatements?: TriggersResult[]
  routineSQLStatement?: string
  routineDefinitions?: CreateRoutineDefinition
  customSQLStatement?: string
}

export async function generateMigrationFile(
  options: GenerateMigrationFileOptions,
  builder: MigrationFileBuilder
): Promise<string> {
  const {
    triggersSQLStatements,
    mainTableSQLStatements,
    customSQLStatement,
    routineSQLStatement,
    auditTableSQLStatements,
    routineDefinitions,
  } = options

  builder.addToUpStatementsFromSQL(mainTableSQLStatements)
  builder.addToUpStatementsFromSQL(auditTableSQLStatements)
  builder.addTriggersSQL(triggersSQLStatements)
  builder.addToUpStatementsFromRoutineSQL(
    routineSQLStatement,
    routineDefinitions
  )
  builder.addToUpStatementsFromCustomSQL(customSQLStatement)

  const content = builder.buildMigrationFileContent()
  const migrationFilePath = builder.getMigrationFilePath()

  await Bun.write(migrationFilePath, content)
  return migrationFilePath
}
