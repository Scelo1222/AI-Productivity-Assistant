# StudySync AI — Student Productivity Dashboard

StudySync AI is a **pure HTML, CSS and JavaScript** dashboard that helps students handle the
admin side of student life: awkward emails, messy lecture notes, unrealistic timetables,
research that never starts, and revision that never sticks.

No frameworks. No build step. No backend. Open the file and it runs.

---

## Live files

```
public/studysync/
├── index.html    # structure (sidebar, topbar, views, modal)
├── styles.css    # design system, light + dark themes, responsive rules
└── app.js        # routing, state, prompt layer, AI generators
```

Open `public/studysync/index.html` directly in any browser, or visit `/` in this project.

---

## Features

| Tool | What it does |
|---|---|
| **Dashboard** | Usage stats, quick-launch cards, recent-activity feed, study streak |
| **Email Writer** | Drafts emails to lecturers, classmates or employers with three tone presets |
| **Notes Summarizer** | Splits raw lecture notes into action items, key concepts and deadlines |
| **Study Planner** | Time-blocked day built around your window, energy peak, breaks and meals |
| **Research Helper** | Framing advice, outline, key questions, search terms, verification checklist |
| **AI Tutor** | Chat on study methods, exams, procrastination, balance and academic integrity |

Supporting features: light/dark mode (remembered), editable + copyable + exportable outputs,
toasts, loading states, empty states, keyboard shortcuts (`Enter` to send, `Esc` to close),
and persistent state via `localStorage`.

---

## Design

Gen-Z, student-friendly and readable rather than corporate:

- **Type:** Space Grotesk for headings, Outfit for body
- **Colour:** violet → pink gradient accents, lime streak card, soft surfaces
- **Shape:** large radii (14–26px), pill buttons, floating cards
- **Themes:** every colour is a CSS custom property, so dark mode is one attribute flip
  (`<html data-theme="dark">`) with zero duplicated rules

## Responsive layout

| Width | Behaviour |
|---|---|
| ≥ 900px | Fixed 258px sidebar + fluid content, auto-fill card grids |
| < 900px | Sidebar becomes an off-canvas drawer with a hamburger button and scrim |
| Any | Grids reflow with `auto-fill / minmax`, all inputs go full width |

---

## Prompt engineering

Every generator builds a structured prompt before producing output, using a shared
`buildPrompt(role, context, constraints, format)` helper:

```
ROLE:        a university student writing a formal email
CONTEXT:     Recipient: Prof. Johnson. Subject: … Points: …
CONSTRAINTS: Max 180 words, no invented facts, one clear ask, polite close.
OUTPUT FORMAT: Subject line, greeting, 2-3 short paragraphs, sign-off.
SAFETY:      study aid only — flag anything the student must verify.
```

The composed prompt is logged to the browser console for every generation, so the prompt
design is inspectable and reusable. Responses are produced by deterministic, rule-based
generators (keyword extraction, date detection, time-block arithmetic, intent matching in
the tutor) so the demo works fully offline with no API key. Swapping in a real model means
sending the same composed prompt to an API and rendering the reply in place.

---

## Responsible AI

Responsible AI is built into the product, not bolted on:

1. **Disclaimer modal on first visit**, re-openable any time from the sidebar badge.
2. **Contextual notes on every tool** stating the specific risk of that tool.
3. **No fabricated citations** — the research tool returns search strategies, never fake sources.
4. **Human-in-the-loop by design** — outputs are `contenteditable`; the student is expected to edit.
5. **Escalation** — the tutor refers wellbeing concerns to campus counselling and refuses to
   complete graded work.
6. **Privacy by default** — everything stays in the browser's `localStorage`; nothing is uploaded.
7. **Academic integrity** — the tutor explains citation and plagiarism rules when asked.

---

## Innovation highlights

- Energy-aware planner that reorders tasks for morning people vs night owls, and inserts
  breaks and a meal automatically inside your real available window.
- Notes summarizer classifies each line into task / concept / deadline with regex intent rules.
- Tone engine rewrites the same bullet points into three different professional registers.
- Zero-dependency architecture: one HTML file, one stylesheet, one script — easy to grade,
  host anywhere, and read end to end.

---

## Run it

```bash
# any static server, or just double-click the file
npx serve public/studysync
```

Tested in current Chrome, Firefox, Safari and Edge.
