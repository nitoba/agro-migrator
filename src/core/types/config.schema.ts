import { z } from 'zod'

export const migrationConfigSchema = z.object({
  outputDir: z
    .string()
    .min(1, {
      message: '`outputDir` deve ser uma string válida e não pode estar vazia.',
    })
    .optional()
    .nullable(),
  sqlFilesDir: z
    .string()
    .min(1, {
      message:
        '`sqlFilesDir` deve ser uma string válida e não pode estar vazia.',
    })
    .optional()
    .nullable(),
  dbConnection: z.object({
    host: z.string().min(1, { message: '`host` deve ser uma string válida.' }),
    port: z
      .number()
      .int()
      .positive({ message: '`port` deve ser um número inteiro positivo.' }),
    username: z
      .string()
      .min(1, { message: '`username` deve ser uma string válida.' }),
    password: z
      .string()
      .min(1, { message: '`password` deve ser uma string válida.' }),
    database: z
      .string()
      .min(1, { message: '`database` deve ser uma string válida.' }),
  }),
})

export const MigrationConfig = Symbol('MigrationConfig')

export type MigrationConfig = z.infer<typeof migrationConfigSchema>
