import type { MigrationConfig } from '@/core/types/config.schema'
import { logger } from '@/utils/logger'
import { group, select, text, isCancel, cancel, confirm } from '@clack/prompts'

export interface MigrationInfo {
  migrationType: string
  migrationName: string
  outputDir: string
  sqlFile: string
}

export class MigrationPrompts {
  constructor(private readonly config: MigrationConfig) {}

  async collectMigrationInfo(): Promise<MigrationInfo> {
    const migrationInfo = await group(
      {
        migrationType: () =>
          select({
            message: 'Qual tipo de migração você deseja criar?',
            options: [
              {
                value: 'create',
                label: 'Criar tabelas',
                hint: 'Criação de tabelas',
              },
              {
                value: 'update',
                label: 'Atualizar tabelas',
                hint: 'Atualização de tabelas',
              },
              {
                value: 'routine',
                label: 'Routine',
                hint: 'Criação de procedures e funções',
              },
              {
                value: 'custom',
                label: 'Criação customizada',
                hint: 'Criação de tabelas, triggers e procedures e tudo mais que você quiser',
              },
            ],
          }),
        migrationName: () =>
          text({
            message: 'Qual o nome da migration?',
            placeholder: 'create_users_table',
            defaultValue: `Create${Date.now()}${Math.floor(Math.random() * 1000)}`,
            validate: (value) => {
              if (value.length === 0) {
                return 'O nome da migration não pode ser vazio'
              }

              if (value.length < 3) {
                return 'O nome da migration deve ter pelo menos 3 caracteres'
              }

              if (value.length > 255) {
                return 'O nome da migration deve ter no máximo 255 caracteres'
              }
            },
          }),
        sqlFile: async ({ results }) => {
          let withSQLFile = true
          let sqlFile: string | undefined

          if (results.migrationType === 'custom') {
            const shouldProvideASqlFile = await confirm({
              message: 'Você deseja fornecer um arquivo SQL?',
            })

            if (isCancel(shouldProvideASqlFile)) {
              cancel('Tudo bem então, Tchau!')
              logger.warn('Criação de migration cancelada!')
              process.exit(0)
            }

            withSQLFile = shouldProvideASqlFile
          }

          if (withSQLFile) {
            const currentSqlMigrationFile = await text({
              message: 'Qual caminho do arquivo SQL?',
              placeholder:
                results.migrationType === 'create'
                  ? 'create_users_table.sql'
                  : results.migrationType === 'update'
                    ? 'alter_users_table.sql'
                    : 'custom_migration.sql',
              validate: (value) => {
                if (value.length === 0) {
                  return 'O nome do arquivo SQL não pode ser vazio'
                }
              },
            })

            if (isCancel(currentSqlMigrationFile)) {
              cancel('Tudo bem então, Tchau!')
              logger.warn('Criação de migration cancelada!')
              process.exit(0)
            }

            sqlFile = currentSqlMigrationFile as string
          }

          return sqlFile
        },
        outputDir: () => {
          if (!this.config.outputDir) {
            return text({
              message: 'Qual o diretório de saída?',
              placeholder: 'src/migrations',
              initialValue: 'src/migrations',
            })
          }
        },
      },
      {
        onCancel: () => {
          cancel('Tudo bem então, Tchau!')
          logger.warn('Criação de migration cancelada!')
          process.exit(0)
        },
      }
    )

    return migrationInfo as MigrationInfo
  }
}
