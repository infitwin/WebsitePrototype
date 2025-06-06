# Infitwin AI Design Briefs - Individual Pages
**Version 1.0**  
**Created: 2025-01-10T19:45:00.000Z**  
**Last Updated: 2025-01-10T19:45:00.000Z**

## Overview
Individual design briefs for each of the 10 pages that need to be created for Infitwin Phase 1 Alpha.

---

## 1. EMAIL VERIFICATION PAGE

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Not required (pending verification)
Purpose: Ensures user email addresses are valid for secure memory storage
User Goal: Verify email to access dashboard
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: auth.html (soft horizon gradient)
Background: Soft gradient (light warm tones)
Overall Feel: Welcoming, secure, patient
Key Colors: Warm whites (#FFF8E7), soft blues (#87CEEB), gold accents (#FFD700)
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Minimal - just logo top left
Container: Centered, max-width 600px, padding 40px
Sections:
1. Logo/Brand header
2. Verification message with email icon
3. Status content (check email / resend)
4. Alternative actions footer
Responsive: Stack vertically, reduce padding to 20px
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Secondary button ("Resend Email")
- [x] Text link ("Change email address")
- [x] Text link ("Back to login")
- [x] Success state styling

Custom Elements:
- [x] Email envelope icon/illustration
- [x] Countdown timer (60s for resend)
- [x] Check mark animation (when verified)

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "Verify Your Email"
- H2: "Almost there!"

Body Text:
- "We've sent a verification link to [user@email.com]"
- "Please check your email and click the link to continue"
- "Didn't receive the email? Check your spam folder"

CTAs:
- Secondary: "Resend Email" (disabled during cooldown)
- Link: "Wrong email address?"

Footer Links:
- "Back to Login"
- "Contact Support"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Message showing email sent
Hover States: Buttons and links
Click Actions: 
- Resend: Start 60s cooldown, show success toast
- Change email: Navigate to form
Transitions: Smooth opacity changes
Validation: Email format if changing
```

#### 7. EMPTY/ERROR STATES
```
Empty State: N/A
Loading State: Button spinner during resend
Error State: "Failed to send. Please try again"
Success State: "Email sent! Check your inbox"
Verified State: Check mark + "Verified! Redirecting..."
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Will check verification status via API
File Format: HTML + inline CSS
Libraries: None required
Browser Support: Modern browsers
Performance: Lightweight, fast loading
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Natural vertical flow
Touch Targets: Buttons 44px height minimum
Font Sizes: 16px minimum
Simplified: Smaller illustration
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Semantic HTML structure
- ARIA labels for timer and status
- Color contrast WCAG AA compliant
- Keyboard navigation support
- Focus indicators visible
- Screen reader announces countdown
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: email-verification.html
Assets: Use inline SVG for email icon
Interactivity: Countdown timer, button states
Comments: Mark API integration points
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Clear email display with option to change
- [x] Resend button with 60s cooldown timer
- [x] Helpful message about spam folders
- [x] Smooth transition to verified state

Must NOT include:
- [x] Complex forms or inputs
- [x] Multiple verification methods

---

## 2. ALPHA WELCOME PAGE

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required (just verified)
Purpose: Orient new users to Infitwin's value and features
User Goal: Understand product value and start building
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: index.html hero (warm, inspiring)
Background: Subtle gradient with floating elements
Overall Feel: Exciting, welcoming, valuable
Key Colors: Gold (#FFD700), warm whites, soft accent colors
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Full nav with user menu
Container: Full width with max-width sections
Sections:
1. Welcome hero with user name
2. Three value props cards
3. Video section (optional view)
4. Sample twin preview
5. CTA to start building
Responsive: Cards stack, video remains 16:9
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Primary button ("Start Building My Twin")
- [x] Secondary button ("Skip Video")
- [x] Content cards (3 value props)
- [x] Video player container
- [x] User avatar in nav

Custom Elements:
- [x] Welcome illustration/graphic
- [x] Value prop icons (Build, Explore, Share)
- [x] Sample twin preview card
- [x] Alpha badge/indicator

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "Welcome to Infitwin Alpha, [Name]!"
- H2: "Your Legacy Starts Here"
- H3s: "Build", "Explore", "Share"

Body Text:
- "Thank you for being an early adopter!"
- Value props:
  - Build: "Interview with Winston to capture memories"
  - Explore: "Navigate your life story visually"  
  - Share: "Preserve your legacy for family"

CTAs:
- Primary: "Start Building My Twin"
- Secondary: "Explore Sample Twin"
- Link: "Skip intro video"

Sample Twin:
- "Meet Albert Einstein"
- "See how a complete twin works"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Welcome message prominent
Hover States: Cards lift, buttons glow
Click Actions:
- Video: Plays inline
- Sample twin: Opens preview
- Start building: To dashboard
Transitions: Smooth card animations
Auto-play: No (user controls video)
```

#### 7. EMPTY/ERROR STATES
```
Empty State: N/A
Loading State: Video skeleton while loading
Error State: "Video unavailable" with skip option
Success State: N/A
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Video embed (YouTube/Vimeo)
File Format: HTML + inline CSS
Libraries: Video player (if needed)
Browser Support: Modern browsers
Performance: Lazy load video
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Hero, cards, video, sample, CTA
Touch Targets: All buttons 44px+
Font Sizes: 16px minimum
Simplified: Smaller hero, cards stack
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Video controls accessible
- Captions available
- Skip options for all content
- Keyboard navigation through sections
- High contrast text on backgrounds
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: alpha-welcome.html
Assets: Icons as inline SVG, video placeholder
Interactivity: Video player, hover states
Comments: Mark personalization points
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Personalized welcome with user's name
- [x] Three clear value propositions
- [x] Video section (skippable)
- [x] Sample twin preview
- [x] Clear path to start building

Must NOT include:
- [x] Overwhelming information
- [x] Required video watching

---

## 3. FILE BROWSER/UPLOAD UI

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required
Purpose: Upload, organize, and manage photos/documents for memories
User Goal: Add visual context to memories through files
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: dashboard.html (clean, organized)
Background: Light gray (#F9FAFB)
Overall Feel: Organized, efficient, clear
Key Colors: White cards, blue accents, gold CTAs
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Full nav + sidebar
Container: Full width with sidebar
Sections:
1. Header with view toggle and actions
2. Upload zone (collapsible)
3. File grid/list view
4. Storage indicator bar
Responsive: Sidebar collapses, grid adjusts
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Primary button ("Upload Files")
- [x] Icon buttons (grid/list toggle)
- [x] Secondary buttons (Delete, Link to Memory)
- [x] Progress bar (storage)
- [x] Card pattern (file preview)
- [x] Checkbox pattern
- [x] Empty state pattern

Custom Elements:
- [x] Drag-drop zone with dashed border
- [x] File preview thumbnails
- [x] Upload progress indicators
- [x] Bulk selection toolbar

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "My Files"
- H2: "Upload New Files"

Body Text:
- "Drag files here or click to browse"
- "Supported: JPG, PNG, PDF, DOC"
- Empty: "No files yet. Drag photos here to get started!"
- Storage: "3.5 GB of 10 GB used"

CTAs:
- Primary: "Upload Files"
- Secondary: "Link to Memory"
- Danger: "Delete Selected"

File Info:
- Name, size, date uploaded
- "Linked to X memories"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Grid view of files
Hover States: File cards show actions
Click Actions:
- File: Preview modal
- Checkbox: Select for bulk
- Upload: File picker
Drag-drop: Visual feedback
Multi-select: Shift+click
```

#### 7. EMPTY/ERROR STATES
```
Empty State: Illustration + "No files yet" + upload CTA
Loading State: Skeleton cards while fetching
Error State: "Upload failed. Try again"
Success State: "Files uploaded successfully!"
Storage Warning: Red bar at 80%+
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: File upload API, storage calc
File Format: HTML + inline CSS
Libraries: None (native file API)
Browser Support: Modern browsers
Performance: Lazy load thumbnails
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Hide sidebar, stack actions
Touch Targets: Larger file cards
Font Sizes: File names may truncate
Simplified: Single column grid
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Keyboard navigation through files
- Screen reader announces selections
- Clear focus indicators
- Alternative to drag-drop
- Status announcements
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: file-browser.html
Assets: Placeholder thumbnails, icons
Interactivity: Selection, drag-drop zones
Comments: Mark upload API endpoints
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Drag-and-drop upload zone
- [x] Grid and list view toggle
- [x] Multi-file selection
- [x] Storage indicator
- [x] Link to memory action
- [x] Bulk delete with confirmation

Must NOT include:
- [x] Complex file editing
- [x] Folder organization (Phase 2)

---

## 4. EXPLORE SCREEN (WINSTON CURATOR MODE)

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required
Purpose: Guided exploration of memory graph with Winston's help
User Goal: Rediscover connections and forgotten stories
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: Combination of dashboard + winston.html
Background: Subtle gradient like dashboard
Overall Feel: Magical discovery, guided journey
Key Colors: Gold nodes, purple connections, warm accents
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Minimal nav (back to dashboard)
Container: Full screen with panels
Sections:
1. Mode indicator header
2. Graph visualization (main area)
3. Winston panel (right, collapsible)
4. Controls toolbar (bottom)
Responsive: Winston panel becomes modal
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Icon buttons (zoom, pan, reset)
- [x] Secondary button ("Surprise Me")
- [x] Chat bubble pattern (Winston)
- [x] Avatar (Winston)
- [x] Input field (ask Winston)

Custom Elements:
- [x] Neo4j graph container
- [x] Node preview popover
- [x] Connection path highlighting
- [x] Time slider control
- [x] Category filter chips

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "Explore Your Memories"
- H2: "Winston's Insights"

Winston Messages:
- "Shall we explore your family memories?"
- "I notice a pattern in your career journey..."
- "This photo connects to 3 other memories"

CTAs:
- "Show me something surprising"
- "Focus on [category]"
- "Tell me more"

Graph Labels:
- Node types: Memory, Photo, Person, Place
- Connection types: Relates to, Mentions, Occurs at
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Full graph with Winston ready
Hover States: Nodes glow, preview appears
Click Actions:
- Node: Expand details
- Connection: Highlight path
- Winston suggestion: Navigate to area
Pan/Zoom: Mouse or touch controls
Keyboard: Arrow keys navigate
```

#### 7. EMPTY/ERROR STATES
```
Empty State: "Add memories to see connections"
Loading State: Graph skeleton animation
Error State: "Unable to load graph"
No Connections: "No connections found yet"
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Neo4j component, Winston AI
File Format: HTML + inline CSS
Libraries: Neo4j viz (provided separately)
Browser Support: Modern browsers
Performance: Progressive graph loading
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Graph full screen, Winston overlay
Touch Targets: Larger node hit areas
Gestures: Pinch zoom, pan
Simplified: Hide advanced filters
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Keyboard navigation through nodes
- Screen reader describes connections
- High contrast mode option
- Alternative list view of connections
- Winston messages read aloud option
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: explore-screen.html
Assets: Winston avatar, placeholder graph
Interactivity: Basic hover states, panel toggle
Comments: Mark Neo4j integration points
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Full-screen graph visualization area
- [x] Winston panel with chat interface
- [x] Graph controls (zoom, pan, reset)
- [x] Category filters
- [x] Time-based navigation
- [x] "Surprise me" discovery feature

Must NOT include:
- [x] Direct graph editing
- [x] Complex search (use Winston instead)

---

## 5. TALK TO INFITWIN SCREEN

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required
Purpose: Direct conversation with user's digital twin
User Goal: Ask questions and receive personalized responses
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: winston.html chat interface
Background: Warm gradient with subtle texture
Overall Feel: Personal, intimate conversation
Key Colors: User's twin colors, chat bubbles (white/gradient)
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Minimal nav with mode switcher
Container: Centered chat, max-width 800px
Sections:
1. Twin header with avatar
2. Chat messages area
3. Input area with voice option
4. Suggested questions chips
Responsive: Full width on mobile
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Chat bubbles (user/twin)
- [x] Avatar (twin portrait)
- [x] Input field with send button
- [x] Icon button (microphone)
- [x] Chip pattern (suggestions)

Custom Elements:
- [x] Twin presence indicator
- [x] Typing animation
- [x] Voice recording visualization
- [x] Related memories indicator
- [x] Message timestamps

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "[Twin Name]"
- Subtitle: "Ask me anything"

Suggested Questions:
- "What was your happiest moment?"
- "Tell me about grandma"
- "What advice would you give me?"
- "Describe your childhood"

Status Messages:
- "[Twin] is typing..."
- "Recording... Tap to stop"
- "Related memories found"

CTAs:
- Send button (arrow icon)
- Voice input (microphone)
- "Clear conversation"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Welcome message from twin
Hover States: Suggestions highlight
Click Actions:
- Suggestion: Sends question
- Microphone: Start/stop recording
- Message: Show timestamp
Voice: Hold to record or tap toggle
Typing: Real-time indicator
```

#### 7. EMPTY/ERROR STATES
```
Empty State: Twin introduces themselves
Loading State: Typing dots animation
Error State: "Connection lost. Retry?"
No Response: "Hmm, ask me another way"
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Twin AI API, speech-to-text
File Format: HTML + inline CSS
Libraries: None required
Browser Support: Modern (with WebRTC)
Performance: Message pagination
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Natural chat flow
Touch Targets: Large input area
Keyboard: Adjusts for on-screen
Simplified: Hide suggestions when typing
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Messages read by screen reader
- Voice input alternative (text)
- Clear speaker identification
- Keyboard send (Enter key)
- High contrast message bubbles
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: talk-to-twin.html
Assets: Avatar placeholder, mic icon
Interactivity: Chat interaction, typing animation
Comments: Mark AI response injection points
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Clear twin identity/avatar
- [x] Natural chat interface
- [x] Voice and text input options
- [x] Suggested questions
- [x] Typing indicators
- [x] Smooth conversation flow

Must NOT include:
- [x] Complex chat commands
- [x] Twin configuration (separate screen)

---

## 6. TWIN MANAGEMENT PAGE

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required
Purpose: Manage twin settings and view shared twins
User Goal: Configure their twin and access shared twins
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: dashboard.html cards pattern
Background: Light gray (#F9FAFB)
Overall Feel: Organized control panel
Key Colors: White cards, gold accents
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Full nav + sidebar
Container: Full width with sidebar
Sections:
1. Tab navigation (My Twin | Shared with Me)
2. My Twin: Stats cards + name edit
3. Shared: List of shared twins
Responsive: Tabs stack on mobile
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Tab navigation pattern
- [x] Stat cards (like dashboard)
- [x] Input field (twin name)
- [x] Primary button ("Share Twin")
- [x] Secondary button ("View Twin")
- [x] Empty state pattern

Custom Elements:
- [x] Twin avatar upload
- [x] Share status badges
- [x] Last updated timestamps
- [x] Owner info display

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "Twin Management"
- Tab 1: "My Twin"
- Tab 2: "Shared with Me"

My Twin Content:
- Name: "[Twin Name]" (editable)
- Created: "January 15, 2024"
- Stats: "47 Memories", "23 People", "15 Places"
- "Share your twin with family"

Shared Twins:
- "[Twin Name] by [Owner]"
- "Shared on [date]"
- "Last updated [time ago]"
- Empty: "No twins shared with you yet"

CTAs:
- Primary: "Share Twin"
- Secondary: "View Twin"
- Link: "Save Changes"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: My Twin tab active
Hover States: Cards lift slightly
Click Actions:
- Tab: Switch views
- Edit name: Inline editing
- Share: Opens modal
- View: Navigate to shared view
Save: Updates without refresh
```

#### 7. EMPTY/ERROR STATES
```
Empty State: "No twins shared yet" + explanation
Loading State: Skeleton cards
Error State: "Failed to load. Retry"
Success State: "Changes saved!"
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Twin settings API
File Format: HTML + inline CSS
Libraries: None required
Browser Support: Modern browsers
Performance: Quick tab switching
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Tabs, then content
Touch Targets: Larger tab buttons
Font Sizes: Stats remain readable
Simplified: Hide sidebar
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Tab keyboard navigation
- Clear tab indicators
- Form labels for editing
- Status messages announced
- Focus management on tab switch
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: twin-management.html
Assets: Avatar placeholder, stat icons
Interactivity: Tab switching, inline edit
Comments: Mark API data points
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Two-tab interface
- [x] Editable twin name
- [x] Clear statistics display
- [x] Share button (opens modal)
- [x] List of shared twins
- [x] Empty state for shared tab

Must NOT include:
- [x] Complex twin configuration
- [x] Delete twin option (Phase 2)

---

## 7. SETTINGS PAGE

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required
Purpose: Manage account settings and preferences
User Goal: Update personal info and control notifications
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: dashboard.html clean sections
Background: Light gray (#F9FAFB)
Overall Feel: Clear, organized settings
Key Colors: White sections, blue toggles
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Full nav + sidebar
Container: Full width with sidebar
Sections:
1. Account Information
2. Security (password)
3. Notifications
4. Privacy (Phase 1 basics)
Responsive: Single column on mobile
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Form inputs (text, password)
- [x] Primary button ("Save Changes")
- [x] Toggle switches
- [x] Section cards
- [x] Success toast

Custom Elements:
- [x] Password strength indicator
- [x] Email verification badge
- [x] Section dividers
- [x] Help text for options

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "Settings"
- H2s: "Account", "Security", "Notifications", "Privacy"

Form Labels:
- "Display Name"
- "Email Address" 
- "Current Password"
- "New Password"
- "Confirm Password"

Toggles:
- "Email notifications"
- "Interview reminders"
- "Weekly digest"
- "Shared twin alerts"

Help Text:
- "Used across Infitwin"
- "We'll email to verify"
- "At least 8 characters"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Current settings shown
Hover States: Form focus styles
Click Actions:
- Save: Validate and submit
- Toggle: Instant save
- Cancel: Revert changes
Validation: Real-time for password
Auto-save: Toggles save instantly
```

#### 7. EMPTY/ERROR STATES
```
Empty State: N/A (always has data)
Loading State: Spinner on save button
Error State: Inline field errors
Success State: "Settings saved!" toast
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: User settings API
File Format: HTML + inline CSS
Libraries: None required
Browser Support: Modern browsers
Performance: Section-based saves
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Natural section flow
Touch Targets: Larger toggles
Font Sizes: Readable labels
Simplified: Hide sidebar
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Form labels associated
- Toggle states clear
- Error messages linked to fields
- Keyboard navigation
- Screen reader announcements
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file with embedded CSS
Naming: settings.html
Assets: Toggle switches, icons
Interactivity: Form validation, toggles
Comments: Mark save endpoints
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Account info editing
- [x] Password change form
- [x] Notification preferences
- [x] Clear save feedback
- [x] Organized sections
- [x] Mobile-friendly forms

Must NOT include:
- [x] Complex privacy controls
- [x] Data export (Phase 2)

---

## 8. SHARE MODAL

#### 1. CONTEXT & PURPOSE
```
Page Type: Modal overlay
Authentication: Required
Purpose: Share twin with family via email
User Goal: Grant access to specific people
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: capture-memory.html modal
Background: Dark overlay (rgba(0,0,0,0.5))
Overall Feel: Simple, secure sharing
Key Colors: White modal, gold CTA
```

#### 3. LAYOUT STRUCTURE
```
Navigation: None (modal)
Container: 500px wide, centered
Sections:
1. Modal header with close
2. Share form
3. Current shares list
4. Privacy notice
Responsive: 90% width on mobile
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Modal container pattern
- [x] Close button (X)
- [x] Input field (email)
- [x] Primary button ("Send Invitations")
- [x] Text link ("Add another")

Custom Elements:
- [x] Email chip with remove
- [x] Share status badges
- [x] Recipient list item
- [x] Success animation

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H2: "Share Your Twin"
- H3: "Who has access"

Form Content:
- Label: "Email address"
- Placeholder: "family@example.com"
- "Add another email address"
- "Message (optional)"

Privacy Notice:
- "Recipients must create an account"
- "You control who sees your memories"

Current Shares:
- "[email] - Invited [date]"
- "Active" or "Pending" badge
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Empty email field focused
Hover States: Buttons, remove icons
Click Actions:
- Add: New email field
- Remove: Delete email
- Send: Validate and submit
- X: Close modal
Enter key: Add email to list
```

#### 7. EMPTY/ERROR STATES
```
Empty State: "Not shared with anyone yet"
Loading State: Button spinner
Error State: "Invalid email address"
Success State: "Invitations sent!"
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Share API endpoint
File Format: HTML + inline CSS
Libraries: None required
Browser Support: Modern browsers
Performance: Quick open/close
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Natural vertical
Touch Targets: Larger buttons
Font Sizes: 16px minimum
Simplified: Full-width modal
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Focus trapped in modal
- Escape key closes
- Screen reader announces
- Clear focus order
- Error messages associated
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Modal within page HTML
Naming: Part of twin-management.html
Assets: Close icon, status badges
Interactivity: Open/close, form handling
Comments: Mark as modal component
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Email input with validation
- [x] Multiple email support
- [x] Current shares display
- [x] Clear privacy message
- [x] Success confirmation
- [x] Easy close options

Must NOT include:
- [x] Revoke access (Phase 2)
- [x] Permission levels

---

## 9. SHARED VIEW (READ-ONLY)

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Required
Purpose: View twins shared by others (read-only)
User Goal: Explore family member's memories
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: Dashboard + muted colors
Background: Similar gradient, softer
Overall Feel: Respectful viewing experience
Key Colors: Muted versions of owner's colors
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Minimal nav + limited sidebar
Container: Full dashboard layout
Sections:
1. Owner banner
2. Graph visualization (view-only)
3. Limited sidebar (Explore/Talk only)
4. Conversion prompt (subtle)
Responsive: Same as dashboard
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Navigation (limited)
- [x] Graph container
- [x] Sidebar (modified)
- [x] Banner pattern
- [x] Secondary button ("Create Your Own")

Custom Elements:
- [x] "Shared with you" badge
- [x] Owner info display
- [x] Read-only indicators
- [x] Disabled edit buttons

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "[Twin Name]"
- Subtitle: "by [Owner Name]"
- Badge: "Shared with you"

Banner Text:
- "You're viewing [Name]'s memories"
- "Read-only access"

Disabled Actions:
- Edit buttons grayed out
- "View only" tooltips

Conversion:
- "Inspired? Create your own twin"
- Subtle, persistent footer
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Graph centered, banner visible
Hover States: Nodes only (no edit)
Click Actions:
- Nodes: View details only
- Explore: Winston guides
- Talk: Chat with twin
- Create own: To signup
Disabled: All edit functions
```

#### 7. EMPTY/ERROR STATES
```
Empty State: N/A (has content)
Loading State: Same as dashboard
Error State: "Unable to load shared twin"
Access Revoked: "No longer shared"
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Shared twin API
File Format: HTML + inline CSS
Libraries: Neo4j viewer (read-only)
Browser Support: Modern browsers
Performance: Same as dashboard
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Banner, graph, prompt
Touch Targets: Standard sizes
Font Sizes: Standard dashboard
Simplified: Hide conversion on small screens
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Clear ownership indication
- Read-only state announced
- Navigation limited appropriately
- All content still readable
- Keyboard nav works
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file
Naming: shared-view.html
Assets: Uses dashboard assets
Interactivity: Limited to viewing
Comments: Mark read-only sections
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Clear owner identification
- [x] Read-only indicators
- [x] Limited navigation (Explore/Talk)
- [x] Graph visualization works
- [x] Conversion prompt
- [x] No edit capabilities visible

Must NOT include:
- [x] Any edit functions
- [x] Delete options
- [x] Settings access

---

## 10. GENERAL ERROR PAGE

#### 1. CONTEXT & PURPOSE
```
Page Type: Full page
Authentication: Contextual
Purpose: Handle unexpected errors gracefully
User Goal: Understand issue and recover
```

#### 2. VISUAL STYLE REFERENCE
```
Match Style Of: auth.html friendly style
Background: Soft gradient
Overall Feel: Helpful, not alarming
Key Colors: Soft colors, no harsh reds
```

#### 3. LAYOUT STRUCTURE
```
Navigation: Minimal or none
Container: Centered, max-width 600px
Sections:
1. Error illustration
2. Error message
3. Recovery actions
4. Additional help
Responsive: Stack naturally
```

#### 4. COMPONENTS NEEDED
From Pattern Library:
- [x] Primary button ("Try Again")
- [x] Secondary button ("Go to Dashboard")
- [x] Text link ("Contact Support")
- [x] Illustration style

Custom Elements:
- [x] Error illustration (friendly)
- [x] Error code display (subtle)
- [x] Collapsible tech details
- [x] Timestamp

#### 5. CONTENT SPECIFICATIONS
```
Headers:
- H1: "Oops! Something went wrong"
- H2: "Don't worry, we're on it"

Messages:
- "We encountered an unexpected issue"
- "Your memories are safe"
- "Error code: [XXX]" (small)

CTAs:
- Primary: "Try Again"
- Secondary: "Go to Dashboard"
- Link: "Report this issue"

Help Text:
- "If this keeps happening, contact support"
- Email: "help@infitwin.com"
```

#### 6. INTERACTION REQUIREMENTS
```
Default State: Error message with actions
Hover States: Standard buttons
Click Actions:
- Try again: Reload/retry
- Dashboard: Navigate home
- Details: Expand tech info
Copy: Error code copyable
```

#### 7. EMPTY/ERROR STATES
```
Empty State: N/A
Loading State: N/A (fast page)
Error State: This is the error state
Success State: Redirects away
```

#### 8. TECHNICAL CONSTRAINTS
```
Integrations: Error logging API
File Format: HTML + inline CSS
Libraries: None (lightweight)
Browser Support: All browsers
Performance: Must load fast
```

#### 9. MOBILE CONSIDERATIONS
```
Breakpoint: 768px
Stack Order: Natural vertical
Touch Targets: Standard
Font Sizes: Readable
Simplified: Same experience
```

#### 10. ACCESSIBILITY REQUIREMENTS
```
- Clear error communication
- Screen reader friendly
- High contrast maintained
- Keyboard navigation
- No auto-refresh
```

#### 11. DELIVERABLE SPECIFICATIONS
```
Format: Single HTML file
Naming: error-general.html
Assets: Friendly illustration
Interactivity: Minimal
Comments: Mark dynamic error content
```

#### 12. SUCCESS CRITERIA
Must include:
- [x] Non-threatening message
- [x] Clear recovery options
- [x] Error code (subtle)
- [x] Support contact
- [x] Technical details (hidden)
- [x] Reassuring tone

Must NOT include:
- [x] Scary error messages
- [x] Technical jargon
- [x] Auto-refresh loops