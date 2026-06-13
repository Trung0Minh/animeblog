# Figma Prompt — Fullscreen Editor (High Fidelity)

## Project Overview

Design a **high-fidelity fullscreen writing editor** for the same anime analysis blog. This is where writers spend hours crafting long-form articles. The editor must feel like a **dedicated writing environment** — calm, focused, distraction-free. Think of how iA Writer, Ulysses, or Bear feel as writing apps. Not a web form. Not a CMS dashboard. A proper writing tool that happens to live in a browser.

The editor takes over the **entire viewport** — no navbar, no sidebar, no footer from the main blog. Only a minimal top bar and the writing canvas.

Create **4 frames**:
1. Desktop Light Mode (1440 × 960px)
2. Desktop Dark Mode (1440 × 960px)
3. Mobile Light Mode (390 × 844px)
4. Mobile Dark Mode (390 × 844px)

Same color system and typography from `01_homepage.md` and `02_post_detail.md`.

---

## Overall Layout Structure — Desktop

```
┌──────────────────────────────────────────────────────────────────┐
│  EDITOR TOP BAR (48px, full width, fixed at top)                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    SCROLLABLE WRITING AREA                       │
│                                                                  │
│         ┌──────────────────────────────────────────┐            │
│         │  TOOLBAR (sticky within scroll area)      │            │
│         ├──────────────────────────────────────────┤            │
│         │                                          │            │
│         │  Title                                   │            │
│         │  Excerpt                                 │            │
│         │  ─────────────────────────────           │            │
│         │                                          │            │
│         │  Body content area (Tiptap)              │            │
│         │                                          │            │
│         └──────────────────────────────────────────┘            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  POST SETTINGS BAR (collapsible, fixed at bottom)               │
└──────────────────────────────────────────────────────────────────┘
```

**Background of the overall page:** page background color — the writing canvas floats on top with a shadow.

---

## Editor Top Bar (48px, fixed)

**Full viewport width, fixed at top, z-index: 100**
**Background:** page background color
**Border bottom:** 1px solid border-default
**Horizontal padding:** 20px left and right

**Left zone:**
- Back arrow icon (←) 16px, color text-secondary
- Gap: 6px
- Text: "Dashboard" — 13px Inter weight 500, text-secondary
- On hover: both icon and text shift to text-primary, smooth 150ms transition
- This is the exit button — takes writer back to dashboard

