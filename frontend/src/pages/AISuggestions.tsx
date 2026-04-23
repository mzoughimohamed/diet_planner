import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ChatMessage from '../components/ChatMessage'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AISuggestions() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.name ?? 'there'}! I can suggest meals based on your ${user?.goal ?? 'health'} goal and ${user?.daily_calorie_target ?? 2000} kcal/day target. Try asking: "Suggest a full day of meals" or "What's a good high-protein breakfast?"`,
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const appendToken = (token: string) => {
    setMessages((m) => {
      const last = m[m.length - 1]
      return [...m.slice(0, -1), { ...last, content: last.content + token }]
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMessage = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userMessage }])
    setStreaming(true)
    setMessages((m) => [...m, { role: 'assistant', content: '' }])

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortRef.current.signal,
        body: JSON.stringify({
          message: userMessage,
          context: {
            goal: user?.goal ?? 'maintain',
            daily_calorie_target: user?.daily_calorie_target ?? 2000,
            restrictions: [],
          },
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const token = line.slice(6)
            if (token === '[DONE]') { setStreaming(false); return }
            appendToken(token)
          }
        }
        // Flush remaining buffer after stream ends
        if (buffer.startsWith('data: ')) {
          const token = buffer.slice(6)
          if (token && token !== '[DONE]') appendToken(token)
        }
      } finally {
        reader.cancel()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[ai]', err)
      setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content: 'Sorry, something went wrong. Make sure Ollama is running.' }])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900">AI Meal Suggestions</h1>
        <p className="text-sm text-gray-500 mt-1">Powered by Ollama (local AI — private &amp; free)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            placeholder="Ask for meal suggestions…"
            disabled={streaming}
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="bg-brand-500 text-white p-2.5 rounded-xl hover:bg-brand-600 disabled:opacity-60"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
