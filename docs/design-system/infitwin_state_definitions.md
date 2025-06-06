# Infitwin State Definitions - Phase 1 Alpha
**Version 1.0**  
**Created: 2025-01-10T17:00:00.000Z**  
**Last Updated: 2025-01-10T17:15:00.000Z**

## Overview
This document defines all data states, UI states, and state transitions for each screen in Infitwin Phase 1 Alpha. The Neo4j Knowledge Graph is the heart of the dashboard, with all other features accessible via sidebar navigation.

---

## 1. DASHBOARD (Knowledge Graph Visualization)

### Data Requirements
```javascript
{
  user: {
    name: string,
    email: string,
    avatar: string (generated),
    lastActive: timestamp
  },
  knowledgeGraph: {
    nodes: [
      {
        id: string,
        type: "memory" | "photo" | "person" | "place" | "event" | "theme",
        label: string,
        createdAt: timestamp,
        position: {x: number, y: number},
        size: number, // Based on connections
        color: string, // Based on type
        metadata: {
          thumbnail?: string,
          excerpt?: string,
          dateReference?: date
        }
      }
    ],
    edges: [
      {
        source: nodeId,
        target: nodeId,
        type: "relates_to" | "mentions" | "occurs_at" | "involves",
        strength: number // 0-1
      }
    ],
    layout: "force-directed" | "timeline" | "categorical",
    viewMode: "2D" | "3D",
    filters: {
      dateRange: {start, end},
      nodeTypes: string[],
      searchQuery: string
    }
  },
  quickStats: {
    recentMemories: number, // Last 7 days
    keyMoments: number,
    people: number,
    places: number,
    projects: number,
    insights: number
  },
  sharedWithMe: {
    visible: boolean, // Shows in dashboard corner
    count: number,
    recentShares: [
      {
        ownerName: string,
        twinName: string,
        sharedDate: timestamp
      }
    ]
  },
  sidebar: {
    isOpen: boolean,
    activeItem: "dashboard"
  }
}
```

### UI States
- **Loading**: 
  - Graph area shows animated loading spinner
  - Category cards show skeleton placeholders
  - Sidebar disabled
  
- **Empty** (New User):
  - Graph shows single welcome node
  - Floating idea clouds animate across top
  - Category cards show 0 counts with prompts
  - "Start Building" CTA prominent
  
- **Populated**:
  - Graph renders with physics simulation
  - Nodes pulse/glow on hover
  - Category cards show actual counts
  - Mini-map in corner for navigation
  - Shared twins indicator if any exist
  
- **Error**:
  - Graph area shows error message
  - Retry button available
  - Category cards show cached data if available

### State Transitions
- Click category card → Filter graph to that type
- Click graph node → Expand node details
- Hover node → Preview connections
- Click shared twins indicator → Navigate to Twin Management
- Sidebar item click → Navigate to respective screen
- Graph updates after backend verification:
  - New memory captured → Backend processes → Neo4j updated → Graph refreshes
  - Shows "Processing..." state during verification

---

## 2. SIDEBAR NAVIGATION

### Data Requirements
```javascript
{
  navigation: {
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "🏠",
        path: "/dashboard",
        active: boolean
      },
      {
        id: "interview",
        label: "New Memory",
        icon: "🎙️",
        path: "/interview",
        active: boolean,
        badge?: number // Open interviews
      },
      {
        id: "explore",
        label: "Explore",
        icon: "🔍",
        path: "/explore",
        active: boolean
      },
      {
        id: "talk",
        label: "Talk to Twin",
        icon: "💬",
        path: "/talk",
        active: boolean
      },
      {
        id: "files",
        label: "My Files",
        icon: "📁",
        path: "/files",
        active: boolean
      },
      {
        id: "twin-manager",
        label: "My Twin",
        icon: "🧬",
        path: "/twin-manager",
        active: boolean
      },
      {
        id: "settings",
        label: "Settings",
        icon: "⚙️",
        path: "/settings",
        active: boolean
      }
    ],
    userMenu: {
      isOpen: boolean,
      items: ["Profile", "Logout"]
    }
  }
}
```

### UI States
- **Collapsed**: Icons only (mobile/tablet)
- **Expanded**: Icons + labels (desktop)
- **Item Active**: Highlighted with accent color
- **Item Hover**: Subtle background change
- **Badge Alert**: Red dot/number for updates

---

## 3. INTERVIEW SCREEN

