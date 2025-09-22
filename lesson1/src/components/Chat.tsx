import { useEffect, useMemo, useRef, useState } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function useAutoScroll(msgLength: number, isThinking: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight })
  }, [msgLength, isThinking])
  return ref
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }} aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            opacity: 0.8,
            animation: `blink 1.4s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>
        {`@keyframes blink { 0%, 80%, 100% { opacity: .2 } 40% { opacity: 1 } }`}
      </style>
    </span>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([{
    id: crypto.randomUUID(),
    role: 'assistant',
    content: "Hi! I'm your AI assistant. Ask me anything.",
  }])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useAutoScroll(messages.length, isThinking)

  const canSend = useMemo(() => input.trim().length > 0 && !isThinking, [input, isThinking])

  const sendMessage = async () => {
    if (!canSend) return
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsThinking(true)

    const WORKER_BASE = 'https://ai-chat.bonelycheng.workers.dev'
    const tryCall = async (path: string) => {
      const body = {
        model: 'Qwen/QwQ-32B',
        messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }
      const res = await fetch(`${WORKER_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return res
    }

    try {
      let res = await tryCall('/api/chat')
      if (res.status === 404) {
        // Some deployments may mount chat at root
        res = await tryCall('')
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }
      const data = await res.json()
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.delta?.content ??
        'No content returned.'
      const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error contacting AI: ${err?.message || String(err)}`,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsThinking(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '70vh' }}>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(10,10,18,0.55)',
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', marginBottom: 10 }}>
            <div
              style={{
                maxWidth: '80%',
                marginLeft: m.role === 'assistant' ? 0 : 'auto',
                marginRight: m.role === 'assistant' ? 'auto' : 0,
                padding: '10px 12px',
                borderRadius: 10,
                background: m.role === 'assistant' ? 'rgba(30,30,46,0.9)' : 'rgba(90,90,140,0.9)',
                border: '1px solid rgba(255,255,255,0.12)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div style={{ display: 'flex', marginBottom: 10 }}>
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(30,30,46,0.9)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              <TypingDots />
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask something..."
          rows={3}
          style={{
            flex: 1,
            resize: 'vertical',
            padding: 10,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.4)',
            color: 'inherit',
          }}
          className="chat-input"
        />
        <button style={{ color: 'white' }} onClick={() => void sendMessage()} disabled={!canSend}>
          Send
        </button>
      </div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Press ⌘/Ctrl + Enter to send</div>
    </div>
  )
}
