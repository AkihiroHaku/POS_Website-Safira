'use client'

import React, { useState } from 'react'
import { Bot, Check, Copy, User } from 'lucide-react'

export interface ChatMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: ChatMessageItem
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple and safe text parser for markdown features (bold, list items, inline code, line breaks)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n')

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim()

      if (!trimmed) {
        return <div key={lineIdx} className="h-2" />
      }

      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')
      const isNumbered = /^\d+\.\s/.test(trimmed)
      const lineText = isBullet ? trimmed.slice(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : line

      // Parse inline elements: **bold** and `code`
      const parts = lineText.split(/(\*\*.*?\*\*|`.*?`)/g)

      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-[var(--foreground)]">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        return part
      })

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-0.5 pl-1">
            <span className="text-emerald-500 font-bold select-none text-xs mt-1">•</span>
            <span className="flex-1 leading-relaxed">{formattedLine}</span>
          </div>
        )
      }

      if (isNumbered) {
        const numberMatch = trimmed.match(/^(\d+)\./)
        const num = numberMatch ? numberMatch[1] : '•'
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-0.5 pl-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold select-none text-xs mt-0.5">
              {num}.
            </span>
            <span className="flex-1 leading-relaxed">{formattedLine}</span>
          </div>
        )
      }

      return (
        <p key={lineIdx} className="leading-relaxed my-0.5">
          {formattedLine}
        </p>
      )
    })
  }

  const timeString = new Date(message.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`group flex w-full gap-2.5 ${
        isUser ? 'flex-row-reverse justify-start' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform ${
          isUser
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`relative flex max-w-[85%] sm:max-w-[78%] flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm transition-all ${
            isUser
              ? 'rounded-tr-sm bg-emerald-600 text-white shadow-sm'
              : 'rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="space-y-0.5 text-[var(--foreground)]">{renderFormattedContent(message.content)}</div>
          )}
        </div>

        {/* Timestamp & Copy action */}
        <div
          className={`flex items-center gap-1.5 px-1 pt-1 text-[11px] text-[var(--foreground-muted)] ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>{timeString}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              title="Salin jawaban"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-emerald-500"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
