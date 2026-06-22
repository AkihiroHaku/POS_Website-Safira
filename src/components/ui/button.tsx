import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold tracking-[0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_14px_30px_-18px_rgba(5,150,105,0.8)] hover:from-emerald-500 hover:to-emerald-700 hover:shadow-[0_18px_34px_-18px_rgba(5,150,105,0.7)]",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_14px_30px_-18px_rgba(220,38,38,0.75)] hover:from-red-500 hover:to-red-700",
        outline:
          "border themed-transition",
        secondary:
          "themed-transition",
        ghost: "themed-transition hover:bg-emerald-500/10 hover:text-emerald-600",
        link: "rounded-none px-0 text-emerald-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-3.5",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Apply themed styles based on variant
    const themedStyle: React.CSSProperties = {}
    if (variant === "outline") {
      Object.assign(themedStyle, {
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--foreground-soft)",
      })
    } else if (variant === "secondary") {
      Object.assign(themedStyle, {
        backgroundColor: "var(--surface-muted)",
        color: "var(--foreground)",
      })
    } else if (variant === "ghost") {
      Object.assign(themedStyle, {
        color: "var(--foreground-soft)",
      })
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ ...themedStyle, ...style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
