import { MigrationService } from '@/core/migration.service.interface'
import { injectable } from 'inversify'

type CreateMigrationUseCaseProps = {
  sqlFilePath: string
}

@injectable()
export class CreateMigrationUseCase {
  constructor(private readonly migrationService: MigrationService) {}

  async execute({ sqlFilePath }: CreateMigrationUseCaseProps): Promise<string> {
    return this.migrationService.generateMigration({ sqlFilePath })
  }
}
