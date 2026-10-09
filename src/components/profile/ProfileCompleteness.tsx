import Link from 'next/link'

// Visas bara för ägaren. Stapeln bär värdet och procenten står som text,
// så kortet går att läsa utan att tolka färg.
export default function ProfileCompleteness({ percent, missing }: { percent: number; missing: { key: string; label: string; anchor: string }[] }) {
  if (missing.length === 0) return null
  return (
    <section className="rounded-panel border border-blue-100 bg-blue-50/60 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-bold text-slate-900">Din profil är {percent} % klar</h2>
        <span className="text-xs font-semibold text-slate-500">{missing.length} steg kvar</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profilens fullständighet">
        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-600">Kompletta profiler får fler förfrågningar. Nästa steg:</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {missing.slice(0, 4).map(step => (
          <li key={step.key}>
            <Link href={step.anchor} className="font-semibold text-blue-700 hover:underline">{step.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
