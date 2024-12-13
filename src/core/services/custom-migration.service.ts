import { generateMigrationFile } from '@/core/generators/migration-file-generator'
import {
  MigrationService,
  type MigrationParams,
} from '@/core/migration.service.interface'
import type { MigrationFileBuilder } from '../migration.builder.interface'

export class CustomMigrationService extends MigrationService {
  constructor(private readonly migrationBuilder: MigrationFileBuilder) {
    super()
  }

  async generateMigration({ sqlFiles }: MigrationParams): Promise<string> {
    let sqlContent: string | undefined

    if (sqlFiles.currentSqlFile) {
      const fullPath = sqlFiles.currentSqlFile
      sqlContent = await Bun.file(fullPath).text()
    }

    const migrationFilePathCreated = await generateMigrationFile(
      {
        customSQL: sqlContent,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }
}
