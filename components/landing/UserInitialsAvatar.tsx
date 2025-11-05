import React from "react"

function getInitials(name?: string, email?: string): string {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "U"
  const parts = source.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? source[0]
  const second = parts.length > 1 ? parts[1][0] : (source[1] ?? "")
  return (first + second).toUpperCase()
}

function stringToHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export default function UserInitialsAvatar({
  name,
  email,
  size = 32,
  className,
}: {
  name?: string
  email?: string
  size?: number
  className?: string
}) {
  const initials = getInitials(name, email)
  const hue = stringToHue(name || email || "user")
  const hue2 = (hue + 40) % 360
  const fontSize = Math.max(10, Math.floor(size * 0.42))
  const radius = 8
  const id = `g-${hue}-${hue2}`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={name || email || "User"}
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 80% 55%)`} />
          <stop offset="100%" stopColor={`hsl(${hue2} 80% 55%)`} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={size} height={size} rx={radius} fill={`url(#${id})`} />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-inter), ui-sans-serif, system-ui"
        fontWeight={700}
        fontSize={fontSize}
        fill="#0B0F14"
      >
        {initials}
      </text>
    </svg>
  )
}


