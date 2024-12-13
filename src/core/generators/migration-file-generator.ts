import type { MigrationFileBuilder } from '../migration.builder.interface'
import type { CreateRoutineDefinition, TriggersResult } from '../types'

interface GenerateMigrationFileOptions {
  mainTableSQL?: string[]
  auditTableSQL?: string[]
  triggersSQL?: TriggersResult[]
  alterMainTableSQL?: string[]
  alterAuditTableSQL?: string[]
  routineSQL?: string
  routineDefinitions?: CreateRoutineDefinition
  customSQL?: string
}

export async function generateMigrationFile(
  options: GenerateMigrationFileOptions,
  builder: MigrationFileBuilder
): Promise<string> {
  const {
    mainTableSQL,
    auditTableSQL,
    triggersSQL,
    alterMainTableSQL,
    alterAuditTableSQL,
    routineSQL,
    routineDefinitions,
    customSQL,
  } = options

  builder.addMainTableSQL(mainTableSQL)
  builder.addAuditTableSQL(auditTableSQL)
  builder.addTriggersSQL(triggersSQL)
  builder.addAlterSQL(alterMainTableSQL)
  builder.addAlterSQL(alterAuditTableSQL, true)
  builder.addRoutineSQL(routineSQL, routineDefinitions)
  builder.addCustomSQL(customSQL)

  const content = builder.buildMigrationFileContent()
  const migrationFilePath = builder.getMigrationFilePath()

  await Bun.write(migrationFilePath, content)
  return migrationFilePath
}
