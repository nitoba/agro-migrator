import {
  MigrationConfigSchema,
  type MigrationConfig,
} from '@/core/types/config.schema'
import path from 'node:path'
import { ZodError } from 'zod'

const DEFAULT_CONFIG_PATH = path.resolve('migration.config.ts')

export async function loadConfig(): Promise<MigrationConfig> {
  if (!(await Bun.file(DEFAULT_CONFIG_PATH).exists())) {
    throw new Error(
      `Arquivo de configuração não encontrado na raiz do projeto: ${DEFAULT_CONFIG_PATH}.
      Certifique-se de criar um arquivo chamado "migration.config.ts".`
    )
  }

  try {
    const { default: userConfig } = await import(DEFAULT_CONFIG_PATH)
    return validateConfig(userConfig)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Erro ao carregar o arquivo de configuração: ${error.message}`
      )
    }
    throw error
  }
}
function validateConfig(config: unknown): MigrationConfig {
  try {
    return MigrationConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((err) => ({
        field: `${err.path.join('.')}`,
        message: err.message,
      }))

      throw new Error(
        `Erro de validação no arquivo de configuração:\n${JSON.stringify(
          errorMessages,
          null,
          2
        )}`
      )
    }

    if (error instanceof Error) {
      throw new Error(
        `Erro de validação no arquivo de configuração: ${error.message}`
      )
    }
    throw error
  }
}
