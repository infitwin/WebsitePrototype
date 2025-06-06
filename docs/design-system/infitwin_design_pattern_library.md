# Infitwin Design Pattern Library - Phase 1 Alpha
**Version 1.0**  
**Created: 2025-01-10T19:00:00.000Z**  
**Last Updated: 2025-01-10T19:00:00.000Z**

## Overview
This document catalogs all reusable design patterns found in existing Infitwin designs, providing a consistent component library for building remaining screens.

---

## 1. NAVIGATION COMPONENTS

### 1.1 Top Navigation Bar
**Found in:** dashboard.html, interview.html
```
Structure: Logo | Title | Right Actions (notifications, user menu)
Height: 64px (dashboard), 50px (interview)
Background: White with bottom border
Shadow: 0 1px 3px rgba(0,0,0,0.05)
```

**Variations:**
- Full nav (dashboard): Logo + title + notifications + user menu
- Minimal nav (interview): Back button + title + action buttons
- Auth nav (auth pages): Just back link

### 1.2 Sidebar Navigation
**Found in:** dashboard.html
```
Width: 250px (desktop), collapsible on mobile
Background: White
Items: Icon + Label
Active state: Accent background + colored bar
Hover: Background color change
```

**Navigation Items Pattern:**
- Icon (emoji or svg) + Text label
- Active indicator (yellow background)
- Badge for counts (red circle)

### 1.3 User Menu
**Found in:** dashboard.html
```
Components: Avatar + Name + Dropdown arrow
Avatar: Rounded, 40px, generated from initials
Dropdown: Hidden in Phase 1
```

---

## 2. BUTTONS & CALLS-TO-ACTION

### 2.1 Primary Button
**Found in:** All pages
```
Background: Linear gradient (gold to orange)
  - gradient(135deg, #FFD700 0%, #FFC107 100%)
Padding: 16-20px vertical, 32-48px horizontal
Border-radius: 25-50px
Font-weight: 600
Hover: Lift effect + enhanced shadow
Box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4)
```

**Examples:**
- "Start Building Your Living Archive"
- "Continue Building My Archive"
- "Create Your Archive"

### 2.2 Secondary Button
**Found in:** Multiple pages
```
Background: White
Border: 2px solid #E5E7EB
Color: Dark text
Hover: Background change to light gray
Same padding/radius as primary
```

### 2.3 Icon Buttons
**Found in:** dashboard.html, interview.html
```
Size: 40-45px circle
Background: Varies (white, colored)
Icon: Centered emoji or SVG
Hover: Scale(1.05) + shadow
```

**Examples:**
- Microphone button (recording)
- Notification bell
- Quick action buttons

### 2.4 Text Links
**Found in:** auth.html
```
Color: #87CEEB (light blue)
Hover: Underline
Font-size: 14px
```

---

## 3. FORM ELEMENTS

### 3.1 Input Fields
**Found in:** auth.html, winston.html
```
Border: 1px solid #E5E7EB
Border-radius: 8px
Padding: 12-16px
Font-size: 16px
Focus: Border color #87CEEB or #635bff
Background: White or #FFFDF9
```

**Variations:**
- Standard input (auth forms)
- Chat input (rounded, with button)
- Textarea (resizable, memory capture)

### 3.2 Form Labels
**Found in:** auth.html
```
Font-size: 14px
Font-weight: 500
Color: #2C1810
Margin-bottom: 8px
```

### 3.3 Form Groups
**Found in:** auth.html
```
Structure: Label + Input + Help text
Gap: 8px between elements
Margin: 24px between groups
```

---

## 4. CARDS & CONTAINERS

### 4.1 Content Cards
**Found in:** dashboard.html
```
Background: White
Border-radius: 12px
Padding: 24px
Box-shadow: 0 1px 3px rgba(0,0,0,0.05)
Hover: Transform + enhanced shadow
```

**Types:**
- Stat cards (icon + number + label)
- Memory cards (image + content)
- Action cards (clickable with icon)

### 4.2 Modal Container
**Found in:** capture-memory.html
```
Background: White
Border-radius: 24px
Padding: 30-40px
Box-shadow: 0 20px 60px rgba(0,0,0,0.2)
Overlay: rgba(0,0,0,0.5) with blur
```

### 4.3 Chat Bubbles
**Found in:** winston.html
```
Winston: White background, left-aligned
User: Gradient background, right-aligned
Border-radius: 20px (with tail)
Padding: 16px 20px
Max-width: 80%
```

---

## 5. VISUAL ELEMENTS

### 5.1 Avatars
**Found in:** dashboard.html, winston.html
```
Size: 40px (standard), 120px (winston)
Shape: Circle
Content: Image or initials
Background: Generated colors or gradient
```

### 5.2 Progress Indicators
**Found in:** auth.html, capture-memory.html
```
Height: 4-8px
Background: Light gray
Fill: Gold gradient
Border-radius: Full
Animation: Width transition
```

