# Webloom Design Language & Interaction Guidelines

This document defines how Webloom should visually exist as a product — wireframes, spacing rules, typography, color system, graphical hierarchy, motion behavior, and interaction patterns.

This ensures:

- consistency across screens
- premium appearance
- faster UI development
- memorable brand identity

## 1. Brand Identity Foundation

**Brand Concept:**

"A continuously evolving digital surface that reveals change over time."

**Keywords:**

- evolving
- clean
- automation
- reliability
- intelligence
- scanning
- continuous flow

**Brand archetype:**
The Clean Analyst — delivers clarity, insight, and summary of change.

## 2. Color System

The palette intentionally leans toward clarity and contrast without becoming loud.

### Core Brand Colors

| Usage | Color |
|-------|-------|
| Primary | #3A82F7 (Blue) |
| Primary Dark | #2159B7 |
| Accent Highlight | #32B785 (Green) |
| Warning | #FFB21C |
| Danger | #F44336 |
| Neutral Base | #111111 |
| Neutral Text | #333333 |
| Neutral Border | #D9D9D9 |
| Panel | #FFFFFF |
| Background | #F6F7F9 |

**Psychological Effects:**

- Blue → trust, precision, continuity
- Green → successful fetch / stable value
- Yellow → threshold approaching
- Red → clear break/failure
- Grey/White → modern enterprise look

Webloom intentionally avoids purple, neon gradients, or rainbow UI — because this is NOT a toy product.

## 3. Typography Rules

### Primary Font
Inter or Manrope

**Reason:**
Minimal, neutral, non-distracting, futuristic edge.

### Typography sizes

| Component | Size |
|-----------|------|
| H1 | 28px / bold |
| H2 | 22px / semibold |
| H3 | 18px / semibold |
| Body Primary | 15–16px |
| Body Secondary | 13–14px |
| Microcopy | 11–12px |

### Usage Guidelines

**NEVER use >30px headings in dashboards**

Keep one font-weight per component

Apply lighter gray for secondary content

**Example correct use:**

H2 — Job Details
Text — changes detected in last run

**Example incorrect:**

BIG TITLE — 46px
Bouncy animated gradients
Mixed fonts

This screams amateur.

## 4. Layout System

Grid behavior must follow:

max-width containers for all primary content:
- 1320px → Dashboard pages
- 960px → Create forms
- 1480px → Analytics section

Horizontal margin per section:

padding-left: 28px
padding-right: 28px

Spacing rules:

- Section spacing: 30px–38px
- Component spacing: 14–18px
- Element spacing: 8–12px

Spacing must NOT collapse.

This gives enterprise-grade visual breathing.

## 5. Component Design Rules

### Card Component
- bg-white
- rounded-xl
- shadow-sm
- border border-neutral-200
- padding: 18px–24px

**Card Title:**

- font-size: 16px
- font-weight: 600

### Table Style

- zebra-less rows (clean enterprise)
- thin divider lines
- left-aligned values

**Table Row Height:**

>= 42px

**Why?**
Compact rows = cheap product look.

### Buttons

**Primary Button Style:**

