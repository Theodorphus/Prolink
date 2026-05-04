interface StepCardProps {
  step: '01' | '02' | '03'
  emoji: string
  title: string
  description: string
  badge: string
  iconBg: string
  iconRing: string
}

export default function StepCard({ step, emoji, title, description, badge, iconBg, iconRing }: StepCardProps) {
  return (
    <div className="group relative bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col gap-5">

      {/* Faded background step number */}
      <span
        aria-hidden
        className="absolute -bottom-4 -right-2 text-[7rem] font-black leading-none text-neutral-100 select-none pointer-events-none"
      >
        {step}
      </span>

      {/* Icon circle + step badge */}
      <div className="flex items-center justify-between">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconRing} ring-4 flex items-center justify-center text-2xl shadow-sm`}>
          {emoji}
        </div>
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.18em]">
          Steg {step}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-neutral-900 leading-snug tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 flex-1">
        {description}
      </p>

      {/* Badge */}
      <div className="pt-1">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${iconBg} ${iconRing} ring-1`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
          {badge}
        </span>
      </div>
    </div>
  )
}