**Center zone (absolutely centered):**
- Autosave status indicator:
  - When saving: rotating loader icon 12px (text-tertiary) + "Saving..." text 12px Inter text-tertiary
  - When saved: checkmark icon 12px (green #4caf50) + "Saved" text 12px Inter in same green
  - When error: warning icon 12px (red) + "Save failed — retrying" 12px Inter red
- Separator: thin vertical line, 16px tall, border-default color, 12px horizontal margin
- Post title preview (truncated): the actual post title being written, max 280px, truncated with ellipsis, 13px Inter text-tertiary. If no title yet: "Untitled post" in text-tertiary italic

**Right zone:**
- "Save draft" button: height 32px, padding 0 14px, border 1px solid border-default, border-radius 5px, 13px Inter weight 500, text-primary, transparent background. On hover: bg subtle-bg
- Gap: 8px
- "Publish" button: height 32px, padding 0 14px, border-radius 5px, 13px Inter weight 600, bg: button-primary-bg (black/off-white), color: button-primary-text (white/dark). On hover: opacity 0.85
- If post is already published, show "Update" instead of "Publish"

---

## Scrollable Writing Area

**Background:** page background (same as overall — no contrast difference)
**Overflow-y:** auto (scrollable)
**Height:** viewport height minus 48px (top bar) minus ~44px (bottom settings bar collapsed state)

**Inner content container:**
- max-width: 760px
- centered horizontally
- horizontal padding: 24px
- top padding: 32px
- bottom padding: 120px (space above settings bar)

---

## Writing Canvas (the bordered content area)

This is the most important visual element — the visible writing surface that shows writers exactly where their content lives.

**Appearance:**
- Background: page background (same as page — no fill difference needed, the border defines the space)
- Border: 1px solid border-default
- Border-radius: 8px
- Box shadow:
  - Light mode: `0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)`
  - Dark mode: `0 1px 3px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)`
- Padding inside canvas: 40px horizontal, 36px top, 48px bottom

### Toolbar (inside canvas, sticky at top of canvas when scrolling)

**When sticky:** background becomes fully opaque page-bg, very subtle bottom border (1px border-default at 50% opacity), slight box-shadow
**Normal state:** no shadow, just sits at top of canvas

**Height:** 44px
**Padding:** 0 8px

Layout: flex row, align-items center, flex-wrap wrap (wraps to second row on narrow screens), gap 2px between buttons

**Toolbar button appearance:**
- Size: 30×30px
- Border-radius: 5px
- Icon: 15px, color text-secondary
- On hover: background subtle-bg, icon color text-primary
- Active/pressed state: background subtle-bg at 70% opacity, icon color text-primary (slightly stronger)

**Dividers between groups:** 1px vertical line, 16px tall, border-default color, 4px horizontal margin

**Button groups (left to right):**

Group 1 — Text formatting:
- **B** (bold) — show as slightly bolder "B" text icon or standard bold icon
- *I* (italic) — italic style "I"
- ~~S~~ (strikethrough) — strikethrough "S"
- `</>` (inline code) — monospace code icon

Divider

Group 2 — Headings:
- H2 icon (shows "H₂" with subscript 2)
- H3 icon (shows "H₃")
- H4 icon (shows "H₄")

Divider

Group 3 — Blocks:
- Bullet list icon (unordered)
- Numbered list icon (ordered)
- Quote block icon (stylized quote mark)
- Horizontal rule icon (three horizontal lines)

Divider

Group 4 — Media:
- Image icon (mountain + sun landscape in square) — for inserting images/GIFs
- Video icon (play button in rectangle) — for embedding videos

Divider

Group 5 — Special:
- Eye icon with slash — spoiler block
- Code block icon (square brackets with angle brackets) — `{ }` style

Show the toolbar in its **active/writing state** — some buttons appear active:
- Bold button is active (writer is in bold text)
- H2 button is active (cursor is inside an H2 heading)

### Title input area (inside canvas, below toolbar)

**Appearance:**
- No visible input border — it blends with canvas
- Placeholder text: "Post title..." in text-tertiary, font-style normal
- Font: Inter 28px weight 700 text-primary
- line-height: 1.2
- No border, no background
- Full width of canvas (minus canvas padding)
- Padding: 20px 0 8px 0

**Show actual content:** "The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes"

### Excerpt area (below title)

**Appearance:**
- Same no-border style
- Font: Inter 15px weight 400 text-secondary
- Placeholder: "Short excerpt (optional)..." in text-tertiary
- Auto-resizing textarea feel
- Padding: 0 0 16px 0
- Max 2 lines

**Show actual content:** "MAPPA's approach to sound in Chainsaw Man represents a complete rethinking of how anime uses audio to convey physical violence..."

### Horizontal divider between meta and content

A 1px line, border-default color, full width of canvas content area.
Margin: 4px top, 24px bottom.

### Content area (Tiptap editor canvas)

**Minimum height:** 400px (so it feels spacious even when empty)
**Font:** Lora serif 17px line-height 1.65
**Color:** text-primary

**Show the editor in mid-writing state — with real mixed content:**

An H2 heading:
> **The Architecture of Silence**

Two paragraphs of body text (Lora serif):
> Most anime sound design works by filling every moment. Fight scenes are dense with impact sounds, whooshes, and musical punctuation. The silence between hits exists only as breath before the next sound event.

> Chainsaw Man director Ryuu Nakayama made a radical decision with sound designer Tatsuya Yamamoto: the moments of most extreme violence would often carry the least sound. The scene in episode three where...

A blockquote (styled with left accent border, subtle background):
> "We wanted the audience to feel what silence sounds like after something terrible. Not dramatic silence — accidental silence. The sound of shock."
> — Tatsuya Yamamoto, sound designer

Another paragraph:

> This philosophy extends to the musical score by Kensuke Ushio, who is best known for his ambient work on A Silent Voice and Devilman Crybaby. Where those scores used silence as meditation, Chainsaw Man uses it as threat.

An image block:
- A screenshot from the anime at 16:9 ratio, within the content column
- Caption below: "Episode 3, the confrontation scene. Note the complete absence of score during this 47-second sequence."
- Image style: dark, high-contrast, clearly anime but slightly desaturated — dramatic

An H3 heading:
> **The Impact Sound Philosophy**

Two more body paragraphs continuing the article.

**Show the cursor** positioned in the text (blinking cursor bar, 2px wide, accent color or black) to indicate this is an active editing state.

---

## Character Count

Below the canvas, outside of it, right-aligned:
- "3,847 characters" — 11px Inter text-tertiary

---

## Post Settings Bar (Fixed at Bottom)

**Fixed at bottom of viewport**
**Background:** page background
**Border top:** 1px solid border-default
**z-index:** 50

### Collapsed state (default)
**Height:** 44px
**Layout:** single row

Center: toggle button — up chevron (▲) icon 13px + "Post settings — cover, category, tags, co-authors" — 12px Inter text-tertiary. Entire row is clickable.

On hover: text shifts to text-secondary, background becomes subtle-bg with smooth transition.

### Expanded state (when toggle clicked)
**Height:** auto (expands upward from bottom)
**Background:** page background
**Border top:** same

**Inner layout:** max-width 760px centered, padding 20px 24px, two columns:

**Left column (cover image upload):**
Label: "Cover image" — 12px Inter weight 600 text-secondary, margin-bottom 10px

Cover upload area (when no image):
- Dashed border: 1.5px dashed border-strong, border-radius: 8px
- Aspect ratio: 16:9
- Background: subtle-bg
- Center content:
  - Image plus icon (24px, text-tertiary)
  - Text: "Add cover image" — 13px Inter text-secondary, margin-top 8px
  - Subtext: "JPG, PNG, GIF, WebP · Max 10MB" — 11px text-tertiary
- On hover: border color shifts to text-secondary, background slightly darker

Cover upload area (when image exists — show this as an alternate state):
- The actual cover image fills the area (16:9)
- Border-radius: 8px, overflow hidden
- On hover: a semi-transparent dark overlay appears with a camera icon and "Change" text centered
- Small X button (×) at top-right corner, 24px circle, dark background, white icon

**Right column (metadata fields):**

Category select:
- Label: "Category" — 12px Inter weight 600 text-secondary
- Select dropdown: full width, height 36px, border 1px solid border-default, border-radius 5px, padding 0 10px, font 13px Inter
- Current value: "Animation Analysis" with a subtle dropdown chevron on the right

Tags:
- Label: "Tags" — 12px weight 600
- Selected tags shown as pills: "Chainsaw Man", "Sound Design", "MAPPA" — same pill style as read mode but slightly larger (13px, more padding)
- X on each pill to remove
- Below pills: input with placeholder "Search or create tags..." — 13px, border 1px solid border-default, border-radius 5px, height 34px, padding 0 10px
- Show a dropdown below the input with suggested tags: "Seinen", "Action", "2022 Fall", "Kensuke Ushio" — as a list, current query highlighted

Co-authors:
- Label: "Co-authors" — 12px weight 600
- Show 1 co-author already added: small avatar (24px, dusty purple background, "Y") + "Yuki Ishikawa" + X button to remove
- Input: "Add co-author..." placeholder, same style as tags input

Draft visibility:
- Label: "Draft visibility" — 12px weight 600
- Two toggle buttons side by side:
  - "🔒 Private" — currently selected (filled button style: bg text-primary, text page-bg)
  - "👥 Visible to co-authors" — unselected (outlined button style)
- Below: 11px italic text-tertiary: "Only you and admins can see this draft."

---

## Mobile Layout (390px)

### Top bar — Mobile
Same 3-zone layout but compressed:
- Left: ← icon only (no "Dashboard" text)
- Center: autosave indicator only (no title preview — too narrow)
- Right: "Draft" button (abbreviated) + "Publish" button

### Writing area — Mobile
- No centered canvas with border — just full-width content
- Horizontal padding: 16px
- Title: Inter 22px weight 700
- Body: Lora 16px
- Toolbar:
  - Shows only most-used buttons: B, I, H2, H3, list, image, link
  - Remaining buttons accessible via "···" overflow button at right
  - Toolbar scrolls horizontally if needed

### Post settings — Mobile
- Bottom bar toggle: same concept but only shows chevron + "Settings"
- Expanded state: full-screen sheet slides up from bottom
- Settings stacked vertically: cover upload (full width), then category, then tags, then co-authors, then visibility
- Close button at top right of sheet

---

## States to Design

**Autosave indicator variants (show all 3):**
- Saving: spinner + "Saving..."
- Saved: green checkmark + "Saved"
- Error: red warning + "Save failed"

**Toolbar button variants:**
- Default
- Hover
- Active (bold/heading currently applied)

**Cover upload variants:**
- Empty (dashed border placeholder)
- Filled (actual image with hover overlay)
- Uploading (progress indicator)

**Tag input variants:**
- Empty (placeholder)
- Typing (showing dropdown suggestions)
- Tag already selected (pills visible)

**Bottom bar variants:**
- Collapsed (default)
- Expanded (showing all settings)

---

## Atmosphere Notes

The editor should feel like **a professional's tool, not a form**.

The writing canvas with its subtle border and shadow is critical — it transforms what could feel like "a text area on a webpage" into "a document on a desk." That psychological shift matters enormously for writers who will spend hours here.

**The toolbar must not feel like a Word toolbar.** Icons should be minimal, the active state subtle, dividers thin. The writer should feel the toolbar is available but not demanding attention.

**Typography in the writing canvas must match the reading experience.** The Lora serif body text in the editor is the same font readers will see. What you write is (approximately) what they read — this is intentional WYSIWYG that respects both writer and reader.

**In dark mode**, the editor should evoke a **night writing session** — the kind where the room is dark and only the screen illuminates. The background is near-black, the canvas is a slightly lighter near-black, and the text glows softly. Not harsh, not cold.

**The post settings bar at the bottom is intentionally unobtrusive.** Writers should be writing, not fiddling with metadata. The settings collapse behind a small toggle by default. This is a deliberate hierarchy: writing first, metadata second.

**Never make the editor feel like it is judging the writer** — no word count warnings, no "this might not be SEO-friendly" messages, no red underlines unless genuinely helping. The space should feel safe, private, and focused.
