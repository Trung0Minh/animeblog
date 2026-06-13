# Figma Prompt — Homepage

## Project context

Design a high-fidelity homepage for an **anime analysis and review blog** called "Anime Blog". Think of it as a serious editorial publication — like a print magazine that also lives on the web. The audience is passionate anime fans who read long-form analysis, not casual scrollers. The visual tone should be **quiet, confident, and content-first** — similar to `blog.sakugabooru.com` combined with the restraint of `The Paris Review` website.

Design both **light mode** and **dark mode** versions. Design both **desktop (1440px wide)** and **mobile (390px wide)** versions.

---

## Visual Identity

**Color palette — Light mode**
- Background: pure white `#ffffff`
- Subtle background (sidebar, code areas): `#f7f7f7`
- Text primary: near-black `#111111`
- Text secondary (dates, meta): `#6b6b6b`
- Borders: `#e5e5e5`
- Accent (links, category labels, active states): deep red `#c0392b`
- Buttons: black background `#111111`, white text

**Color palette — Dark mode**
- Background: `#141414`
- Subtle background: `#1e1e1e`
- Text primary: `#e8e8e8`
- Text secondary: `#888888`
- Borders: `#2a2a2a`
- Accent: `#e05c4a` (slightly lighter red for contrast)
- Buttons: `#e8e8e8` background, `#141414` text

**Typography**
- Font: Inter (sans-serif) for all UI and headings
- Body text in post excerpts: Lora (serif)
- Post card titles: Inter, 20px, weight 700
- Category labels: Inter, 11px, weight 600, ALL CAPS, letter-spacing 0.08em, accent color
- Meta text (author, date): Inter, 13px, weight 400, secondary color
- Navbar links: Inter, 14px, weight 500

**Spacing feel**
Generous whitespace. Cards breathe. Not cramped. Think editorial magazine, not news aggregator.

---

## Page Structure — Desktop (1440px)

### Navbar (56px tall, sticky)
- Left: Blog name "Anime Blog" in bold 16px — text only, no logo icon
- Center: navigation links — "Contributors", "About" — 14px, secondary color, hover turns primary
- Right: search bar (rounded input, 280px wide, placeholder "Search posts..."), then sun/moon toggle icon
- Full-width white/dark background with very subtle bottom border
- Slight background blur when scrolled (frosted glass effect)

### Main content area (below navbar)
Two-column layout with a clear but not heavy visual separation:

**Left column — Post list (fills remaining space, ~72% width)**

Stack of post cards, one per row, separated by 40px vertical gap.

Each post card has this structure (top to bottom):
1. **Cover image** — full width of the card, 16:9 aspect ratio, rounded corners 6px. The image should zoom in slightly (scale 1.02) on hover with a smooth transition. Use diverse, high-quality anime screencaps as placeholder images — colorful, cinematic, with visible animation quality. Examples: a beautifully animated fight scene from Demon Slayer, a quiet atmospheric shot from Frieren, a sakuga cut from Mob Psycho 100.
2. **Category label** — 11px, ALL CAPS, accent red color, 8px below image. Example: "ANIMATION ANALYSIS"
3. **Title** — 20px, weight 700, Inter, tight line height 1.3. 2 lines maximum. On hover, title color shifts to accent red. Example titles:
   - "The Quiet Revolution of Frieren's Animation Direction"
   - "How Ufotable Redefined the Visual Language of Action Anime"
   - "WIT Studio's Architectural Approach to Storytelling in Vinland Saga"
4. **Excerpt** — 14px, Lora serif, secondary color, line height 1.65. 3 lines maximum. Example: "When Frieren: Beyond Journey's End premiered, few expected it to become one of the most visually ambitious productions of the decade. Yet episode after episode, director Atsushi Ookubo and his team..."
5. **Meta row** — 13px, secondary color, flex row with space between:
   - Left side: small avatar circle (24px) + author name + "·" + date
   - Right side: comment count ("12 comments")
6. **Tags row** — small pill tags, 11px, subtle background, rounded-full. Examples: "Ufotable", "Sakuga", "Seinen", "2024"

Below the 3rd or 4th card, show a **pagination row**: centered, minimal number buttons (1, 2, 3... style), current page highlighted with black/white filled circle.

**Right column — Sidebar (240px fixed width, 48px gap from main)**

Three stacked sections separated by subtle dividers:

Section 1: **Newsletter**
- Section title: "NEWSLETTER" in 11px, ALL CAPS, weight 600, secondary color
- Short descriptive text: "Get notified when new posts are published."
- Email input field (full width, border, 8px padding)
- "Subscribe" button below — full width, black background, white text, 40px tall
- Clean and minimal — not flashy

Section 2: **Categories**
- Section title: "CATEGORIES"
- List of category names with post counts on the right
- Subcategories indented with a subtle left border line
- Example structure:
  - Analysis (24) → children: Animation Analysis (12), Narrative Analysis (8)
  - Reviews (18)
  - Essays (7)
- Hover: category name shifts to accent red

Section 3: **Recent Posts**
- Section title: "RECENT POSTS"
- 5 items, each: post title (2 lines max, 13px) + date below in secondary color
- No images — text only
- Hover: title shifts to accent red

---

## Page Structure — Mobile (390px)

### Navbar (52px)
- Left: "Anime Blog" blog name
- Right: sun/moon toggle + hamburger menu icon (≡)
- No nav links visible — they're inside the drawer

### Mobile drawer (slides in from right when hamburger tapped)
- Full height, 280px wide, dark overlay behind
- Blog name at top
- Nav links stacked vertically with generous padding
- Search bar at bottom of nav links
- If logged in as writer: "My Posts" and "Edit Profile" links + "Sign out" at very bottom

### Post list (single column, full width)
Same card structure as desktop but:
- Cards separated by 28px gap
- Excerpt hidden — more compact
- Meta row slightly smaller font

### Sidebar sections
Appear **below** the post list (not beside it), stacked vertically:
- Newsletter form
- Categories (collapsible accordion on mobile)
- Recent posts

---

## Atmosphere & Details

- The page should feel like you're reading a **curated literary magazine about anime**
- No decorative illustrations, no icons except in UI controls
- Images do all the visual heavy lifting — let the anime screencaps be the art
- Hover states are subtle — color shifts, not jumps
- Dark mode should feel like a **cinema or gallery at night** — not just inverted colors
- In dark mode, cover images should have a very subtle brightness adjustment to not look washed out against the dark background
- The accent red should feel **editorial and authoritative**, not aggressive
- Post cards should feel like **entries in a journal**, not products in a shop

---

## What NOT to include

- No hero banner or featured post carousel at the top — jump straight into the post list
- No social media share counts or follower numbers
- No "trending" or "popular" sections
- No advertisement placeholders
- No bold gradient backgrounds
- No drop shadows on text
- No rounded corners larger than 8px anywhere except pill tags
- No animations on page load — only hover transitions
