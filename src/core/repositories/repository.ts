export abstract class IRepository {
  abstract getColumnsForTable(tableName: string): Promise<string[]>
  abstract getTriggersForTable(tableName: string): Promise<TriggerDBResult[]>
}

export type TriggerDBResult = {
  Trigger: string
  Event: string
  Table: string
  Statement: string
  Timing: string
  Created: string
}
