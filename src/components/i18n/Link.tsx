'use client'

import NextLink from 'next/link'
import { useLocale } from '@/i18n/client'
import { localePath } from '@/i18n/config'

type Props = React.ComponentProps<typeof NextLink>

/**
 * Ersätter next/link och lägger på språkprefixet för interna adresser, så att
 * en besökare på engelska stannar på engelska.
 */
export default function Link({ href, ...props }: Props) {
  const locale = useLocale()
  if (typeof href === 'string') return <NextLink href={localePath(locale, href)} {...props} />
  if (href.pathname && !href.host) return <NextLink href={{ ...href, pathname: localePath(locale, href.pathname) }} {...props} />
  return <NextLink href={href} {...props} />
}
