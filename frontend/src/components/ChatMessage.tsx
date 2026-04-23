interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function ChatMessage({ role, content, streaming }: ChatMessageProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
        role === 'user' ? 'bg-brand-500 text-white' : 'bg-white border text-gray-800'
      }`}>
        <p className="whitespace-pre-wrap leading-relaxed">{content}{streaming && <span className="animate-pulse">▋</span>}</p>
      </div>
    </div>
  )
}
