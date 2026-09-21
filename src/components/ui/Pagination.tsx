import Link from 'next/link'
export default function Pagination({ page, total, pageSize, pathname, params }: {
  page: number; total: number; pageSize: number; pathname: string; params: Record<string, string | undefined>
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  function href(number: number) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => { if (value && key !== 'page') query.set(key, value) })
    query.set('page', String(number))
    return `${pathname}?${query}`
  }
  if (pages <= 1 && page === 1) return null
  return <nav aria-label="Sidindelning" className="mt-8 flex items-center justify-center gap-6 text-sm">
    {page > 1 && <Link className="rounded-lg border px-4 py-2" href={href(page - 1)}>Föregående</Link>}
    <span>Sida {page} av {pages}</span>
    {page < pages && <Link className="rounded-lg border px-4 py-2" href={href(page + 1)}>Nästa</Link>}
  </nav>
}