- Background: Primary Blue (#3A82F7)
- Color: White
- Radius: 8px
- Padding: 10px 18px
- Shadow: very subtle

**Hover:**

- Background: #2159B7
- Shadow: slightly intensified

**Secondary:**

- Transparent background
- Border: 1px solid #D9D9D9
- Text color: Neutral Text

**Hover:**

- Border: Primary Blue
- Text: Primary Blue

**Danger:**

- Background: #F44336
- Color: White

Used exclusively for irreversible deletes.

Don't misuse danger coloring.
If everything is red → nothing is red.

## 6. Animation System

**Allowed animations:**

- subtle fade-in
- small translation in dropdown
- card elevation on hover
- loading shimmer skeleton

**Duration guideline:**

100ms–220ms

**Disallowed animations:**

- bounce
- pulsate on repeat
- neon glow
- random gradients
- rotating loaders

**Reason:**
Serious automation product ≠ flashy banners.

## 7. Motion Principles

Motion should communicate:

✔ state change
✔ data arrival
✔ status
✔ hierarchical grouping

Motion should NOT be:
❌ decorative
❌ exaggerated
❌ random

**Examples:**

**Good:**

Row expands on click → reveals more details

**Bad:**

Row flips 3D → fades to purple → spins

## 8. Iconography

Use only:

👉 Lucide Icons
👉 Hero Icons

**Rules:**

- line width consistent
- icons grayscale unless semantic
- action icons aligned flush right

Do NOT import random icon packs.

**Why?**
Consistency = trust.

## 9. UI Hierarchy Strategy

Webloom UI has three clarity layers:

### Layer 1 — Primary Indicators

(Users immediately recognize)

- job status
- changes count
- last run outcome
- price trends

### Layer 2 — Data Context

Displayed beneath or to right

**Examples:**

- domain
- discovered item count
- last updates

### Layer 3 — Deep Diagnostic

Collapsed
Expandable on click

**Examples:**

- JSON diffs
- price variance curves
- HTML debug logs

This hierarchy matches mental model:

overview → context → depth

## 10. Dashboard Layout Example (Final Approved)

```
┌──────────────────────────────────────────────────────┐
│ Top Navigation                                        │
├──────────────────────────────────────────────────────┤
│ Left Filters (collapsed optional)     | Job List      │
│ Status Flags                          | Change Summary │
│ Run Controls                          | Trend Cards    │
├──────────────────────────────────────────────────────┤
│ Footer + Documentation Link                           │
└──────────────────────────────────────────────────────┘
```

## 11. Visual Language for Success/Fail States

### Success

Use green:

🟢 "Tracking complete"

No confetti.
No dancing icons.
We are not Duolingo.

### Warning

Use amber:

🟡 "Quota almost reached"

Must include mitigation suggestion.

### Failure

Use red:

🔴 "Run failed — tap for details"

Failure message must NEVER:

- apologize
- sound uncertain
- hide error

Instead → present facts.

## 12. Unique Webloom Style Signatures

To differentiate Webloom visually:

### Signature #1

"Timeline of changes visual bar"

**Representation:**

```
|█----█-███---|
```

**Meaning:**
Each block = run
Width = intensity of change

### Signature #2

Dual-layer card division

**Example:**

```
[PAGE TITLE]
[Trend Indicators]
------------------
[Last Run]
[Changed X items]
```

### Signature #3

Line-chart micro-tag badges

**Example:**

📉 falling
📈 rising
🟰 stable

## 13. How UI Conveys Intelligence

You must always show:

- context
- insight
- root cause
- what changed
- what to do next

**For example:**

**Bad UX:**

"Run Completed"

**Good UX:**

Run Completed
11 pages updated
3 price decreases recorded
View change list →

This is OUTPUT-FOCUSED.

## 14. Token-Based Padding System

(optional shorthand)

Let token = 4px.

Then:

- Container padding     = 6T  (24px)
- Section spacing       = 9T  (36px)
- Component spacing     = 4T  (16px)
- Element spacing       = 2T  (8px)

This is consistent & scalable.

## 15. Elevation System

Visible depth levels:

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 | none | table rows |
| 1 | small blur | static cards |
| 2 | medium blur | popup cards |
| 3 | heavy | modal/dialog |

Elevation must correlate with interactivity.

## 16. Mobile Adaptation Rules

**Allowed:**

- vertical stacking
- sticky summary bar
- collapsible analytics

**Not allowed:**

- horizontal scrolling tables without collapse
- hidden actions inside obscure menus
- micro-text under 12px

Replace tables with cards on < 768px width.

**Example:**

```
[Title]
Price today
Price change
Last update
```

## 🎯 Summary of Design Guidelines

Webloom design becomes:

✓ enterprise-grade
✓ minimal yet rich
✓ system-oriented
✓ structured and predictable
✓ visually trustworthy
✓ "real product" level clean

Not:

❌ gradient-heavy
❌ flashy startup aesthetic
❌ cartoony colors
❌ cluttered dashboards

You are designing a:
digital analyst tool, not a game.

END OF FILE