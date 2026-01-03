# Moos: The Gift-Finding Genius

## The Original Vision
**Moos** is a collaborative gift-finding app designed to solve the age-old problem: *"What should we get for [Friend Name]?"*

Instead of endless WhatsApp threads or generic gift lists, Moos uses the power of your friend group's collective knowledge—and a bit of AI magic—to find the perfect present.

## Core Value Proposition
- **Collaborative Wisdom**: Captures unique insights from everyone who knows the birthday person.
- **AI-Powered Synthesis**: Turns messy anecdotes into a coherent "Persona" and tailored gift ideas.
- **Zero Friction**: No login required. Simple sharing via link.
- **Organizer Focused**: Streamlines everything from brainstorming to collecting money.

---

## User Flow

### 1. Creation (The Organizer)
- The Organizer visits Moos.
- Enters basic info: Friend's name, birthday, budget range, and their contact info.
- **Moos** creates a unique link (e.g., `#/b/bday-123`).
- Organizer is automatically added as a participant.

### 2. Information Gathering (The Crew)
- Organizer shares the link with friends.
- Friends (Participants) join—no account needed.
- They answer **6 core questions** (the "Secret Intel"):
    - What is [name] obsessing over?
    - What do they keep saying they'll do but haven't yet?
    - What small thing makes them unreasonably happy?
    - What do they complain about?
    - What would they never buy for themselves?
    - Anything else we should know?

### 3. The AI "Magic" Moment
- Once enough answers are in, the Organizer triggers the AI.
- **The Persona Reveal**: The AI generates a "Vibe Check"—a visual and textual profile of the birthday person based on the crew's answers.
- **The Recommendations**: AI suggests 10 specific gifts that fit the persona and the budget.

### 4. Decision & Action
- Friends vote on their favorites.
- The winner is crowned.
- The app displays the Organizer's payment details so everyone can chip in.

---

## Tech Stack

### Frontend
- **Framework**: React 18 (TypeScript) + Vite
- **Styling**: Tailwind CSS
- **Design System**: Premium, warm aesthetics (Cream, Soft Gold, Orange) with glassmorphism effects
- **Animations**: View Transitions API for "app-like" fluidity
- **Icons**: Lucide React

### Backend / Data
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions for live participant updates
- **Authentication**: Token-based organizer verification (no user accounts needed)

### AI Integration
- **Provider**: Google Gemini (gemini-1.5-flash)
- **Deployment**: Supabase Edge Function (`generate-gifts`)
- **Security**: API key stored as Supabase secret (not exposed client-side)
- **Features**: Persona generation + gift idea synthesis from collective answers

### Deployment
- **Hosting**: Vercel
- **Repository**: GitHub (bibihez/moos)

---

## Project Structure

```
moos/
├── App.tsx                    # Main app with routing and state management
├── types.ts                   # TypeScript interfaces and constants
├── components/
│   ├── Layout.tsx             # Page layout wrapper
│   ├── Card.tsx               # Reusable card component
│   ├── Button.tsx             # Styled button component
│   ├── Input.tsx              # Form input component
│   ├── MoosMascot.tsx         # The friendly Moos mascot
│   ├── QuestionFlow.tsx       # Step-by-step question UI
│   ├── GiftVoting.tsx         # Gift selection/voting interface
│   ├── PersonaReveal.tsx      # AI persona display
│   ├── ParticipantList.tsx    # Shows who's joined/answered
│   ├── ParticipantThankYou.tsx# Thank you screen for participants
│   └── VotingResults.tsx      # Final results display
├── services/
│   ├── supabaseClient.ts      # Supabase client initialization
│   ├── storageService.ts      # All data operations (CRUD, subscriptions)
│   └── geminiService.ts       # Calls Edge Function for AI generation
├── supabase/
│   └── functions/
│       └── generate-gifts/    # Edge Function for Gemini API
└── .env.local                 # Environment variables (not in git)
```

---

## Database Schema (Supabase)

### moos_birthdays
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| friend_name | text | Birthday person's name |
| date | date | Birthday date |
| budget_min | integer | Minimum budget |
| budget_max | integer | Maximum budget |
| organizer_name | text | Who's organizing |
| organizer_email | text | Organizer's email |
| organizer_iban | text | Payment details (optional) |
| organizer_token | uuid | Secret token for organizer verification |
| status | text | 'collecting' / 'voting' / 'completed' |
| persona_vibe | text | AI-generated vibe title |
| persona_description | text | AI-generated description |
| persona_traits | text[] | Array of personality traits |

### moos_participants
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| birthday_id | uuid | FK to birthdays |
| name | text | Participant's name |
| is_organizer | boolean | Whether they created the event |
| has_answered | boolean | Completed questions? |
| has_paid | boolean | Paid their share? |

### moos_answers
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| birthday_id | uuid | FK to birthdays |
| participant_id | uuid | FK to participants |
| question_id | integer | Which question (1-6) |
| answer_text | text | The answer content |

### moos_gift_ideas
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| birthday_id | uuid | FK to birthdays |
| name | text | Gift name |
| price_estimate | text | Price range string |
| reason | text | Why this gift fits |
| sort_order | integer | Display order |

### moos_votes
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| birthday_id | uuid | FK to birthdays |
| gift_id | uuid | FK to gift_ideas |
| voter_identifier | text | Anonymous voter ID |

---

## Key Features Implemented

### Core Flow
- [x] Landing page with birthday creation form
- [x] Deep-linking via hash routing (`#/b/{id}`)
- [x] Participant join flow (name entry)
- [x] 6-question flow with progress indicator
- [x] Organizer dashboard with participant tracking
- [x] Real-time participant updates (Supabase subscriptions)
- [x] AI-powered gift generation (Gemini)
- [x] Persona reveal with vibe/traits
- [x] Gift voting interface
- [x] Results display with vote counts
- [x] Payment info screen with dynamic IBAN
- [x] "I've Paid" button for guests

### Cross-Device Support
- [x] Organizer token stored in localStorage
- [x] Shareable organizer link with `?token=` parameter
- [x] Guest link (no token) for participants

### Data Persistence
- [x] Full Supabase integration
- [x] All data persists across sessions/devices
- [x] RLS policies enabled on all tables

---

## Environment Variables

Required in `.env.local` (and Vercel):
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Future Enhancements (Ideas)
- [ ] Email notifications to organizer
- [x] Payment tracking (guests can mark "I've Paid")
- [x] Organizer IBAN input (no hardcoded values)
- [ ] Gift purchase links integration
- [ ] Multiple gift selection (group purchase)
- [ ] Birthday reminders
- [ ] Photo/image support for gifts
- [ ] WhatsApp/social sharing integration
- [ ] Gift idea regeneration option

---

## Design Tokens

### Colors
- **Cream**: `#FDF8F3` (background)
- **Warm**: `#4A3728` (text, browns)
- **Soft Gold**: `#D4A853` (accents, CTAs)
- **Orange**: `#E07B39` (highlights)

### Typography
- Font: System sans-serif stack
- Headings: Bold, warm-800
- Body: Regular, warm-600/700

### Components
- Cards: White with subtle shadow, rounded-2xl
- Buttons: Rounded-full, gradient backgrounds
- Inputs: Rounded-xl with cream backgrounds
