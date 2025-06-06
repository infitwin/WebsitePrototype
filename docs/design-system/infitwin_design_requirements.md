# Infitwin Design Requirements - Phase 1 Alpha
**Version 1.0**  
**Created: 2025-01-10T18:00:00.000Z**  
**Last Updated: 2025-01-10T18:00:00.000Z**

## Overview
This document defines detailed design requirements for the 10 screens that need to be built for Infitwin Phase 1 Alpha. Each screen includes purpose, user stories, content requirements, data requirements, and success criteria.

## 11. 404 ERROR PAGE

### Purpose Statement
Provides a friendly error message when users navigate to a non-existent page, helping them find their way back to valid content.

### User Stories
1. **As a user who mistyped a URL**, I want to quickly get back to a working page so I can continue using the app.
2. **As someone following an old link**, I want to understand the page doesn't exist so I know what happened.
3. **As a logged-in user**, I want to return to my dashboard so I can continue working.

### Content Requirements
- **Error Header**: "Page Not Found"
- **Friendly Message**: 
  - "Looks like this memory got lost..."
  - "The page you're looking for doesn't exist"
- **Visual**: 
  - Illustration (empty box or lost character)
  - Soft colors matching brand
- **Navigation Options**:
  - If authenticated: "Back to Dashboard" (primary)
  - If not authenticated: "Go to Homepage" (primary)
  - "Go Back" (browser back)
- **Helpful Suggestions**:
  - "Were you looking for..."
  - Common pages list
- **Error Code**: "404" (subtle, small text)

### Data Requirements
- Requested URL path
- User authentication status  
- Referrer page (if available)
- Common/popular pages list

### Success Criteria
- Friendly, non-technical tone
- Clear navigation options
- Loads quickly (lightweight)
- Maintains brand aesthetic
- Mobile responsive
- Contextual navigation (auth-aware)

---

## 12. DASHBOARD (NEO4J GRAPH CENTERED)

### Purpose Statement
Provides the central hub of the Infitwin experience where users see their memory network visualized as an interactive knowledge graph, with quick access to all features via sidebar navigation.

### User Stories
1. **As a user**, I want to see my memories as a living graph so I can understand how my life stories connect.
2. **As someone exploring**, I want to filter the graph by categories so I can focus on specific types of memories.
3. **As a returning user**, I want to quickly see my progress so I feel motivated to continue building.

### Content Requirements
- **Header Bar**:
  - Infitwin logo (left)
  - User menu (right) with avatar and name
  - Notification icon with badge
- **Sidebar Navigation** (Persistent):
  - Dashboard (active)
  - New Memory
  - Explore
  - Talk to Twin
  - My Files
  - My Twin
  - Settings
- **Main Content Area**:
  - **Neo4j Graph Container**:
    - Control box placeholder (90% of viewport)
    - Min height: 400px
    - Background: subtle gradient
    - Loading state: "Loading your Knowledge Symphony..."
    - Empty state: Single welcome node with idea clouds
    - Error state: "Unable to load graph. Retry?"
    - Integration hooks:
      - onNodeClick(nodeId)
      - onFilterChange(filters)
      - onGraphReady()
  - **Category Cards** (Below graph):
    - 6 cards in responsive grid:
      - Recent Memories (Last 7 days)
      - Key Moments (Life highlights)
      - People (Connections)
      - Places (Locations visited)
      - Projects (Achievements)
      - Insights (Patterns & themes)
    - Each card shows:
      - Icon
      - Title
      - Count/number
      - Subtitle text
    - Click behavior: Filters graph to that category
- **Floating Elements**:
  - "Shared with Me" indicator (if any)
  - Quick action button (+) for new memory

### Data Requirements
- User profile (name, avatar)
- Notification count
- Graph data passed to Neo4j component:
  - Nodes array
  - Edges array
  - Current filters
  - Layout preferences
- Category statistics:
  - Recent memory count
  - Key moments count
  - People count
  - Places count
  - Projects count
  - Insights count
- Shared twins count

