'use client'
import { useId } from 'react'
interface StarRatingProps { value: number; onChange?: (value: number) => void; readonly?: boolean; size?: 'sm' | 'md' | 'lg' }
const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const name = useId()
  const star = (number: number) => <svg aria-hidden="true" className={`${sizes[size]} ${number <= value ? 'text-amber-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
  if (readonly) return <span role="img" aria-label={`${value} av 5 stjärnor`} className="inline-flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n}>{star(n)}</span>)}</span>
  return <fieldset><legend className="sr-only">Betyg</legend><div className="flex gap-1">{[1,2,3,4,5].map(n => <label key={n} className="cursor-pointer rounded p-2 focus-within:ring-2 focus-within:ring-blue-600"><input className="sr-only" type="radio" name={name} value={n} checked={n === value} onChange={() => onChange?.(n)} /><span className="sr-only">{n} av 5 stjärnor</span>{star(n)}</label>)}</div></fieldset>
}
