import type { MigrationFileGenerator } from '@/core/generators/migration-file-generator'
import {
  MigrationService,
  type MigrationParams,
  type SQLProcessorResult,
} from '@/core/migration.service.interface'
import { parseCreateRoutineSQL } from '../parsers/routine-parser'
import { logger } from '@/utils/logger'

export class RoutinesMigrationService extends MigrationService {
  processUpSQL(upSQL: string): SQLProcessorResult {
    return {
      main: [upSQL],
    }
  }

  processDownSQL(downSQL: string): SQLProcessorResult {
    const downSQLStatements = downSQL
      .split(';')
      .filter(Boolean)
      .map((s) => `${s.trim()};`)

    return {
      main: downSQLStatements,
    }
  }
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

    const upSQLStatements = this.processUpSQL(upSQL).main.join('\n')
    const downSQLStatements = this.processDownSQL(downSQL).main

    const migrationFilePathCreated =
      await this.migrationFileGenerator.generateMigrationFile({
        routineSQLStatement: upSQLStatements,
        downSQLStatements: downSQLStatements,
        routineDefinitions: routineDef,
      })

    return migrationFilePathCreated
  }
}
