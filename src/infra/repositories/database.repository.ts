import type { Connection } from 'mysql2/promise'
import type {
  IRepository,
  TriggerDBResult,
} from '../../core/repositories/repository'

export class DatabaseRepository implements IRepository {
  constructor(private readonly dbConnection: Connection) {}

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
