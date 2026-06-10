# DESIGN.md — Anime Blog

## Design Philosophy

This is an **editorial-first blog** for anime analysis and reviews. The design must never compete with the content. Every decision — spacing, color, typography — serves one goal: making long-form text and media-rich articles comfortable and pleasurable to read.

Reference sites:
- `blog.sakugabooru.com` — clean, no-frills, content-first, strong cover imagery
- `shinseiki.blog` — minimal, quiet, academic tone, generous whitespace

The result should feel like a **serious publication**, not a social platform or a fan forum.

---

## Color System

All colors are defined as CSS variables. Both light and dark modes are required.

### Light Mode

```css
:root {
  /* Backgrounds */
  --color-bg:           #ffffff;
  --color-bg-subtle:    #f7f7f7;   /* sidebar, code blocks, muted areas */
  --color-bg-hover:     #f0f0f0;   /* hover state on cards, nav items */

  /* Borders */
  --color-border:       #e5e5e5;
  --color-border-strong:#c0c0c0;

  /* Text */
  --color-text:         #111111;   /* primary body text — near black, not pure #000 */
  --color-text-muted:   #6b6b6b;   /* meta info: dates, authors, comment counts */
  --color-text-faint:   #999999;   /* placeholders, disabled states */

  /* Accent — used sparingly: links, active states, category badges */
  --color-accent:       #c0392b;   /* deep red — editorial, not playful */
  --color-accent-hover: #a93226;

  /* Utility */
  --color-white:        #ffffff;
  --color-black:        #111111;
}
```

### Dark Mode

```css
.dark {
  --color-bg:           #141414;
  --color-bg-subtle:    #1e1e1e;
  --color-bg-hover:     #252525;

  --color-border:       #2a2a2a;
  --color-border-strong:#3d3d3d;

  --color-text:         #e8e8e8;
  --color-text-muted:   #888888;
  --color-text-faint:   #555555;

  --color-accent:       #e05c4a;   /* slightly lighter in dark mode for contrast */
  --color-accent-hover: #c94d3c;

  --color-white:        #141414;
  --color-black:        #e8e8e8;
}
```

### Accent Color Usage Rules
- Links inside post body: `var(--color-accent)` with underline on hover
- Category labels: `var(--color-accent)`, uppercase, small text
- Active nav item: underline in `var(--color-accent)`
- Buttons (primary): `var(--color-black)` background, `var(--color-white)` text — not accent
- **Never** use accent as a background for large areas
- **Never** use more than one accent color

---

## Typography

### Font Stack

