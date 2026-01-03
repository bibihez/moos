# Moos: The Gift-Finding Genius 🎁

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

### 2. Information Gathering (The Crew)
- Organizer shares the link with friends.
- Friends (Participants) join—no account needed.
- They answer **6 core questions** (the "Secret Intel"):
    - What is Sarah obsessing over?
    - What does she complain about?
    - What would she never buy for herself?
    - etc.

### 3. The AI "Magic" Moment
- Once enough answers are in, the Organizer triggers the AI.
- **The Persona Reveal**: The AI generates a "Vibe Check"—a visual and textual profile of the birthday person based on the crew's answers.
- **The Recommendations**: AI suggests 10 specific gifts that fit the persona and the budget.

### 4. Decision & Action
- Friends vote on their favorites.
- The winner is crowned.
- The app displays the Organizer's payment details so everyone can chip in.

---

## Tech Stack & Design
- **Frontend**: React (TypeScript) + Vite
- **Styling**: Tailwind CSS
- **Design System**: Premium, warm aesthetics (Cream, Soft Gold, Orange) with glassmorphism effects.
- **Animations**: View Transitions API for "app-like" fluidity.
- **Backend**: n8n workflows (Integration in progress via `n8nService.ts`).
- **Mascot**: "Moos" – the friendly gift guide.

## Current Progress
- ✅ Landing / Create Flow
- ✅ Deep-linking & Routing
- ✅ Participant Join & Question Flow
- ✅ Organizer Dashboard (Initial)
- ✅ Gift Voting UI
- 🚧 **In Progress**: AI Persona Generation UI & Logic.
- 🚧 **Next Up**: Connecting real n8n webhooks (currently using realistic mocks).
