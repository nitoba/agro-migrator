import path from 'node:path'
import { parseMigrationSQL } from './parsers/parse-migration-sql'

export interface MigrationParams {
  sqlFilePath?: string
}

export abstract class MigrationService {
  abstract generateMigration(params: MigrationParams): Promise<string>

  protected async processSQLFile(
    sqlFilePath?: string
  ): Promise<ReturnType<typeof parseMigrationSQL>> {
    if (!sqlFilePath) {
      throw new Error('Nenhum arquivo SQL fornecido.')
    }

    const sqlFile = Bun.file(path.resolve(sqlFilePath))

    if (!(await sqlFile.exists())) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlFilePath}`)
    }
    const sqlContent = await sqlFile.text()
    return parseMigrationSQL(sqlContent)
  }
}
