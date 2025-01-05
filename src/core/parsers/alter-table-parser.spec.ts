import { describe, it, expect } from 'bun:test'
import { parseAlterTableSQL } from './alter-table-parser'

describe('parseAlterTableSQL', () => {
  it('should parse ADD COLUMN statement', () => {
    const sql = 'ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL;'
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('users')
    expect(result[0].operations).toHaveLength(1)
    expect(result[0].operations[0]).toEqual({
      action: 'add',
      columnName: 'email',
      columnType: 'VARCHAR(255)',
      isNullable: false,
      isPrimaryKey: false,
    })
  })

  it('should parse DROP COLUMN statement', () => {
    const sql = 'ALTER TABLE products DROP COLUMN description;'
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('products')
    expect(result[0].operations).toHaveLength(1)
    expect(result[0].operations[0]).toEqual({
      action: 'drop',
      columnName: 'description',
    })
  })

  it('should parse MODIFY COLUMN statement', () => {
    const sql = `ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending';`
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('orders')
    expect(result[0].operations).toHaveLength(1)
    expect(result[0].operations[0]).toEqual({
      action: 'modify',
      columnName: 'status',
      columnType: 'VARCHAR(50)',
      isNullable: true,
      default: 'pending',
      isPrimaryKey: false,
    })
  })

  it('should parse ADD INDEX statement', () => {
    const sql = 'ALTER TABLE users ADD INDEX idx_email (email);'
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('users')
    expect(result[0].operations).toHaveLength(1)
    expect(result[0].operations[0]).toEqual({
      action: 'add_index',
      indexName: 'idx_email',
      indexColumns: ['email'],
    })
  })

  it('should parse ADD FOREIGN KEY constraint', () => {
    const sql =
      'ALTER TABLE orders ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;'
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('orders')
    expect(result[0].operations).toHaveLength(1)
    expect(result[0].operations[0]).toEqual({
      action: 'add_constraint',
      constraintName: 'fk_user_id',
      constraintType: 'FOREIGN KEY',
      referencedTable: 'users',
      referencedColumns: ['id'],
      referencedOnDelete: 'CASCADE',
      referencedOnUpdate: 'CASCADE',
    })
  })

  it('should parse multiple ALTER operations in single statement', () => {
    const sql = `ALTER TABLE products 
                 ADD COLUMN price DECIMAL(10,2),
                 DROP COLUMN old_price,
                 MODIFY COLUMN name VARCHAR(100) NOT NULL;`
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('products')
    expect(result[0].operations).toHaveLength(3)
    expect(result[0].operations[0].action).toBe('add')
    expect(result[0].operations[1].action).toBe('drop')
    expect(result[0].operations[2].action).toBe('modify')
  })

  it('should parse RENAME COLUMN statement', () => {
    const sql = 'ALTER TABLE users RENAME COLUMN user_name TO username;'
    const result = parseAlterTableSQL(sql)

    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('users')
    expect(result[0].operations).toHaveLength(1)
    expect(result[0].operations[0]).toEqual({
      action: 'rename_column',
      oldColumnName: 'user_name',
      newColumnName: 'username',
    })
  })
})
