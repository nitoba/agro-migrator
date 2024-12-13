export interface SqlFiles {
  currentSqlFile?: string
  originalMainTable?: string
}

export interface MigrationParams {
  sqlFiles: SqlFiles
}

export abstract class MigrationService {
  abstract generateMigration(params: MigrationParams): Promise<string>
}
