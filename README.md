# Green Box

Delta Green dice roller and character helper built with HTML, CSS, and vanilla JavaScript.

## Features
- Manual d100 skill checks with critical/fumble handling.
- Polyhedral dice buttons (d4, d6, d8, d10, d12, d20).
- Optional lethality mode with correct damage fallback on 100.
- Local terminal-style roll log.
- Character JSON import stored in localStorage.
  - Supports typed skills like `Art (Journalism)` and `Science (Geology)`.
  - Hides generic zero-value placeholders when typed skills exist.
  - Renders imported skills as roll buttons.

## Character import notes
- Import runs fully client-side via the browser `FileReader` API.
- Parsed character data is normalized to this local model:

```json
{
  "id": "optional-id",
  "name": "Character Name",
  "profession": "optional profession",
  "derived": {
    "hp": 10,
    "wp": 12,
    "san": 55
  },
  "skills": [
    {
      "key": "science",
      "label": "Science (Geology)",
      "baseLabel": "Science",
      "typed": true,
      "value": 60
    }
  ]
}
```

- Malformed JSON is handled gracefully and does not crash the app.
