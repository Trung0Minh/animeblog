# Figma Prompt — Post Detail Page (High Fidelity)

## Project Overview

Design a **high-fidelity post detail page** for the same anime analysis blog from the homepage design. This is where readers actually consume content — the most important page to get right. The reading experience must feel **immersive, distraction-free, and typographically beautiful**.

A reader arriving here has committed to reading a long article. They should feel welcomed into the text, not overwhelmed by interface chrome. Think of how a beautifully typeset book page feels — that is the goal.

Create **4 frames**:
1. Desktop Light Mode (1440 × 1200px — tall enough to show full reading experience)
2. Desktop Dark Mode (1440 × 1200px)
3. Mobile Light Mode (390 × 1100px)
4. Mobile Dark Mode (390 × 1100px)

Use the exact same color system and typography from `01_homepage.md`. All colors, fonts, and spacing tokens are identical — this is the same design system.

---

## Page-Level Layout — Desktop

**Navbar:** identical to homepage — sticky, 56px, same exact appearance

**Article container:**
- max-width: 720px
- centered horizontally
- horizontal padding: 24px
- top padding: 48px below navbar
- bottom padding: 80px

**Two-column layout inside article container (xl screens only, 1280px+):**
- Article content: `flex: 1, min-width: 0`
- Table of Contents sidebar: `width: 200px, flex-shrink: 0, margin-left: 48px`

At 1440px wide, the layout looks like:
```
[  empty  ] [  720px article content  ] [  200px TOC  ] [  empty  ]
```

---

## Post Header Section

This sits at the very top of the article content area.

### 1. Category label
- Same style as homepage cards: 11px Inter weight 600 ALL CAPS accent color letter-spacing 0.1em
- Example: "ANIMATION ANALYSIS"
- No background

### 2. Post title (H1)
- Margin top: 10px from category
- Font: Inter 36px weight 700 line-height 1.2 letter-spacing -0.02em
- Color: text-primary
- Max width: 100% of container (720px)
- This should feel **monumental** — the biggest text on the page
- Example title: "The Quiet Revolution of Frieren's Animation Direction"
- Spans 2–3 lines naturally at 720px width

### 3. Author row
- Margin top: 20px from title
- Flex row, align-items: center, gap: 12px