### Success Criteria
- Graph loads within 3 seconds
- Smooth integration with Neo4j component
- Category cards update when graph changes
- Sidebar navigation persists across pages
- Mobile responsive (graph adapts)
- Empty state encourages first memory
- Clear visual hierarchy (graph is focal point)

### Integration Points
The Neo4j component will need to:
- Receive initial graph data on mount
- Emit events when nodes are clicked
- Accept filter commands from category cards
- Update when new memories are added
- Handle resize events gracefully

---

## 13. PASSWORD RESET PAGE

### Purpose Statement
Allows users who have forgotten their password to securely reset it through email verification, maintaining account security while providing a smooth recovery process.

### User Stories
1. **As a forgetful user**, I want to reset my password easily so I can regain access to my memories.
2. **As someone concerned about security**, I want the reset process to verify my identity so my account stays protected.
3. **As a user who made a typo**, I want to correct my email address so I can receive the reset link.

### Content Requirements
- **Step 1: Request Reset**
  - Header: "Reset Your Password"
  - Instruction: "Enter your email and we'll send you a reset link"
  - Email input field
  - "Send Reset Link" button
  - "Remember your password? Log in" link
  - "Back to login" link
- **Step 2: Email Sent**
  - Success message: "Check your email!"
  - Instructions: "We've sent a password reset link to [email]"
  - "Didn't receive it?" section:
    - Check spam folder reminder
    - Resend link button (with cooldown)
    - "Try different email" link
  - Email icon/illustration
- **Step 3: Set New Password**
  - Header: "Create New Password"
  - New password field
  - Confirm password field
  - Password requirements:
    - At least 8 characters
    - Mix of letters and numbers recommended
  - "Reset Password" button
  - Strength indicator (optional)
- **Step 4: Success**
  - Success message: "Password reset successful!"
  - "Continue to Login" button
  - Auto-redirect in 3 seconds

### Data Requirements
- Email address
- Reset token (from email link)
- Token validity status
- Token expiration time
- Password strength rules
- Resend cooldown timer

### Success Criteria
- Clear 3-step process
- Email arrives within 1 minute
- Token expires after 24 hours
- Password strength validated
- Mobile-friendly forms
- Clear error messages
- Secure token handling

---

## 1. EMAIL VERIFICATION PAGE

### Purpose Statement
Ensures user email addresses are valid and owned by the person creating the account, establishing trust and security for storing personal memories.

### User Stories
1. **As a new user**, I want to easily verify my email so I can start building my memory archive securely.
2. **As someone who didn't receive the email**, I want to request a resend so I don't get stuck in the process.
3. **As a user who made a typo**, I want to change my email address so I can receive the verification.

### Content Requirements
- **Header**: "Verify Your Email"
- **Main Message**: "We've sent a verification link to [user@email.com]"
- **Instructions**: "Please check your email and click the verification link to continue"
- **Resend Section**: 
  - "Didn't receive the email?" text
  - "Resend" button (with cooldown timer)
  - "Check spam folder" reminder
- **Change Email**: "Wrong email?" link
- **Visual**: Email icon or illustration
- **Security Note**: "This helps keep your memories safe and private"

### Data Requirements
- User email address (from signup)
- Verification status (pending/verified/expired)
- Resend attempts count
- Last resend timestamp
- Cooldown period (60 seconds)
- Token expiration time

### Success Criteria
- User successfully verifies within 2 clicks from email
- Resend works with proper cooldown
- Clear feedback for all states (sent, expired, verified)
- Graceful handling of expired tokens
- Mobile-friendly email verification flow

---

## 2. ALPHA WELCOME PAGE

### Purpose Statement
Orients new alpha users to Infitwin's value proposition, demonstrates core features, and provides immediate value through the sample twin experience.

### User Stories
1. **As a new user**, I want to quickly understand what Infitwin does so I can decide if it's valuable for me.
2. **As someone curious**, I want to try a sample twin so I can experience the product before building my own.
3. **As an alpha tester**, I want to understand what features are available so I can provide good feedback.

