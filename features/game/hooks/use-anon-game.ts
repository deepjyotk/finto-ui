"use client"

import { useState, useEffect } from "react"

const ANON_ID_KEY = "finto_anon_id"
const DISPLAY_NAME_KEY = "finto_display_name"

const ADJECTIVES = [
  "Turbo", "Mega", "Rocket", "Nifty", "Alpha", "Sigma",
  "Hyper", "Ultra", "Delta", "Apex", "Lunar", "Sonic",
]
const NOUNS = [
  "Trader", "Picker", "Investor", "Bull", "Whale", "Shark",
  "Hodler", "Quant", "Guru", "Wizard", "Hawk", "Wolf",
]

function generateFunName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}

export interface AnonGameState {
  anonId: string
  displayName: string
  setDisplayName: (name: string) => void
}

export function useAnonGame(): AnonGameState {
  const [anonId, setAnonId] = useState("")
  const [displayName, setDisplayNameState] = useState("")

  useEffect(() => {
    // Runs only client-side
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANON_ID_KEY, id)
    }
    setAnonId(id)

    let name = localStorage.getItem(DISPLAY_NAME_KEY)
    if (!name) {
      name = generateFunName()
      localStorage.setItem(DISPLAY_NAME_KEY, name)
    }
    setDisplayNameState(name)
  }, [])

  const setDisplayName = (name: string) => {
    const trimmed = name.trim() || generateFunName()
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed)
    setDisplayNameState(trimmed)
  }

  return { anonId, displayName, setDisplayName }
}
