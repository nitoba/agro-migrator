import { generateMigrationFile } from '@/core/generators/migration-file-generator'
import {
  MigrationService,
  type MigrationParams,
} from '@/core/migration.service.interface'
import { parseCreateRoutineSQL } from '../parsers/routine-parser'
import type { MigrationFileBuilder } from '../migration.builder.interface'
import { logger } from '@/utils/logger'

export class RoutinesMigrationService extends MigrationService {
  constructor(private readonly migrationBuilder: MigrationFileBuilder) {
    super()
  }

  async generateMigration({ sqlFiles }: MigrationParams): Promise<string> {
    if (!sqlFiles.currentSqlFile) {
      logger.error('Nenhum arquivo SQL fornecido.')
      throw new Error('Nenhum arquivo SQL fornecido.')
    }

    const fullPath = sqlFiles.currentSqlFile

    const routineSQL = await Bun.file(fullPath).text()
    const routineDef = parseCreateRoutineSQL(routineSQL)

    if (!routineDef) {
      logger.error('Nenhuma definição de rotina encontrada no arquivo SQL.')
      throw new Error('Nenhuma definição de rotina encontrada no arquivo SQL.')
    }

    const migrationFilePathCreated = await generateMigrationFile(
      {
        routineSQLStatement: routineSQL,
        routineDefinitions: routineDef,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }
}