### Content Requirements
- **Welcome Header**: "Welcome to Infitwin Alpha, [Name]!"
- **Value Props** (3 cards):
  - Build: "Interview with Winston to capture memories"
  - Explore: "Navigate your life story visually"
  - Share: "Preserve your legacy for family"
- **Video Section**:
  - Embedded 2-3 minute intro video
  - Skip button
  - Play/pause controls
- **Sample Twin**:
  - "Meet Albert Einstein" section
  - Preview of his knowledge graph
  - "Chat with Einstein" button
  - "See how memories connect" link
- **CTA**: "Start Building Your Twin" primary button
- **Alpha Notice**: "You're part of our exclusive alpha - thank you!"

### Data Requirements
- User's first name
- Video URL and metadata
- Sample twin data (pre-loaded Einstein twin)
- Feature availability flags
- User's first visit status

### Success Criteria
- 80% of users engage with sample twin
- Video completion rate >50%
- Clear path to dashboard
- Users understand core value in <2 minutes
- Sample twin demonstrates all features

---

## 3. FILE BROWSER/UPLOAD UI

### Purpose Statement
Enables users to upload, organize, and manage photos and documents that can be linked to memories, enriching their memory archive with visual context.

### User Stories
1. **As a user with old photos**, I want to upload multiple files at once so I can efficiently add visual memories.
2. **As someone organizing memories**, I want to link photos to specific memories so they have visual context.
3. **As a storage-conscious user**, I want to see how much space I'm using so I can manage my uploads.

### Content Requirements
- **Header**: "My Files" with view toggle (grid/list)
- **Upload Area**:
  - Drag-and-drop zone
  - "Choose Files" button
  - Accepted formats list
  - Progress bar during upload
- **File Grid/List**:
  - Thumbnail previews
  - File name, size, date
  - Selection checkboxes
  - Linked memory indicator
- **Toolbar**:
  - Upload button
  - Delete selected
  - Link to memory
  - Sort dropdown
  - Filter options
- **Storage Indicator**:
  - Progress bar (3.5GB of 10GB)
  - Percentage used
- **Empty State**:
  - Illustration
  - "No files yet. Drag photos here to get started!"

### Data Requirements
- File metadata (name, size, type, date)
- Thumbnail URLs
- Storage quota and usage
- Linked memory relationships
- Upload progress percentage
- File tags/categories

### Success Criteria
- Drag-and-drop works smoothly
- Bulk upload handles 50+ files
- Clear progress indication
- Easy linking to memories
- Storage warnings at 80% and 95%
- Responsive grid layout

---

## 4. EXPLORE SCREEN (WINSTON CURATOR MODE)

### Purpose Statement
Provides a guided exploration experience where Winston helps users navigate their memory graph, discover connections, and rediscover forgotten stories.

### User Stories
1. **As a user with many memories**, I want Winston to guide me through my archive so I can rediscover forgotten moments.
2. **As someone exploring**, I want to see how my memories connect so I can understand patterns in my life.
3. **As a family member**, I want to explore specific themes so I can find relevant stories to share.

### Content Requirements
- **Mode Indicator**: "Explore with Winston" header
- **Graph View** (dominant):
  - Full Neo4j visualization
  - Zoom/pan controls
  - Node highlighting
  - Connection paths
- **Winston Panel** (collapsible):
  - Winston avatar
  - Current insight/suggestion
  - "Show me..." prompts
  - Voice input option
- **Discovery Tools**:
  - Time slider
  - Category filters
  - Search box
  - "Surprise me" button
- **Memory Preview** (on node click):
  - Memory excerpt
  - Related photos
  - Connection count
  - "Tell me more" link

### Data Requirements
- Full knowledge graph data
- Winston's contextual insights
- User's exploration history
- Memory relationships and strengths
- Temporal data for timeline view
- Category metadata

### Success Criteria
- Smooth graph navigation
- Winston provides relevant guidance
- Discovery feels magical
- Hidden connections revealed
- Easy to filter and focus
- Mobile-friendly exploration

---

## 5. TALK TO INFITWIN SCREEN

### Purpose Statement
Enables direct conversation with the user's digital twin, allowing them to ask questions and receive responses based on their captured memories.

