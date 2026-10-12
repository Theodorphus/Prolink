import Image from 'next/image'
import { getCategoryImage } from '@/lib/categories'

/** Kategoribilden som liten miniatyr bredvid kategori eller rubrik. */
export default function CategoryThumb({ category, size, className = '' }: { category: string | null | undefined; size: number; className?: string }) {
  return (
    <Image
      src={getCategoryImage(category)}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-xl object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
