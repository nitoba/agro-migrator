import {
  migrationConfigSchema,
  type MigrationConfig,
} from '@/core/types/config.schema'
import path from 'node:path'
import { ZodError } from 'zod'
import { argv } from 'node:process'

const DEFAULT_CONFIG_PATH = path.resolve('migration.config.ts')

function getConfigPath(): string {
  const configFlagIndex = argv.indexOf('--config')
  if (configFlagIndex !== -1 && argv[configFlagIndex + 1]) {
    return path.resolve(argv[configFlagIndex + 1])
  }
  return DEFAULT_CONFIG_PATH
}

export async function loadConfig(): Promise<MigrationConfig> {
  const configPath = getConfigPath()

  if (!(await Bun.file(configPath).exists())) {
    throw new Error(
      `Arquivo de configuração não encontrado na raiz do projeto: ${DEFAULT_CONFIG_PATH}.
      Certifique-se de criar um arquivo chamado "migration.config.ts".`
    )
  }

  try {
    const { default: userConfig } = await import(configPath)
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
    return migrationConfigSchema.parse(config)
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
