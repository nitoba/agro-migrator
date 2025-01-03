import { MigrationConfig } from '@/core/types/config.schema'
import type { MigrationTypes } from '@/core/types/migration.types'
import { logger } from '@/utils/logger'
import {
  group,
  select,
  text,
  isCancel,
  cancel,
  confirm,
  type SelectOptions,
} from '@clack/prompts'
import { inject, injectable } from 'inversify'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface MigrationInfo {
  migrationType: keyof typeof MigrationTypes
  migrationName: string
  outputDir: string
  sqlFile: string
}

@injectable()
export class MigrationPrompts {
  constructor(
    @inject(MigrationConfig)
    private readonly config: MigrationConfig
  ) {}

  async readAllSQLFilesFromFolder(): Promise<
    SelectOptions<string>['options'] | null
  > {
    {
      const sqlFilesDir = this.config.sqlFilesDir

      if (!sqlFilesDir) {
        logger.error(
          'Nenhuma pasta de arquivos SQL foi configurada! por favor, configure uma pasta de arquivos SQL no arquivo de configuração.'
        )
        process.exit(1)
      }

      const filesFromDir = await readdir(sqlFilesDir)

      if (filesFromDir.length === 0) {
        logger.warn(`Nenhum arquivo SQL encontrado na pasta ${sqlFilesDir}`)
        return null
      }

      return filesFromDir.map((file) => {
        return {
          value: join(sqlFilesDir, file),
          label: file,
          hint: `Arquivo SQL: ${file}`,
        } satisfies SelectOptions<string>['options'][number]
      })
    }
  }

  async collectMigrationInfo(): Promise<MigrationInfo> {
    const migrationInfo = await group(
      {
        migrationType: () =>
          select({
            message: 'Qual tipo de migração você deseja criar?',
            options: [
              {
                value: 'CREATE',
                label: 'Criar tabelas',
                hint: 'Criação de tabelas',
              },
              {
                value: 'UPDATE',
                label: 'Atualizar tabelas',
                hint: 'Atualização de tabelas',
              },
              {
                value: 'ROUTINE',
                label: 'Routine',
                hint: 'Criação de procedures e funções',
              },
              {
                value: 'CUSTOM',
                label: 'Criação customizada',
                hint: 'Criação de tabelas, triggers e procedures e tudo mais que você quiser',
              },
            ],
          }),
        migrationName: () =>
          text({
            message: 'Qual o nome da migration?',
            // TODO: Adicionar um placeholder baseado no tipo de migration
            placeholder: 'create_users_table',
            // TODO: Adicionar um default value baseado no tipo de migration
            defaultValue: `Create${Date.now()}${Math.floor(Math.random() * 1000)}`,
            validate: (value) => {
              // TODO: Usar o zod para validar o nome da migration
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

          if (results.migrationType === 'CUSTOM') {
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
            if (this.config.sqlFilesDir) {
              const options = await this.readAllSQLFilesFromFolder()

              if (!options) {
                return cancel('Não há arquivos SQL na pasta configurada')
              }

              const sqlFilePath = await select({
                message: 'Selecione um arquivo SQL para a migration',
                options: options,
              })

              if (isCancel(sqlFilePath)) {
                cancel('Tudo bem então, Tchau!')
                logger.warn('Criação de migration cancelada!')
                process.exit(0)
              }

              return sqlFilePath
            }

            const currentSqlMigrationFile = await text({
              message: 'Qual caminho do arquivo SQL?',
              placeholder:
                results.migrationType === 'CREATE'
                  ? 'create_users_table.sql'
                  : results.migrationType === 'UPDATE'
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
