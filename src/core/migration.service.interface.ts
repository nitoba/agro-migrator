import { parseMigrationSQL } from './parsers/parse-migration-sql'
import type { SqlFiles } from './types'

export interface MigrationParams {
  sqlFiles: SqlFiles
}

export abstract class MigrationService {
  abstract generateMigration(params: MigrationParams): Promise<string>

  protected async processSQLFile(
    sqlFilePath: string
  ): Promise<ReturnType<typeof parseMigrationSQL>> {
    const sqlContent = await Bun.file(sqlFilePath).text()
    return parseMigrationSQL(sqlContent)
  }
}
