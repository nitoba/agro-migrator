import type {
  CreateRoutineDefinition,
  TriggerDefinition,
  TriggersResult,
} from '@/core/types'
import { MigrationFileBuilder } from '../../core/migration.builder.interface'
import { injectable } from 'inversify'

@injectable()
export class DefaultMigrationFileBuilder extends MigrationFileBuilder {
  private addStatements(
    statements: string[] | undefined,
    targetArray: string[]
  ): void {
    if (statements && statements.length > 0) {
      for (const statement of statements) {
        targetArray.push(`await queryRunner.query(\`${statement}\`)`)
      }
    }
  }

  public addToUpStatementsFromSQL(sqlStatements?: string[]): void {
    this.addStatements(sqlStatements, this.upStatements)
  }

  public addToDownStatementsFromSQL(sqlStatements?: string[]): void {
    this.addStatements(sqlStatements, this.downStatements)
  }

  public addToUpStatementsFromTriggersSQL(
    triggersStatements?: TriggersResult[]
  ): void {
    if (triggersStatements && triggersStatements.length > 0) {
      for (const trigger of triggersStatements) {
        const { insertTrigger, updateTrigger, deleteTrigger } = trigger
        this.addTriggerSQL(insertTrigger)
        this.addTriggerSQL(updateTrigger)
        this.addTriggerSQL(deleteTrigger)
      }
    }
  }

  public addToDownStatementsFromTriggersSQL(
    triggersStatements?: TriggersResult[]
  ): void {
    if (triggersStatements && triggersStatements.length > 0) {
      for (const trigger of triggersStatements) {
        const { insertTrigger, updateTrigger, deleteTrigger } = trigger
        this.downStatements.push(
          `await queryRunner.query(\`DROP TRIGGER IF EXISTS ${insertTrigger.name};\`)`
        )
        insertTrigger.content &&
          this.downStatements.push(
            `await queryRunner.query(\`${insertTrigger.content}\`)`
          )
        this.downStatements.push(
          `await queryRunner.query(\`DROP TRIGGER IF EXISTS ${updateTrigger.name};\`)`
        )
        updateTrigger.content &&
          this.downStatements.push(
            `await queryRunner.query(\`${updateTrigger.content}\`)`
          )
        this.downStatements.push(
          `await queryRunner.query(\`DROP TRIGGER IF EXISTS ${deleteTrigger.name};\`)`
        )
        deleteTrigger.content &&
          this.downStatements.push(
            `await queryRunner.query(\`${deleteTrigger.content}\`)`
          )
      }
    }
  }

  private addTriggerSQL(trigger?: TriggerDefinition): void {
    if (trigger) {
      this.upStatements.push(
        `await queryRunner.query(\`DROP TRIGGER IF EXISTS ${trigger.name};\`)`
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
        `await queryRunner.query('DROP ${routineDefinitions.routineType} IF EXISTS ${routineDefinitions.routineName}')`
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
