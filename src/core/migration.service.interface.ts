import type { SqlFiles } from './types'

export interface MigrationParams {
  sqlFiles: SqlFiles
}

export abstract class MigrationService {
  abstract generateMigration(params: MigrationParams): Promise<string>
}
