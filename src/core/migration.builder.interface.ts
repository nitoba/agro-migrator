import path from 'node:path'
import type { CreateRoutineDefinition, TriggersResult } from './types'
import { createSlug } from '@/utils/create-slug'

export type MigrationFileBuilderArgs = {
  migrationName: string
  outputDir: string
}

export abstract class MigrationFileBuilder {
  protected migrationName = ''
  protected outputDir = ''
  protected className = ''
  protected upStatements: string[] = []
  protected downStatements: string[] = []
  private timestamp: number = Date.now()

  collectRequiredInformation({
    migrationName,
    outputDir,
  }: MigrationFileBuilderArgs) {
    this.migrationName = createSlug(migrationName)
    this.outputDir = outputDir
    this.className = this.generateClassName(this.migrationName)
  }

  private generateClassName(name: string): string {
    return (
      name
        .split(/[_,-]|(?=[A-Z])/)
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join('') + this.timestamp
    )
  }

  public abstract addToUpStatementsFromSQL(sqlStatements?: string[]): void
  public abstract addToDownStatementsFromSQL(sqlStatements?: string[]): void
  public abstract addToUpStatementsFromTriggersSQL(
    triggersStatements?: TriggersResult[]
  ): void
  public abstract addToDownStatementsFromTriggersSQL(
    triggersStatements?: TriggersResult[]
  ): void
  public abstract addToUpStatementsFromRoutineSQL(
    routineSQL?: string,
    routineDefinitions?: CreateRoutineDefinition
  ): void
  public abstract addToUpStatementsFromCustomSQL(rawSQLStatement?: string): void

  public buildMigrationFileContent(): string {
    return `
import type { MigrationInterface, QueryRunner } from "typeorm";

export class ${this.className} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    ${this.upStatements.join('\n    ').trim()}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    ${this.downStatements.join('\n    ').trim()}
  }
}
`.trim()
  }

  public getMigrationFilePath(): string {
    return path.join(
      this.outputDir,
      `${this.timestamp}-${this.migrationName}.ts`
    )
  }
}
