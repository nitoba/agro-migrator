import type { MigrationFileGenerator } from '@/core/generators/migration-file-generator'
import {
  MigrationService,
  type MigrationParams,
} from '@/core/migration.service.interface'

export class CustomMigrationService extends MigrationService {
  constructor(private readonly migrationFileGenerator: MigrationFileGenerator) {
    super()
  }

  async generateMigration({ sqlFilePath }: MigrationParams): Promise<string> {
    let sqlContent: Awaited<ReturnType<typeof this.processSQLFile>> | undefined

    if (sqlFilePath) {
      sqlContent = await this.processSQLFile(sqlFilePath)
    }

    const upSQL = sqlContent?.up
    const downSQL = sqlContent?.down

    const downSQLStatements = downSQL
      ?.split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    const migrationFilePathCreated =
      await this.migrationFileGenerator.generateMigrationFile({
        customSQLStatement: upSQL,
        downSQLStatements: downSQLStatements,
      })

    return migrationFilePathCreated
  }
}