### Data Requirements
```javascript
{
  interview: {
    id: string,
    type: "general" | "photo_based" | "topic_specific",
    status: "not_started" | "in_progress" | "completed",
    topic: string,
    availableTopics: [
      "Childhood Memories",
      "Family Stories", 
      "Career Journey",
      "Love & Relationships",
      "Adventures & Travel",
      "Life Lessons",
      "Hobbies & Passions"
    ],
    totalQuestions: number,
    questionsAnswered: number,
    sessions: [
      {
        id: string,
        startTime: timestamp,
        endTime: timestamp | null,
        questionsInSession: number,
        status: "open" | "closed"
      }
    ],
    currentSession: {
      questionNumber: number,
      question: string,
      userResponse: string | null,
      isRecording: boolean,
      audioLevel: number
    },
    linkedPhoto?: {
      id: string,
      url: string,
      thumbnail: string
    },
    autoSave: {
      enabled: true,
      lastSaved: timestamp,
      status: "saved" | "saving" | "error"
    }
  },
  privacyModal: {
    shown: boolean,
    accepted: boolean,
    firstTime: boolean
  },
  ideaClouds: [
    {
      text: string,
      position: {x: string, y: string},
      visible: boolean
    }
  ],
  winston: {
    state: "idle" | "listening" | "thinking" | "speaking",
    currentMessage: string
  },
  interviewManager: {
    isOpen: boolean,
    interviews: {
      open: interview[],
      completed: interview[]
    }
  }
}
```

### UI States
- **Privacy Notice**: Modal on first interview (not every session)
- **Topic Selection**: Choose topic before starting (if not photo-based)
- **Interview Active**: 
  - Graph updates after verification
  - Winston animated based on state
  - Progress bar shows completion
- **Recording**: 
  - Mic button pulsing
  - Audio waveform visible
- **Paused**: 
  - Session saved indicator
  - Resume prompt

### UI States
- **Privacy Notice**: Modal on first entry
- **Interview Active**: 
  - Graph updates live as memories captured
  - Winston animated based on state
  - Progress bar shows completion
- **Recording**: 
  - Mic button pulsing
  - Audio waveform visible
- **Paused**: 
  - Session saved indicator
  - Resume prompt

---

## 4. EXPLORE SCREEN (Curator Mode)

### Data Requirements
```javascript
{
  explore: {
    graphState: {...}, // Inherited from dashboard
    curatorMode: {
      active: boolean,
      suggestions: string[],
      currentPath: nodeId[],
      discoveries: {
        connections: number,
        themes: string[],
        timeSpans: object
      }
    },
    winston: {
      mode: "guide",
      insights: string[],
      tourActive: boolean
    }
  }
}
```

### UI States
- **Guided Tour**: Winston highlights paths
- **Free Explore**: User-driven navigation
- **Discovery Mode**: AI suggests connections
- **Focused View**: Single memory expanded

---

## 5. TALK TO TWIN SCREEN

### Data Requirements
```javascript
{
  conversation: {
    twinId: string,
    isOwnTwin: boolean,
    messages: [
      {
        id: string,
        sender: "user" | "twin",
        content: string,
        timestamp: timestamp,
        relatedMemories: nodeId[]
      }
    ],
    twinState: {
      avatar: string,
      name: string,
      isThinking: boolean,
      personality: object // Built from memories
    },
    inputMode: "text" | "voice"
  }
}
```

### UI States
- **Conversation Active**: Messages flow
- **Twin Thinking**: Loading animation
- **Voice Input**: Recording indicator
- **Memory Referenced**: Highlights in graph

---

## 6. FILE BROWSER

### Data Requirements
```javascript
{
  files: {
    items: [
      {
        id: string,
        name: string,
        type: "image" | "document" | "video",
        size: number,
        uploadDate: timestamp,
        linkedMemories: nodeId[],
        thumbnail: string,
        tags: string[],
        selected: boolean
      }
    ],
    view: "grid" | "list",
    sort: "date" | "name" | "size",
    filter: {
      type: string[],
      dateRange: object,
      hasLinks: boolean
    },
    storage: {
      used: number,
      total: number,
      percentage: number
    }
  },
  upload: {
    active: boolean,
    progress: number,
    queue: file[]
  },
  deletion: {
    confirmModal: boolean,
    selectedFiles: fileId[],
    permanentDelete: boolean,
    reason: "storage" | "privacy" | "mistake"
  }
}
```

### UI States
- **Empty**: Drag-drop prompt
- **Browsing**: Grid/list of files
- **Uploading**: Progress indicators
- **Selecting**: Checkbox mode for bulk actions
- **Linking**: Select mode for memories
- **Delete Confirmation**: 
  - Modal with file preview
  - Warning about permanent deletion
  - Confirm button with 3-second delay
