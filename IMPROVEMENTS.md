# Moos — Prioritized Improvements

## P0: Fix Before Anyone Uses This

### 1. Move secrets out of client code
**Files:** `geminiService.ts`, `QuestionFlow.tsx`, `vite.config.ts`, `.mcp.json`

Your OpenRouter API key, n8n webhook URLs, and n8n JWT token are all exposed in client-side code or committed to git. Anyone can open DevTools, grab the key, and burn through your API quota (or abuse your n8n instance).

**Fix:**
- Create a Supabase Edge Function (or lightweight backend) that proxies AI calls
- Move all API keys server-side — nothing with `VITE_` prefix should be a secret
- Rotate the n8n API key in `.mcp.json` immediately (it's in git history)
- Add `.mcp.json` to `.gitignore`

### 2. Fix the gift save race condition (data loss)
**File:** `storageService.ts` lines 236-260

`saveGiftIdeas()` deletes all existing gifts, then inserts new ones as two separate operations. If the insert fails (network drop, Supabase timeout), all gifts are permanently gone.

**Fix:** Use a Supabase RPC function that wraps both in a database transaction:
```sql
BEGIN;
  DELETE FROM moos_gift_ideas WHERE birthday_id = $1;
  INSERT INTO moos_gift_ideas (...) VALUES (...);
COMMIT;
```

### 3. Protect the IBAN
**File:** `storageService.ts`

Bank account numbers stored in plain text in Supabase. A database breach = financial fraud.

**Fix:** Either encrypt at the application layer before storing, or (better) don't store IBANs at all — use Stripe Connect, PayPal, or similar to handle payment collection. If you must store it, encrypt with a server-side key and only decrypt for display.

### 4. Add Supabase Row Level Security (RLS)
**Current state:** Anonymous Supabase key + no RLS = anyone can read/write/delete any row.

**Fix:** Enable RLS on all tables. At minimum:
- Votes: One vote per voter_identifier per gift
- Answers: Only writable by the participant who owns them
- Birthdays: Only updatable by requests that include the organizer token

---

## P1: Fix Before Sharing Widely

### 5. Add a confirmation dialog before AI generation
**File:** `App.tsx` line 491

Clicking "Generate 10 Gift Ideas" immediately deletes existing gifts and regenerates. No undo.

**Fix:** Simple confirm dialog: "This will replace any existing gift ideas. Continue?"

### 6. Handle JSON parse failures from AI
**File:** `geminiService.ts` lines 80, 129, 188

`JSON.parse()` called on LLM output without try-catch. If the model returns malformed JSON, the app crashes.

**Fix:** Wrap in try-catch, attempt regex extraction of JSON from response, and show a user-friendly "AI had trouble, try again" message.

### 7. Add request timeouts
**Files:** `QuestionFlow.tsx`, `geminiService.ts`, `storageService.ts`

No timeouts on any fetch() or Supabase call. If a service hangs, the user sees a spinner forever.

**Fix:** Add `AbortController` with 30-second timeout on all external calls. Show "Taking too long, please try again" after timeout.

### 8. Fix the organizer answer flow
**File:** `App.tsx` lines 443-469

When the organizer completes the QuestionFlow, they can get stuck on the thank-you page with no way back to the dashboard.

**Fix:** After organizer completes questions, redirect back to `AppView.ORGANIZER_DASHBOARD` instead of `PARTICIPANT_THANK_YOU`.

### 9. Replace `alert()` with inline feedback
**File:** `GiftVoting.tsx` line 22

`alert("You can only choose up to 3 favorites!")` blocks the page and looks unprofessional.

**Fix:** Show an inline toast or message below the voting area.

### 10. Fix the broken persona image
**Files:** `storageService.ts`, `geminiService.ts`, `PersonaReveal.tsx`

`imageUrl` is always empty string `''`, causing a broken image placeholder in the persona reveal.

**Fix:** Either generate an image (DALL-E, Stable Diffusion) or remove the image section from PersonaReveal and use a gradient/icon placeholder instead.

---

## P2: Important for Product Quality

### 11. Break up App.tsx (689 lines)
The main component handles routing, state, forms, business logic, and all rendering. This makes changes risky and debugging slow.

**Fix:** Extract into:
- A router (even simple hash-based)
- Separate page components (Landing, Dashboard, Voting, Results)
- A context or store for shared state
- Custom hooks for business logic (`useBirthday`, `useVoting`, `useAI`)

### 12. Deduplicate CORE_QUESTIONS
**Files:** `types.ts` line 58, `geminiService.ts` line 6

Same question list defined in two places. If one changes, AI prompts break silently.

**Fix:** Single source of truth in `types.ts`, import everywhere.

### 13. Add input validation
- Budget: Ensure min < max, both positive, reasonable range
- Email: Basic format check
- IBAN: Validate format (standard pattern: 2 letters + 2 digits + up to 30 alphanumeric)
- Names: Prevent empty strings, trim whitespace, reasonable length limits

### 14. Add analytics
You're flying blind. You need to know:
- How many events are created vs. completed
- Where users drop off (creation → sharing → answering → voting → payment)
- AI generation success/failure rates
- Average participants per event

**Fix:** Add PostHog or Mixpanel (both have generous free tiers). Track key funnel events.

### 15. Add SEO and social sharing meta tags
**File:** `index.html`

No Open Graph tags, no description, no favicon. When someone shares a Moos link on WhatsApp/iMessage, it shows nothing — and sharing is your entire growth mechanism.

**Fix:**
```html
<meta name="description" content="Find the perfect group gift with AI. No signup needed.">
<meta property="og:title" content="Moos — AI Group Gift Finder">
<meta property="og:description" content="Your friends know them best. Let AI find the perfect gift.">
<meta property="og:image" content="/og-image.png">
```

### 16. Fix the viewport zoom restriction
**File:** `index.html` line 6

`user-scalable=no` blocks pinch-to-zoom. This fails WCAG 2.1 accessibility and excludes users with visual impairments.

**Fix:** Remove `maximum-scale=1.0, user-scalable=no`.

---

## P3: Nice to Have for Growth

### 17. Add real payment collection
Replace IBAN display + "I've paid" checkbox with actual payment collection (Stripe, PayPal). This closes the loop and massively increases perceived value.

### 18. Expand beyond birthdays
Support Christmas, weddings, baby showers, retirement, team celebrations. More occasions = higher frequency = better retention.

### 19. Add email/SMS reminders
Nudge participants who haven't answered yet. Nudge voters who haven't voted. This is critical for completion rates in group coordination tools.

### 20. Implement affiliate links
You already generate gift recommendations with purchase links. Integrate Amazon Associates or similar affiliate programs to earn commission on purchases. This is your most natural revenue stream.

### 21. Add a "Create another" flow
After a birthday is completed, prompt the organizer to create another event. Reduce friction for repeat usage.