### User Stories
1. **As the twin creator**, I want to test my twin so I can see how it responds to questions.
2. **As someone seeking wisdom**, I want to ask my past self for advice so I can make better decisions.
3. **As a family member**, I want to have conversations so I feel connected to the person's stories.

### Content Requirements
- **Header**: "[Twin Name]" with avatar
- **Chat Interface**:
  - Message bubbles (user/twin)
  - Timestamps
  - Typing indicator
  - Message input field
- **Input Options**:
  - Text input with send button
  - Voice input toggle button
  - Voice recording indicator:
    - Microphone icon (tap to start)
    - Recording animation (pulsing red)
    - Waveform visualization
    - "Tap to stop" state
  - Suggested questions chips
- **Voice Interaction Details**:
  - Hold to record / tap to toggle
  - Real-time transcription display
  - "Listening..." status
  - Error handling for no microphone
- **Twin Presence**:
  - Avatar/profile image
  - "Active now" indicator
  - Personality traits display
- **Conversation Tools**:
  - Clear chat option
  - Export conversation
  - Search messages
  - Related memories indicator

### Data Requirements
- Conversation history
- Twin's knowledge base
- Response generation status
- User input method preference
- Related memory nodes
- Twin personality model

### Success Criteria
- Natural conversation flow
- <3 second response time
- Relevant memory references
- Voice input works well
- Conversation feels authentic
- Easy to navigate history

---

## 6. TWIN MANAGEMENT PAGE

### Purpose Statement
Provides central control over twin settings and displays shared twins, allowing users to manage their own twin and access twins shared with them.

### User Stories
1. **As a twin owner**, I want to edit my twin's name so it feels more personal.
2. **As someone monitoring progress**, I want to see my twin's statistics so I know how complete it is.
3. **As a recipient**, I want to see all twins shared with me so I can explore family stories.

### Content Requirements
- **Tab Navigation**: "My Twin" | "Shared with Me"
- **My Twin Tab**:
  - Twin name (editable)
  - Creation date
  - Statistics cards:
    - Total memories
    - Total files
    - People connected
    - Date range covered
  - Twin avatar/image
  - "Share Twin" button (opens Share Modal)
- **Shared with Me Tab**:
  - List of shared twins
  - Each shows:
    - Owner name
    - Twin name  
    - Share date
    - Last updated
    - "View Twin" button
  - Empty state: "No twins shared yet"

### Data Requirements
- Twin metadata
- Statistics/counts
- Sharing relationships
- Shared twin access list
- Last activity timestamps
- Permission levels

### Success Criteria
- Name editing saves properly
- Statistics update real-time
- Shared twins load quickly
- Clear navigation between tabs
- Mobile-responsive layout
- Empty states helpful

---

## 7. SETTINGS PAGE

### Purpose Statement
Allows users to manage their account information, security settings, and notification preferences in one organized location.

### User Stories
1. **As a security-conscious user**, I want to change my password regularly so my account stays secure.
2. **As a busy person**, I want to control notifications so I only get relevant updates.
3. **As someone who moved**, I want to update my email so I continue receiving important communications.

### Content Requirements
- **Section: Account Information**
  - Display name field
  - Email field (with verification status)
  - Member since date
  - "Save Changes" button
- **Section: Security**
  - Change password form
  - Current password field
  - New password field
  - Confirm password field
  - Password requirements
- **Section: Notifications**
  - Email alerts toggle
  - Interview reminders toggle
  - Weekly digest toggle
  - Shared twin notifications toggle
- **Section: Privacy**
  - Default sharing setting
  - Data export option
- **Save Confirmation**: Toast message

### Data Requirements
- User profile data
- Email verification status
- Password change timestamps
- Notification preferences
- Privacy settings
- Account creation date

### Success Criteria
- All changes save properly
- Password validation works
- Email change triggers verification
- Toggles provide instant feedback
- Form validation clear
- Mobile-friendly forms

---

## 8. SHARE MODAL

### Purpose Statement
Provides a simple, secure way to share a twin with family members via email invitation, maintaining privacy while enabling family connections.

