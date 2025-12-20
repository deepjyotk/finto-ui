# ArthiQ Color Palette

## Primary Brand Color (Cyan)

### Main Cyan Colors
- **Cyan 400**: `#22d3ee` - Primary brand accent (Get Started button, primary CTAs, main interactive elements)
- **Cyan 300**: `#67e8f9` - Lighter cyan (hover states, features, pricing highlights)
- **Cyan 500**: `#06b6d4` - Darker cyan (gradient ends, pressed states)
- **Cyan 600**: `#0891b2` - Secondary cyan (button backgrounds, status indicators)
- **Cyan 700**: `#0e7490` - Dark cyan (hover states, connections)

### Cyan Shadows & Glows
- **Cyan Shadow**: `rgba(34,211,238,0.2)` - Cyan glow/shadows (20% opacity)
- **Cyan Shadow Hover**: `rgba(34,211,238,0.3)` - Cyan shadow hover (30% opacity)
- **Cyan Glow**: `rgba(34,211,238,0.15)` - Cyan glow effects (15% opacity)
- **Cyan Focus Glow**: `rgba(34,211,238,0.15)` - Focus state glow

### Cyan Variants (Tailwind)
- **Cyan 50**: `#ecfeff` - Light backgrounds (badges, cards)
- **Cyan 100**: `#cffafe` - Very light backgrounds
- **Cyan 200**: `#a5f3fc` - Light borders
- **Cyan 400**: `#22d3ee` - Main brand color
- **Cyan 500**: `#06b6d4` - Darker variant
- **Cyan 600**: `#0891b2` - Secondary buttons
- **Cyan 700**: `#0e7490` - Hover states

### CSS Variable Secondary Colors
- **Secondary**: `#0891b2` - Secondary color (cyan-600)
- **Secondary Hover**: `#0e7490` - Darker cyan hover
- **Secondary Pressed**: `#155e75` - Pressed state
- **Secondary Disabled**: `rgba(8, 145, 178, 0.45)` - Disabled state
- **Secondary Foreground**: `#e0f2fe` - Light cyan text on dark cyan

## Dark Background Colors

### Main Backgrounds
- **Background Primary**: `#0B0F14` - Main app background
- **Background Secondary**: `#0F1621` - Card backgrounds (with 60% opacity: `/60`)
- **Chat Surface**: `#050509` - Chat interface background

### Sidebar & Panels
- **Sidebar**: `#202123` - Sidebar background
- **Surface 1**: `#1a1b23` - Input containers, gradients
- **Surface 2**: `#1f2028` - Gradient middle, card surfaces
- **Surface 3**: `#2a2b35` - Gradient start, elevated surfaces
- **Surface 4**: `#252630` - Gradient middle variant

## Text Colors

### Primary Text
- **Primary Text**: `#E5EAF2` - Main text color (white/light gray)
- **White**: `#FFFFFF` - Pure white (headers, buttons)

### Muted Text
- **Muted Gray**: `#9AA7B2` - Secondary text, descriptions
- **Gray 400**: `#9ca3af` - Placeholders, disabled states
- **Gray 200**: `#e5e7eb` - Light gray text

## Accent Colors

### Orange
- **Orange Accent**: `#c96a2f` - Avatar backgrounds, user indicators

### Purple
- **Purple 300**: `#c084fc` - Badge text
- **Purple 500/20**: `rgba(139,92,246,0.2)` - Badge background (20% opacity)
- **Purple 500/30**: `rgba(139,92,246,0.3)` - Badge border (30% opacity)

### Red (Destructive/Errors)
- **Red 600**: `#dc2626` - Error states, negative values
- **Destructive**: `oklch(0.396 0.141 25.723)` - Destructive actions (dark mode)

## Border & Overlay Colors

### Borders
- **Border White/10**: `rgba(255,255,255,0.1)` - Standard borders
- **Border White/20**: `rgba(255,255,255,0.2)` - Focus borders
- **Border White/5**: `rgba(255,255,255,0.05)` - Subtle borders

### Overlays & Backdrop
- **White/5**: `rgba(255,255,255,0.05)` - Subtle backgrounds
- **White/10**: `rgba(255,255,255,0.1)` - Button backgrounds, badges
- **White/15**: `rgba(255,255,255,0.15)` - Hover states
- **White/90**: `rgba(255,255,255,0.9)` - Light backgrounds

## Color Usage Examples

### Primary Buttons
```css
/* Cyan primary button */
background: #22d3ee (cyan-400)
shadow: rgba(34,211,238,0.2)

/* Cyan action button (chat send, etc.) */
background: linear-gradient(to bottom right, #22d3ee, #06b6d4)
shadow: rgba(34,211,238,0.2)
hover: linear-gradient(to bottom right, #67e8f9, #22d3ee)
hover-shadow: rgba(34,211,238,0.3)

/* Cyan secondary button */
background: #0891b2 (cyan-600)
hover: #0e7490 (cyan-700)
```

### Dark Cards
```css
background: #0F1621 (with 60% opacity: /60)
border: rgba(255,255,255,0.1)
```

### Text Hierarchy
- Headings: `#FFFFFF` or `#E5EAF2`
- Body: `#E5EAF2`
- Secondary: `#9AA7B2`
- Placeholders: `rgba(156,163,175,0.6)`

### Status Colors
- Success/Positive: `#0891b2` (cyan-600) - Uses brand cyan for positive states
- Error/Negative: `#dc2626` (red-600) - Red for errors/negative values
- Warning: `#ca8a04` (yellow-600) - Yellow for warnings

## Notes

- The **only brand accent color** is **Cyan** (`#22d3ee`) - used consistently throughout the application
- All interactive elements, buttons, links, and focus states use cyan variants
- Chat send button uses cyan gradient: `from-[#22d3ee] to-[#06b6d4]` with hover `from-[#67e8f9] to-[#22d3ee]`
- Positive/success states use cyan instead of green for brand consistency
- The dark theme uses very dark grays/blacks (`#0B0F14`, `#202123`) for backgrounds
- Text uses high contrast whites/light grays for readability
- All borders and overlays use white with low opacity (5-20%) for subtle separation
- **No green or blue colors** are used - everything uses cyan for a cohesive brand experience