### 5.3 Badges
**Found in:** dashboard.html
```
Background: Red (#EF4444)
Color: White
Size: Min 20px
Border-radius: Full
Font-size: 12px
Position: Absolute top-right
```

### 5.4 Loading States
**Found in:** Multiple pages
```
Skeleton: Gray animated background
Spinner: Rotating circle
Dots: Three bouncing dots
Text: "Loading..." with animation
```

---

## 6. BACKGROUNDS & OVERLAYS

### 6.1 Gradient Backgrounds
**Found in:** index.html, auth.html, winston.html
```
Hero: Van Gogh wheat field image
Auth: Soft horizon gradient (SVG)
Winston: Gauguin tropical with overlays
Archive: Bierstadt landscape
```

### 6.2 Modal Overlays
**Found in:** Multiple modals
```
Background: rgba(0,0,0,0.5)
Backdrop-filter: blur(5-10px)
Z-index: 1000+
Click to close: Yes
```

### 6.3 Floating Elements
**Found in:** index.html, winston.html
```
Idea clouds: Organic shapes with text
Particles: Small animated dots
Animation: Float upward and fade
Position: Absolute, random placement
```

---

## 7. TYPOGRAPHY PATTERNS

### 7.1 Headers
```
H1: 42-64px, weight 600-700
H2: 28-36px, weight 600
H3: 20-24px, weight 600
H4: 18px, weight 600
Font-family: Inter
```

### 7.2 Body Text
```
Base: 16px, line-height 1.5-1.6
Small: 14px for labels/meta
Large: 18-20px for important text
Color: #1F2937 (dark) or #6B7280 (muted)
```

### 7.3 Special Text
```
Links: #87CEEB or #F59E0B
Success: #10B981
Error: #EF4444
Emphasis: Italic or bold
```

---

## 8. SPACING SYSTEM

### 8.1 Padding
```
Small: 8px
Medium: 16px
Large: 24px
XL: 32px
XXL: 40px
```

### 8.2 Margins
```
Between sections: 40px
Between cards: 24px
Between elements: 16px
Between related items: 8px
```

### 8.3 Border Radius
```
Small: 4-6px (inputs)
Medium: 8-12px (cards)
Large: 16-20px (modals)
Full: 50% (circles, pills)
```

---

## 9. ANIMATION PATTERNS

### 9.1 Transitions
```
Duration: 0.2-0.3s (interactions)
Duration: 0.5-1s (page elements)
Easing: ease, ease-in-out
Properties: transform, opacity, color
```

### 9.2 Hover Effects
```
Buttons: translateY(-2px) + shadow
Cards: translateY(-2px) + shadow
Links: underline or color change
Scale: 1.02-1.05 for emphasis
```

### 9.3 Loading Animations
```
Fade in: opacity 0 to 1
Slide up: translateY(20px) to 0
Pulse: scale animation
Spin: rotate animation
```

---

## 10. EMPTY STATES

### 10.1 Patterns
**Found in:** dashboard.html, interview.html
```
Structure: Icon/Illustration + Message + CTA
Message: Friendly, encouraging tone
CTA: Clear action to take
Examples:
- "No memories yet. Start building!"
- "No files yet. Drag photos here!"
- Idea clouds for prompts
```

---

## 11. COLOR PALETTE

### 11.1 Primary Colors
```
Gold: #FFD700
Orange: #FFC107, #FF8C00
Warm backgrounds: #FFF8E7, #FFFDF9
```

### 11.2 Neutral Colors
```
Dark: #1F2937, #2C1810
Muted: #6B7280, #8D6E63
Light: #F3F4F6, #E5E7EB
White: #FFFFFF
```

### 11.3 Semantic Colors
```
Success: #10B981
Error: #EF4444, #DC2626
Info: #3B82F6, #87CEEB
Warning: #F59E0B
```

---

## 12. RESPONSIVE PATTERNS

### 12.1 Breakpoints
```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

### 12.2 Mobile Adaptations
```
Sidebar: Collapsible/hidden
Cards: Stack vertically
Text: Minimum 16px
Tap targets: Minimum 44px
Modals: Full width with padding
```

---

## IMPLEMENTATION NOTES

### Consistency Rules
1. Always use gradient for primary CTAs
2. Keep shadow styles consistent per element type
3. Use system fonts for better performance
4. Maintain 8px grid for spacing
5. Ensure touch targets are 44px minimum
6. Use semantic colors consistently

### Component Reuse Priority
1. **High:** Buttons, inputs, cards (used everywhere)
2. **Medium:** Navigation, modals (used frequently)
3. **Low:** Specific components like chat bubbles

### Accessibility Considerations
- Maintain color contrast ratios
- Include focus states for keyboard nav
- Use semantic HTML structure
- Add ARIA labels where needed
- Ensure text remains readable on backgrounds