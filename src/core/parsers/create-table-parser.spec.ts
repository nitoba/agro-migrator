import { describe, it, expect } from 'bun:test'
import { parseCreateTableSQL } from './create-table-parser'

describe('parseCreateTableSQL', () => {
  it('should parse a simple table with basic columns', () => {
    const sql = `
      CREATE TABLE products (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) DEFAULT '0.00'
      );
    `
    const result = parseCreateTableSQL(sql)
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('products')
    expect(result[0].columns).toHaveLength(3)
    expect(result[0].columns[0]).toEqual({
      name: 'id',
      type: 'INT',
      isNullable: false,
      isPrimaryKey: true,
      extra: 'AUTO_INCREMENT',
    })
    expect(result[0].columns[1]).toEqual({
      name: 'name',
      type: 'VARCHAR(100)',
      isNullable: false,
      isPrimaryKey: false,
    })
    expect(result[0].columns[2]).toEqual({
      name: 'price',
      type: 'DECIMAL(10, 2)',
      isNullable: true,
      isPrimaryKey: false,
      default: '0.00',
    })
  })

  it('should parse multiple table definitions', () => {
    const sql = `
      CREATE TABLE categories (
        id INT PRIMARY KEY,
        name VARCHAR(50)
      );

      CREATE TABLE items (
        id INT PRIMARY KEY,
        category_id INT
      );
    `
    const result = parseCreateTableSQL(sql)
    expect(result).toHaveLength(2)
    expect(result[0].tableName).toBe('categories')
    expect(result[1].tableName).toBe('items')
  })

  it('should throw error for invalid table structure', () => {
    const sql = 'CREATE TABLE;'
    expect(() => parseCreateTableSQL(sql)).toThrow()
  })

  it('should handle tables without columns', () => {
    const sql = 'CREATE TABLE empty_table;'
    expect(() => parseCreateTableSQL(sql)).toThrow()
  })
})
