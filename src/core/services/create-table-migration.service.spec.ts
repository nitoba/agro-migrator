import {
  describe,
  it,
  expect,
  beforeEach,
  mock,
  afterEach,
  setSystemTime,
  spyOn,
} from 'bun:test'
import { CreateTableMigrationService } from './create-table-migration.service'
import { MigrationFileGeneratorService } from './migration-file-generator.service'
import { TriggersManagerService } from './triggers-manager.service'
import { AuditTableSQLGeneratorService } from './audit-table-generator.service'
import { rm, unlink } from 'node:fs/promises'
import { DefaultMigrationFileBuilder } from '@/infra/builders/migration.builder'

describe('CreateTableMigrationService', () => {
  let service: CreateTableMigrationService
  let mockMigrationFileGenerator: MigrationFileGeneratorService
  let mockTriggersManager: TriggersManagerService
  let mockAuditTableGenerator: AuditTableSQLGeneratorService
  let mockBuilder: DefaultMigrationFileBuilder

  beforeEach(() => {
    setSystemTime(new Date('2023-01-01'))
    mockBuilder = new DefaultMigrationFileBuilder()
    mockBuilder.collectRequiredInformation({
      migrationName: 'test',
      outputDir: 'test',
    })
    mockMigrationFileGenerator = new MigrationFileGeneratorService(mockBuilder)

    mockTriggersManager = {
      generateTriggersSQLFromColumns: mock(() => ({
        insertTrigger: { name: 'ins_trigger', content: 'INSERT TRIGGER SQL' },
        updateTrigger: { name: 'upd_trigger', content: 'UPDATE TRIGGER SQL' },
        deleteTrigger: { name: 'del_trigger', content: 'DELETE TRIGGER SQL' },
      })),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any

    mockAuditTableGenerator = {
      generateAuditTableSQL: mock(() => 'CREATE TABLE ad_test'),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any

    service = new CreateTableMigrationService(
      mockMigrationFileGenerator,
      mockTriggersManager,
      mockAuditTableGenerator
    )
  })

  afterEach(async () => {
    setSystemTime()
    await unlink('test.sql')
    await rm('test', { recursive: true, force: true })
  })

  it('should generate migration for single table creation', async () => {
    spyOn(mockMigrationFileGenerator, 'generateMigrationFile')
    const sqlContent = `
-- UP
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);
-- DOWN
DROP TABLE users;
`
    Bun.write('test.sql', sqlContent)
    const result = await service.generateMigration({ sqlFilePath: 'test.sql' })

    expect(result).toBe(`test/${new Date('2023-01-01').getTime()}-test.ts`)
    expect(mockMigrationFileGenerator.generateMigrationFile).toHaveBeenCalled()

    const expectedMigrationFileContent = `import type { MigrationInterface, QueryRunner } from "typeorm";

export class Test1672531200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100))")
    await queryRunner.query("CREATE TABLE ad_test")
    await queryRunner.query("DROP TRIGGER IF EXISTS ins_trigger;")
    await queryRunner.query("INSERT TRIGGER SQL")
    await queryRunner.query("DROP TRIGGER IF EXISTS upd_trigger;")
    await queryRunner.query("UPDATE TRIGGER SQL")
    await queryRunner.query("DROP TRIGGER IF EXISTS del_trigger;")
    await queryRunner.query("DELETE TRIGGER SQL")
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TRIGGER IF EXISTS ins_trigger;")
    await queryRunner.query("DROP TRIGGER IF EXISTS upd_trigger;")
    await queryRunner.query("DROP TRIGGER IF EXISTS del_trigger;")
    await queryRunner.query("DROP TABLE IF EXISTS ad_users;")
  }
}`
    expect((await Bun.file(result).text()).replaceAll('`', '"')).toBe(
      expectedMigrationFileContent
    )
  })
})
