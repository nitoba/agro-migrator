import type { MigrationFileGenerator } from '@/core/generators/migration-file-generator'
import {
  MigrationService,
  type MigrationParams,
} from '@/core/migration.service.interface'
import { parseCreateRoutineSQL } from '../parsers/routine-parser'
import { logger } from '@/utils/logger'

export class RoutinesMigrationService extends MigrationService {
  constructor(private readonly migrationFileGenerator: MigrationFileGenerator) {
    super()
  }

  async generateMigration({ sqlFilePath }: MigrationParams): Promise<string> {
    const { up: upSQL, down: downSQL } = await this.processSQLFile(sqlFilePath)
    const routineDef = parseCreateRoutineSQL(upSQL)

    if (!routineDef) {
      logger.error('Nenhuma definição de rotina encontrada no arquivo SQL.')
      throw new Error('Nenhuma definição de rotina encontrada no arquivo SQL.')
    }

    const downSQLStatements = downSQL
      .split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    const migrationFilePathCreated =
      await this.migrationFileGenerator.generateMigrationFile({
        routineSQLStatement: upSQL,
        downSQLStatements: downSQLStatements,
        routineDefinitions: routineDef,
      })

    return migrationFilePathCreated
  }
}