### User Stories
1. **As a twin creator**, I want to share with specific family members so they can access my stories.
2. **As someone careful about privacy**, I want to control who sees my twin so my memories stay protected.
3. **As a sharer**, I want to see who I've shared with so I can manage access.

### Content Requirements
- **Modal Header**: "Share Your Twin"
- **Share Form**:
  - Email input field
  - "Add another email" link
  - Optional message textarea
  - "Send Invitations" button
- **Current Shares Section**:
  - List of people shared with
  - Email and share date
  - Status (active/pending)
  - ~~Remove access option~~ (Phase 2)
- **Privacy Notice**: 
  - "Recipients must create account"
  - "Access can be managed later" (Phase 2)
- **Success State**:
  - "Invitations sent!" message
  - List of sent emails

### Data Requirements
- Recipient email validation
- Current share list
- Invitation status
- Share timestamps
- Custom message content
- Email delivery status

### Success Criteria
- Email validation prevents errors
- Multiple emails easy to add
- Clear send confirmation
- Share list updates immediately
- Modal closes smoothly
- Accessible on mobile

---

## 9. SHARED VIEW (READ-ONLY)

### Purpose Statement
Provides a limited, read-only interface for viewing twins shared by others, maintaining clear boundaries while enabling meaningful family connections.

### User Stories
1. **As a family member**, I want to explore shared memories so I can learn about family history.
2. **As a shared twin viewer**, I want to chat with the twin so I can ask specific questions.
3. **As an inspired viewer**, I want to create my own twin after seeing the value.

### Content Requirements
- **Header**: 
  - "[Twin Name] by [Owner Name]"
  - "Shared with you" badge
  - Back to dashboard link
- **Limited Navigation**:
  - Explore mode
  - Talk mode  
  - No edit capabilities
- **View Indicators**:
  - "Read-only access" notice
  - Disabled edit buttons
  - No delete options
- **Conversion Prompt**:
  - "Inspired? Create your own twin"
  - Subtle but persistent
- **Graph/Chat Interface**:
  - Same as owner view but read-only

### Data Requirements
- Shared twin data (filtered)
- Access permissions
- Owner information
- View-only states
- Available actions list
- Conversion tracking

### Success Criteria
- Clear read-only indicators
- No accidental edit attempts
- Smooth navigation
- Fast loading
- Conversion prompt effective
- Mobile-optimized

---

## 10. GENERAL ERROR PAGE

### Purpose Statement
Provides helpful error handling for unexpected issues, maintaining user confidence while guiding them back to a working state.

### User Stories
1. **As a user encountering an error**, I want to understand what happened so I'm not confused.
2. **As someone trying to work**, I want options to recover so I don't lose progress.
3. **As a concerned user**, I want to report issues so they can be fixed.

### Content Requirements
- **Error Header**: "Oops! Something went wrong"
- **Error Message**: 
  - User-friendly explanation
  - Error code (small text)
- **Visual**: Error illustration
- **Recovery Options**:
  - "Try Again" button
  - "Go to Dashboard" link
  - "Return Home" link
- **Additional Help**:
  - "Report this issue" link
  - Support email
- **Technical Details**:
  - Collapsible section
  - Error stack (if available)

### Data Requirements
- Error code/type
- Error message
- Stack trace (dev mode)
- User authentication status
- Previous page URL
- Timestamp

### Success Criteria
- Non-threatening tone
- Clear next steps
- Mobile-friendly
- Quick loading
- Helpful navigation options
- Technical details hidden by default

---

## Design Patterns to Maintain

### Visual Consistency
- Use existing color palette from hero/dashboard
- Maintain button styles from auth pages
- Keep card patterns from dashboard
- Use consistent spacing system

### Interaction Patterns
- Loading states: Skeleton screens preferred
- Success feedback: Green toast messages
- Error handling: Red inline messages
- Modals: Dark overlay with white content

### Responsive Behavior
- Mobile-first approach
- Breakpoints at 768px and 1024px
- Touch-friendly tap targets (44px min)
- Readable font sizes (16px base)