```css
/* Body and UI */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Post body content only — serif for long-form reading comfort */
--font-serif: 'Lora', 'Georgia', serif;
```

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
```

### Type Scale

```css
--text-xs:   0.75rem;   /* 12px — tags, labels, timestamps */
--text-sm:   0.875rem;  /* 14px — meta, captions, sidebar text */
--text-base: 1rem;      /* 16px — UI, nav, buttons */
--text-md:   1.125rem;  /* 18px — post excerpt on homepage */
--text-lg:   1.25rem;   /* 20px — sidebar section titles, small headings */
--text-xl:   1.5rem;    /* 24px — post card title on homepage */
--text-2xl:  2rem;      /* 32px — post detail H1 title */
--text-3xl:  2.5rem;    /* 40px — hero post title (featured/first post) */
```

### Line Heights

```css
--leading-tight:  1.25;   /* headings */
--leading-snug:   1.4;    /* post card titles */
--leading-normal: 1.6;    /* UI text */
--leading-relaxed:1.75;   /* post body paragraphs — generous for readability */
```

### Typography Rules

- **Homepage post titles**: `--font-sans`, `--text-xl`, `font-weight: 700`, `--leading-snug`
- **Post detail H1**: `--font-sans`, `--text-2xl` (mobile) / `--text-3xl` (desktop), `font-weight: 700`, `--leading-tight`
- **Post body paragraphs**: `--font-serif`, `--text-md`, `--leading-relaxed`, `color: var(--color-text)`
- **Post body H2**: `--font-sans`, `--text-xl`, `font-weight: 700`, `margin-top: 2.5rem`
- **Post body H3**: `--font-sans`, `--text-lg`, `font-weight: 600`, `margin-top: 2rem`
- **Meta text** (author, date, comment count): `--font-sans`, `--text-sm`, `color: var(--color-text-muted)`
- **Tags**: `--font-sans`, `--text-xs`, `font-weight: 500`, uppercase, letter-spacing: 0.05em
- **Category labels**: `--font-sans`, `--text-xs`, `font-weight: 600`, uppercase, `color: var(--color-accent)`
- **Body text max-width**: `68ch` — prevents lines from getting too wide on large screens

---

## Spacing System

Based on a 4px base unit:

```
4px   — xs    (tight gaps: icon + label, tag spacing)
8px   — sm    (inner padding on small components)
12px  — md    (gap between meta items)
16px  — base  (standard padding, card inner spacing)
24px  — lg    (section gaps within a component)
32px  — xl    (gap between cards in the list)
48px  — 2xl   (section separators, top/bottom page padding)
64px  — 3xl   (large vertical rhythm between major sections)
```

---

## Layout

### Site-wide Container

```
max-width: 1100px
padding: 0 24px (mobile: 0 16px)
margin: 0 auto
```

### Homepage Layout (2-column)

```
┌─────────────────────────────────────────┐
│              NAVBAR (full width)         │
├──────────────────────────┬──────────────┤
│                          │              │
│   MAIN CONTENT           │   SIDEBAR    │
│   (post list)            │   240px      │
│                          │   fixed      │
│   flex: 1                │   width      │
│   min-width: 0           │              │
│                          │              │
└──────────────────────────┴──────────────┘
```

- Sidebar appears at `lg` breakpoint (1024px+), hidden below
- Gap between main and sidebar: `48px`
- On mobile: single column, sidebar hidden

### Post Detail Layout (single column)

```
┌──────────────────────────────────────────┐
│              NAVBAR (full width)          │
├──────────────────────────────────────────┤
│                                          │
│   ARTICLE                                │
│   max-width: 720px                       │
│   margin: 0 auto                         │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  PostHeader                      │   │
│   │  (category, title, authors,      │   │
│   │   cover image)                   │   │
│   └──────────────────────────────────┘   │
│                                          │
│   ┌────────────────────┬─────────────┐   │
│   │  PostBody          │  TOC        │   │
│   │  (Tiptap render)   │  200px      │   │
│   │                    │  xl only    │   │
│   └────────────────────┴─────────────┘   │
│                                          │
│   CommentSection                         │
│                                          │
└──────────────────────────────────────────┘
```

- TOC only visible at `xl` breakpoint (1280px+)
- Post body max-width: `720px`
- No sidebar on post detail pages

---

## Components

### Navbar

```
Height: 56px
Position: sticky, top: 0, z-index: 40
Background: var(--color-bg) / 0.95 with backdrop-blur
Border-bottom: 1px solid var(--color-border)

Layout (left → right):
  [Logo / Blog Name]    [Nav Links]    [SearchBar] [ThemeToggle]

Logo:
  font-size: --text-base
  font-weight: 700
  color: var(--color-text)
  Text only or simple SVG

Nav links:
  font-size: --text-sm
  font-weight: 500
  color: var(--color-text-muted)
  On hover: color → var(--color-text)
  Active: underline using var(--color-accent), 2px, underline-offset 3px
  Gap between links: 4px

Mobile (< 768px):
  Hide nav links
  Show hamburger → slide-out drawer from right
```

### PostCard (homepage list item)

Inspired directly by Sakugabooru Blog's homepage layout.

```
Structure:
┌─────────────────────────────────────────┐
│  COVER IMAGE                            │
│  aspect-ratio: 16/9                     │
│  object-fit: cover                      │
│  border-radius: 4px                     │
│  overflow: hidden                       │
│  On hover: scale(1.015), transition 300ms│
├─────────────────────────────────────────┤
│  CATEGORY LABEL (if any)                │
│  text-xs, uppercase, accent color       │
│                                         │
│  TITLE                                  │
│  text-xl, font-weight 700, leading-snug │
│  On hover: color → accent               │
│  max 2 lines (line-clamp: 2)            │
│                                         │
│  EXCERPT                                │
│  text-sm, color muted, leading-relaxed  │
│  max 3 lines (line-clamp: 3)            │
│                                         │
│  META ROW                               │
│  [Author avatars] [Author name(s)]      │
│                   [Date] [N comments]   │
│  text-xs, color muted                   │
│                                         │
│  TAGS ROW                               │
│  pill chips, bg: subtle, text-xs        │
└─────────────────────────────────────────┘

Card border: none by default
On hover: box-shadow: 0 2px 12px rgba(0,0,0,0.08)
Border-radius: 6px
Margin between cards: 40px (single column list, not a grid)
```

### PostHeader (post detail page)

```
Structure (top to bottom):
1. Category label — text-xs, uppercase, accent color
2. H1 title — text-2xl / text-3xl, bold, tight leading
3. Author row:
   - Avatar(s): 32px circle, stacked with -8px offset if multiple
   - Author name(s): text-sm, font-weight 500
   - Separator ·
   - Published date: text-sm, color muted
