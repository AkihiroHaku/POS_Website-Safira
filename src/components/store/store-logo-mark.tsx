import Image from "next/image"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoreLogoMarkProps {
  logoUrl?: string | null
  storeName: string
  className?: string
  iconClassName?: string
  imageClassName?: string
}

export function StoreLogoMark({
  logoUrl,
  storeName,
  className,
  iconClassName,
  imageClassName,
}: StoreLogoMarkProps) {
  if (logoUrl) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_20px_40px_-20px_rgba(15,23,42,0.14)] transition-all duration-300 themed-transition",
          className
        )}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Image
          src={logoUrl}
          alt={`Logo ${storeName}`}
          fill
          unoptimized
          sizes="96px"
          className={cn("object-contain object-center p-[12%] transition-all duration-300", imageClassName)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_20px_40px_-20px_rgba(16,185,129,0.9)] transition-all duration-300",
        className
      )}
    >
      <Package className={cn("h-5 w-5", iconClassName)} />
    </div>
  )
}
