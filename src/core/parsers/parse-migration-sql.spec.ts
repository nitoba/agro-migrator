import { describe, it, expect } from 'bun:test'
import { parseMigrationSQL } from './parse-migration-sql'

describe('parseMigrationSQL', () => {
  it('should parse SQL with both up and down sections', () => {
    const sql = `
            -- #UP
            CREATE TABLE users (id INT);
            -- #DOWN
            DROP TABLE users;
        `
    const result = parseMigrationSQL(sql)
    expect(result.up).toBe('CREATE TABLE users (id INT);')
    expect(result.down).toBe('DROP TABLE users;')
  })

  it('should handle SQL with only up section', () => {
    const sql = `
            -- #UP
            CREATE TABLE products (id INT);
        `
    const result = parseMigrationSQL(sql)
    expect(result.up).toBe('CREATE TABLE products (id INT);')
    expect(result.down).toBe('')
  })

  it('should handle empty SQL input', () => {
    const result = parseMigrationSQL('')
    expect(result.up).toBe('')
    expect(result.down).toBe('')
  })

  it('should handle SQL with multiple statements in sections', () => {
    const sql = `
            -- #UP
            CREATE TABLE orders (id INT);
            CREATE INDEX idx_orders ON orders(id);
            -- #DOWN
            DROP INDEX idx_orders;
            DROP TABLE orders;
        `
    const result = parseMigrationSQL(sql)
    expect(result.up).toBe(
      'CREATE TABLE orders (id INT);\n            CREATE INDEX idx_orders ON orders(id);'
    )
    expect(result.down).toBe(
      'DROP INDEX idx_orders;\n            DROP TABLE orders;'
    )
  })

  it('should handle SQL with whitespace around markers', () => {
    const sql = `
            
            -- #UP    
            CREATE TABLE test (id INT);
                
            -- #DOWN    
            DROP TABLE test;
            
        `
    const result = parseMigrationSQL(sql)
    expect(result.up).toBe('CREATE TABLE test (id INT);')
    expect(result.down).toBe('DROP TABLE test;')
  })
})
