'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <button
        type="button"
        aria-label="Tutup modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <Card
        className="relative z-10 w-full max-w-xl border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--shadow-medium)",
        }}
      >
        <CardHeader
          className="border-b pb-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              {description ? (
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--foreground-soft)" }}
                >
                  {description}
                </p>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          {children}
          {footer ? <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">{footer}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}
