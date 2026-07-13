'use client'

import { useState } from 'react'
import { Send, Bot, User, AlertCircle } from 'lucide-react'
import { getCannedReply, type ChatMessage } from './ai-mock-data'

const initialMessages: ChatMessage[] = [
  { id: 'm-0', role: 'assistant', text: 'Hi! Ask me about borrowing, reservations, courses, or certificates. I can only answer questions — I can\'t make changes to your account.' },
]

/**
 * Mocked AI chat assistant: message list + input, canned keyword-matched
 * replies only — no real LLM call, per APP_DOC Task 8.3 (inform only, no
 * write operations). New messages are announced via an aria-live region.
 */
export function AiChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const trimmed = input.trim()
      if (!trimmed) throw new Error('Type a message first')

      const userMessage: ChatMessage = { id: `m-${Date.now()}-u`, role: 'user', text: trimmed }
      const assistantMessage: ChatMessage = { id: `m-${Date.now()}-a`, role: 'assistant', text: getCannedReply(trimmed) }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message')
    }
  }

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col" style={{ height: 420 }}>
      <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-3">AI Chat Assistant</h2>

      <div
        className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${m.role === 'user' ? 'bg-w-600 text-white' : 'bg-w-200 text-w-700'}`}>
              {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </span>
            <div className={`font-lato text-xs px-3 py-2 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-w-600 text-white' : 'bg-white border border-w-300 text-w-950'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-2 font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about borrowing, courses, certificates..."
          aria-label="Chat message"
          className="flex-1 px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
        />
        <button type="submit" aria-label="Send message" className="px-3 py-2 bg-w-600 text-white rounded hover:bg-w-700 transition-colors">
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
