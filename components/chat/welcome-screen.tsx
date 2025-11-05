"use client"

import { useState } from "react"

import type React from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { addMessage, startNewConversation } from "@/lib/features/chat/chat-slice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Search, Mic, Send } from "lucide-react"

export default function WelcomeScreen() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Start a new conversation first
    dispatch(startNewConversation())

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user" as const,
      timestamp: new Date(),
    }

    dispatch(addMessage(userMessage))
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you said: "${input}". This is a demo response from the Finto. In a real implementation, this would connect to an AI service.`,
        role: "assistant" as const,
        timestamp: new Date(),
      }
      dispatch(addMessage(aiMessage))
    }, 1000)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4">Finto</h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything"
            className="w-full px-4 py-4 pr-32 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <Paperclip className="h-4 w-4 text-gray-500" />
            </Button>

            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <Search className="h-4 w-4 text-gray-500" />
            </Button>

            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <Mic className="h-4 w-4 text-gray-500" />
            </Button>

            {input.trim() && (
              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          By messaging Finto, you agree to our{" "}
          <a href="#" className="underline hover:text-gray-700">
            Terms
          </a>{" "}
          and have read our{" "}
          <a href="#" className="underline hover:text-gray-700">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
