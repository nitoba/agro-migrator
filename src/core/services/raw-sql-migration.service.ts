import type { MigrationFileGeneratorService } from '@/core/services/migration-file-generator.service'
import {
  MigrationService,
  type MigrationParams,
  type SQLProcessorResult,
} from '@/core/migration.service.interface'

export class RawSQLMigrationService extends MigrationService {
  processUpSQL(upSQL: string): SQLProcessorResult {
    const upSQLStatements = this.splitSQLStatements(upSQL)
    console.log(upSQLStatements)
    return { main: upSQLStatements }
  }

  processDownSQL(downSQL: string): SQLProcessorResult {
    const downSQLStatements = this.splitSQLStatements(downSQL)
    console.log(downSQLStatements)
    return { main: downSQLStatements }
  }

  private splitSQLStatements(sql: string): string[] {
    const statements = []
    let currentStatement = ''
    let insideFunction = false

    // biome-ignore lint/complexity/noForEach: <explanation>
    sql.split('\n').forEach((line) => {
      if (line.trim().startsWith('CREATE OR REPLACE FUNCTION')) {
        insideFunction = true
      }
      if (insideFunction) {
        currentStatement += `${line}\n`
        if (line.trim().endsWith('$$;')) {
          insideFunction = false
          statements.push(currentStatement.trim())
          currentStatement = ''
        }
      } else {
        if (line.trim().endsWith(';')) {
          statements.push((currentStatement + line).trim())
          currentStatement = ''
        } else {
          currentStatement += `${line}\n`
        }
      }
    })

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }

    return statements
  }

  constructor(
    private readonly migrationFileGenerator: MigrationFileGeneratorService
  ) {
    super()
  }

  async generateMigration({ sqlFilePath }: MigrationParams): Promise<string> {
    let sqlContent: Awaited<ReturnType<typeof this.processSQLFile>> | undefined

    if (sqlFilePath) {
      sqlContent = await this.processSQLFile(sqlFilePath)
    }

    const upSQLStatements = sqlContent?.up
      ? this.processUpSQL(sqlContent.up).main.join(' ')
      : undefined

    const downSQLStatements = sqlContent?.down
      ? this.processDownSQL(sqlContent.down).main
      : undefined

    const migrationFilePathCreated =
      await this.migrationFileGenerator.generateMigrationFile({
        customSQLStatement: upSQLStatements,
        downSQLStatements: downSQLStatements,
      })

    return migrationFilePathCreated
  }
}
