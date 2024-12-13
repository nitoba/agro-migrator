import type { TriggersResult } from '../types'

export function generateTriggersSQLFromColumns({
  tableName,
  columns,
}: {
  tableName: string
  columns: string[]
}): TriggersResult {
  const auditTableName = `ad_${tableName}`
  // Campos adicionais para o modelo de trigger
  const additionalFields = [
    'oper',
    'data_audit',
    'hora_audit',
    'usuario',
    'plataforma',
    'ip_reverso',
    'sistema_operacional',
    'requisicao_id',
  ]

  // Todos os campos usados no INSERT da tabela de auditoria
  const auditColumns = [...additionalFields, ...columns].join(', ')

  // Mapear colunas para valores NEW/OLD e variáveis de conexão
  const auditValues = (prefix: 'NEW' | 'OLD') =>
    [
      "'{op}'", // Será substituído por 'I', 'A', ou 'E'
      'CURRENT_DATE',
      'CURRENT_TIME',
      '@cnn_usuario',
      '@cnn_plataforma',
      '@cnn_ip_reverso',
      '@cnn_sistema_operacional',
      '@cnn_requisicao_id',
      ...columns.map((col) => `${prefix}.${col}`),
    ].join(', ')

  // Tipos de operação e seus respectivos prefixos
  const operations = [
    { op: 'I', prefix: 'NEW', event: 'INSERT', type: 'di' },
    { op: 'A', prefix: 'NEW', event: 'UPDATE', type: 'da' },
    { op: 'E', prefix: 'OLD', event: 'DELETE', type: 'de' },
  ] as const

  // Gerar SQL para cada operação
  const triggers = operations.map(({ op, prefix, event, type }) =>
    `
    CREATE TRIGGER ${tableName}_${type} 
    AFTER ${event} ON ${tableName} FOR EACH ROW 
    BEGIN
      CALL getConnectionInfo(@cnn_usuario, @cnn_plataforma, @cnn_ip_reverso, @cnn_sistema_operacional, @cnn_requisicao_id);
      INSERT INTO ${auditTableName} (${auditColumns})
      VALUES(${auditValues(prefix).replace('{op}', op)});
    END;
  `.trim()
  )

  return {
    insertTrigger: {
      name: `${tableName}_di`,
      content: triggers[0],
    },
    updateTrigger: {
      name: `${tableName}_da`,
      content: triggers[1],
    },
    deleteTrigger: {
      name: `${tableName}_de`,
      content: triggers[2],
    },
  }
}
