import type { CreateRoutineDefinition, RoutineParameter } from '../types'

export function parseCreateRoutineSQL(
  sql: string
): CreateRoutineDefinition | null {
  const normalizedSQL = sql.trim().replace(/\s+/g, ' ')

  const routineMatch = normalizedSQL.match(
    /^CREATE\s+(FUNCTION|PROCEDURE)\s+([a-zA-Z0-9_]+)\s*\((([^()]*|\([^()]*\))*)\)/i
  )

  if (!routineMatch) {
    return null
  }

  const routineType = routineMatch[1].toUpperCase() as 'FUNCTION' | 'PROCEDURE'
  const routineName = routineMatch[2]
  const paramsRaw = routineMatch[3].trim()

  const parameters: RoutineParameter[] = []
  if (paramsRaw) {
    const paramsList =
      paramsRaw
        .replace(/\s+/g, ' ')
        .match(/[^,]+/g)
        ?.map((p) => p.trim())
        .filter(Boolean) ?? []

    for (const p of paramsList) {
      const paramMatch = p.match(
        /^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+(?:\([^()]*\))?(?:\s+ARRAY)?)/i
      )

      if (paramMatch) {
        parameters.push({
          name: paramMatch[1],
          type: paramMatch[2],
        })
      }
    }
  }

  let returnType: string | undefined
  if (routineType === 'FUNCTION') {
    const returnMatch = normalizedSQL.match(/RETURNS\s+([a-zA-Z0-9_()]+)\s/i)
    if (returnMatch) {
      returnType = returnMatch[1]
    }
  }

  const bodyMatch = normalizedSQL.match(/BEGIN\s+(.*)\s+END;/i)
  const body = bodyMatch ? bodyMatch[1].trim() : undefined

  return {
    routineType,
    routineName,
    parameters,
    returnType,
    body,
  }
}
