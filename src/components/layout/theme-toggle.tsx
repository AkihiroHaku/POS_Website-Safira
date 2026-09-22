'use client'

import { useSyncExternalStore } from 'react'
import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const emptySubscribe = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-2xl"
        aria-label="Ganti tema"
        disabled
      >
        <MoonStar className="h-4 w-4 opacity-0" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="rounded-2xl"
      aria-label={resolvedTheme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? (
        <SunMedium className="h-4 w-4 transition-all duration-300 rotate-0 scale-100" />
      ) : (
        <MoonStar className="h-4 w-4 transition-all duration-300 rotate-0 scale-100" />
      )}
    </Button>
  )
}
