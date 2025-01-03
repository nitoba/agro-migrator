import type { Connection } from 'mysql2/promise'
import type {
  IRepository,
  TriggerDBResult,
} from '../../core/repositories/repository'
import { inject, injectable } from 'inversify'
import { DB_CONNECTION } from '@/utils/db-connection'

@injectable()
export class DatabaseRepository implements IRepository {
  constructor(
    @inject(DB_CONNECTION)
    private readonly dbConnection: Connection
  ) {}

  async getColumnsForTable(tableName: string): Promise<string[]> {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const [columns] = await this.dbConnection.query<[{ Field: string }[], any]>(
      `SHOW COLUMNS FROM ${tableName}`
    )
    return columns.map((col) => col.Field)
  }

  async getTriggersForTable(tableName: string): Promise<TriggerDBResult[]> {
    const [triggersSQL] = await this.dbConnection.query<
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      [TriggerDBResult[], any]
    >(`SHOW TRIGGERS LIKE '${tableName}'`)
    return triggersSQL
  }
}
