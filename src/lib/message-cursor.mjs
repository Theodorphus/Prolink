// Keep PostgreSQL microseconds: Date.toISOString() truncates them to milliseconds.
export function messageCursor(params) {
  const after = params.get('after')
  const before = params.get('before')
  const afterId = params.get('after_id')
  const beforeId = params.get('before_id')
  if (![after, before, afterId, beforeId].some(value => value !== null)) return null
  const forward = after !== null || afterId !== null
  if (forward && (before !== null || beforeId !== null)) throw new Error('Invalid cursor')
  const time = forward ? after : before
  const id = forward ? afterId : beforeId
  if (!time || !id
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(time)
    || !Number.isFinite(Date.parse(time))
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid cursor')
  const operator = forward ? 'gt' : 'lt'
  return { forward, filter: `created_at.${operator}.${time},and(created_at.eq.${time},id.${operator}.${id})` }
}
