# Green Box project instructions

Build a static web app called "Green Box" for Delta Green players.

## Product goal
This app is a stylish player-facing dice roller and character helper.
It should feel like a restrained secure terminal, not a neon hacker toy.

The app should:
- support fast manual rolling
- support importing a character JSON file
- support optional live multiplayer roll logging via Firebase
- remain usable as a local-only static site without Firebase

## Hard constraints
- Use only HTML, CSS, and vanilla JavaScript
- No React, Vue, Svelte, TypeScript, npm, bundlers, or build tooling
- No backend server
- Must work as a static GitHub Pages site
- Firebase Realtime Database may be used only for the shared roll log
- If Firebase is missing or unavailable, the app must still work locally

## File structure
Keep the project simple and readable.

Preferred files:
- index.html
- styles.css
- app.js
- firebase-config.example.js
- README.md
- AGENTS.md

Do not reorganize into a framework-style architecture.

## UX and visual design
Theme:
- dark matte background
- monospace font
- restrained green or amber accents
- high contrast text
- clean rectangular panels
- subtle terminal/government console aesthetic
- avoid excessive glow, neon, gimmicks, and "movie hacker" clichés

Layout:
- desktop: controls left, log right
- mobile: controls top, log below

## Main features

### 1. Agent codename
- Input labeled "Agent Codename"
- Persist to localStorage
- Load automatically on revisit
- Fallback value: "Agent UNKNOWN"

### 2. Manual skill rolls
- Numeric input labeled "Target Number"
- Valid range: 1 to 100
- Button labeled "Roll d100"

Rules:
- d100 result must be an integer from 1 to 100 inclusive
- roll <= target => Success
- roll > target => Failure
- matching digits are: 11,22,33,44,55,66,77,88,99,100
- Success + matching digits => Critical Success
- Failure + matching digits => Fumble

### 3. Polyhedral dice
Provide buttons for:
- d4
- d6
- d8
- d10
- d12
- d20

Each rolls one die and logs the result.

### 4. Lethality rolls
- Optional toggle labeled "Lethality"
- Numeric input labeled "Lethality Rating"
- Valid range: 1 to 100

Rules:
- roll <= lethality rating => Lethal
- roll > lethality rating => Damage
- Damage = tens digit + ones digit of the d100 roll
- Failed lethality roll of 100 must be treated as Damage 10

### 5. Character JSON import
The app must support importing a local .json character file client-side only.

Requirements:
- file picker for .json
- parse entirely in the browser
- do not upload character files anywhere
- store normalized character data in localStorage
- show imported character summary
- render imported skills as clickable roll buttons

Imported character UI should show when available:
- character name
- profession if present
- key derived values if present, such as HP, WP, SAN

### 6. Imported skill handling
The importer should normalize external JSON into an internal structure.

Support:
- standard skills
- typed skills like:
  - Art (Journalism)
  - Foreign Language (Ancient scripts)
  - Science (Geology)

If a generic zero-value placeholder exists alongside a typed version, prefer the typed version and hide the useless zero-value placeholder.

Examples:
- hide "Art 0" if "Art (Journalism) 80" exists
- hide generic zero-value "Science" if typed science skills exist

When a skill is clicked:
- roll d100 against that skill value
- log a readable result using the skill label

### 7. Roll log
The app must include a readable terminal-style log panel.

Behavior:
- append new entries at the bottom
- auto-scroll to the latest entry unless the user has manually scrolled upward
- work well on mobile

Format examples:
- > Agent ALPHONSE rolled 22 vs 60 [CRITICAL SUCCESS]
- > Agent ALPHONSE rolled 74 vs 60 [FAILURE]
- > Agent ALPHONSE rolled d8 = 6
- > Agent ALPHONSE rolled lethality 08 vs 40 [LETHAL]
- > Agent ALPHONSE rolled lethality 47 vs 40 [DAMAGE 11]
- > Colm rolled Search 43 vs 80 [SUCCESS]

### 8. Firebase live log
Firebase Realtime Database is phase 2, not phase 1.

Requirements:
- append-only log of roll events
- subscribe to new entries
- render new entries live for connected users
- do not break local-only functionality
- if Firebase config is missing, show a small local-mode notice and continue working

Recommended path:
- rolls/{pushId}

## Data model
Each logged roll should normalize to a payload like:

{
  "timestamp": 1718294850123,
  "agentName": "Agent ALPHONSE",
  "characterId": null,
  "rollType": "Skill Check",
  "skillKey": null,
  "skillLabel": null,
  "targetNumber": 60,
  "rollResult": 22,
  "outcome": "Critical Success",
  "detail": null
}

Notes:
- Use timestamp in milliseconds
- targetNumber may be null for non-target rolls
- skillKey and skillLabel are optional
- detail may contain values like "Damage 11"

## Safety and validation
- Sanitize agent names before rendering
- Trim whitespace
- Enforce a sensible max name length, e.g. 24 characters
- Parse all numeric inputs as integers
- Validate ranges before rolling
- Reject malformed JSON gracefully
- Do not use innerHTML for user-generated content
- Use textContent or safe DOM node creation

## Code quality rules
- Keep functions small and readable
- Prefer pure helper functions for dice logic and import normalization
- Avoid giant monolithic functions
- Add comments only where useful
- Do not introduce unnecessary abstractions

Recommended helper functions:
- rollDie(sides)
- rollD100()
- isMatchingDigitRoll(value)
- getSkillOutcome(roll, target)
- getLethalityOutcome(roll, rating)
- formatLogEntry(entry)
- sanitizeAgentName(name)
- parseCharacterFile(json)
- normalizeCharacterData(raw)
- normalizeSkillLabel(key, typeName)
- dedupeSkills(skills)
- saveCharacterToLocalStorage(character)
- loadCharacterFromLocalStorage()
- clearStoredCharacter()

## Scope control
Build in phases.

### MVP
- terminal UI
- codename storage
- manual d100 rolls
- polyhedral dice
- lethality rolls
- local log
- local-only operation

### Phase 1.5
- character JSON import
- imported skill buttons
- character persistence in localStorage

### Phase 2
- Firebase Realtime Database live shared log

Do not add:
- auth
- user accounts
- rooms unless explicitly requested later
- character editing UI
- campaign tools
- chat
- a backend server
- a framework
- a build step

## Acceptance criteria

### MVP complete when:
1. page works as a static site
2. codename persists across refresh
3. d100 returns 1 to 100 inclusive
4. skill outcomes are correct
5. matching-digit criticals and fumbles work
6. polyhedral buttons work
7. lethality works including 100 => Damage 10
8. log entries render clearly
9. desktop and mobile layout both work
10. app works with no Firebase config

### Character import complete when:
1. user can import a local JSON file
2. imported character name displays correctly
3. imported skills render correctly
4. typed skills render as readable labels
5. duplicate useless zero-value placeholders are hidden
6. clicking an imported skill rolls correctly
7. imported character persists across refresh
8. clearing imported character returns to manual-only mode
9. malformed JSON does not crash the app

### Firebase phase complete when:
1. rolls are pushed to Firebase
2. multiple clients see updates live
3. local-only mode still works if Firebase is absent
4. entries do not duplicate from listener bugs
5. ordering is stable