- **Storage Warning**: Alert when >80% full

---

## 7. TWIN MANAGEMENT

### Data Requirements
```javascript
{
  twin: {
    name: string,
    createdDate: timestamp,
    stats: {
      totalMemories: number,
      totalFiles: number,
      peopleConnected: number,
      dateRange: {start, end}
    }
  },
  tabs: {
    active: "my-twin" | "shared-with-me",
    sharedTwins: [
      {
        id: string,
        ownerName: string,
        ownerEmail: string,
        twinName: string,
        sharedDate: timestamp,
        lastUpdated: timestamp,
        memoryCount: number
      }
    ]
  }
}
```

### UI States
- **My Twin Tab**: Shows twin stats and name editing
- **Shared Tab**: List of shared twins or empty state
- **Editing**: Name field active
- **Saving**: Loading state
- **Empty Shared**: "No twins shared with you yet"

---

## 8. SETTINGS PAGE

### Data Requirements
```javascript
{
  account: {
    name: string,
    email: string,
    emailVerified: boolean,
    joinedDate: timestamp
  },
  security: {
    passwordLastChanged: timestamp,
    changePasswordForm: {
      currentPassword: string,
      newPassword: string,
      confirmPassword: string
    }
  },
  preferences: {
    notifications: {
      emailAlerts: boolean,
      interviewReminders: boolean,
      weeklyDigest: boolean
    },
    privacy: {
      defaultShareSetting: "private" | "family"
    }
  }
}
```

### UI States
- **Viewing**: Display current settings
- **Editing Section**: Specific form active
- **Saving**: Loading spinner
- **Success**: Green checkmark confirmation
- **Error**: Red error message

---

## 9. SHARE MODAL

### Data Requirements
```javascript
{
  modal: {
    isOpen: boolean,
    twinId: string,
    shareForm: {
      recipientEmail: string,
      message: string,
      sending: boolean
    },
    sharedWith: [
      {
        email: string,
        sharedDate: timestamp,
        status: "active" | "pending"
      }
    ]
  }
}
```

### UI States
- **Closed**: Hidden
- **Open**: Overlay active, form displayed
- **Sending**: Loading state
- **Success**: Confirmation message
- **Error**: Invalid email or send failure

---

## 10. SHARED VIEW (READ-ONLY)

### Data Requirements
```javascript
{
  sharedTwin: {
    id: string,
    ownerName: string,
    twinName: string,
    accessLevel: "view-only",
    knowledgeGraph: {...}, // Limited graph data
    canExplore: true,
    canTalk: true,
    canEdit: false,
    canDownload: false
  },
  navigation: {
    limited: true,
    availableActions: ["explore", "talk", "back-to-dashboard"]
  }
}
```

### UI States
- **Loading**: Fetching shared twin
- **Active**: Limited interface displayed
- **Restricted Action**: Toast shows "View only access"

---

## 11. EMAIL VERIFICATION PAGE

### Data Requirements
```javascript
{
  verification: {
    email: string,
    status: "pending" | "verified" | "expired",
    resendAvailable: boolean,
    resendCooldown: number, // seconds
    attemptsRemaining: number
  }
}
```

### UI States
- **Pending**: Check email message
- **Resend Available**: Button active
- **Cooldown**: Timer showing wait time
- **Verified**: Success message, redirect
- **Expired**: Error with resend option

---

## 12. ALPHA WELCOME PAGE

### Data Requirements
```javascript
{
  welcome: {
    isFirstVisit: true,
    userName: string,
    features: [
      {
        title: string,
        description: string,
        icon: string
      }
    ],
    sampleTwin: {
      name: "Albert Einstein",
      available: true,
      fullAccess: true, // Post-signup = unlimited
      description: "Explore a fully-built twin to see possibilities"
    },
    video: {
      url: string,
      duration: number,
      watched: boolean
    }
  }
}
```

### UI States
- **Video Playing**: Embedded player active
- **Video Skipped**: Show features directly
- **Sample Twin Access**: Full conversation available
- **Ready**: Continue to dashboard button

### Note on Sample Twin
- Pre-signup: Limited to 4-5 questions (separate preview)
- Post-signup: Full unlimited access from dashboard
- Always available as reference/inspiration

---

## 13. PASSWORD RESET

### Data Requirements
```javascript
{
  passwordReset: {
    step: "request" | "verify" | "reset",
    email: string,
    token: string,
    tokenValid: boolean,
    newPassword: string,
    confirmPassword: string
  }
}
```