Author avatars (overlapping):
- Two avatar circles, 36px each
- Second avatar overlaps first by -10px (negative margin)
- Each: circular, with colored background and white initial, or a photo-style avatar
- Use colors: deep teal (#2d6e7e) for first author, warm terracotta (#c47f5a) for second
- Author 1: "H" initial (Haruki Tanaka)
- Author 2: "M" initial (Mei Yoshida)
- Very subtle white/dark ring (2px) around each avatar to separate from page bg

Author names:
- "Haruki Tanaka & Mei Yoshida"
- 14px Inter weight 500 text-primary
- Each name is a subtle link (underline appears on hover) to author profile

Separator · then:
- Date: "March 14, 2025" — 13px Inter text-secondary
- Separator · then:
- Reading estimate: "12 min read" — 13px Inter text-tertiary

### 4. Cover image
- Margin top: 28px from author row
- Full width (720px), aspect ratio 16:9, border-radius 8px
- `overflow: hidden`
- The cover image for this article: a stunning widescreen anime screenshot — show a close-up of a character with long silver/white hair and pointed ears (Frieren) surrounded by magical sparkles and flowers, soft pastel color palette, incredibly detailed animation with visible brush strokes in the background. The image should look like a frame from a high-budget anime production — not a wallpaper, but a specific moment captured.
- Below the image, on the right: a very small caption "© Madhouse / Frieren: Beyond Journey's End, Episode 4" — 11px Inter text-tertiary, margin top 6px, text-align right

### 5. Tags row
- Margin top: 16px from cover caption
- Same pill tags as homepage: 11px Inter weight 500, horizontal padding 10px, vertical 4px, border-radius 99px, tag-bg background, tag-text color
- Tags for this article: "Frieren", "Animation Analysis", "Madhouse", "2023 Fall", "Seinen"
- Gap: 6px between tags

---

## Table of Contents — Desktop only (xl+)

**Position:** sticky, top: 80px (below navbar), within the right column
**Visible at:** 1280px viewport width and above only

**Section label:**
- "CONTENTS" — 10px Inter weight 600 ALL CAPS letter-spacing 0.1em text-tertiary
- Margin bottom: 12px

**TOC items list:**
- Each item: text link, no underline by default
- H2 items: 13px Inter weight 400 text-secondary, no indent
- H3 items: 12px Inter weight 400 text-tertiary, indent 12px left
- Vertical gap: 8px between items
- On hover: color transitions to text-primary in 150ms
- Active item (currently in viewport): accent color, weight 500, with a 2px left border in accent color (left padding 8px to accommodate)
- Line connecting items: a 1px vertical line in border-default color runs along the left edge

Show this TOC structure:
```
CONTENTS
│
├ The Problem with Conventional Anime Pacing  ← active (accent, bold)
├ How Frieren Reframes Time
│  ├ The 10-Year Time Skip
│  └ Silence as Storytelling
├ Visual Metaphors and the Magic System
├ Comparing Directorial Approaches
└ Why This Matters for the Medium
```

---

## Post Body — The Article Content

This is the most important section. The typography must be **exquisite**.

**Container:** max-width 68ch (approximately 680px at the reading font size), within the 720px article container

**Base styles:**
- Font: Lora serif, 17.5px, line-height 1.8, color text-primary
- Paragraph margin-bottom: 1.2em
- No extra margin between consecutive paragraphs — tight and intentional

### Heading styles in article body

**H2:**
- Font: Inter 22px weight 700
- Margin top: 2.5em from previous content
- Margin bottom: 0.6em
- Color: text-primary
- Left border accent: 3px solid accent color, padding-left 14px
- Example: "The Problem with Conventional Anime Pacing"

**H3:**
- Font: Inter 17px weight 600
- Margin top: 2em
- Margin bottom: 0.4em
- Color: text-primary
- No left border
- Example: "The 10-Year Time Skip"

### Body text paragraphs
Show 4-5 real paragraphs of article content. Use this actual text (or similar quality):

> What makes Frieren so visually striking is not any single technical achievement, but rather a sustained philosophy about what anime can communicate without dialogue. Director Atsushi Ookubo and animation supervisor Reiko Nagasawa have built a visual language around negative space — the emptiness between characters, the pause before a spell is cast, the moment after it resolves.

> In most action-oriented fantasy anime, magic functions as a visual spectacle. Explosions, light beams, elaborate transformation sequences. The audience measures quality by density — how much is happening per second. Frieren inverts this entirely. Its most significant magical moments are often the quietest ones. A flower blooming in an instant. A flame dying on a fingertip. The choice to show these events at a pace that respects their duration rather than dramatizing them is, in itself, a directorial statement.

> This approach descends directly from Yoshiyuki Tomino's work on early Gundam, filtered through the quieter sensibilities of Satoshi Kon and later Masaaki Yuasa. What Ookubo adds is a kind of temporal honesty — a willingness to let real time pass on screen without filling it with incident. It is an act of trust in the audience, and in the medium itself.

### Blockquote
Show one blockquote in the article:
- Left border: 3px solid border-strong color
- Background: subtle-bg, border-radius 0 4px 4px 0
- Padding: 16px 20px
- Font: Lora italic 16px line-height 1.7 text-secondary
- Example text: "Animation is not about drawing things that move. It is about drawing the space between movements — the invisible architecture of time itself. Frieren understands this in a way few productions have."
- Attribution below: "— Sakuga Database editorial, November 2023" in 12px Inter text-tertiary

### Inline image (single image within article body)
Show one full-width image within the article text:
- Width: 100% of content column
- Aspect ratio: approximately 16:9 but can be wider or taller depending on content
- Border-radius: 4px
- Margin: 2em top and bottom
- The image: a side-by-side frame comparison showing two animation cuts — left shows a rough sketch/key animation frame, right shows the fully colored and composited final frame. The style should look like actual sakuga analysis screenshots.
- Below the image: a centered caption in 12px Inter italic text-tertiary: "Key animation frame (left) vs. final composite (right) — Episode 4, cut 47. Animation by Reiko Nagasawa."

### Inline image (GIF-style animated panel description)
Show one more image block:
- Same width and styling as above
- This image: a single frame from an action sequence showing motion blur and smear frames — the kind of image sakuga enthusiasts analyze. Fluid, slightly abstract, clearly mid-motion. Blues, whites, and pale greens. A magical effect dissipating.
- Caption: "A smear frame from episode 28's climactic sequence. The distortion here is intentional — note how the arm extends beyond anatomical possibility to communicate velocity."

### Code block (showing a timeline or structured analysis)
Show one code block — not actual code, but a formatted text block used for structured data:
- Background: subtle-bg
- Border: 1px solid border-default
- Border-radius: 6px
- Padding: 16px 20px
- Font: JetBrains Mono or Consolas, 13px, line-height 1.6, text-primary color
- Example content (analysis timeline):
```
Episode 01 — "Sunrise Castle"
  Director: Atsushi Ookubo
  Animation Director: Reiko Nagasawa
  Key Animation: Takashi Kojima, Sayo Yamamoto
  Notable cuts: 14, 47, 103

Episode 04 — "The First Step"  ← high sakuga density
  Director: Atsushi Ookubo
  Animation Director: Reiko Nagasawa, Taro Ikegami
  Key Animation: Nana Yamazaki, Hiroshi Seko (9 cuts)
  Notable cuts: 8, 22, 55, 78, 91
```

### Horizontal rule
Show one `<hr>` element:
- 1px solid border-default
- Margin: 2.5em auto
- Width: 40% of content width, centered
- Used to separate major sections

### Final paragraphs
Two more body paragraphs after a section break.

---

## Author Bio Section

Below the article body, separated by a 1px border and 40px spacing:

**Layout:** horizontal card, flex row, align-items: flex-start, gap: 20px
**Background:** subtle-bg, border-radius: 8px, padding: 24px
**Border:** 1px solid border-default

Left: avatar circle 56px, same deep teal color as header, "H" initial

Right:
- "Written by" label: 11px Inter weight 600 ALL CAPS text-tertiary letter-spacing 0.08em
- Author name: "Haruki Tanaka" — 16px Inter weight 700 text-primary, clickable link
- Bio text: "Haruki has been writing about anime production for eight years. He specializes in animation direction and the technical craft behind contemporary sakuga culture. Previously at Sakuga Database and Anime News Network." — 13px Inter text-secondary line-height 1.6
- Link: "View all posts →" — 13px Inter accent color, appears on hover as underline

---

## Comments Section

Below author bio, margin top: 48px

**Section header:**
- "Comments" as H2 — 20px Inter weight 700, margin bottom 8px
- Subtitle: "24 comments" — 14px Inter text-secondary

**Comment form — appears first (above comment list)**
Label: "Leave a comment" — 14px Inter weight 600, margin bottom 16px

Two-column inputs:
- Left: Name input (label "Name *", input below)
- Right: Email input (label "Email *", input below, helper text "Not shown publicly" in 11px text-tertiary below input)

Both inputs: full column width, height 40px, border 1px solid input-border, border-radius 5px, padding 0 12px, font 14px Inter

Below inputs: full-width textarea, label "Comment *", height 120px, same border style, padding 12px, font 14px Inter, resize vertical

Checkbox row: `☑ Notify me by email when someone replies` — 13px Inter text-secondary

Submit button: "Post comment" — right-aligned, not full width, height 38px, padding 0 20px, black background white text, border-radius 5px, 13px Inter weight 600

**Comment list (5 comments, showing threading)**

Comment 1 (top level):
- Avatar: 32px circle, slate blue (#4a6fa5) background, "S" initial
- Name: "Sora K." — 13px Inter weight 600 text-primary
- Date: "2 hours ago" — 12px text-tertiary
- Content: "This is exactly the kind of analysis I've been waiting for. The point about negative space is so important — I never had the vocabulary for it but I felt it in every episode." — 14px Inter text-secondary line-height 1.6
- Reply button: "Reply" text link, 12px text-tertiary, hover: text-primary
- Indent separator: no visual indicator for top-level

Reply to Comment 1 (indented, showing threading):
- Left indent: 40px (or left border line 1px border-default)
- Avatar: 28px circle, forest green (#4a7c59) background, "R" initial
- Name: "Ren F." — 13px weight 600
- Date: "1 hour ago"
- Content: "The comparison to Tomino is interesting but I'd push back slightly — Ookubo's sensibility feels more specifically indebted to Dezaki than early Gundam. The postcard memory effect appears twice in episode 3 alone."
- Reply button

Comment 2 (top level, no replies):
- Avatar: dusty purple (#7b5ea7) background, "Y" initial
- Name: "Yuki I."
- Date: "Yesterday"
- Content: "Beautifully written. One addition worth mentioning — the sound design complements this perfectly. Every silence in Frieren is acoustically shaped, not just the absence of sound."

Comment 3 (top level, with 2 replies):
- Avatar: warm terracotta (#c47f5a) background, "M" initial  
- Name: "Mei Y."
- Date: "3 days ago"
- Content: "As someone who worked in animation production briefly, the analysis of the key animation credits in episode 4 is spot-on. What you didn't mention is that several of those cuts were done on 3s rather than 2s — which paradoxically makes them feel more fluid, not less."

Reply 1 to Comment 3:
- "K.T." initial, deep teal (#2d6e7e)
- "This is a great point. Animating on 3s requires much more deliberate planning per frame."

Reply 2 to Comment 3 (writer of the article replying):
- "H.T." initial, same teal as article author Haruki Tanaka
- Label: "Author" badge — 10px Inter weight 600, accent color background at 15% opacity, accent color text, border 1px solid accent color at 30%, padding 2px 6px, border-radius 3px — appears next to the name
- "Thank you Mei — you're completely right, I touched on it briefly but it deserved its own section. Consider this a preview of a follow-up piece specifically on frame rate decisions."

---

## Footer

Identical to homepage footer — same height, same content, same styling.

---

## Mobile Layout (390px)

### Navbar
Identical to homepage mobile navbar.

### Post Header — Mobile
- Horizontal padding: 20px from screen edges
- Category label: same style
- Title: 26px Inter weight 700 line-height 1.25
- Author row: slightly compressed — small avatar 28px, name 13px, date and read time on second line below name
- Cover image: full device width (0 horizontal margin), no border-radius, OR keep 16px margin each side with 6px border-radius — pick the option that looks more editorial
- Tags: horizontal scroll if overflow, no wrapping

### Table of Contents — Mobile
Hidden entirely on mobile — do not show.

### Post Body — Mobile
- Font: Lora 16px line-height 1.75
- Paragraphs full width, 20px horizontal padding
- Images full width, no horizontal padding (edge to edge)
- Image captions: 20px horizontal padding, back to contained
- Blockquote: 16px horizontal margin, thinner left border

### Author Bio — Mobile
- Stack vertically (not horizontal)
- Avatar centered above name
- Text centered or left-aligned — whichever looks more editorial

### Comments — Mobile
- Name and email inputs stacked vertically (single column)
- Comment form full width
- Comment threading: indent reduced to 20px instead of 40px
- Avatar size: 28px (same as desktop reply avatars)

---

## Interaction States to Design

**TOC item states:**
- Default (neutral)
- Hover (text-primary)
- Active/in-viewport (accent color, weight 500, left border)

**Comment form:**
- Empty state (placeholders visible)
- Input focused (border darkens)
- Filled state (text entered)
- Submitted state (form replaced by "Comment posted. Thank you.")

**Reply toggle:**
- Reply form collapsed (just "Reply" link visible)
- Reply form expanded (inline form appears below parent comment)

**Author bio link:**
- Default (no underline)
- Hover (underline appears, color stays accent)

---

## Atmosphere Notes

The reading experience is the product. Every design decision should ask: "does this help someone read 3000 words comfortably?"

**Line length matters:** The 68ch max-width on body text is not arbitrary — it is the typographically optimal line length for reading. Do not widen it.

**The TOC is a navigation tool, not a decoration.** It should be visible but unobtrusive. The active state should feel helpful, not aggressive.

**Images interrupt reading — make it worth it.** An image in the middle of a long article should feel like a visual breath, not a disruption. The caption is part of the reading experience.

**The comment section should feel like a discussion among serious readers** — not YouTube comments. The threading, the author badge, the clean avatars all contribute to this.

**Dark mode reading:** In dark mode, the body text color `#e8e8e8` on `#141414` background achieves approximately 15:1 contrast ratio — high enough for long-form reading without eye strain. The off-white (not pure white) reduces harshness for extended reading sessions.

**The cover image at the top sets the emotional tone for the entire article.** Frieren's soft pastels and magical atmosphere should make the reader feel they are entering a considered, beautiful piece of writing about something they care about.