4. Cover image:
   - Full width (720px), aspect-ratio: 16/9, border-radius: 6px
   - margin-top: 24px
5. Tags row below cover, pill style, margin-top: 16px
```

### Sidebar

```
Width: 240px, hidden on mobile
Scrolls with page (not sticky)
Gap from main: 48px

Sections:
1. Newsletter subscribe form
2. Categories with sub-category tree
3. Recent posts (5 items)

Section title:
  text-xs, uppercase, letter-spacing 0.08em
  color: var(--color-text-muted), font-weight: 600
  margin-bottom: 12px
  padding-bottom: 8px
  border-bottom: 1px solid var(--color-border)
```

### Buttons

```
Primary:
  Background: var(--color-text)   ← inverted
  Color: var(--color-bg)
  Padding: 9px 20px
  Border-radius: 4px
  Font-size: --text-sm, font-weight: 600
  On hover: opacity 0.85

Secondary / outline:
  Background: transparent
  Border: 1px solid var(--color-border)
  Color: var(--color-text)
  On hover: background → var(--color-bg-hover)
```

### Inputs

```
Border: 1px solid var(--color-border)
Border-radius: 4px
Padding: 8px 12px
Font-size: --text-sm
On focus: border-color → var(--color-text), outline: none
Transition: border-color 150ms
Background: var(--color-bg)
```

### Table of Contents

```
Position: sticky, top: 80px
Width: 200px
Font-size: --text-sm

"Contents" label: text-xs, uppercase, letter-spacing 0.08em, color muted

TOC items:
  H2: no indent
  H3: padding-left: 12px
  H4: padding-left: 24px
  Color: var(--color-text-muted)
  On hover: color → var(--color-text)
  Active: color → var(--color-accent), font-weight 500
  Gap between items: 6px
  Transition: color 150ms
```

### Pagination

```
Centered, horizontal
Page buttons: 36×36px, border: 1px solid var(--color-border), border-radius: 4px
Current page: background var(--color-text), color var(--color-bg)
Gap: 4px
Prev/Next: chevron icons, same size
```

---

## Post Body Prose Styles

Applied to the Tiptap read-only render output:

```css
.post-content {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--color-text);
  max-width: 68ch;
}
.post-content p { margin-bottom: 1.5em; }

.post-content h2 {
  font-family: var(--font-sans);
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2.5em;
  margin-bottom: 0.75em;
  padding-left: 12px;
  border-left: 3px solid var(--color-accent);
}
.post-content h3 {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2em;
  margin-bottom: 0.5em;
}
.post-content a {
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 150ms;
}
.post-content a:hover { border-bottom-color: var(--color-accent); }

.post-content blockquote {
  margin: 2em 0;
  padding: 1em 1.5em;
  border-left: 3px solid var(--color-border-strong);
  background: var(--color-bg-subtle);
  border-radius: 0 4px 4px 0;
  font-style: italic;
  color: var(--color-text-muted);
}
.post-content img {
  max-width: 100%;
  border-radius: 4px;
  margin: 2em 0;
  display: block;
}
.post-content figcaption,
.post-content .media-caption {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
  margin-top: 8px;
  font-style: italic;
}
.post-content hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 3em 0;
}
/* Search result highlight */
.post-content mark,
mark {
  background: #fef08a;   /* light mode */
  padding: 0 2px;
  border-radius: 2px;
}
.dark mark {
  background: #713f12;
  color: #fef3c7;
}
```

---

## Animations & Transitions

```
Default transition: 150ms ease
Hover: color, background, border-color, opacity only
Cover image hover: scale(1.015) 300ms ease — image only, not card
Dropdown: fade in 100ms, no slide
TOC active: color 150ms
```

**Never use:**
- Entrance animations or scroll-triggered fades
- Parallax
- Shimmer loading skeletons
- Bouncy or spring transitions
- Page transition animations

---

## Responsive Breakpoints

```
sm:  640px  — stacked form fields
md:  768px  — show desktop navbar, hide mobile nav
lg:  1024px — show sidebar on homepage/listing pages
xl:  1280px — show TOC on post detail pages
```

---

## What to Avoid

- No gradients anywhere in the UI
- No shadows on text
- No rounded corners above 8px except pill badges
- No full-bleed background color sections in post body
- No sticky sidebar (scrolls with page)
- No infinite scroll — pagination only
- No animations on initial page load
- No custom cursor
- No comic or otaku-fan aesthetic — this is a serious editorial publication