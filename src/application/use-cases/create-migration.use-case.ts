import type { MigrationService } from '@/core/migration.service.interface'

export class CreateMigrationUseCase {
  constructor(private readonly migrationService: MigrationService) {}

  async execute(sqlFilePath: string): Promise<string> {
    return this.migrationService.generateMigration({ sqlFilePath })
  }
}
