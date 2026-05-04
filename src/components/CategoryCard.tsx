import Link from 'next/link'
import type { ReactNode } from 'react'

interface CategoryCardProps {
  label: string
  href: string
  icon: ReactNode
  color: string
}

export default function CategoryCard({ label, href, icon, color }: CategoryCardProps) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2.5 p-4 sm:p-5 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[90px] justify-center">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center text-xl sm:text-2xl shrink-0`}>
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-neutral-700 group-hover:text-neutral-900 text-center leading-tight transition-colors">
        {label}
      </span>
    </Link>
  )
}
