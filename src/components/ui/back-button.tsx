"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  className?: string
}

export function BackButton({
  fallbackHref = "/",
  label = "Kembali",
  className,
}: BackButtonProps) {
  const router = useRouter()
  const canGoBack = useMemo(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.history.length > 1
  }, [])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (canGoBack) {
          router.back()
          return
        }

        router.push(fallbackHref)
      }}
      className={`gap-2 ${className ?? ""}`.trim()}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
