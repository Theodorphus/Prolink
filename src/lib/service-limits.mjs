// Begränsar hur många tjänster en och samma frilansare får synas med, så att
// den som publicerar många tjänster inte tränger undan alla andra. Listorna
// förutsätts redan vara sorterade; ordningen behålls.

export const FEATURED_SERVICE_COUNT = 6
export const MAX_SERVICES_PER_PROVIDER = 3

export function onePerProvider(services, limit) {
  const seen = new Set()
  const picked = []
  for (const service of services) {
    if (picked.length >= limit) break
    if (seen.has(service.provider_id)) continue
    seen.add(service.provider_id)
    picked.push(service)
  }
  return picked
}

// visible: de tjänster som visas, i ursprunglig ordning.
// hidden: antal dolda tjänster per frilansare.
// lastVisible: id på frilansarens sista synliga tjänst, där hänvisningen till
// profilen placeras.
export function capPerProvider(services, max) {
  const shown = new Map()
  const hidden = new Map()
  const lastVisible = new Map()
  const visible = []
  for (const service of services) {
    const count = shown.get(service.provider_id) ?? 0
    if (count < max) {
      shown.set(service.provider_id, count + 1)
      lastVisible.set(service.provider_id, service.id)
      visible.push(service)
    } else {
      hidden.set(service.provider_id, (hidden.get(service.provider_id) ?? 0) + 1)
    }
  }
  return { visible, hidden, lastVisible }
}
