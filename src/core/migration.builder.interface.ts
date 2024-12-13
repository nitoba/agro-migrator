import path from 'node:path'
import type { CreateRoutineDefinition, TriggersResult } from './types'

export type MigrationFileBuilderArgs = {
  migrationName: string
  outputDir: string
}

export abstract class MigrationFileBuilder {
  protected migrationName: string
  protected outputDir: string
  protected className: string
  protected upStatements: string[]

  constructor({ migrationName, outputDir }: MigrationFileBuilderArgs) {
    this.migrationName = migrationName
    this.outputDir = outputDir
    this.className = this.generateClassName(migrationName)
    this.upStatements = []
  }

  private generateClassName(name: string): string {
    return name
      .split(/[_,-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }

  public abstract addMainTableSQL(sql?: string[]): void

  public abstract addAuditTableSQL(sql?: string[]): void

  public abstract addTriggersSQL(triggers?: TriggersResult[]): void

  public abstract addAlterSQL(
    statements?: string[],
    isAuditTable?: boolean
  ): void

  public abstract addRoutineSQL(
    routineSQL?: string,
    routineDefinitions?: CreateRoutineDefinition
  ): void

  public abstract addCustomSQL(customSQL?: string): void

  public buildMigrationFileContent(): string {
    return `
import type { MigrationInterface, QueryRunner } from "typeorm";

export class ${this.className} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    ${this.upStatements.join('\n    ').trim()}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Implementar caso necessário: 
    // Remover triggers, rotinas, alterações e etc.
    // Ex: await queryRunner.query("DROP TABLE ...");
  }
}
`.trim()
  }

  public getMigrationFilePath(): string {
    return path.join(this.outputDir, `${Date.now()}-${this.migrationName}.ts`)
  }
}