### UI States
- **Request Form**: Email input
- **Email Sent**: Check email message
- **Reset Form**: New password inputs
- **Success**: Password changed confirmation
- **Invalid Token**: Error with retry

---

## 14. 404 ERROR PAGE

### Data Requirements
```javascript
{
  error404: {
    requestedPath: string,
    isAuthenticated: boolean,
    suggestedPages: [
      {
        title: string,
        path: string
      }
    ]
  }
}
```

### UI States
- **Authenticated**: Show dashboard link
- **Not Authenticated**: Show landing page link
- **Suggestions**: Related pages listed

---

## 15. GENERAL ERROR PAGE

### Data Requirements
```javascript
{
  errorGeneral: {
    errorCode: string,
    errorMessage: string,
    technicalDetails: string,
    canRetry: boolean,
    supportEmail: string
  }
}
```

### UI States
- **Recoverable**: Show retry button
- **Non-Recoverable**: Contact support
- **Details Hidden**: Toggle for technical info
- **Details Shown**: Full error stack

---

## 16. SAMPLE TWIN PREVIEW (PRE-SIGNUP)

### Data Requirements
```javascript
{
  samplePreview: {
    twin: {
      name: "Historical Figure",
      bio: string,
      sampleMemories: memory[]
    },
    interaction: {
      questionsAsked: number,
      questionLimit: 5,
      responses: message[]
    },
    conversion: {
      limitReached: boolean,
      signupPrompt: boolean
    }
  }
}
```

### UI States
- **Active Chat**: Can ask questions
- **Limit Warning**: "2 questions remaining"
- **Limit Reached**: Signup prompt overlay
- **Converting**: Redirect to auth

## 17. PRIVACY NOTICE MODAL

### Data Requirements
```javascript
{
  privacyModal: {
    isOpen: boolean,
    context: "interview" | "sharing" | "general",
    content: {
      title: "Your Privacy Matters",
      message: "Only share what you're comfortable sharing. You can skip any question by saying 'next question'. All memories are private by default.",
      actions: [
        {
          label: "I Understand",
          primary: true
        }
      ]
    },
    userPreferences: {
      dontShowAgain: boolean,
      acceptedAt: timestamp
    }
  }
}
```

### UI States
- **Closed**: Hidden
- **Open**: Overlay with modal
- **Accepting**: Button clicked, closing animation
- **Preference Saved**: Don't show again checked

---

## GLOBAL STATES ADDITIONS

### Connection Handling
```javascript
{
  connection: {
    status: "online" | "offline" | "reconnecting",
    lastOnline: timestamp,
    retryCount: number,
    pendingActions: action[]
  }
}
```

### Auto-Save States
```javascript
{
  autoSave: {
    enabled: boolean,
    interval: number, // ms
    lastSave: timestamp,
    pendingChanges: boolean,
    saveStatus: "idle" | "saving" | "saved" | "error"
  }
}
```

---

## State Management Principles

1. **Graph is Central**: The dashboard IS the knowledge graph visualization - all features enhance or interact with it
2. **Verified Updates**: Graph updates after backend validation:
   - User answers question → Backend verifies → Pushes to Neo4j → Graph updates
   - Not instant, but feels responsive with proper loading states
3. **Persistent Sidebar**: Navigation state maintained across screens
4. **Progressive Disclosure**: Start simple, reveal complexity
5. **Graceful Degradation**: Cached data when offline
6. **Optimistic Updates**: Show pending state while awaiting verification
7. **Consistent Navigation**: All main features accessed via sidebar, shared twins accessible from dashboard indicator OR twin management

---

## Clarifications for Cohesion

### Dashboard Terminology
- "Dashboard" = The page containing the knowledge graph
- "Knowledge Graph" = The Neo4j visualization that IS the main interface
- Not separate sections, but one unified graph experience

### Sample Twin Access
- **Pre-signup**: Limited preview (4-5 questions) to demonstrate value
- **Post-signup**: Full access from dashboard as learning tool
- **Location**: Accessible via special node in graph or help menu

### Shared Twins Flow
- **Indicator**: Shows on dashboard when twins are shared with user
- **List View**: Full list in Twin Management > Shared with Me tab
- **Access**: Click shared twin → Opens in limited Shared View

### Navigation Consistency
- 7 main sidebar items (no duplicate shared section)
- Twin Management contains both "My Twin" and "Shared with Me"
- All features orbit around the central graph