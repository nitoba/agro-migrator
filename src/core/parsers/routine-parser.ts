import type { CreateRoutineDefinition, RoutineParameter } from '../types'

export function parseCreateRoutineSQL(
  sql: string
): CreateRoutineDefinition | null {
  // Normaliza espaços e quebras de linha
  const normalizedSQL = sql.trim().replace(/\s+/g, ' ')

  // Detecta se é FUNCTION ou PROCEDURE
  const routineMatch = normalizedSQL.match(
    /^CREATE\s+(FUNCTION|PROCEDURE)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/i
  )
  if (!routineMatch) {
    return null
  }

  const routineType = routineMatch[1].toUpperCase() as 'FUNCTION' | 'PROCEDURE'
  const routineName = routineMatch[2]
  const paramsRaw = routineMatch[3].trim()

  const parameters: RoutineParameter[] = []
  if (paramsRaw) {
    // Divide por vírgulas
    const paramsList = paramsRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    for (const p of paramsList) {
      // Supondo formato "paramName TYPE"
      const parts = p.split(/\s+/)
      const paramName = parts[0]
      const paramType = parts.slice(1).join(' ')
      parameters.push({ name: paramName, type: paramType })
    }
  }

  let returnType: string | undefined
  if (routineType === 'FUNCTION') {
    // Tenta extrair RETURNS <type>
    const returnMatch = normalizedSQL.match(/RETURNS\s+([a-zA-Z0-9_()]+)\s/i)
    if (returnMatch) {
      returnType = returnMatch[1]
    }
  }

  // Extrair corpo da função/procedimento:
  // Supondo que o corpo fique entre BEGIN e END;
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
