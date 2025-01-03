export interface IRepository {
  getColumnsForTable(tableName: string): Promise<string[]>
  getTriggersForTable(tableName: string): Promise<TriggerDBResult[]>
}

export type TriggerDBResult = {
  Trigger: string
  Event: string
  Table: string
  Statement: string
  Timing: string
  Created: string
}
