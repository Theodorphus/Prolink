// Minnesbaserad ersättning för Supabase-klienten i tester. Läser och skriver
// globalThis.__fakeDb = { rows: [], readError: false }.
function db() {
  globalThis.__fakeDb ??= { rows: [], readError: false }
  return globalThis.__fakeDb
}

export function createAdminClient() {
  return {
    from(table) {
      return {
        select() {
          const filters = []
          const query = {
            eq(column, value) { filters.push(row => row[column] === value); return query },
            in(column, values) { filters.push(row => values.includes(row[column])); return query },
            then(resolve) {
              if (db().readError) return resolve({ data: null, error: { message: 'relation does not exist' } })
              return resolve({ data: db().rows.filter(row => row.__table === table && filters.every(f => f(row))), error: null })
            },
          }
          return query
        },
        async upsert(rows) {
          for (const row of rows) {
            const index = db().rows.findIndex(existing => existing.__table === table && existing.entity_type === row.entity_type && existing.entity_id === row.entity_id && existing.lang === row.lang)
            const next = { ...row, __table: table }
            if (index === -1) db().rows.push(next)
            else db().rows[index] = next
          }
          return { error: null }
        },
      }
    },
  }
}
