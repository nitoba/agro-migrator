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
  rawSQLStatement?: string
}

export class MigrationFileGeneratorService {
  constructor(private readonly builder: MigrationFileBuilder) {}

  async generateMigrationFile(
    options: GenerateMigrationFileOptions
  ): Promise<string> {
    const {
      triggersUpSQLStatements,
      triggersDownSQLStatements,
      upSQLStatements,
      downSQLStatements,
      auditUpSQLStatements,
      auditDownSQLStatements,
      rawSQLStatement,
      routineSQLStatement,
      routineDefinitions,
    } = options

    // Adiciona os statements para o UP
    this.builder.addToUpStatementsFromCustomSQL(rawSQLStatement)
    this.builder.addToUpStatementsFromRoutineSQL(
      routineSQLStatement,
      routineDefinitions
    )
    this.builder.addToUpStatementsFromSQL(upSQLStatements)
    this.builder.addToUpStatementsFromSQL(auditUpSQLStatements)
    this.builder.addToUpStatementsFromTriggersSQL(triggersUpSQLStatements)

    // Adiciona os statements para o DOWN
    this.builder.addToDownStatementsFromTriggersSQL(triggersDownSQLStatements)
    this.builder.addToDownStatementsFromSQL(auditDownSQLStatements)
    this.builder.addToDownStatementsFromSQL(downSQLStatements)

    const content = this.builder.buildMigrationFileContent()
    const migrationFilePath = this.builder.getMigrationFilePath()

    await Bun.write(migrationFilePath, content)
    return migrationFilePath
  }
}
