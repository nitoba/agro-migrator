import type {
  CreateRoutineDefinition,
  TriggerDefinition,
  TriggersResult,
} from '@/core/types'
import { MigrationFileBuilder } from '../../core/migration.builder.interface'

export class DefaultMigrationFileBuilder extends MigrationFileBuilder {
  public addToUpStatementsFromSQL(sqlStatements?: string[]): void {
    if (sqlStatements && sqlStatements.length > 0) {
      for (const sqlStatement of sqlStatements) {
        this.upStatements.push(`await queryRunner.query(\`${sqlStatement}\`);`)
      }
    }
  }

  public addTriggersSQL(triggersStatements?: TriggersResult[]): void {
    if (triggersStatements && triggersStatements.length > 0) {
      for (const trigger of triggersStatements) {
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
      this.addToUpStatementsFromSQL([trigger.content])
    }
  }

  public addToUpStatementsFromRoutineSQL(
    routineSQL?: string,
    routineDefinitions?: CreateRoutineDefinition
  ): void {
    if (routineSQL && routineSQL.length > 0 && routineDefinitions) {
      this.upStatements.push(
        `await queryRunner.query('DROP ${routineDefinitions.routineType} IF EXISTS ${routineDefinitions.routineName}');`
      )
      this.addToUpStatementsFromSQL([routineSQL])
    }
  }

  public addToUpStatementsFromCustomSQL(customSQL?: string): void {
    if (customSQL) {
      const sqlStatements = customSQL.split(';').filter((stmt) => stmt.trim())
      this.addToUpStatementsFromSQL(sqlStatements)
    }
  }
}
