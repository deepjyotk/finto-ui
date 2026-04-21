"use client"

import { cn } from "@/lib/utils"

/**
 * Animated SVG stick-figure runner.
 *
 * Props:
 *  - size      px size of the figure (height). Default 40.
 *  - color     CSS colour string. Default "currentColor".
 *  - flipped   Mirror horizontally (runner faces left). Default false.
 *  - speed     Animation duration multiplier. 1 = normal (~0.45s cycle). Default 1.
 *  - celebrate Replace running with a small jump/celebrate pose. Default false.
 *  - className Extra class names on the wrapper span.
 */
export interface RunnerCharacterProps {
  size?: number
  color?: string
  flipped?: boolean
  speed?: number
  celebrate?: boolean
  className?: string
}

const KEYFRAMES = `
@keyframes _runner-leg-l  { 0%,100%{transform:rotate(-35deg)} 50%{transform:rotate(35deg)}  }
@keyframes _runner-leg-r  { 0%,100%{transform:rotate(35deg)}  50%{transform:rotate(-35deg)} }
@keyframes _runner-arm-l  { 0%,100%{transform:rotate(35deg)}  50%{transform:rotate(-35deg)} }
@keyframes _runner-arm-r  { 0%,100%{transform:rotate(-35deg)} 50%{transform:rotate(35deg)}  }
@keyframes _runner-bob    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
@keyframes _runner-fg-l   { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(-50deg)} }
@keyframes _runner-fg-r   { 0%,100%{transform:rotate(-50deg)} 50%{transform:rotate(-15deg)} }
@keyframes _runner-jump   { 0%,100%{transform:translateY(0px)} 40%{transform:translateY(-8px)} 60%{transform:translateY(-8px)} }
@keyframes _runner-arm-cel-l { 0%,100%{transform:rotate(-140deg)} 50%{transform:rotate(-160deg)} }
@keyframes _runner-arm-cel-r { 0%,100%{transform:rotate(140deg)}  50%{transform:rotate(160deg)}  }
`

export default function RunnerCharacter({
  size = 40,
  color = "currentColor",
  flipped = false,
  speed = 1,
  celebrate = false,
  className,
}: RunnerCharacterProps) {
  const dur = (base: number) => `${(base / speed).toFixed(2)}s`
  const cycle = dur(0.45)
  const jumpCycle = dur(0.6)

  return (
    <span
      className={cn("inline-block select-none", className)}
      style={{ color, transform: flipped ? "scaleX(-1)" : undefined, display: "inline-flex" }}
      aria-hidden
    >
      {/* Inject keyframes once — duplicate <style> tags are harmless */}
      <style>{KEYFRAMES}</style>

      <svg
        viewBox="0 0 20 34"
        width={size * 0.6}
        height={size}
        fill="none"
        overflow="visible"
      >
        {/* ── Body group — bobs up/down while running ─────────────────── */}
        <g
          style={
            celebrate
              ? { animation: `_runner-jump ${jumpCycle} ease-in-out infinite` }
              : { animation: `_runner-bob ${cycle} ease-in-out infinite` }
          }
        >
          {/* Head */}
          <circle cx="10" cy="4.5" r="3.8" fill="currentColor" />

          {/* Torso */}
          <line
            x1="10" y1="8.5"
            x2="10" y2="20"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          />

          {/* ── Left arm (swings forward/back) */}
          <g style={{
            transformOrigin: "10px 11px",
            animation: celebrate
              ? `_runner-arm-cel-l ${jumpCycle} ease-in-out infinite`
              : `_runner-arm-l ${cycle} ease-in-out infinite`,
          }}>
            <line x1="10" y1="11" x2="3" y2="17"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* ── Right arm */}
          <g style={{
            transformOrigin: "10px 11px",
            animation: celebrate
              ? `_runner-arm-cel-r ${jumpCycle} ease-in-out infinite`
              : `_runner-arm-r ${cycle} ease-in-out infinite`,
          }}>
            <line x1="10" y1="11" x2="17" y2="17"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* ── Left thigh */}
          <g style={{
            transformOrigin: "10px 20px",
            animation: celebrate
              ? `_runner-jump ${jumpCycle} ease-in-out infinite`
              : `_runner-leg-l ${cycle} ease-in-out infinite`,
          }}>
            <line x1="10" y1="20" x2="7" y2="27"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Left foreleg — bends at knee */}
            <g style={{
              transformOrigin: "7px 27px",
              animation: celebrate
                ? undefined
                : `_runner-fg-l ${cycle} ease-in-out infinite`,
            }}>
              <line x1="7" y1="27" x2="5" y2="33.5"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </g>

          {/* ── Right thigh */}
          <g style={{
            transformOrigin: "10px 20px",
            animation: celebrate
              ? `_runner-jump ${jumpCycle} ease-in-out infinite`
              : `_runner-leg-r ${cycle} ease-in-out infinite`,
          }}>
            <line x1="10" y1="20" x2="13" y2="27"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Right foreleg */}
            <g style={{
              transformOrigin: "13px 27px",
              animation: celebrate
                ? undefined
                : `_runner-fg-r ${cycle} ease-in-out infinite`,
            }}>
              <line x1="13" y1="27" x2="15" y2="33.5"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
    </span>
  )
}
