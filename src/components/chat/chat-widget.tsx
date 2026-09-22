'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Boxes,
} from 'lucide-react'
import { ChatMessage, ChatMessageItem } from './chat-message'

const SUGGESTED_PROMPTS = [
  {
    icon: AlertTriangle,
    label: 'Produk stok menipis',
    prompt: 'Produk apa saja yang stoknya sudah menipis atau perlu restok?',
  },
  {
    icon: TrendingUp,
    label: 'Berapa laba hari ini?',
    prompt: 'Berapa estimasi laba bersih dan total omset penjualan toko hari ini?',
  },
  {
    icon: Receipt,
    label: 'Ringkasan transaksi',
    prompt: 'Bagaimana ringkasan transaksi kasir hari ini?',
  },
  {
    icon: Boxes,
    label: 'Tren penjualan 7 hari',
    prompt: 'Bagaimana tren pendapatan toko selama 7 hari terakhir?',
  },
]

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Halo! Saya **Asisten Toko Pintar Safira** 🤖.\n\nSaya dapat membantu Anda memantau stok barang, omset harian, laba bersih, dan histori transaksi toko kasir secara real-time. Ada yang bisa saya bantu?',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim()
    if (!messageText || isLoading) return

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build conversation history for API
      const history = messages
        .filter((m) => m.id !== 'welcome-1')
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          content: m.content,
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history,
        }),
      })

      const data = await response.json()

      const botMessage: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          data.error ||
          'Maaf, tidak mendapatkan respon dari asisten toko.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ Terjadi gangguan koneksi ke server chatbot. Pastikan aplikasi Next.js berjalan dan coba kembali.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Riwayat percakapan telah dibersihkan. Silakan tanyakan hal baru seputar toko Anda!',
        timestamp: new Date(),
      },
    ])
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        id="chat-widget-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Tutup Asisten AI' : 'Buka Asisten AI'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        style={{
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)',
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-emerald-600" />
            </span>
          </div>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          id="chat-widget-panel"
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[560px] max-h-[calc(100vh-7.5rem)] w-[calc(100vw-2rem)] sm:w-[420px] flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
          style={{
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5 bg-[var(--surface-muted)]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface-muted)]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm leading-tight text-[var(--foreground)]">
                    Asisten Toko Safira
                  </h3>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-[var(--foreground-muted)] flex items-center gap-1">
                  Online • Sinkron Data Toko
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Hapus obrolan"
                className="rounded-xl p-2 text-[var(--foreground-muted)] transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup jendela chat"
                className="rounded-xl p-2 text-[var(--foreground-muted)] transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm text-sm text-[var(--foreground-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span className="text-xs">Asisten sedang menganalisis data toko...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips (shows when fewer messages or user wants quick answers) */}
          {messages.length <= 3 && !isLoading && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5">
              <p className="mb-2 text-[11px] font-medium text-[var(--foreground-muted)] flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Pertanyaan Cepat:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)] transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95"
                    >
                      <Icon className="h-3 w-3 text-emerald-500" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya stok, omset, atau laba..."
                disabled={isLoading}
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Kirim pesan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-[var(--foreground-muted)]">
              AI menganalisis data real-time database toko Safira
            </p>
          </div>
        </div>
      )}
    </>
  )
}
