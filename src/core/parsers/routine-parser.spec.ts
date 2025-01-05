import { describe, it, expect } from 'bun:test'
import { parseCreateRoutineSQL } from './routine-parser'

describe('parseCreateRoutineSQL', () => {
  it('should parse a simple function definition', () => {
    const sql = `
      CREATE FUNCTION get_user(id INT) 
      RETURNS INT
      BEGIN
        SELECT * FROM users WHERE user_id = id;
      END;
    `
    const result = parseCreateRoutineSQL(sql)
    expect(result?.routineType).toBe('FUNCTION')
    expect(result?.routineName).toBe('get_user')
    expect(result?.parameters).toEqual([{ name: 'id', type: 'INT' }])
    expect(result?.returnType).toBe('INT')
    expect(result?.body).toBe('SELECT * FROM users WHERE user_id = id;')
  })

  it('should parse a procedure with multiple parameters', () => {
    const sql = `
      CREATE PROCEDURE insert_user(username VARCHAR(50), age INT, active BOOLEAN) 
      BEGIN
        INSERT INTO users (username, age, active) VALUES (username, age, active);
      END;
    `
    const result = parseCreateRoutineSQL(sql)
    expect(result?.routineType).toBe('PROCEDURE')
    expect(result?.routineName).toBe('insert_user')
    expect(result?.parameters).toEqual([
      { name: 'username', type: 'VARCHAR(50)' },
      { name: 'age', type: 'INT' },
      { name: 'active', type: 'BOOLEAN' },
    ])
    expect(result?.returnType).toBeUndefined()
    expect(result?.body).toBe(
      'INSERT INTO users (username, age, active) VALUES (username, age, active);'
    )
  })

  it('should handle function with no parameters', () => {
    const sql = `
      CREATE FUNCTION get_timestamp() 
      RETURNS TIMESTAMP
      BEGIN
        RETURN CURRENT_TIMESTAMP;
      END;
    `
    const result = parseCreateRoutineSQL(sql)
    expect(result?.routineType).toBe('FUNCTION')
    expect(result?.routineName).toBe('get_timestamp')
    expect(result?.parameters).toEqual([])
    expect(result?.returnType).toBe('TIMESTAMP')
    expect(result?.body).toBe('RETURN CURRENT_TIMESTAMP;')
  })

  it('should return null for invalid SQL', () => {
    const sql = 'CREATE TABLE users (id INT);'
    const result = parseCreateRoutineSQL(sql)
    expect(result).toBeNull()
  })

  it('should handle complex parameter types', () => {
    const sql = `
      CREATE FUNCTION process_data(data JSON, arr VARCHAR(255) ARRAY) 
      RETURNS BOOLEAN
      BEGIN
        RETURN true;
      END;
    `
    const result = parseCreateRoutineSQL(sql)
    expect(result?.parameters).toEqual([
      { name: 'data', type: 'JSON' },
      { name: 'arr', type: 'VARCHAR(255) ARRAY' },
    ])
  })
})
