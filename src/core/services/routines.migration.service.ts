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

    const { up: upSQL, down: downSQL } = await this.processSQLFile(
      sqlFiles.currentSqlFile
    )
    const routineDef = parseCreateRoutineSQL(upSQL)

    if (!routineDef) {
      logger.error('Nenhuma definição de rotina encontrada no arquivo SQL.')
      throw new Error('Nenhuma definição de rotina encontrada no arquivo SQL.')
    }

    const downSQLStatements = downSQL
      .split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    const migrationFilePathCreated = await generateMigrationFile(
      {
        routineSQLStatement: upSQL,
        downSQLStatements: downSQLStatements,
        routineDefinitions: routineDef,
      },
      this.migrationBuilder
    )

    return migrationFilePathCreated
  }
}
