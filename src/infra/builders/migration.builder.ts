import { MigrationFileBuilder } from '../../core/migration.builder.interface'
import type {
  CreateRoutineDefinition,
  TriggerDefinition,
  TriggersResult,
} from '../../core/types'

export class DefaultMigrationFileBuilder extends MigrationFileBuilder {
  public addMainTableSQL(sql?: string[]): void {
    if (sql && sql.length > 0) {
      for (const sqlStatement of sql) {
        this.upStatements.push(`await queryRunner.query(\`${sqlStatement}\`);`)
      }
    }
  }

  public addAuditTableSQL(sql?: string[]): void {
    if (sql && sql.length > 0) {
      for (const sqlStatement of sql) {
        this.upStatements.push(`await queryRunner.query(\`${sqlStatement}\`);`)
      }
    }
  }

  public addTriggersSQL(triggers?: TriggersResult[]): void {
    if (triggers && triggers.length > 0) {
      for (const trigger of triggers) {
        const { insertTrigger, updateTrigger, deleteTrigger } = trigger
        this.addTriggerSQL(insertTrigger)
        this.addTriggerSQL(updateTrigger)
        this.addTriggerSQL(deleteTrigger)
      }
    }
  }

  private addTriggerSQL(trigger?: TriggerDefinition): void {
    if (trigger) {
      this.upStatements.push(
        `await queryRunner.query(\`DROP TRIGGER IF EXISTS ${trigger.name};\`);`
      )
      this.upStatements.push(`await queryRunner.query(\`${trigger.content}\`);`)
    }
  }

  public addAlterSQL(statements?: string[], isAuditTable = false): void {
    if (statements && statements.length > 0) {
      for (const stmt of statements) {
        this.upStatements.push(`await queryRunner.query(\`${stmt.trim()}\`);`)
      }
    }
  }

  public addRoutineSQL(
    routineSQL?: string,
    routineDefinitions?: CreateRoutineDefinition
  ): void {
    if (routineSQL && routineSQL.length > 0 && routineDefinitions) {
      this.upStatements.push(
        `await queryRunner.query('DROP ${routineDefinitions.routineType} IF EXISTS ${routineDefinitions.routineName}');`
      )
      this.upStatements.push(`await queryRunner.query(\`${routineSQL}\`);`)
    }
  }

  public addCustomSQL(customSQL?: string): void {
    if (customSQL) {
      const sqlStatements = customSQL.split(';').filter((stmt) => stmt.trim())
      for (const stmt of sqlStatements) {
        this.upStatements.push(`await queryRunner.query(\`${stmt};\`);`)
      }
    }
  }
}
