export function parseMigrationSQL(sql: string): { up: string; down: string } {
    const upSection = sql.split('-- #DOWN')[0]?.replace('-- #UP', '').trim();
    const downSection = sql.split('-- #DOWN')[1]?.trim() || '';
    return { up: upSection, down: downSection };
  }
  